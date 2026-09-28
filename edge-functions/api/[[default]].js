/**
 * 诗泉别苑 · 专属网关（EdgeOne Pages Edge Function）
 * 路由：/edge-functions/api/[[default]].js  →  /api/*
 *
 * 作用：把上游公开诗词 API 收敛为同源接口，统一补齐 CORS 与缓存头，
 *      并做参数白名单校验，避免本函数被当作任意请求的跳板。
 *
 * 说明：上游本身已开放 CORS，本网关属可选增强。若未部署，
 *      前端会自动回退为直连上游，功能不受影响。
 */

const UPSTREAM = 'https://poetry.palemoky.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
};

/** 允许透传的查询参数白名单 */
const ALLOWED_PARAMS = ['lang', 'page', 'q', 'author', 'dynasty', 'type', 'char'];

/** 可按路径分级的缓存时长（秒） */
function cacheSeconds(pathname) {
  if (pathname === '/api/stats') return 3600;
  if (pathname === '/api/dynasties' || pathname === '/api/types') return 86400;
  if (pathname === '/api/poems/random') return 0;
  if (pathname === '/api/search') return 300;
  return 600;
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }, CORS_HEADERS)
  });
}

/* ── 释义：转发百度百科开放接口 ───────────────────
   百度百科未开放 CORS，浏览器无法直连，故由同源网关代取；
   网关未部署该路由时，前端会自动降级为 JSONP 直连。 */
const BAIKE_UPSTREAM = 'https://baike.baidu.com/api/openapi/BaikeLemmaCardApi';
const EXPLAIN_TTL = 86400 * 1000;
const EXPLAIN_MAX = 500;
const explainCache = new Map();

/** 词条字段可能是数组且内嵌 <a> 链接，统一转成纯文本 */
function plain(v) {
  if (Array.isArray(v)) v = v.filter(Boolean).join('、');
  if (v == null) return '';
  return String(v).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeExplain(key, payload) {
  const outer = payload || {};
  if (outer.code !== undefined && String(outer.code) !== '0' && String(outer.code) !== '200') {
    return { title: key, available: false };
  }
  const d = outer.data || outer;
  const abstract = plain(d.abstract || d.summary);
  const card = (Array.isArray(d.card) ? d.card : [])
    .map(function (c) { return { name: plain(c.name || c.title), value: plain(c.value || c.content) }; })
    .filter(function (c) { return c.name && c.value; });
  if (!abstract && !card.length) return { title: key, available: false };
  return {
    title: plain(d.title || d.key) || key,
    desc: plain(d.desc),
    abstract: abstract,
    card: card,
    url: d.url || ('https://baike.baidu.com/item/' + encodeURIComponent(d.key || key))
  };
}

function explainResponse(key) {
  if (!key || key.length > 120) {
    return jsonResponse({ error: { code: 'BAD_KEY', message: '缺少有效的词条名' } }, 400);
  }
  const hit = explainCache.get(key);
  if (hit && hit.expire > Date.now()) {
    return jsonResponse({ data: hit.data });
  }
  const target = BAIKE_UPSTREAM + '?scope=103&format=json&appid=379020&bk_key=' + encodeURIComponent(key);

  return fetch(target, {
    headers: {
      Accept: 'application/json',
      Referer: 'https://baike.baidu.com/',
      'User-Agent': 'Mozilla/5.0 (compatible; shiquan-bieyuan-gateway/1.0)'
    },
    signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(12000) : undefined
  })
    .then(function (res) { return res.text(); })
    .then(function (txt) {
      let json = null;
      try { json = JSON.parse(txt); } catch (e) { /* 非 JSON：按「暂未收录」处理 */ }
      const data = normalizeExplain(key, json);
      if (explainCache.size >= EXPLAIN_MAX) explainCache.clear();
      explainCache.set(key, { expire: Date.now() + EXPLAIN_TTL, data: data });
      return jsonResponse({ data: data });
    })
    .catch(function () {
      return jsonResponse({ data: { title: key, available: false } });
    });
}

export default function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: '只读网关，仅支持 GET' } }, 405);
  }

  if (url.pathname.indexOf('/api/') !== 0) {
    return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
  }

  // 释义：转发百度百科开放接口（前端在网关缺失该路由时会降级为 JSONP 直连）
  if (url.pathname === '/api/explain') {
    return explainResponse(url.searchParams.get('key') || '');
  }

  // 仅放行白名单参数，其余丢弃
  const params = new URLSearchParams();
  ALLOWED_PARAMS.forEach(function (key) {
    const value = url.searchParams.get(key);
    if (value !== null && value !== '') params.set(key, value);
  });

  const query = params.toString();
  const target = UPSTREAM + url.pathname + (query ? '?' + query : '');

  const init = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'shiquan-bieyuan-gateway/1.0 (EdgeOne Pages)'
    }
  };
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(12000);
  }

  return fetch(target, init)
    .then(function (res) {
      const headers = new Headers();
      const type = res.headers.get('content-type') || 'application/json; charset=utf-8';
      headers.set('Content-Type', type);

      const maxAge = cacheSeconds(url.pathname);
      headers.set('Cache-Control', maxAge > 0 ? 'public, max-age=' + maxAge : 'no-store');
      headers.set('X-Gateway', 'shiquan-bieyuan');
      Object.keys(CORS_HEADERS).forEach(function (k) {
        headers.set(k, CORS_HEADERS[k]);
      });

      return new Response(res.body, { status: res.status, headers: headers });
    })
    .catch(function (err) {
      return jsonResponse({
        error: {
          code: 'BAD_GATEWAY',
          message: '专属网关连接上游失败',
          details: err && err.message ? err.message : String(err)
        }
      }, 502);
    });
}
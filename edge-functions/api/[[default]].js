/**
 * 诗泉别苑 · 专属网关（EdgeOne Pages Edge Function）
 * 路由：/edge-functions/api/[[default]].js  →  /api/*
 *
 * 作用：
 *  1. 把上游公开诗词 API 收敛为同源接口，统一补齐 CORS 与缓存头，
 *     并做参数白名单校验，避免本函数被当作任意请求的跳板；
 *  2. 代理「释义」所需的文本生成接口（该接口免密钥但不宜由前端直连），
 *     并在边缘侧缓存生成结果。
 *
 * 说明：诗词上游本身已开放 CORS，若未部署该网关，前端会自动回退为直连上游；
 *      释义接口未部署时，前端也会回退为浏览器直连生成接口。功能均不受影响。
 */

const UPSTREAM = 'https://poetry.palemoky.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
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

/* ── 释义：由大模型生成白话译文与赏析 ───────────────
   词条类数据源（如百科）给出的只是背景介绍，不是「现代解说」，
   因此改为：把诗题 / 作者 / 正文交给大模型生成逐句白话译文 + 短赏析。
   上游为免密钥的文本生成接口，由本网关代理以获得稳定与边缘缓存。
   注意：其纯文本端点偶发会把原始对话载荷（含 reasoning）当正文吐出，
   故固定使用 OpenAI 兼容端点，只取 choices[0].message.content。 */
const AI_UPSTREAM = 'https://text.pollinations.ai/openai';
const AI_MODEL = 'openai';
const AI_TIMEOUT = 40000;
const EXPLAIN_TTL = 7 * 86400 * 1000;
const EXPLAIN_MAX = 300;
const explainCache = new Map();

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(function () { c.abort(); }, ms);
  return c.signal;
}

/** 从 OpenAI 风格响应中取出正文，忽略 reasoning 等旁路字段 */
function extractAiText(payload) {
  const p = payload || {};
  const choice = p.choices && p.choices[0];
  const msg = choice ? (choice.message || choice) : null;
  let text = (msg && (msg.content || msg.text)) || p.content || p.text || '';
  if (Array.isArray(text)) {
    text = text.map(function (part) { return (part && (part.text || part.content)) || ''; }).join('');
  }
  return String(text || '').trim();
}

function explainResponse(prompt) {
  const key = String(prompt || '').trim().slice(0, 2000);
  if (!key) {
    return jsonResponse({ error: { code: 'BAD_PROMPT', message: '缺少释义请求内容' } }, 400);
  }

  const hit = explainCache.get(key);
  if (hit && hit.expire > Date.now()) {
    return jsonResponse({ data: hit.data });
  }

  return fetch(AI_UPSTREAM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: key }],
      private: true
    }),
    signal: timeoutSignal(AI_TIMEOUT)
  })
    .then(function (res) {
      if (!res.ok) throw new Error('upstream ' + res.status);
      return res.json();
    })
    .then(function (json) {
      const text = extractAiText(json);
      if (!text) throw new Error('empty content');
      const data = { text: text };
      if (explainCache.size >= EXPLAIN_MAX) explainCache.clear();
      explainCache.set(key, { expire: Date.now() + EXPLAIN_TTL, data: data });
      return jsonResponse({ data: data });
    })
    .catch(function (err) {
      return jsonResponse({
        error: {
          code: 'UPSTREAM_FAILED',
          message: '释义生成失败',
          details: err && err.message ? err.message : String(err)
        }
      }, 502);
    });
}

export default function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (url.pathname.indexOf('/api/') !== 0) {
    return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
  }

  // 释义：仅接受 POST（请求体 { prompt }），避免长正文挤进 URL
  if (url.pathname === '/api/explain') {
    if (request.method !== 'POST') {
      return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: '释义接口仅支持 POST' } }, 405);
    }
    return request.json()
      .then(function (body) { return explainResponse(body && body.prompt); })
      .catch(function () {
        return jsonResponse({ error: { code: 'BAD_BODY', message: '请求体需为 JSON' } }, 400);
      });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: '只读网关，仅支持 GET' } }, 405);
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
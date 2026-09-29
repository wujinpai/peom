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

   上游有两种接法：
   1) 在 EdgeOne Pages 配置环境变量 EXPLAIN_API_URL / EXPLAIN_API_KEY /
      EXPLAIN_MODEL，指向任意 OpenAI 兼容服务（推荐，稳定）——
      国内可用免费的智谱 glm-4-flash：
        EXPLAIN_API_URL   = https://open.bigmodel.cn/api/paas/v4/chat/completions
        EXPLAIN_MODEL     = glm-4-flash
        EXPLAIN_API_KEY   = <你的 key>
   2) 不配置时退回免密钥的公共接口：零成本，但稳定性无保障
      （实测会间歇返回 402 / 500），仅作兜底。

   另注：免密钥上游是推理模型，思维链会吃光 token 预算导致正文为空，
   故对其压低推理强度；且其纯文本端点会把原始对话载荷当正文吐出，
   故统一使用 OpenAI 兼容端点，只取 choices[0].message.content。 */
const AI_DEFAULT_URL = 'https://text.pollinations.ai/openai';
const AI_DEFAULT_MODEL = 'openai';
const AI_TIMEOUT = 30000;
const AI_ATTEMPTS = 3;
const EXPLAIN_TTL = 7 * 86400 * 1000;
const EXPLAIN_MAX = 300;
const explainCache = new Map();

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(function () { c.abort(); }, ms);
  return c.signal;
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/** 环境变量取值：兼容 context.env / process.env / 全局 */
function envOf(context, name) {
  const bags = [
    context && (context.env || context.environment),
    typeof process !== 'undefined' && process.env,
    typeof globalThis !== 'undefined' ? globalThis : null
  ];
  for (let i = 0; i < bags.length; i++) {
    const bag = bags[i];
    if (bag && bag[name] != null && bag[name] !== '') return String(bag[name]);
  }
  return '';
}

function aiConfig(context) {
  const key = envOf(context, 'EXPLAIN_API_KEY');
  const url = envOf(context, 'EXPLAIN_API_URL') || AI_DEFAULT_URL;
  return {
    url: url,
    key: key,
    model: envOf(context, 'EXPLAIN_MODEL') || AI_DEFAULT_MODEL,
    // 免密钥上游专有参数，第三方服务不认，故仅在兜底通道发送
    native: !key
  };
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

/** 5xx / 402 / 429 视为可重试，其余 4xx 直接失败 */
function isRetryable(status) {
  return status === 402 || status === 429 || status >= 500;
}

/** 单次请求；seed 变化可绕开上游的结果缓存 */
function requestExplain(cfg, prompt, seed) {
  const body = { model: cfg.model, messages: [{ role: 'user', content: prompt }] };
  if (cfg.native) {
    body.private = true;
    body.reasoning_effort = 'low';
  }
  if (seed !== undefined) body.seed = seed;

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (cfg.key) headers.Authorization = 'Bearer ' + cfg.key;

  return fetch(cfg.url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
    signal: timeoutSignal(AI_TIMEOUT)
  })
    .then(function (res) {
      if (!res.ok) {
        const err = new Error('upstream ' + res.status);
        err.retryable = isRetryable(res.status);
        throw err;
      }
      return res.json();
    })
    .then(function (json) { return extractAiText(json); });
}

/** 失败重试；空正文同样重试（换 seed 绕开上游缓存） */
function attemptExplain(cfg, prompt, n) {
  const seed = n === 1 ? undefined : Math.floor(Math.random() * 1e9);
  return requestExplain(cfg, prompt, seed).then(function (text) {
    if (text || n >= AI_ATTEMPTS) return text;
    return sleep(400 * n).then(function () { return attemptExplain(cfg, prompt, n + 1); });
  }).catch(function (err) {
    if (n < AI_ATTEMPTS && err && err.retryable) {
      return sleep(400 * n).then(function () { return attemptExplain(cfg, prompt, n + 1); });
    }
    throw err;
  });
}

function explainResponse(prompt, context) {
  const key = String(prompt || '').trim().slice(0, 2000);
  if (!key) {
    return jsonResponse({ error: { code: 'BAD_PROMPT', message: '缺少释义请求内容' } }, 400);
  }

  const hit = explainCache.get(key);
  if (hit && hit.expire > Date.now()) {
    return jsonResponse({ data: hit.data });
  }

  return attemptExplain(aiConfig(context), key, 1)
    .then(function (text) {
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
      .then(function (body) { return explainResponse(body && body.prompt, context); })
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
/* ============================================================
   诗泉别苑 · 数据层
   优先使用同源专属网关（EdgeOne Pages Edge Function: /api/*），
   若网关不可用则自动回退到上游公开 API 直连。
   ============================================================ */
(function (global) {
  'use strict';

  var UPSTREAM = 'https://poetry.palemoky.com';
  var resolved = null;          // '' = 同源网关；UPSTREAM = 直连

  function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c.signal;
  }

  function safeJson(res) {
    return res.json().then(function (j) { return j; }, function () { return null; });
  }

  /** 探测同源网关是否可用（只执行一次，结果缓存） */
  function resolveBase() {
    if (resolved !== null) return Promise.resolve(resolved);
    return fetch('/api/stats', { signal: timeoutSignal(4000), headers: { Accept: 'application/json' } })
      .then(function (res) {
        // 收到任何 HTTP 响应即说明同源网关存在；纯静态站点会回落到 HTML 首页
        return safeJson(res).then(function (json) {
          resolved = (json && json.data) ? '' : UPSTREAM;
          return resolved;
        });
      })
      .catch(function () {
        // 探测超时 / 网络异常：优先信任同源网关，
        // 若网关确有故障，则由 request() 的直连重试兜底
        resolved = '';
        return resolved;
      });
  }

  function buildQuery(params) {
    var q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      if (v !== undefined && v !== null && v !== '') q.set(k, v);
    });
    var s = q.toString();
    return s ? '?' + s : '';
  }

  var lang = 'zh-Hans';

  /** 拉取并解析 JSON；HTTP 业务错误抛出带 status 的 Error，网络错误则无 status */
  function fetchJson(url, opts) {
    var signal = (opts && opts.signal) || timeoutSignal((opts && opts.timeout) || 15000);
    return fetch(url, { signal: signal, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) {
          return safeJson(res).then(function (json) {
            var msg = (json && json.error && json.error.message) || ('请求失败（HTTP ' + res.status + '）');
            var err = new Error(msg);
            err.status = res.status;
            throw err;
          });
        }
        return res.json();
      });
  }

  /**
   * 发起一次接口请求，返回解析后的 JSON（{data, pagination, lang}）。
   * 同源网关出现网络级故障或 5xx 时，自动回退上游直连并重试一次。
   */
  function request(path, params, opts) {
    opts = opts || {};
    var merged = Object.assign({}, params);
    if (merged.lang === undefined) merged.lang = lang;
    var query = buildQuery(merged);

    return resolveBase().then(function (base) {
      return fetchJson(base + path + query, opts).catch(function (err) {
        if (base === '' && (!err.status || err.status >= 500)) {
          resolved = UPSTREAM;
          return fetchJson(UPSTREAM + path + query, opts);
        }
        throw err;
      });
    });
  }

  function unwrap(json) {
    if (json && typeof json === 'object' && 'data' in json) return json.data;
    return json;
  }

  var api = {
    get base() { return resolved; },
    set lang(v) { lang = v || 'zh-Hans'; },
    get lang() { return lang; },
    resolve: resolveBase,

    stats: function (opts) {
      return request('/api/stats', {}, opts).then(unwrap);
    },
    dynasties: function (opts) {
      return request('/api/dynasties', {}, opts).then(unwrap);
    },
    types: function (opts) {
      return request('/api/types', {}, opts).then(unwrap);
    },
    authors: function (page, opts) {
      return request('/api/authors', { page: page || 1 }, opts);
    },
    authorsAll: function (pages, opts) {
      var list = [];
      var seq = [];
      for (var i = 1; i <= (pages || 5); i++) seq.push(i);
      return seq.reduce(function (chain, p) {
        return chain.then(function () {
          return request('/api/authors', { page: p }, opts).then(function (json) {
            (json.data || []).forEach(function (a) { list.push(a); });
          });
        });
      }, Promise.resolve()).then(function () { return list; });
    },
    poems: function (page, opts) {
      return request('/api/poems', { page: page || 1 }, opts);
    },
    poem: function (id, opts) {
      return request('/api/poems/' + encodeURIComponent(id), {}, opts).then(unwrap);
    },
    random: function (filters, opts) {
      return request('/api/poems/random', filters || {}, opts).then(function (json) {
        var d = unwrap(json);
        return Array.isArray(d) ? d[0] : d;
      });
    },
    search: function (q, page, opts) {
      return request('/api/search', { q: q, page: page || 1 }, opts).then(function (json) {
        return { items: json.data || [], pagination: json.pagination || null };
      });
    }
  };

  global.PoemAPI = api;
})(window);
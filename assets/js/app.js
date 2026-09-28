/* ============================================================
   诗泉别苑 · 应用逻辑
   ============================================================ */
(function () {
  'use strict';

  var API = window.PoemAPI;

  /* ── 图标 ─────────────────────────────────────── */
  var ICON = {
    seal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 6.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v8.5A1.5 1.5 0 0 0 5 15h1.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.2 1.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.2-1.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.2v5.6h3.1L11.5 18V6L7.1 9.2H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 8.6a4.4 4.4 0 0 1 0 6.8M17.8 6.2a7.6 7.6 0 0 1 0 11.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    pinyin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h8.5M8.2 7.5V17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M13.5 9.5h6.5M16.8 9.5V17" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity=".6"/></svg>',
    explain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 4.5h10a2 2 0 0 1 2 2v11a1.6 1.6 0 0 1-1.6 1.6H7.5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.6 8.8h5.6M8.6 12.2h3.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
  };
  var FAMOUS = ['李白', '杜甫', '白居易', '苏轼', '辛弃疾', '李清照', '王维', '陆游', '李商隐', '王安石', '柳永', '孟浩然'];
  var POPULAR_TYPES = ['唐诗', '宋词', '元曲', '诗经', '楚辞', '乐府诗', '五言绝句', '七言绝句', '五言律诗', '七言律诗'];
  // 上游分页在第 501 页后会被钳制且 hasMore 仍为 true，故在本地设上限并做去重兜底
  var MAX_PAGE = 500;

  /* ── 界面文案（简 / 繁） ──────────────────────── */
  var I18N = {
    'zh-Hans': {
      docTitle: '诗泉别苑 · 中华诗词歌赋检索',
      navSearch: '检索', navRoam: '漫游', navFav: '诗笺', navHistory: '足迹',
      heroKicker: '中华诗词 · 免费开源数据',
      heroTitle: '咫尺之间<i>·</i>纵览千年',
      heroSub: '检索、偶得、漫游 —— 于三十七万首诗海中打捞属于你的那一句',
      statPoems: '收录诗词', statAuthors: '历代诗人', statDynasties: '朝代跨度', statTypes: '体裁样式',
      searchPh: '输入诗句 / 题目关键字（至少 3 个字）…',
      btnSearch: '检索', btnRandom: '偶得一首',
      fAuthor: '诗人', fAuthorPh: '如：李白 / 苏轼', fDynasty: '朝代', allDynasty: '全部朝代',
      fType: '体裁', allType: '全部体裁', fChar: '含字', fCharPh: '单字', btnReset: '重置',
      chipDynasty: '朝代', chipType: '体裁', chipAuthor: '名家',
      more: '探寻更多', moreRandom: '再来一批',
      roamTitle: '漫游诗海', roamDesc: '按库中顺序翻阅典藏，滚动到底部自动续读。',
      roamMore: '继续翻阅', roamEnd: '已漫游至可翻阅的尽头',
      favTitle: '我的诗笺', favDesc: '珍藏的诗句保存在本机浏览器中，可随时导出留存。',
      expTxt: '导出 TXT', expJson: '导出 JSON', clearFav: '清空诗笺',
      favEmpty: '诗笺尚且空白。', favEmptyHint: '在任意诗词上点击「藏笺」，即可收入此处。',
      hisTitle: '浏览足迹', hisDesc: '最近看过的诗词会留在这里，最多保留 60 条。',
      clearHis: '清空足迹', hisEmpty: '暂无足迹。', hisEmptyHint: '翻开任意一首诗，便会在此留痕。',
      footSrc: '数据来源：<a href="https://poetry.palemoky.com" target="_blank" rel="noopener">诗泉 API</a> · 开源项目 chinese-poetry',
      footDeploy: '本站为纯静态前端，部署于 EdgeOne Pages',
      footTip: '快捷键：<kbd>/</kbd> 聚焦检索 · <kbd>R</kbd> 偶得一首 · <kbd>Esc</kbd> 关闭浮层',
      resultTitle: '检索结果', dailyTag: '每 日 一 诗', sealText: '诗泉',
      cardFav: '藏笺', cardFavOn: '已藏', cardCopy: '复制', cardShare: '分享',
      actRead: '朗读', actStop: '停止', actPinyin: '拼音', actExplain: '释义',
      pyLoading: '正在加载拼音库…', pyFail: '拼音库加载失败，请检查网络后重试',
      expLoading: '正在生成白话译文…', expFail: '释义生成失败，请稍后再试',
      expNone: '暂未生成该诗的释义。',
      expSource: '释义由 AI 生成，仅供参考', ttsUnsupported: '当前浏览器不支持语音朗读',
      mFav: '藏笺', mFavOn: '已藏笺', mCopy: '复制全文', mShare: '复制分享链接', mAuthor: '同诗人作品',
      mNote: '数据来源：诗泉 API · poem #{id}',
      copyOk: '已复制到剪贴板', copyFail: '复制失败，请长按选择', shareOk: '分享链接已复制',
      favAdded: '已收入诗笺', favRemoved: '已从诗笺中移出', favCleared: '诗笺已清空', hisCleared: '足迹已清空',
      expTxtOk: '已导出 TXT', expJsonOk: '已导出 JSON',
      confirmClearFav: '确定清空全部诗笺吗？此操作不可撤销。',
      randomFail: '偶得失败。', randomFailHint: '网络似乎不通，稍后再试。',
      netFail: '未能连上诗泉。', openFail: '未能打开该诗篇', loadFail: '翻阅失败，请稍后再试',
      shortQuery: '关键字至少需要 3 个字。', shortQueryHint: '试试「明月光」「春风」这类更完整的词句。',
      noResult: '烟海茫茫，未寻得「{q}」的诗迹。', noResultHint: '换个关键字，或去掉部分筛选条件再试。',
      noResultFilter: '该条件下未寻得诗迹。', noResultFilterHint: '可能过于冷门，试试换个诗人或朝代。',
      searchTitle: '「{q}」的检索结果',
      searchMeta: '第 {page} 页 · 本页 {count} 首 · 已列 {total} 首', endOfList: ' · 已至尽头',
      randomTitle: '随缘偶得', randomMeta: '已列 {total} 首 · 可继续「偶得一首」换新',
      oneTitle: '偶得一首', oneMeta: '独取一瓢饮',
      fAuthorDesc: '诗人「{name}」', fCharDesc: '含「{c}」',
      langToHans: '已切换为简体', langToHant: '已切换为繁體'
    },
    'zh-Hant': {
      docTitle: '詩泉別苑 · 中華詩詞歌賦檢索',
      navSearch: '檢索', navRoam: '漫遊', navFav: '詩箋', navHistory: '足跡',
      heroKicker: '中華詩詞 · 免費開源數據',
      heroTitle: '咫尺之間<i>·</i>縱覽千年',
      heroSub: '檢索、偶得、漫遊 —— 於三十七萬首詩海中打撈屬於你的那一句',
      statPoems: '收錄詩詞', statAuthors: '歷代詩人', statDynasties: '朝代跨度', statTypes: '體裁樣式',
      searchPh: '輸入詩句 / 題目關鍵字（至少 3 個字）…',
      btnSearch: '檢索', btnRandom: '偶得一首',
      fAuthor: '詩人', fAuthorPh: '如：李白 / 蘇軾', fDynasty: '朝代', allDynasty: '全部朝代',
      fType: '體裁', allType: '全部體裁', fChar: '含字', fCharPh: '單字', btnReset: '重置',
      chipDynasty: '朝代', chipType: '體裁', chipAuthor: '名家',
      more: '探尋更多', moreRandom: '再來一批',
      roamTitle: '漫遊詩海', roamDesc: '按庫中順序翻閱典藏，滾動到底部自動續讀。',
      roamMore: '繼續翻閱', roamEnd: '已漫遊至可翻閱的盡頭',
      favTitle: '我的詩箋', favDesc: '珍藏的詩句保存在本機瀏覽器中，可隨時導出留存。',
      expTxt: '導出 TXT', expJson: '導出 JSON', clearFav: '清空詩箋',
      favEmpty: '詩箋尚且空白。', favEmptyHint: '在任意詩詞上點擊「藏箋」，即可收入此處。',
      hisTitle: '瀏覽足跡', hisDesc: '最近看過的詩詞會留在這裡，最多保留 60 條。',
      clearHis: '清空足跡', hisEmpty: '暫無足跡。', hisEmptyHint: '翻開任意一首詩，便會在此留痕。',
      footSrc: '數據來源：<a href="https://poetry.palemoky.com" target="_blank" rel="noopener">詩泉 API</a> · 開源項目 chinese-poetry',
      footDeploy: '本站為純靜態前端，部署於 EdgeOne Pages',
      footTip: '快捷鍵：<kbd>/</kbd> 聚焦檢索 · <kbd>R</kbd> 偶得一首 · <kbd>Esc</kbd> 關閉浮層',
      resultTitle: '檢索結果', dailyTag: '每 日 一 詩', sealText: '詩泉',
      cardFav: '藏箋', cardFavOn: '已藏', cardCopy: '複製', cardShare: '分享',
      actRead: '朗讀', actStop: '停止', actPinyin: '拼音', actExplain: '釋義',
      pyLoading: '正在載入拼音庫…', pyFail: '拼音庫載入失敗，請檢查網路後重試',
      expLoading: '正在生成白話譯文…', expFail: '釋義生成失敗，請稍後再試',
      expNone: '暫未生成該詩的釋義。',
      expSource: '釋義由 AI 生成，僅供參考', ttsUnsupported: '目前瀏覽器不支援語音朗讀',
      mFav: '藏箋', mFavOn: '已藏箋', mCopy: '複製全文', mShare: '複製分享連結', mAuthor: '同詩人作品',
      mNote: '數據來源：詩泉 API · poem #{id}',
      copyOk: '已複製到剪貼板', copyFail: '複製失敗，請長按選擇', shareOk: '分享連結已複製',
      favAdded: '已收入詩箋', favRemoved: '已從詩箋中移出', favCleared: '詩箋已清空', hisCleared: '足跡已清空',
      expTxtOk: '已導出 TXT', expJsonOk: '已導出 JSON',
      confirmClearFav: '確定清空全部詩箋嗎？此操作不可撤銷。',
      randomFail: '偶得失敗。', randomFailHint: '網路似乎不通，稍後再試。',
      netFail: '未能連上詩泉。', openFail: '未能打開該詩篇', loadFail: '翻閱失敗，請稍後再試',
      shortQuery: '關鍵字至少需要 3 個字。', shortQueryHint: '試試「明月光」「春風」這類更完整的詞句。',
      noResult: '煙海茫茫，未尋得「{q}」的詩跡。', noResultHint: '換個關鍵字，或去掉部分篩選條件再試。',
      noResultFilter: '該條件下未尋得詩跡。', noResultFilterHint: '可能過於冷門，試試換個詩人或朝代。',
      searchTitle: '「{q}」的檢索結果',
      searchMeta: '第 {page} 頁 · 本頁 {count} 首 · 已列 {total} 首', endOfList: ' · 已至盡頭',
      randomTitle: '隨緣偶得', randomMeta: '已列 {total} 首 · 可繼續「偶得一首」換新',
      oneTitle: '偶得一首', oneMeta: '獨取一瓢飲',
      fAuthorDesc: '詩人「{name}」', fCharDesc: '含「{c}」',
      langToHans: '已切換為簡體', langToHant: '已切換為繁體'
    }
  };

  /** 取当前语言的文案，支持 {占位符} 插值 */
  function t(key, vars) {
    var pack = I18N[API.lang] || I18N['zh-Hans'];
    var s = pack[key] != null ? pack[key] : I18N['zh-Hans'][key];
    if (s == null) return key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return s;
  }

  /** 将静态骨架中的文案替换为当前语言 */
  function applyStaticI18n() {
    $$('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
    $$('[data-i18n-html]').forEach(function (n) { n.innerHTML = t(n.getAttribute('data-i18n-html')); });
    $$('[data-i18n-ph]').forEach(function (n) { n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); });
  }

  /* ── 工具 ─────────────────────────────────────── */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) { return n == null ? '—' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 忽略配额错误 */ }
    }
  };

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
      catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function download(filename, text, mime) {
    var blob = new Blob(['\ufeff' + text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ── 状态 ─────────────────────────────────────── */
  var state = {
    tab: 'search',
    query: '',
    page: 1,
    hasMore: false,
    searching: false,
    token: 0,
    roamPage: 0,
    seen: {},          // 当前列表已渲染的 id
    favorites: store.get('shiquan.favorites', []),
    history: store.get('shiquan.history', [])
  };
  var meta = { dynasties: [], types: [], authors: [] };

  /* ── DOM ──────────────────────────────────────── */
  var el = {};
  ['search-input', 'clear-input', 'btn-search', 'btn-random', 'filter-author', 'filter-dynasty',
    'filter-type', 'filter-char', 'btn-reset', 'author-list', 'chips-dynasty', 'chips-type',
    'chips-author', 'chips-block', 'featured', 'result-head', 'result-title', 'result-meta',
    'results', 'state-empty', 'state-empty-text', 'state-empty-hint', 'skeleton', 'btn-more', 'roam-results',
    'roam-skeleton', 'roam-more', 'roam-sentinel', 'fav-results', 'fav-empty', 'fav-toolbar',
    'fav-count', 'fav-export-txt', 'fav-export-json', 'fav-clear', 'his-results', 'his-empty',
    'his-toolbar', 'his-clear', 'modal', 'modal-content', 'toast', 'lang-toggle', 'theme-toggle',
    'hero-stats'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

  /* ── 归一化 ───────────────────────────────────── */
  function normalize(p) {
    if (!p || typeof p !== 'object') return null;
    var content = p.content;
    if (typeof content === 'string') content = content.split('\n');
    if (!Array.isArray(content)) content = [];
    return {
      id: p.id,
      title: p.title || '无题',
      content: content.filter(function (l) { return String(l).trim() !== ''; }),
      author: (p.author && p.author.name) || p.author || '佚名',
      dynasty: (p.dynasty && p.dynasty.name) || p.dynasty || '未知',
      type: (p.type && p.type.name) || p.type || ''
    };
  }

  function filters() {
    return {
      author: el['filter-author'].value.trim(),
      dynasty: el['filter-dynasty'].value,
      type: el['filter-type'].value,
      char: el['filter-char'].value.trim()
    };
  }
  function hasFilter(f) { return !!(f.author || f.dynasty || f.type || f.char); }

  function matchFilters(p, f, useChar) {
    if (f.author && p.author.indexOf(f.author) < 0) return false;
    if (f.dynasty && p.dynasty.indexOf(f.dynasty) < 0) return false;
    if (f.type && p.type.indexOf(f.type) < 0) return false;
    if (useChar && f.char && p.content.join('').indexOf(f.char) < 0 && p.title.indexOf(f.char) < 0) return false;
    return true;
  }

  /* ── 提示 ─────────────────────────────────────── */
  var toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('is-on'); }, 2200);
  }

  /* ── 卡片 ─────────────────────────────────────── */
  function isFav(id) {
    return state.favorites.some(function (x) { return x.id === id; });
  }

  function cardEl(poem, index) {
    var p = normalize(poem);
    if (!p) return null;
    var card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = p.id;
    card.style.animationDelay = Math.min(index * 45, 420) + 'ms';
    card.innerHTML =
      '<span class="card-dynasty">' + esc(p.dynasty) + '</span>' +
      '<h3 class="card-title">' + esc(p.title) + '</h3>' +
      '<div class="card-meta">' +
        '<span class="tag tag-a">' + esc(p.author) + '</span>' +
        (p.type ? '<span class="tag tag-t">' + esc(p.type) + '</span>' : '') +
      '</div>' +
      '<div class="card-verse">' + p.content.slice(0, 6).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>' +
      '<div class="poem-tools" hidden></div>' +
      '<div class="card-foot">' +
        '<button class="act" data-act="fav">' + ICON.seal + '<span>' + (isFav(p.id) ? t('cardFavOn') : t('cardFav')) + '</span></button>' +
        '<button class="act" data-act="copy">' + ICON.copy + '<span>' + t('cardCopy') + '</span></button>' +
        '<button class="act" data-act="speak">' + ICON.speak + '<span>' + t('actRead') + '</span></button>' +
        '<button class="act" data-act="pinyin">' + ICON.pinyin + '<span>' + t('actPinyin') + '</span></button>' +
        '<button class="act" data-act="explain">' + ICON.explain + '<span>' + t('actExplain') + '</span></button>' +
        '<span class="spacer"></span>' +
        '<button class="act" data-act="share">' + ICON.link + '<span>' + t('cardShare') + '</span></button>' +
      '</div>';
    if (isFav(p.id)) card.querySelector('[data-act="fav"]').classList.add('is-on');
    var verse = card.querySelector('.card-verse');
    if (verse) verse._lines = p.content.slice(0, 6);
    card._poem = p;
    return card;
  }

  function appendPoems(container, poems, reset) {
    if (reset) { container.innerHTML = ''; state.seen = {}; }
    var added = 0, frag = document.createDocumentFragment();
    poems.forEach(function (raw) {
      var p = normalize(raw);
      if (!p || p.id == null || state.seen[p.id]) return;
      state.seen[p.id] = 1;
      var c = cardEl(p, added);
      if (c) { frag.appendChild(c); added++; }
    });
    container.appendChild(frag);
    return added;
  }

  /* ── 加载态 ───────────────────────────────────── */
  function setSearching(on) {
    state.searching = on;
    el.skeleton.hidden = !on;
    el['btn-search'].disabled = on;
    el['btn-random'].disabled = on;
  }
  function showEmpty(text, hint) {
    el['state-empty-text'].textContent = text;
    el['state-empty-hint'].textContent = hint || t('noResultHint');
    el['state-empty'].hidden = false;
  }

  /* ── 检索视图渲染策略 ─────────────────────────── */
  function showDiscovery(on) {
    el['chips-block'].hidden = !on;
    el.featured.hidden = !on;
  }

  function setMoreButton(show, mode) {
    el['btn-more'].hidden = !show;
    el['btn-more'].dataset.mode = mode;
    el['btn-more'].textContent = mode === 'random' ? t('moreRandom') : t('more');
  }

  /* ── 搜索 ─────────────────────────────────────── */
  function doSearch(reset) {
    var q = el['search-input'].value.trim();
    var f = filters();
    var myToken = ++state.token;

    if (!q) {
      // 无关键字：按筛选条件随机成批
      loadRandomBatch(reset === false ? false : true);
      return;
    }
    if (q.length < 3) {
      setSearching(false);
      el.results.innerHTML = '';
      el['result-head'].hidden = true;
      el['result-title'].textContent = t('resultTitle');
      el['result-meta'].textContent = '';
      el['btn-more'].hidden = true;
      showDiscovery(false);
      showEmpty(t('shortQuery'), t('shortQueryHint'));
      return;
    }

    if (reset) state.page = 1;
    setSearching(true);
    if (reset) { el['state-empty'].hidden = true; el.results.innerHTML = ''; state.seen = {}; }

    API.search(q, state.page).then(function (res) {
      if (myToken !== state.token) return;
      var items = res.items.map(normalize).filter(Boolean)
        .filter(function (p) { return matchFilters(p, f, true); });

      setSearching(false);
      showDiscovery(false);

      if (reset) {
        el.results.innerHTML = '';
        state.seen = {};
        setMoreButton(false, 'search');
      }

      var added = appendPoems(el.results, items, false);
      var total = el.results.children.length;
      // 上游 hasMore 在上限页仍为 true，故以「本页无新增」作为终止条件
      state.hasMore = !!(res.pagination && res.pagination.hasMore) &&
        added > 0 && state.page < MAX_PAGE;

      el['result-head'].hidden = false;
      el['result-title'].textContent = t('searchTitle', { q: q });
      el['result-meta'].textContent = t('searchMeta', { page: state.page, count: items.length, total: total }) +
        (state.hasMore ? '' : t('endOfList'));

      if (!added && total === 0) {
        showEmpty(t('noResult', { q: q }), t('noResultHint'));
      } else {
        el['state-empty'].hidden = true;
      }
      setMoreButton(state.hasMore, 'search');
    }).catch(function (err) {
      if (myToken !== state.token) return;
      setSearching(false);
      showEmpty(t('netFail'), err && err.message ? err.message : '');
    });
  }

  function loadMore() {
    if (state.searching || !state.hasMore) return;
    state.page++;
    doSearch(false);
  }

  /* ── 随机成批 ─────────────────────────────────── */
  function loadRandomBatch(reset) {
    var f = filters();
    var batches = hasFilter(f) ? 8 : 6;
    var myToken = ++state.token;
    setSearching(true);
    if (reset) { el.results.innerHTML = ''; state.seen = {}; setMoreButton(false, 'random'); }
    showDiscovery(false);
    el['state-empty'].hidden = true;

    var jobs = [];
    for (var i = 0; i < batches; i++) jobs.push(API.random(f).catch(function () { return null; }));

    Promise.all(jobs).then(function (list) {
      if (myToken !== state.token) return;
      setSearching(false);

      var valid = list.filter(Boolean).map(normalize).filter(Boolean)
        .filter(function (p) { return matchFilters(p, f, true); });

      var added = appendPoems(el.results, valid, false);
      el['result-head'].hidden = false;

      var desc = [];
      if (f.author) desc.push(t('fAuthorDesc', { name: f.author }));
      if (f.dynasty) desc.push(f.dynasty);
      if (f.type) desc.push(f.type);
      if (f.char) desc.push(t('fCharDesc', { c: f.char }));
      el['result-title'].textContent = desc.length ? desc.join(' · ') + ' · ' + t('randomTitle') : t('randomTitle');
      el['result-meta'].textContent = t('randomMeta', { total: el.results.children.length });

      if (!added && el.results.children.length === 0) {
        showEmpty(t('noResultFilter'), t('noResultFilterHint'));
      }
      setMoreButton(true, 'random');
    });
  }

  /* ── 单首偶得 ─────────────────────────────────── */
  function randomOne() {
    var myToken = ++state.token;
    setSearching(true);
    API.random(filters()).then(function (poem) {
      if (myToken !== state.token) return;
      setSearching(false);
      if (!poem) { showEmpty(t('noResultFilter')); return; }
      showDiscovery(false);
      el['result-head'].hidden = false;
      el['result-title'].textContent = t('oneTitle');
      el['result-meta'].textContent = t('oneMeta');
      el.results.innerHTML = '';
      state.seen = {};
      appendPoems(el.results, [poem], false);
      el['state-empty'].hidden = true;
      setMoreButton(true, 'random');
    }).catch(function () {
      setSearching(false);
      showEmpty(t('randomFail'), t('randomFailHint'));
    });
  }

  /* ── 漫游 ─────────────────────────────────────── */
  function roamMore() {
    if (state.roamPage >= MAX_PAGE) { el['roam-more'].hidden = true; return; }
    el['roam-skeleton'].hidden = false;
    el['roam-more'].disabled = true;
    API.poems(state.roamPage + 1).then(function (res) {
      el['roam-skeleton'].hidden = true;
      el['roam-more'].disabled = false;
      state.roamPage++;
      var added = 0;
      (res.data || []).forEach(function (raw) {
        var p = normalize(raw);
        if (!p || state.seen[p.id]) return;
        state.seen[p.id] = 1;
        var c = cardEl(p, added);
        if (c) { el['roam-results'].appendChild(c); added++; }
      });
      var hasMore = !!(res.pagination && res.pagination.hasMore) && added > 0 && state.roamPage < MAX_PAGE;
      el['roam-more'].hidden = !hasMore;
      if (!hasMore) toast(t('roamEnd'));
    }).catch(function () {
      el['roam-skeleton'].hidden = true;
      el['roam-more'].disabled = false;
      toast(t('loadFail'));
    });
  }

  /* ── 收藏 / 历史 ──────────────────────────────── */
  function toggleFav(poem) {
    var p = normalize(poem);
    var i = state.favorites.findIndex(function (x) { return x.id === p.id; });
    if (i >= 0) {
      state.favorites.splice(i, 1);
      toast(t('favRemoved'));
    } else {
      state.favorites.unshift({ id: p.id, title: p.title, content: p.content, author: p.author, dynasty: p.dynasty, type: p.type, savedAt: Date.now() });
      toast(t('favAdded'));
    }
    store.set('shiquan.favorites', state.favorites);
    el['fav-count'].textContent = state.favorites.length;
    return i < 0;
  }

  function addHistory(poem) {
    var p = normalize(poem);
    state.history = state.history.filter(function (x) { return x.id !== p.id; });
    state.history.unshift({ id: p.id, title: p.title, author: p.author, dynasty: p.dynasty, type: p.type, content: p.content, viewedAt: Date.now() });
    if (state.history.length > 60) state.history.length = 60;
    store.set('shiquan.history', state.history);
  }

  function renderFavorites() {
    el['fav-results'].innerHTML = '';
    if (!state.favorites.length) {
      el['fav-empty'].hidden = false;
      el['fav-toolbar'].hidden = true;
      return;
    }
    el['fav-empty'].hidden = true;
    el['fav-toolbar'].hidden = false;
    var frag = document.createDocumentFragment();
    state.favorites.forEach(function (p, i) {
      var c = cardEl(p, i);
      if (c) frag.appendChild(c);
    });
    el['fav-results'].appendChild(frag);
  }

  function renderHistory() {
    el['his-results'].innerHTML = '';
    if (!state.history.length) {
      el['his-empty'].hidden = false;
      el['his-toolbar'].hidden = true;
      return;
    }
    el['his-empty'].hidden = true;
    el['his-toolbar'].hidden = false;
    var frag = document.createDocumentFragment();
    state.history.forEach(function (p, i) {
      var c = cardEl(p, i);
      if (c) frag.appendChild(c);
    });
    el['his-results'].appendChild(frag);
  }

  function poemToText(p) {
    var n = normalize(p);
    return n.title + '\n' + n.dynasty + ' · ' + n.author + (n.type ? ' · ' + n.type : '') +
      '\n\n' + n.content.join('\n') + '\n\n—— 诗泉别苑';
  }

  /* ── 浮层 ─────────────────────────────────────── */
  var modalOpen = false;

  function openPoem(poemOrId, pushHash) {
    var p = poemOrId && typeof poemOrId === 'object' ? normalize(poemOrId) : null;
    var id = p ? p.id : poemOrId;

    el.modal.hidden = false;
    modalOpen = true;
    document.body.style.overflow = 'hidden';
    el['modal-content'].innerHTML = '<div class="skeleton" style="height:260px"></div>';

    var ready = p && p.content && p.content.length ? Promise.resolve(p) : API.poem(id).then(normalize);

    ready.then(function (full) {
      if (!full) throw new Error('empty');
      if (p && (!p.content || !p.content.length)) Object.assign(p, full);
      renderModal(p && p.content && p.content.length ? p : full);
      addHistory(p || full);
      if (pushHash !== false) setHash('#/p/' + id);
    }).catch(function () {
      closeModal(true);
      toast(t('openFail'));
    });
  }

  function renderModal(p) {
    var fav = isFav(p.id);
    el['modal-content'].innerHTML =
      '<h2 class="m-title" id="modal-title">' + esc(p.title) + '</h2>' +
      '<div class="m-meta">' +
        '<span class="tag tag-d">' + esc(p.dynasty) + '</span>' +
        '<span class="tag tag-a">' + esc(p.author) + '</span>' +
        (p.type ? '<span class="tag tag-t">' + esc(p.type) + '</span>' : '') +
      '</div>' +
      '<div class="m-verse">' + p.content.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>' +
      '<div class="m-tools poem-tools" hidden></div>' +
      '<div class="m-divider"></div>' +
      '<div class="m-actions">' +
        '<button class="m-btn' + (fav ? ' is-on' : '') + '" data-m="fav">' + ICON.seal + '<span>' + (fav ? t('mFavOn') : t('mFav')) + '</span></button>' +
        '<button class="m-btn" data-m="copy">' + ICON.copy + '<span>' + t('mCopy') + '</span></button>' +
        '<button class="m-btn" data-m="speak">' + ICON.speak + '<span>' + t('actRead') + '</span></button>' +
        '<button class="m-btn" data-m="pinyin">' + ICON.pinyin + '<span>' + t('actPinyin') + '</span></button>' +
        '<button class="m-btn" data-m="explain">' + ICON.explain + '<span>' + t('actExplain') + '</span></button>' +
        '<button class="m-btn" data-m="share">' + ICON.link + '<span>' + t('mShare') + '</span></button>' +
        '<button class="m-btn" data-m="author">' + t('mAuthor') + '</button>' +
      '</div>' +
      '<p class="m-note">' + t('mNote', { id: esc(p.id) }) + '</p>';

    if (p.author && p.author !== '佚名') addAuthorOption(p.author);
    var mV = el['modal-content'].querySelector('.m-verse');
    if (mV) mV._lines = p.content;
    el['modal-content']._poem = p;
  }

  function closeModal(fromHash) {
    if (!modalOpen) return;
    el.modal.hidden = true;
    modalOpen = false;
    document.body.style.overflow = '';
    if (!fromHash && location.hash.indexOf('#/p/') === 0) setHash('#/');
  }

  var suppressHash = false;
  function setHash(h) {
    suppressHash = true;
    if (h === '#/') {
      history.replaceState(null, '', location.pathname + location.search);
    } else {
      location.hash = h;
    }
    setTimeout(function () { suppressHash = false; }, 0);
  }

  function handleHash() {
    if (suppressHash) return;
    var m = /^#\/p\/(\d+)/.exec(location.hash);
    if (m) openPoem(Number(m[1]), false);
    else if (modalOpen) closeModal(true);
  }

  /* ── 元数据 ───────────────────────────────────── */
  function addAuthorOption(name) {
    if (!name || meta.authors.some(function (a) { return a.name === name; })) return;
    meta.authors.push({ name: name });
    var o = document.createElement('option');
    o.value = name;
    el['author-list'].appendChild(o);
  }

  /**
   * 拉取并渲染统计与分类元数据。
   * 可在切换语言后重复调用：会先清空容器再按当前语言重建。
   */
  function loadMeta() {
    return Promise.all([
      API.stats().catch(function () { return null; }),
      API.dynasties().catch(function () { return []; }),
      API.types().catch(function () { return []; })
    ]).then(function (r) {
      var stats = r[0] || {};
      $$('[data-stat]').forEach(function (b) {
        var k = b.getAttribute('data-stat');
        b.textContent = stats[k] != null ? fmt(stats[k]) : '—';
      });

      meta.dynasties = (r[1] || []).filter(function (d) { return d && d.name; });
      meta.types = (r[2] || []).filter(function (x) { return x && x.name; });

      // 清空后重建，避免切换语言时累加
      el['chips-dynasty'].innerHTML = '';
      el['chips-type'].innerHTML = '';
      el['chips-author'].innerHTML = '';
      el['filter-dynasty'].innerHTML = '';
      el['filter-type'].innerHTML = '';
      el['filter-dynasty'].appendChild(new Option(t('allDynasty'), ''));
      el['filter-type'].appendChild(new Option(t('allType'), ''));

      // 朝代下拉 & 快捷标签
      meta.dynasties.forEach(function (d) {
        el['filter-dynasty'].appendChild(new Option(d.name, d.name));
        var b = document.createElement('button');
        b.className = 'chip';
        b.dataset.dynasty = d.name;
        b.textContent = d.name;
        el['chips-dynasty'].appendChild(b);
      });

      // 体裁下拉（按 category 分组）
      var groups = {};
      meta.types.forEach(function (tp) {
        var g = tp.category || '其他';
        (groups[g] = groups[g] || []).push(tp);
      });
      Object.keys(groups).forEach(function (g) {
        var og = document.createElement('optgroup');
        og.label = g;
        groups[g].forEach(function (tp) { og.appendChild(new Option(tp.name, tp.name)); });
        el['filter-type'].appendChild(og);
      });

      // 体裁快捷标签
      var typeByName = {};
      meta.types.forEach(function (tp) { typeByName[tp.name] = tp; });
      POPULAR_TYPES.forEach(function (name) {
        if (!typeByName[name]) return;
        var b = document.createElement('button');
        b.className = 'chip';
        b.dataset.type = name;
        b.textContent = name;
        el['chips-type'].appendChild(b);
      });

      // 名家标签
      FAMOUS.forEach(function (name) {
        var b = document.createElement('button');
        b.className = 'chip';
        b.dataset.author = name;
        b.textContent = name;
        el['chips-author'].appendChild(b);
      });
    });
  }

  function fillAuthors() {
    API.authorsAll(6).then(function (list) {
      meta.authors = list.filter(function (a) { return a && a.name; });
      var names = meta.authors.map(function (a) { return a.name; });
      var seen = {};
      var frag = document.createDocumentFragment();
      names.concat(FAMOUS).forEach(function (n) {
        if (!n || seen[n]) return;
        seen[n] = 1;
        frag.appendChild(new Option(n, n));
      });
      el['author-list'].appendChild(frag);
    }).catch(function () { /* 作者列表属于增强项，失败静默 */ });
  }

  /* ── 每日一诗 ─────────────────────────────────── */
  function dailyPoem() {
    var d = new Date();
    var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + '-' + API.lang;
    var cached = store.get('shiquan.daily', null);
    if (cached && cached.key === key && cached.poem && cached.poem.content && cached.poem.content.length) {
      renderDaily(cached.poem);
      return;
    }

    API.random({}).then(normalize).then(function (p) {
      if (!p || !p.content.length) throw new Error('empty');
      store.set('shiquan.daily', { key: key, poem: p });
      renderDaily(p);
    }).catch(function () {
      if (cached && cached.poem) renderDaily(cached.poem);
      else el.featured.hidden = true;
    });
  }

  function renderDaily(p) {
    el.featured.innerHTML =
      '<article class="daily">' +
        '<div class="daily-main">' +
          '<span class="daily-tag">' + t('dailyTag') + '</span>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<div class="meta">' +
            '<span class="tag tag-d">' + esc(p.dynasty) + '</span>' +
            '<span class="tag tag-a">' + esc(p.author) + '</span>' +
            (p.type ? '<span class="tag tag-t">' + esc(p.type) + '</span>' : '') +
          '</div>' +
          '<div class="verse">' + p.content.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="daily-seal">' + t('sealText') + '</div>' +
        '<div class="daily-tools">' +
          '<div class="daily-actions">' +
            '<button class="act" data-act="speak">' + ICON.speak + '<span>' + t('actRead') + '</span></button>' +
            '<button class="act" data-act="pinyin">' + ICON.pinyin + '<span>' + t('actPinyin') + '</span></button>' +
            '<button class="act" data-act="explain">' + ICON.explain + '<span>' + t('actExplain') + '</span></button>' +
          '</div>' +
          '<div class="poem-tools" hidden></div>' +
        '</div>' +
      '</article>';
    el.featured._poem = p;
    var verse = $('.verse', el.featured);
    if (verse) verse._lines = p.content;
  }

  /* ── 朗读 / 拼音 / 释义 ───────────────────────── */
  var PINYIN_SRC = 'https://cdn.jsdelivr.net/npm/pinyin-pro@3/dist/index.js';
  var pinyinLib = null;
  var speakState = null;   // { btn, utter }
  var explainCache = {};

  function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c.signal;
  }

  function toolsEl(host) { return host ? host.querySelector('.poem-tools') : null; }

  function verseElIn(host) {
    return host ? (host.querySelector('.m-verse') || host.querySelector('.card-verse') || host.querySelector('.verse')) : null;
  }

  function setBtnLabel(btn, text) {
    var s = btn && btn.querySelector('span');
    if (s) s.textContent = text;
  }

  function loadPinyinLib() {
    if (window.pinyinPro) return Promise.resolve(window.pinyinPro);
    if (pinyinLib) return pinyinLib;
    pinyinLib = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PINYIN_SRC;
      s.async = true;
      s.onload = function () { window.pinyinPro ? resolve(window.pinyinPro) : reject(new Error('pinyin lib missing')); };
      s.onerror = function () { pinyinLib = null; reject(new Error('pinyin lib load failed')); };
      document.head.appendChild(s);
    });
    return pinyinLib;
  }

  /** 将一行文字转成带 <ruby> 注音的 HTML（逐字对齐） */
  function toRuby(line, pp, ctx) {
    return pp.pinyin(line, { type: 'all', toneType: 'symbol', context: ctx || '' }).map(function (o) {
      if (o && o.isZh) return '<ruby>' + esc(o.origin) + '<rt>' + esc(o.pinyin) + '</rt></ruby>';
      return '<span class="py-punc">' + esc(o ? o.origin : '') + '</span>';
    }).join('');
  }

  function togglePinyin(host, btn) {
    var verse = verseElIn(host);
    if (!verse) return;
    var next = !verse.classList.contains('is-pinyin');
    if (!next) {
      if (verse._orig != null) verse.innerHTML = verse._orig;
      verse.classList.remove('is-pinyin');
      btn.classList.remove('is-on');
      return;
    }
    btn.classList.add('is-on');
    loadPinyinLib().then(function (pp) {
      if (verse._orig == null) verse._orig = verse.innerHTML;
      verse.innerHTML = (verse._lines || []).map(function (l) { return '<p>' + toRuby(l, pp) + '</p>'; }).join('');
      verse.classList.add('is-pinyin');
    }).catch(function () {
      btn.classList.remove('is-on');
      toast(t('pyFail'));
    });
  }

  function stopSpeak() {
    if (!speakState) return;
    var st = speakState;
    speakState = null;
    try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    if (st.btn) { st.btn.classList.remove('is-on'); setBtnLabel(st.btn, t('actRead')); }
  }

  function speakPoem(poem, btn) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      toast(t('ttsUnsupported'));
      return;
    }
    if (speakState && speakState.btn === btn) { stopSpeak(); return; }
    stopSpeak();
    var text = poem.title + '。' +
      (poem.dynasty && poem.dynasty !== '未知' ? poem.dynasty + '。' : '') +
      (poem.author && poem.author !== '佚名' ? poem.author + '。' : '') +
      poem.content.join('');
    var u = new SpeechSynthesisUtterance(text);
    u.lang = API.lang === 'zh-Hans' ? 'zh-CN' : 'zh-TW';
    u.rate = 0.92;
    var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    var zh = voices.filter(function (v) { return /^zh/i.test(v.lang); })[0];
    if (zh) u.voice = zh;
    speakState = { btn: btn, utter: u };
    btn.classList.add('is-on');
    setBtnLabel(btn, t('actStop'));
    u.onend = u.onerror = function () { if (speakState && speakState.btn === btn) stopSpeak(); };
    window.speechSynthesis.speak(u);
  }

  /* 释义：由大模型把古典诗词译成现代白话 + 短赏析
     词条类数据源只给百科背景，不是「现代解说」，故改用文本生成接口。
     优先走同源网关（可缓存、无长度限制）→ 未部署网关时浏览器直连生成接口。
     固定用 OpenAI 兼容端点：其纯文本端点偶发会把含 reasoning 的原始
     对话载荷当正文吐出，而这里只取 choices[0].message.content。 */
  var AI_ENDPOINT = 'https://text.pollinations.ai/openai';
  var AI_MODEL = 'openai';
  var AI_MAX_LINES = 24;

  function buildExplainPrompt(poem) {
    var lines = poem.content.slice(0, AI_MAX_LINES).join('，');
    return '你是一位古典诗词讲解者。请把下面这首诗词译成现代白话，输出简体中文，' +
      '按以下格式作答，不要输出任何多余说明：\n' +
      '逐句译文：每句一行，格式为「原句 —— 译文」\n' +
      '赏析：一段不超过 60 字的简要赏析\n' +
      '诗题：' + poem.title + '\n' +
      '作者：' + (poem.dynasty || '') + '·' + (poem.author || '') + '\n' +
      '正文：' + lines;
  }

  /** 从 OpenAI 风格响应中取出正文，忽略 reasoning 等旁路字段 */
  function extractAiText(payload) {
    var p = payload || {};
    var choice = p.choices && p.choices[0];
    var msg = choice ? (choice.message || choice) : null;
    var text = (msg && (msg.content || msg.text)) || p.content || p.text || '';
    if (Array.isArray(text)) {
      text = text.map(function (part) { return (part && (part.text || part.content)) || ''; }).join('');
    }
    return String(text || '').trim();
  }

  function fetchAiDirect(prompt) {
    return fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        private: true
      }),
      signal: timeoutSignal(40000)
    }).then(function (res) {
      if (!res || !res.ok) throw new Error('bad status');
      return res.json();
    }).then(function (json) {
      var text = extractAiText(json);
      if (!text) throw new Error('empty');
      return { text: text };
    });
  }

  function fetchExplain(poem) {
    var key = poem.title + '|' + poem.author;
    if (explainCache[key]) return Promise.resolve(explainCache[key]);
    var prompt = buildExplainPrompt(poem);
    return API.resolve().then(function (base) {
      var start = base === ''
        ? fetch('/api/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
            signal: timeoutSignal(30000)
          }).then(function (res) {
            if (!res || !res.ok) throw new Error('bad status');
            return res.json();
          }).then(function (json) {
            var d = json && json.data ? json.data : null;
            if (!d || !d.text) throw new Error('bad payload');
            return d;
          })
        : Promise.reject(new Error('no gateway'));
      return start.catch(function () { return fetchAiDirect(prompt); });
    }).then(function (d) { explainCache[key] = d; return d; });
  }

  /** 把返回的纯文本（含轻量 Markdown）安全地渲染为 HTML */
  function inlineMd(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function renderExplainText(text) {
    var out = [];
    var listOpen = false;
    var closeList = function () { if (listOpen) { out.push('</ul>'); listOpen = false; } };
    String(text).split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line) { closeList(); return; }
      var h = /^#{1,6}\s*(.+)$/.exec(line);
      if (h) { closeList(); out.push('<p class="explain-h">' + inlineMd(h[1]) + '</p>'); return; }
      var li = /^(?:[-*•]|\d+[.、)])\s*(.+)$/.exec(line);
      if (li) {
        if (!listOpen) { out.push('<ul class="explain-list">'); listOpen = true; }
        out.push('<li>' + inlineMd(li[1]) + '</li>');
        return;
      }
      closeList();
      out.push('<p>' + inlineMd(line) + '</p>');
    });
    closeList();
    return out.join('');
  }

  function toggleExplain(host, poem, btn) {
    var tools = toolsEl(host);
    if (!tools) return;
    var next = !btn.classList.contains('is-on');
    btn.classList.toggle('is-on', next);
    if (!next) { tools.hidden = true; tools.innerHTML = ''; return; }
    tools.hidden = false;
    tools.innerHTML = '<p class="tools-status">' + t('expLoading') + '</p>';
    fetchExplain(poem).then(function (d) {
      if (!btn.classList.contains('is-on')) return;
      if (!d || !d.text) {
        tools.innerHTML = '<p class="tools-status">' + t('expNone') + '</p>';
        return;
      }
      tools.innerHTML =
        '<div class="explain-head"><span class="explain-name">' + esc(poem.title) + '</span>' +
        '<span class="explain-desc">' + esc(poem.dynasty) + ' · ' + esc(poem.author) + '</span></div>' +
        '<div class="explain-body">' + renderExplainText(d.text) + '</div>' +
        '<p class="explain-src">' + t('expSource') + '</p>';
    }).catch(function () {
      if (!btn.classList.contains('is-on')) return;
      tools.innerHTML = '<p class="tools-status">' + t('expFail') + '</p>';
    });
  }

  /** 统一的「朗读 / 拼音 / 释义」派发；命中返回 true */
  function handleToolsAct(kind, btn, host, poem) {
    if (kind === 'speak') { speakPoem(poem, btn); return true; }
    if (kind === 'pinyin') { togglePinyin(host, btn); return true; }
    if (kind === 'explain') { toggleExplain(host, poem, btn); return true; }
    return false;
  }

  /* ── 视图切换 ─────────────────────────────────── */
  function switchTab(tab) {
    state.tab = tab;
    $$('.view').forEach(function (v) { v.classList.remove('is-active'); });
    var view = document.getElementById('view-' + tab);
    if (view) view.classList.add('is-active');
    $$('.nav-btn').forEach(function (b) { b.classList.toggle('is-active', b.dataset.tab === tab); });
    if (tab === 'favorites') renderFavorites();
    if (tab === 'history') renderHistory();
    if (tab === 'roam' && state.roamPage === 0) roamMore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── 主题 / 语言 ──────────────────────────────── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    store.set('shiquan.theme', theme);
    var tc = theme === 'dark' ? '#0f1218' : '#f4efe4';
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', tc);
  }
  function applyLang(l) {
    API.lang = l;
    store.set('shiquan.lang', l);
    document.documentElement.lang = l === 'zh-Hans' ? 'zh-CN' : 'zh-Hant';
    el['lang-toggle'].textContent = l === 'zh-Hans' ? '简' : '繁';
    applyStaticI18n();
  }
  function toggleLang() {
    var next = API.lang === 'zh-Hans' ? 'zh-Hant' : 'zh-Hans';
    applyLang(next);
    store.set('shiquan.daily', null);

    // 分类名与下拉项由接口按语言返回，需重新拉取
    el['filter-author'].value = '';
    el['filter-char'].value = '';
    $$('.chip').forEach(function (c) { c.classList.remove('is-on'); });
    loadMeta();

    toast(next === 'zh-Hans' ? t('langToHans') : t('langToHant'));
    Object.keys(state.seen).forEach(function (k) { delete state.seen[k]; });
    dailyPoem();
    if (state.tab === 'roam') {
      state.roamPage = 0;
      el['roam-results'].innerHTML = '';
      state.seen = {};
      roamMore();
    } else if (el['search-input'].value.trim()) {
      doSearch(true);
    } else {
      loadRandomBatch(true);
      showDiscovery(true);
    }
  }

  /* ── 事件绑定 ─────────────────────────────────── */
  function bind() {
    el['btn-search'].addEventListener('click', function () { doSearch(true); });
    el['btn-random'].addEventListener('click', randomOne);

    el['btn-more'].addEventListener('click', function () {
      if (el['btn-more'].dataset.mode === 'random') loadRandomBatch(false);
      else loadMore();
    });

    el['search-input'].addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doSearch(true); }
    });
    el['search-input'].addEventListener('input', function () {
      el['clear-input'].hidden = !el['search-input'].value;
    });
    el['clear-input'].addEventListener('click', function () {
      el['search-input'].value = '';
      el['clear-input'].hidden = true;
      el['search-input'].focus();
    });
    el['filter-author'].addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doSearch(true); }
    });
    ['filter-dynasty', 'filter-type', 'filter-char'].forEach(function (id) {
      el[id].addEventListener('change', function () { doSearch(true); });
    });

    el['btn-reset'].addEventListener('click', function () {
      el['filter-author'].value = '';
      el['filter-dynasty'].value = '';
      el['filter-type'].value = '';
      el['filter-char'].value = '';
      el['search-input'].value = '';
      el['clear-input'].hidden = true;
      $$('.chip').forEach(function (c) { c.classList.remove('is-on'); });
      el.results.innerHTML = '';
      el['result-head'].hidden = true;
      el['btn-more'].hidden = true;
      el['state-empty'].hidden = true;
      // 先发起请求（其中会收起发现区），再恢复发现区，使其保持可见
      loadRandomBatch(true);
      showDiscovery(true);
    });

    // 快捷标签
    document.addEventListener('click', function (e) {
      var chip = e.target.closest && e.target.closest('.chip');
      if (!chip) return;
      if (chip.dataset.dynasty !== undefined) {
        el['filter-dynasty'].value = chip.dataset.dynasty;
        el['filter-type'].value = '';
        el['filter-author'].value = '';
      } else if (chip.dataset.type !== undefined) {
        el['filter-type'].value = chip.dataset.type;
        el['filter-author'].value = '';
        el['filter-dynasty'].value = '';
      } else if (chip.dataset.author !== undefined) {
        el['filter-author'].value = chip.dataset.author;
        el['filter-dynasty'].value = '';
        el['filter-type'].value = '';
      }
      el['search-input'].value = '';
      $$('.chip').forEach(function (c) { c.classList.remove('is-on'); });
      chip.classList.add('is-on');
      loadRandomBatch(true);
    });

    // 卡片交互
    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('.card');
      if (!card || !card._poem) return;
      var act = e.target.closest('[data-act]');
      if (act) {
        e.stopPropagation();
        var kind = act.dataset.act;
        if (kind === 'fav') {
          var on = toggleFav(card._poem);
          act.classList.toggle('is-on', on);
          $('span', act).textContent = on ? t('cardFavOn') : t('cardFav');
        } else if (kind === 'copy') {
          copyText(poemToText(card._poem)).then(function () { toast(t('copyOk')); },
            function () { toast(t('copyFail')); });
        } else if (kind === 'share') {
          sharePoem(card._poem);
        } else if (kind === 'speak' || kind === 'pinyin' || kind === 'explain') {
          handleToolsAct(kind, act, card, card._poem);
        }
        return;
      }
      // 点击释义面板等工具内容不打开浮层
      if (e.target.closest('.poem-tools')) return;
      openPoem(card._poem);
    });

    // 每日一诗工具按钮（朗读 / 拼音 / 释义）
    document.addEventListener('click', function (e) {
      var daily = e.target.closest && e.target.closest('.daily');
      if (!daily) return;
      var act = e.target.closest('[data-act]');
      if (!act) return;
      e.stopPropagation();
      handleToolsAct(act.dataset.act, act, daily, el.featured._poem);
    });

    // 浮层
    el.modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeModal(); return; }
      var btn = e.target.closest('[data-m]');
      if (!btn) return;
      var p = el['modal-content']._poem;
      if (!p) return;
      var kind = btn.dataset.m;
      if (kind === 'fav') {
        var on = toggleFav(p);
        btn.classList.toggle('is-on', on);
        $('span', btn).textContent = on ? t('mFavOn') : t('mFav');
      } else if (kind === 'copy') {
        copyText(poemToText(p)).then(function () { toast(t('copyOk')); },
          function () { toast(t('copyFail')); });
      } else if (kind === 'share') {
        sharePoem(p);
      } else if (kind === 'speak' || kind === 'pinyin' || kind === 'explain') {
        handleToolsAct(kind, btn, el['modal-content'], p);
      } else if (kind === 'author') {
        closeModal();
        switchTab('search');
        el['filter-author'].value = p.author;
        el['filter-dynasty'].value = '';
        el['filter-type'].value = '';
        el['search-input'].value = '';
        loadRandomBatch(true);
      }
    });

    // 收藏 / 历史工具栏
    el['fav-clear'].addEventListener('click', function () {
      if (!state.favorites.length) return;
      if (!confirm(t('confirmClearFav'))) return;
      state.favorites = [];
      store.set('shiquan.favorites', []);
      el['fav-count'].textContent = '0';
      renderFavorites();
      toast(t('favCleared'));
    });
    el['fav-export-txt'].addEventListener('click', function () {
      var txt = state.favorites.map(function (p, i) {
        return '【' + (i + 1) + '】' + poemToText(p).replace(/\n\n—— [^\n]+$/, '');
      }).join('\n\n' + '—'.repeat(24) + '\n\n');
      download('诗泉别苑-诗笺.txt', txt);
      toast(t('expTxtOk'));
    });
    el['fav-export-json'].addEventListener('click', function () {
      download('诗泉别苑-诗笺.json', JSON.stringify(state.favorites, null, 2), 'application/json');
      toast(t('expJsonOk'));
    });
    el['his-clear'].addEventListener('click', function () {
      state.history = [];
      store.set('shiquan.history', []);
      renderHistory();
      toast(t('hisCleared'));
    });

    // 漫游
    el['roam-more'].addEventListener('click', roamMore);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && state.tab === 'roam' && !el['roam-more'].disabled && !el['roam-more'].hidden) roamMore();
        });
      }, { rootMargin: '320px' }).observe(el['roam-sentinel']);
    }

    // 顶栏
    $$('.nav-btn').forEach(function (b) {
      b.addEventListener('click', function () { switchTab(b.dataset.tab); });
    });
    el['theme-toggle'].addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
    el['lang-toggle'].addEventListener('click', toggleLang);

    // 快捷键
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.key === 'Escape' && modalOpen) { closeModal(); return; }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); el['search-input'].focus(); }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); randomOne(); }
    });

    window.addEventListener('hashchange', handleHash);
  }

  function sharePoem(p) {
    var url = location.origin + location.pathname + '#/p/' + p.id;
    copyText(url).then(function () { toast(t('shareOk')); },
      function () { toast(url); });
  }

  /* ── 启动 ─────────────────────────────────────── */
  function boot() {
    var savedTheme = store.get('shiquan.theme', null);
    if (!savedTheme) {
      savedTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(savedTheme);
    applyLang(store.get('shiquan.lang', 'zh-Hans'));

    el['fav-count'].textContent = state.favorites.length;

    bind();
    loadMeta();
    fillAuthors();
    dailyPoem();
    // 首屏：随机诗选 + 每日一诗 + 分类速览同时呈现
    loadRandomBatch(true);
    showDiscovery(true);
    handleHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
/* ===================================================================
   捡漏 · app.js  —  零依赖，单文件状态机
   状态只进 localStorage：领取记录 / 我发布的 / Pro 标记
   =================================================================== */
(function () {
  'use strict';

  var LS_KEY = 'campusloot.v1';
  var CAMPUS = CAMPUSES[0];
  var NOW = Date.now();

  /* ---------------- 状态 ---------------- */
  var state = loadState();
  var pinId = null;          // 刚发布的那条，置顶（刷新后按距离自然排）
  var activeCat = 'all';
  var activeTab = 'home';
  var detailId = null;
  var tickTimer = null;

  function loadState() {
    var base = { claims: [], mine: [], pro: false };
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      return {
        claims: Array.isArray(parsed.claims) ? parsed.claims : [],
        mine: Array.isArray(parsed.mine) ? parsed.mine : [],
        pro: !!parsed.pro
      };
    } catch (e) { return base; }
  }

  function saveState() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------------- 数据 ---------------- */
  function allItems() {
    var seed = SEED.map(function (it) {
      return assign({}, it, { expiresAt: NOW + it.expiresInMin * 60000, mine: false });
    });
    var mine = state.mine.map(function (it) {
      return assign({}, it, { expiresAt: it.expiresAt || (Date.now() + it.expiresInMin * 60000), mine: true });
    });
    return seed.concat(mine);
  }

  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  }

  function spotName(id) {
    for (var i = 0; i < CAMPUS.spots.length; i++) if (CAMPUS.spots[i].id === id) return CAMPUS.spots[i].name;
    return '校内';
  }

  function catName(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i].name;
    return '';
  }

  function itemById(id) {
    var list = allItems();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function claimOf(id) {
    for (var i = 0; i < state.claims.length; i++) if (state.claims[i].itemId === id) return state.claims[i];
    return null;
  }

  function stockOf(item) {
    var claimed = state.claims.filter(function (c) { return c.itemId === item.id; }).length;
    return Math.max(0, item.stock - claimed);
  }

  /* ---------------- 时间 / 距离文案 ---------------- */
  function minsLeft(item) {
    return Math.round((item.expiresAt - Date.now()) / 60000);
  }

  function timeText(item) {
    var m = minsLeft(item);
    if (m <= 0) return '已过期';
    if (m < 60) return '剩 ' + m + ' 分钟';
    if (m < 1440) {
      var h = Math.floor(m / 60), r = m % 60;
      return '剩 ' + h + ' 小时' + (r ? ' ' + r + ' 分' : '');
    }
    return '剩 ' + Math.round(m / 1440) + ' 天';
  }

  function isUrgent(item) { return minsLeft(item) < 30; }

  function distParts(d) {
    return d < 1000 ? { n: String(d), u: 'm' } : { n: (d / 1000).toFixed(1), u: 'km' };
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function photoCard(name) { return 'assets/photos/' + name + '-4x3.jpg'; }
  function photoWide(name) { return 'assets/photos/' + name + '-16x9.jpg'; }

  /* ---------------- 排序 ---------------- */
  function sortedItems() {
    var list = allItems().filter(function (it) {
      return activeCat === 'all' ? true : it.cat === activeCat;
    });
    list.sort(function (a, b) {
      if (a.id === pinId) return -1;
      if (b.id === pinId) return 1;
      return a.distance - b.distance;
    });
    return list;
  }

  /* ---------------- 渲染：首页 ---------------- */
  function renderHome() {
    var all = allItems();
    var list = sortedItems();
    var near500 = list.filter(function (it) { return it.distance <= 500; });
    var nearest = list.length ? list.reduce(function (m, it) { return Math.min(m, it.distance); }, 1e9) : 0;
    var urgent = list.filter(isUrgent).length;

    document.getElementById('heroTitle').textContent =
      list.length ? near500.length + ' 样东西，在你 500 米内' : '500 米内，暂时没有';
    document.getElementById('nearestNum').textContent = list.length ? String(nearest) : '—';
    document.getElementById('heroArea').textContent = CAMPUS.name;
    document.getElementById('campusName').textContent = CAMPUS.short;
    document.getElementById('liveCount').textContent = String(all.length);

    document.getElementById('heroUrgent').innerHTML = urgent
      ? '<b>' + urgent + '</b> 件 30 分钟内过期'
      : '眼下没有 30 分钟内过期的';

    renderChips(all);
    renderRail(list);
    renderBands(list);

    document.getElementById('listMeta').textContent = list.length + ' 件 · 由近到远';
    document.getElementById('emptyHint').hidden = list.length !== 0;
  }

  function renderChips(all) {
    var host = document.getElementById('chips');
    host.innerHTML = CATEGORIES.map(function (c) {
      var n = c.id === 'all' ? all.length : all.filter(function (i) { return i.cat === c.id; }).length;
      return '<button class="chip' + (activeCat === c.id ? ' is-on' : '') + '" data-cat="' + c.id + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + c.icon + '"/></svg>' +
        '<span>' + c.name + '</span><i>' + n + '</i></button>';
    }).join('');
  }

  function renderRail(list) {
    var host = document.getElementById('rail');
    var picks = list.filter(function (it) { return isUrgent(it) || it.distance <= 100; })
      .sort(function (a, b) { return (isUrgent(b) - isUrgent(a)) || a.distance - b.distance; })
      .slice(0, 6);
    if (!picks.length) { host.innerHTML = '<p class="empty" style="flex:1">暂时没有又快过期又近的。往下按距离看。</p>'; return; }
    host.innerHTML = picks.map(function (it) {
      var d = distParts(it.distance);
      var urgent = isUrgent(it);
      return '<button class="railcard" data-open="' + it.id + '">' +
        '<div class="railcard__photo"><img src="' + photoCard(it.photo) + '" alt="' + esc(it.title) + '">' +
        (urgent ? '<span class="railcard__flag">手慢无</span>' : '') + '</div>' +
        '<div class="railcard__body">' +
        '<p class="railcard__title">' + esc(it.title) + '</p>' +
        '<div class="railcard__foot">' +
        '<span class="railcard__dist"><b>' + d.n + '</b><i>' + d.u + '</i></span>' +
        '<span class="railcard__time' + (urgent ? ' is-urgent' : '') + '">' + timeText(it) + '</span>' +
        '</div></div></button>';
    }).join('');
  }

  var BANDS = [
    { max: 100, label: '100 米内', note: '抬头就能到' },
    { max: 300, label: '300 米内', note: '两分钟路' },
    { max: 600, label: '600 米内', note: '顺手绕一下' },
    { max: 1000, label: '1 公里内', note: '值得走' },
    { max: Infinity, label: '1 公里外', note: '顺路再去' }
  ];

  function renderBands(list) {
    var host = document.getElementById('bands');
    var html = '';
    var cursor = 0;
    BANDS.forEach(function (band) {
      var group = list.filter(function (it) { return it.distance > cursor && it.distance <= band.max; });
      cursor = band.max === Infinity ? cursor : band.max;
      if (!group.length) return;
      html += '<div class="band"><div class="band__head"><b>' + band.label + '</b><i>' +
        group.length + ' 件 · ' + band.note + '</i></div>';
      html += group.map(cardHTML).join('');
      html += '</div>';
    });
    host.innerHTML = html || '<p class="empty">这个分类眼下没有东西。</p>';
  }

  function cardHTML(it) {
    var d = distParts(it.distance);
    var urgent = isUrgent(it);
    var left = stockOf(it);
    var claimed = !!claimOf(it.id);
    var tags = '';
    if (it.id === pinId) tags += '<span class="card__tag">刚刚发布</span>';
    if (claimed) tags += '<span class="card__tag">已领取</span>';
    return '<button class="card' + (it.id === pinId ? ' is-new' : '') + (left <= 0 ? ' is-done' : '') +
      '" data-open="' + it.id + '">' +
      '<span class="card__photo"><img src="' + photoCard(it.photo) + '" alt="' + esc(it.title) + '" loading="lazy"></span>' +
      '<span class="card__main">' +
      '<span class="card__title">' + esc(it.title) + '</span>' +
      '<span class="card__meta">' + tags + catName(it.cat) + ' · ' + esc(spotName(it.spot)) +
      (left > 0 ? ' · 剩 ' + left + ' 份' : ' · 领完了') + '</span>' +
      '<span class="card__time' + (urgent ? ' is-urgent' : '') + '">' + timeText(it) + '</span>' +
      '</span>' +
      '<span class="card__dist' + (it.distance <= 100 ? ' is-near' : '') + '"><b>' + d.n + '</b><i>' + d.u + '</i></span>' +
      '</button>';
  }

  /* ---------------- 详情面板 ---------------- */
  function openDetail(id) {
    var it = itemById(id);
    if (!it) return;
    detailId = id;
    var d = distParts(it.distance);
    var urgent = isUrgent(it);
    var walk = it.distance <= 100 ? '步行 1 分钟' : '步行 ' + Math.max(1, Math.round(it.distance / 80)) + ' 分钟';
    var claimed = claimOf(id);
    var left = stockOf(it);

    document.getElementById('sheetScroll').innerHTML =
      '<div class="sheet__photo"><img src="' + photoWide(it.photo) + '" alt="' + esc(it.title) + '">' +
      '<button class="sheet__close" data-close="1" aria-label="关闭">' +
      '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>' +
      '<div class="sheet__body">' +
      '<p class="sheet__kicker">' + catName(it.cat) + ' · ' + esc(spotName(it.spot)) + '</p>' +
      '<h2 class="sheet__title" id="detailTitle">' + esc(it.title) + '</h2>' +
      '<div class="sheet__dist"><b>' + d.n + '</b><i>' + d.u + '</i><span>' + walk + ' · 免费</span></div>' +
      '<p class="sheet__place">取货点 <b>' + esc(spotName(it.spot)) + '</b>（' + esc(spotOf(it).area) + '）</p>' +
      '<dl class="facts">' +
      '<div><dt>还剩</dt><dd class="js-count' + (urgent ? ' is-urgent' : '') + '">' + timeText(it) + '</dd></div>' +
      '<div><dt>数量</dt><dd>' + (left > 0 ? '剩 ' + left + ' 份' : '领完了') + '</dd></div>' +
      '<div><dt>估值</dt><dd>' + (it.estValue ? '¥ ' + it.estValue : '无标价') + '</dd></div>' +
      '<div><dt>发布者</dt><dd style="font-weight:500;font-size:11px">' + esc(it.owner) + '</dd></div>' +
      '</dl>' +
      '<p class="sheet__desc">' + esc(it.desc || '没有更多说明。到点自己看，能拿就拿走。') + '</p>' +
      '</div>';

    renderAction(it, claimed, left);

    var scrim = document.getElementById('scrim');
    var sheet = document.getElementById('sheet');
    scrim.hidden = false;
    requestAnimationFrame(function () {
      scrim.classList.add('is-on');
      sheet.classList.add('is-open');
      sheet.setAttribute('aria-hidden', 'false');
    });

    clearInterval(tickTimer);
    tickTimer = setInterval(function () {
      var node = document.querySelector('.js-count');
      if (!node || !detailId) return;
      var cur = itemById(detailId);
      if (!cur) return;
      node.textContent = timeText(cur);
      node.classList.toggle('is-urgent', isUrgent(cur));
    }, 1000);
  }

  function spotOf(it) {
    for (var i = 0; i < CAMPUS.spots.length; i++) if (CAMPUS.spots[i].id === it.spot) return CAMPUS.spots[i];
    return { name: '校内', area: '校内' };
  }

  function renderAction(it, claimed, left) {
    var host = document.getElementById('sheetAction');
    if (claimed) {
      host.innerHTML =
        '<div class="codebox"><p class="codebox__label">领取码 · 到现场报这 4 位</p>' +
        '<p class="codebox__num">' + claimed.code + '</p>' +
        '<p class="codebox__hint">已记入「我的」，30 分钟内有效</p></div>';
      return;
    }
    if (left <= 0) {
      host.innerHTML = '<button class="btn btn--claim" disabled>已经被领完了</button>' +
        '<p class="sheet__hint">下次早点来，30 分钟内的东西一般 10 分钟内就没了</p>';
      return;
    }
    host.innerHTML = '<button class="btn btn--claim" id="claimBtn">领取 · 不用登录</button>' +
      '<p class="sheet__hint">领取后出 4 位数字码，到现场报给发布者即可</p>';
  }

  function closeDetail() {
    clearInterval(tickTimer); tickTimer = null; detailId = null;
    var scrim = document.getElementById('scrim');
    var sheet = document.getElementById('sheet');
    scrim.classList.remove('is-on');
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    setTimeout(function () { if (!sheet.classList.contains('is-open')) scrim.hidden = true; }, 320);
  }

  /* ---------------- 领取 ---------------- */
  function claim(id) {
    var it = itemById(id);
    if (!it) return;
    if (claimOf(id)) { toast('这件你已经领过了，码在「我的」'); return; }
    if (stockOf(it) <= 0) { toast('慢了一步，已经被领完了'); return; }

    var code = newCode();
    state.claims.unshift({
      itemId: id, code: code, at: Date.now(),
      title: it.title, value: it.estValue || 0, photo: it.photo, distance: it.distance
    });
    saveState();

    renderAction(it, claimOf(id), stockOf(it));
    renderHome();
    renderMe();
    toast('领取成功 · 你的码是 ' + code);

    var node = document.querySelector('.codebox__num');
    if (node) { node.style.transform = 'translateY(6px)'; requestAnimationFrame(function () { node.style.transition = 'transform 240ms cubic-bezier(.2,.78,.24,1)'; node.style.transform = 'translateY(0)'; }); }
  }

  function newCode() {
    var used = {};
    state.claims.forEach(function (c) { used[c.code] = 1; });
    for (var i = 0; i < 40; i++) {
      var c = String(Math.floor(1000 + Math.random() * 9000));
      if (!used[c]) return c;
    }
    return String(1000 + state.claims.length);
  }

  /* ---------------- 我的 ---------------- */
  function renderMe() {
    var saved = state.claims.reduce(function (s, c) { return s + (c.value || 0); }, 0);
    rollNum(document.getElementById('savedNum'), saved);
    document.getElementById('claimCount').textContent = String(state.claims.length);

    var claimsHost = document.getElementById('claims');
    var empty = document.getElementById('claimEmpty');
    if (!state.claims.length) {
      claimsHost.innerHTML = '';
      empty.hidden = false;
    } else {
      empty.hidden = true;
      claimsHost.innerHTML = state.claims.map(function (c) {
        var it = itemById(c.itemId);
        var d = it ? distParts(it.distance) : { n: '-', u: '' };
        return '<div class="claimrow"><div><p class="claimrow__title">' + esc(c.title) + '</p>' +
          '<p class="claimrow__meta">' + (it ? esc(spotName(it.spot)) + ' · ' : '') + d.n + d.u +
          ' · ' + stamp(c.at) + '</p></div>' +
          '<div class="claimrow__code">' + c.code + '</div></div>';
      }).join('');
    }

    var mineHost = document.getElementById('mineList');
    var mineEmpty = document.getElementById('mineEmpty');
    document.getElementById('mineMeta').textContent = state.mine.length ? state.mine.length + ' 条在架' : '—';
    if (!state.mine.length) {
      mineHost.innerHTML = '';
      mineEmpty.hidden = false;
    } else {
      mineEmpty.hidden = true;
      mineHost.innerHTML = state.mine.map(function (it) {
        var d = distParts(it.distance);
        return '<div class="mineitem"><b>' + esc(it.title) + '</b><span>' + d.n + d.u + ' · 剩 ' +
          stockOf(it) + ' 份</span></div>';
      }).join('');
    }

    var pro = document.getElementById('proCard');
    pro.classList.toggle('is-on', state.pro);
    document.getElementById('proBtn').textContent = state.pro ? '已开通演示 Pro（点此取消）' : '开通演示 Pro';
  }

  function stamp(ts) {
    var d = new Date(ts);
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function rollNum(el, to) {
    if (!el) return;
    var from = Number(el.dataset.v || 0);
    if (from === to) { el.textContent = to; return; }
    el.dataset.v = to;
    var t0 = Date.now(), dur = 520;
    (function step() {
      var p = Math.min(1, (Date.now() - t0) / dur);
      if (p < 1) {
        el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        requestAnimationFrame(step);
      } else {
        el.textContent = to;   /* 结束直接写终值 */
      }
    })();
  }

  /* ---------------- 发布 ---------------- */
  function initPublish() {
    var seg = document.getElementById('fCat');
    var pubCats = CATEGORIES.filter(function (c) { return c.id !== 'all'; });
    seg.innerHTML = pubCats.map(function (c, i) {
      return '<button type="button" class="' + (i === 0 ? 'is-on' : '') + '" data-fcat="' + c.id + '">' + c.name + '</button>';
    }).join('');
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fcat]');
      if (!b) return;
      Array.prototype.forEach.call(seg.children, function (x) { x.classList.remove('is-on'); });
      b.classList.add('is-on');
    });

    var spotSel = document.getElementById('fSpot');
    spotSel.innerHTML = CAMPUS.spots.map(function (s) {
      return '<option value="' + s.id + '">' + s.name + '</option>';
    }).join('');

    var picker = document.getElementById('fPhoto');
    picker.innerHTML = PHOTO_CHOICES.map(function (p, i) {
      return '<button type="button" class="' + (i === 0 ? 'is-on' : '') + '" data-photo="' + p.photo + '">' +
        '<img src="' + photoCard(p.photo) + '" alt="' + p.label + '" loading="lazy"><span>' + p.label + '</span></button>';
    }).join('');
    picker.addEventListener('click', function (e) {
      var b = e.target.closest('[data-photo]');
      if (!b) return;
      Array.prototype.forEach.call(picker.children, function (x) { x.classList.remove('is-on'); });
      b.classList.add('is-on');
    });

    var dist = document.getElementById('fDist');
    var distOut = document.getElementById('fDistOut');
    dist.addEventListener('input', function () { distOut.textContent = dist.value + 'm'; });

    document.getElementById('publishForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = document.getElementById('fTitle').value.trim();
      if (!title) { toast('先写一句「是什么」'); document.getElementById('fTitle').focus(); return; }
      var catBtn = seg.querySelector('.is-on');
      var photoBtn = picker.querySelector('.is-on');
      var item = {
        id: 'm' + Date.now(),
        cat: catBtn ? catBtn.dataset.fcat : 'idle',
        title: title,
        spot: document.getElementById('fSpot').value,
        distance: Number(document.getElementById('fDist').value),
        expiresInMin: Number(document.getElementById('fExp').value),
        expiresAt: Date.now() + Number(document.getElementById('fExp').value) * 60000,
        stock: Math.max(1, Number(document.getElementById('fStock').value) || 1),
        estValue: Math.max(0, Number(document.getElementById('fValue').value) || 0),
        photo: photoBtn ? photoBtn.dataset.photo : 'food-spread',
        owner: '我 · 匿名',
        desc: '我自己发的。到点来拿，不用打招呼。',
        mine: true,
        createdAt: Date.now()
      };
      state.mine.unshift(item);
      saveState();
      pinId = item.id;
      activeCat = 'all';
      renderHome();
      renderMe();
      switchTab('home');
      document.getElementById('fTitle').value = '';
      toast('已发布 · 排在列表第一位');
      document.getElementById('screen').scrollTop = 0;
    });
  }

  /* ---------------- 切换 ---------------- */
  function switchTab(tab) {
    activeTab = tab;
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
      v.classList.toggle('is-active', v.dataset.view === tab);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.toggle('is-active', t.dataset.tab === tab);
    });
    document.getElementById('screen').scrollTop = 0;
    if (tab === 'me') renderMe();
  }

  /* ---------------- 吐司 ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2100);
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    document.getElementById('tabbar').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (b) switchTab(b.dataset.tab);
    });

    document.getElementById('chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      activeCat = b.dataset.cat;
      renderHome();
    });

    document.getElementById('screen').addEventListener('click', function (e) {
      var b = e.target.closest('[data-open]');
      if (b) openDetail(b.dataset.open);
    });

    document.getElementById('scrim').addEventListener('click', closeDetail);
    document.getElementById('sheet').addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeDetail(); return; }
      if (e.target.closest('#claimBtn')) { claim(detailId); }
    });

    document.getElementById('proBtn').addEventListener('click', function () {
      state.pro = !state.pro;
      saveState();
      renderMe();
      toast(state.pro ? '演示 Pro 已开通 · 提前 5 分钟看' : '已取消演示 Pro');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDetail();
    });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    var qrLink = document.getElementById('qrUrl');
    if (qrLink && typeof DEPLOY_URL === 'string') { qrLink.textContent = DEPLOY_URL; qrLink.href = DEPLOY_URL; }
    bind();
    initPublish();
    renderHome();
    renderMe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

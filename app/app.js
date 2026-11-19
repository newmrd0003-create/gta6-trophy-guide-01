/* Leonida Platinum — tracker logic. Loads app/data/trophies.json (a file of
   this app, never the network), keeps progress in localStorage, and renders
   the tracker, roadmap, missables and about views. */
(function () {
  'use strict';

  var STORAGE_KEY = 'gta6-trophy-guide-v1';
  var DATA_URL = 'data/trophies.json';

  var state = {
    earned: {},
    counts: {},
    openId: null,
    view: 'tracker',
    kind: 'all',
    grade: 'all',
    query: '',
    spoiler: false,
    hideEarned: false
  };
  var data = null;

  function $(id) { return document.getElementById(id); }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        if (saved.earned) state.earned = saved.earned;
        if (saved.counts) state.counts = saved.counts;
        if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
        if (typeof saved.hideEarned === 'boolean') state.hideEarned = saved.hideEarned;
      }
    } catch (e) { /* corrupted save: start fresh */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        earned: state.earned,
        counts: state.counts,
        spoiler: state.spoiler,
        hideEarned: state.hideEarned
      }));
    } catch (e) { /* storage full or blocked: progress stays for this session */ }
  }

  function gradeLetter(grade) {
    if (grade === 'platinum') return 'P';
    if (grade === 'gold') return 'G';
    if (grade === 'silver') return 'S';
    return 'B';
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function kindLabel(kind) {
    var labels = {
      story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
      activities: 'Activities', economy: 'Heists & Economy', online: 'Online',
      platinum: 'Platinum', completion: 'Completion'
    };
    return labels[kind] || kind;
  }

  function isStoryHidden(trophy) {
    return state.spoiler && !state.earned[trophy.id] &&
      (trophy.kind === 'story' || trophy.groups.indexOf('story') !== -1);
  }

  function trophyMatches(trophy) {
    if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
    if (state.kind === 'missable' && !trophy.missable) return false;
    if (state.kind === 'online') return false;
    if (state.kind !== 'all' && state.kind !== 'missable' &&
        trophy.groups.indexOf(state.kind) === -1) return false;
    if (state.hideEarned && state.earned[trophy.id]) return false;
    if (state.query) {
      var q = state.query.toLowerCase();
      var hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function sourceLinks(trophy) {
    var out = [];
    var names = data.sources || {};
    (trophy.sources || []).forEach(function (key) {
      var s = names[key];
      if (!s) return;
      if (s.url) out.push('<li><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.name) + '</a></li>');
      else out.push('<li>' + escapeHtml(s.name) + '</li>');
    });
    return out.join('');
  }

  function renderStats() {
    var total = data.trophies.length;
    var counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    var missable = 0;
    data.trophies.forEach(function (t) {
      counts[t.grade] = (counts[t.grade] || 0) + 1;
      if (t.missable) missable += 1;
    });
    $('stats').innerHTML =
      '<span class="stat"><b>' + total + '</b> trophies</span>' +
      '<span class="stat"><b>' + counts.platinum + '</b> platinum</span>' +
      '<span class="stat"><b>' + counts.gold + '</b> gold</span>' +
      '<span class="stat"><b>' + counts.silver + '</b> silver</span>' +
      '<span class="stat"><b>' + counts.bronze + '</b> bronze</span>' +
      '<span class="stat"><b>' + missable + '</b> missable</span>' +
      '<span class="stat"><b>28</b> hidden on PlayStation</span>' +
      '<span class="stat"><b>0</b> online trophies</span>';
  }

  function renderProgress() {
    var total = data.trophies.length;
    var earned = data.trophies.filter(function (t) { return state.earned[t.id]; }).length;
    var pct = total ? Math.round(earned / total * 100) : 0;
    $('progressFill').style.width = pct + '%';
    $('progressText').textContent = earned + ' of ' + total + ' earned (' + pct + '%) — ' +
      (total - earned) + ' to go until the platinum.';
  }

  function renderList() {
    var list = $('trophyList');
    var shown = data.trophies.filter(trophyMatches);
    $('listMeta').textContent = 'Showing ' + shown.length + ' of ' + data.trophies.length +
      ' trophies' + (state.kind === 'online' ? ' — the official list has no online trophies, so this filter is empty on purpose.' : '') +
      (state.spoiler ? ' Spoiler-safe is on: un-earned story trophies are hidden.' : '');
    $('emptyState').hidden = shown.length !== 0;
    list.innerHTML = shown.map(function (t) {
      var hidden = isStoryHidden(t);
      var name = hidden ? 'Hidden story trophy' : escapeHtml(t.name);
      var desc = hidden ? 'Earn this trophy to reveal its name and description.' : escapeHtml(t.description);
      var tags = '<span class="tag grade-' + t.grade + '">' + gradeLabel(t.grade) + '</span>' +
        '<span class="tag">' + kindLabel(t.kind) + '</span>' +
        (t.missable ? '<span class="tag missable">MISSABLE</span>' : '') +
        (t.targetLabel ? '<span class="tag target">' + escapeHtml(t.targetLabel) + '</span>' : '');
      var countRow = '';
      if (t.target) {
        var cur = state.counts[t.id] || 0;
        countRow = '<label class="count-row">Your count: ' +
          '<input type="number" min="0" max="' + t.target + '" value="' + cur +
          '" data-count-id="' + t.id + '" aria-label="Progress toward ' + escapeHtml(t.name) + '"> / ' + t.target + '</label>';
      }
      var guide = '';
      if (state.openId === t.id) {
        guide = '<div class="guide"><h4>Guide</h4><p>' + escapeHtml(t.guide) + '</p>' +
          (t.missableNote ? '<p class="warn"><b>Missable:</b> ' + escapeHtml(t.missableNote) + '</p>' : '') +
          '<div class="sources"><b>Sources:</b><ul>' + sourceLinks(t) + '</ul></div></div>';
      }
      return '<article class="card' + (state.earned[t.id] ? ' earned' : '') + '" data-id="' + t.id + '">' +
        '<div class="card-head"><span class="medal ' + t.grade + '">' + gradeLetter(t.grade) + '</span>' +
        '<div class="card-body"><h3 class="card-title"><button type="button" data-open-id="' + t.id + '">' + name + '</button></h3>' +
        '<p class="card-desc">' + desc + '</p><div class="tags">' + tags + '</div>' + countRow + guide + '</div>' +
        '<label class="earn"><input type="checkbox" data-earn-id="' + t.id + '"' +
        (state.earned[t.id] ? ' checked' : '') + ' aria-label="Mark ' + escapeHtml(t.name) + ' as earned"></label>' +
        '</div></article>';
    }).join('');
  }

  function renderRoadmap() {
    var el = $('roadmapList');
    el.innerHTML = data.roadmap.map(function (stage) {
      var chips = stage.trophies.map(function (id) {
        var t = data.trophies[id - 1];
        var cls = 'chip' + (state.earned[id] ? ' done' : '') + (t.missable ? ' miss' : '');
        return '<button type="button" class="' + cls + '" data-jump-id="' + id + '">' +
          escapeHtml(t.name) + (t.missable ? ' ⚠' : '') + '</button>';
      }).join('');
      return '<article class="stage"><p class="when">Stage ' + stage.stage + ' &middot; ' + escapeHtml(stage.time) + '</p>' +
        '<h3>' + escapeHtml(stage.title) + '</h3><p>' + escapeHtml(stage.text) + '</p>' +
        '<div class="chips">' + chips + '</div></article>';
    }).join('');
  }

  function renderMissables() {
    var el = $('missableList');
    var miss = data.trophies.filter(function (t) { return t.missable; });
    el.innerHTML = miss.map(function (t) {
      return '<article class="miss-card"><div class="card-head"><span class="medal ' + t.grade + '">' +
        gradeLetter(t.grade) + '</span><div class="card-body">' +
        '<h3 class="card-title"><button type="button" data-jump-id="' + t.id + '">' + escapeHtml(t.name) + '</button></h3>' +
        '<p class="card-desc">' + escapeHtml(t.description) + '</p>' +
        '<p><b>Why it is flagged:</b> ' + escapeHtml(t.missableNote || 'Tied to a single moment in the game.') + '</p>' +
        '<p>' + escapeHtml(t.guide) + '</p></div>' +
        '<label class="earn"><input type="checkbox" data-earn-id="' + t.id + '"' +
        (state.earned[t.id] ? ' checked' : '') + ' aria-label="Mark ' + escapeHtml(t.name) + ' as earned"></label>' +
        '</div></article>';
    }).join('');
  }

  function renderAbout() {
    var names = data.sources || {};
    var items = Object.keys(names).map(function (k) {
      var s = names[k];
      return s.url ? '<li><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.name) + '</a></li>'
        : '<li>' + escapeHtml(s.name) + '</li>';
    }).join('');
    $('aboutBody').innerHTML =
      '<h3>How to use this guide</h3>' +
      '<p>Tick a trophy off the moment it pops on your PlayStation — your progress is saved in this browser and stays offline. Use the count boxes on the big grind trophies (250 stunts, 42 Shooting Range golds, 100 WAiNK locations) to track partial progress. Export saves a JSON file you can keep or move to another browser; Import brings it back.</p>' +
      '<h3>What the flags mean</h3>' +
      '<p><b>Missable</b> means the official description ties the trophy to one named mission, one character\'s final mission, a moment with your partner, or a choice. Chapter trophies are not flagged: finishing the story earns them. The <b>spoiler setting</b> hides the names and descriptions of story trophies you have not earned yet, so you can browse the tracker without reading the plot.</p>' +
      '<h3>Honesty note</h3>' +
      '<p>' + escapeHtml(data.notes || '') + '</p>' +
      '<h3>Sources</h3><ul>' + items + '</ul>' +
      '<p>Names, descriptions, grades and PSN counts come from the official list as Exophase and PSNProfiles publish it. Every guide step is written in our own words from those descriptions — where a description does not pin down a place or a step, the guide says so instead of inventing one.</p>';
  }

  function renderAll() {
    renderStats();
    renderProgress();
    renderList();
    renderRoadmap();
    renderMissables();
    renderAbout();
    document.querySelectorAll('#tabs .tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === state.view);
    });
    ['tracker', 'roadmap', 'missables', 'about'].forEach(function (v) {
      $('view-' + v).hidden = state.view !== v;
    });
    $('spoilerToggle').checked = state.spoiler;
    $('hideEarnedToggle').checked = state.hideEarned;
    $('gradeFilter').value = state.grade;
    $('searchBox').value = state.query;
    document.querySelectorAll('#kindFilters .kind').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-kind') === state.kind);
    });
  }

  function showView(view) {
    state.view = view;
    renderAll();
    window.scrollTo(0, 0);
  }

  function jumpToTrophy(id) {
    state.view = 'tracker';
    state.kind = 'all';
    state.grade = 'all';
    state.query = '';
    state.hideEarned = false;
    state.openId = id;
    renderAll();
    var card = document.querySelector('.card[data-id="' + id + '"]');
    if (card) card.scrollIntoView({ block: 'center' });
  }

  function exportProgress() {
    var payload = JSON.stringify({
      game: 'Grand Theft Auto VI', exported: new Date().toISOString(),
      earned: state.earned, counts: state.counts
    }, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var saved = JSON.parse(reader.result);
        if (saved && typeof saved === 'object') {
          if (saved.earned) state.earned = saved.earned;
          if (saved.counts) state.counts = saved.counts;
          saveState();
          renderAll();
        }
      } catch (e) { alert('That file is not a valid progress export.'); }
    };
    reader.readAsText(file);
  }

  function applyUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var view = params.get('view');
    if (view && ['tracker', 'roadmap', 'missables', 'about'].indexOf(view) !== -1) state.view = view;
    var kind = params.get('filter');
    if (kind && ['all', 'story', 'missable', 'collectibles', 'activities', 'economy', 'online'].indexOf(kind) !== -1) state.kind = kind;
    if (params.get('spoiler') === '1') state.spoiler = true;
    var open = parseInt(params.get('open'), 10);
    if (open >= 1 && open <= 55) state.openId = open;
    var q = params.get('q');
    if (q) state.query = q;
    var seed = parseInt(params.get('seed'), 10);
    if (seed > 0) {
      for (var i = 1; i <= Math.min(seed, 55); i++) state.earned[i] = true;
    }
  }

  function bindEvents() {
    document.querySelectorAll('#tabs .tab').forEach(function (b) {
      b.addEventListener('click', function () { showView(b.getAttribute('data-view')); });
    });
    document.querySelectorAll('#kindFilters .kind').forEach(function (b) {
      b.addEventListener('click', function () {
        state.kind = b.getAttribute('data-kind');
        renderAll();
      });
    });
    $('searchBox').addEventListener('input', function (e) {
      state.query = e.target.value;
      renderList();
    });
    $('gradeFilter').addEventListener('change', function (e) {
      state.grade = e.target.value;
      renderAll();
    });
    $('spoilerToggle').addEventListener('change', function (e) {
      state.spoiler = e.target.checked;
      saveState();
      renderAll();
    });
    $('hideEarnedToggle').addEventListener('change', function (e) {
      state.hideEarned = e.target.checked;
      saveState();
      renderAll();
    });
    document.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-open-id]');
      if (openBtn) {
        var id = parseInt(openBtn.getAttribute('data-open-id'), 10);
        state.openId = state.openId === id ? null : id;
        renderAll();
        return;
      }
      var jumpBtn = e.target.closest('[data-jump-id]');
      if (jumpBtn) {
        jumpToTrophy(parseInt(jumpBtn.getAttribute('data-jump-id'), 10));
      }
    });
    document.addEventListener('change', function (e) {
      var earn = e.target.closest('[data-earn-id]');
      if (earn) {
        var id = parseInt(earn.getAttribute('data-earn-id'), 10);
        if (earn.checked) state.earned[id] = true;
        else delete state.earned[id];
        saveState();
        renderAll();
        return;
      }
      var count = e.target.closest('[data-count-id]');
      if (count) {
        var cid = parseInt(count.getAttribute('data-count-id'), 10);
        var val = Math.max(0, parseInt(count.value, 10) || 0);
        state.counts[cid] = val;
        saveState();
      }
    });
    $('exportBtn').addEventListener('click', exportProgress);
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
      e.target.value = '';
    });
    $('resetBtn').addEventListener('click', function () {
      if (window.confirm('Reset all progress? This clears every tick and count.')) {
        state.earned = {};
        state.counts = {};
        saveState();
        renderAll();
      }
    });
  }

  loadState();
  applyUrlParams();
  bindEvents();
  fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (json) {
    data = json;
    renderAll();
  }).catch(function () {
    $('trophyList').innerHTML = '<p class="empty">Could not load data/trophies.json. Open this guide from its own files (serve app/ with any static server).</p>';
  });
})();

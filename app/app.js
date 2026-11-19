// Leonida Platinum — GTA 6 trophy guide & tracker (offline, static files only).
// Loads app/data/trophies.json at run time, keeps progress in localStorage,
// exports/imports that progress as JSON, and never makes a network request
// beyond its own files. Demo views (?demo=checklist|guide|roadmap|missables
// with &earned=1,2,3 &spoiler=1 &open=<id>) preset the screen in memory for
// screenshots and do not write to localStorage.

const STORAGE_KEY = 'leonida-platinum-v5';
const DATA_URL = 'data/trophies.json';

const state = {
  trophies: [],
  roadmap: [],
  earned: new Set(),
  counts: {},
  spoiler: false,
  kind: 'all',
  grade: 'all',
  query: '',
  selectedId: null,
  view: 'checklist',
  demoMode: false,
};

const $ = (id) => document.getElementById(id);

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.filter((n) => Number.isInteger(n)));
    if (saved.counts && typeof saved.counts === 'object') state.counts = saved.counts;
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch {
    // A damaged save is ignored; the checklist starts empty rather than crashing.
  }
}

function saveProgress() {
  if (state.demoMode) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      counts: state.counts,
      spoiler: state.spoiler,
    }));
  } catch {
    // Private mode or a full store: the page keeps working in memory.
  }
}

function applyDemoParams() {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (!demo) return;
  state.demoMode = true;
  if (['checklist', 'roadmap', 'missables'].includes(demo)) state.view = demo;
  if (demo === 'guide') state.view = 'checklist';
  const earned = params.get('earned');
  if (earned) {
    earned.split(',').map((s) => Number(s.trim())).filter(Number.isInteger)
      .forEach((id) => state.earned.add(id));
  }
  if (params.get('spoiler') === '1') state.spoiler = true;
  const open = Number(params.get('open'));
  if (Number.isInteger(open)) state.selectedId = open;
  const kind = params.get('kind');
  if (kind) state.kind = kind;
}

function trophyById(id) {
  return state.trophies.find((t) => t.id === id) || null;
}

function isStorySpoilerHidden(trophy) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function countLabel(trophy) {
  if (trophy.target === null || trophy.target === undefined) return '';
  const have = state.counts[trophy.id] || 0;
  const unit = trophy.target >= 1000 ? '$' : '';
  return unit + have.toLocaleString('en-US') + ' / ' + unit + trophy.target.toLocaleString('en-US');
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind === 'online') return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const total = state.trophies.length || 55;
  const earned = state.earned.size;
  const pct = Math.round((earned / total) * 100);
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = pct + '%';
  $('progressLine').textContent = pct + '% to the platinum — ' + earned + ' of ' + total + ' trophies';
  const byGrade = {};
  for (const t of state.trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (state.earned.has(t.id)) byGrade[t.grade].got += 1;
  }
  $('gradeLine').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => gradeLabel(g) + ' ' + (byGrade[g] ? byGrade[g].got : 0) + '/' + (byGrade[g] ? byGrade[g].total : 0))
    .join(' · ');
}

function renderList() {
  const list = $('trophyList');
  const items = visibleTrophies();
  $('listMeta').textContent = state.kind === 'online'
    ? 'Online trophies: none — every trophy in the official list is single-player.'
    : items.length + ' of ' + state.trophies.length + ' trophies shown';
  list.innerHTML = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-list';
    li.textContent = state.kind === 'online'
      ? 'No online trophies: the official list is single-player only, so there is nothing to track here.'
      : 'No trophies match this filter.';
    list.appendChild(li);
    return;
  }
  for (const t of items) {
    const earned = state.earned.has(t.id);
    const hidden = isStorySpoilerHidden(t);
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned ? ' earned' : '') + (state.selectedId === t.id ? ' selected' : '');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('change', () => toggleEarned(t.id));

    const grade = document.createElement('span');
    grade.className = 'grade-badge grade-' + t.grade;
    grade.textContent = t.grade;

    const mid = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden story trophy' : t.name;
    if (t.hidden && !hidden) {
      const tag = document.createElement('span');
      tag.className = 'hidden-tag';
      tag.textContent = 'Hidden';
      name.appendChild(tag);
    }
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = hidden ? 'Earn it to reveal the name and description.' : t.description;
    mid.appendChild(name);
    mid.appendChild(desc);

    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag missable';
      m.textContent = 'Missable';
      tags.appendChild(m);
    }
    const c = countLabel(t);
    if (c) {
      const ct = document.createElement('span');
      ct.className = 'tag count';
      ct.textContent = c;
      tags.appendChild(ct);
    }

    li.appendChild(box);
    li.appendChild(grade);
    li.appendChild(mid);
    li.appendChild(tags);
    li.addEventListener('click', (event) => {
      if (event.target === box) return;
      selectTrophy(t.id);
    });
    list.appendChild(li);
  }
}

function renderDetail() {
  const pane = $('detailPane');
  const t = trophyById(state.selectedId);
  pane.innerHTML = '';
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy from the list to read its guide, its sources and its counter.';
    pane.appendChild(p);
    return;
  }
  const earned = state.earned.has(t.id);
  const hidden = isStorySpoilerHidden(t);

  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden story trophy' : t.name;
  pane.appendChild(title);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden ? 'Official name and description hidden until earned.' : '“' + t.description + '”';
  pane.appendChild(official);

  const meta = document.createElement('div');
  meta.className = 'meta-line';
  const grade = document.createElement('span');
  grade.className = 'grade-badge grade-' + t.grade;
  grade.textContent = t.grade;
  meta.appendChild(grade);
  const kind = document.createElement('span');
  kind.className = 'tag';
  kind.textContent = t.kind;
  meta.appendChild(kind);
  if (t.hidden) {
    const h = document.createElement('span');
    h.className = 'tag';
    h.textContent = 'Hidden on PSN';
    meta.appendChild(h);
  }
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = 'Missable — save first';
    meta.appendChild(m);
  }
  pane.appendChild(meta);

  if (t.target !== null && t.target !== undefined) {
    const h = document.createElement('h3');
    h.textContent = 'Your count';
    pane.appendChild(h);
    const row = document.createElement('div');
    row.className = 'counter-row';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease count');
    minus.addEventListener('click', () => setCount(t.id, (state.counts[t.id] || 0) - 1));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.value = String(state.counts[t.id] || 0);
    input.setAttribute('aria-label', 'Current count');
    input.addEventListener('change', () => setCount(t.id, Number(input.value)));
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase count');
    plus.addEventListener('click', () => setCount(t.id, (state.counts[t.id] || 0) + 1));
    const label = document.createElement('span');
    label.className = 'target-label';
    label.textContent = 'of ' + t.target.toLocaleString('en-US') + ' needed';
    row.appendChild(minus);
    row.appendChild(input);
    row.appendChild(plus);
    row.appendChild(label);
    pane.appendChild(row);
  }

  const gh = document.createElement('h3');
  gh.textContent = 'Guide';
  pane.appendChild(gh);
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden ? 'This is a story trophy. Turn off “Hide story spoilers” or earn it to read the guide.' : t.guide;
  pane.appendChild(guide);

  const sh = document.createElement('h3');
  sh.textContent = 'Sources';
  pane.appendChild(sh);
  const wrap = document.createElement('div');
  wrap.className = 'sources';
  const ul = document.createElement('ul');
  for (const s of t.sources || []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.rel = 'noopener';
    a.textContent = s.name;
    li.appendChild(a);
    ul.appendChild(li);
  }
  wrap.appendChild(ul);
  pane.appendChild(wrap);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'earn-btn' + (earned ? ' earned' : '');
  btn.textContent = earned ? '✓ Earned — tap to unmark' : 'Mark as earned';
  btn.addEventListener('click', () => toggleEarned(t.id));
  pane.appendChild(btn);
}

function renderRoadmap() {
  const list = $('roadmapList');
  list.innerHTML = '';
  for (const stage of state.roadmap) {
    const members = state.trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => state.earned.has(t.id)).length;
    const li = document.createElement('li');
    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = String(stage.stage);
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = done + ' / ' + members.length + ' trophies earned';
    head.appendChild(num);
    head.appendChild(h);
    head.appendChild(count);
    const p = document.createElement('p');
    p.textContent = stage.text;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const t of members) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (state.earned.has(t.id) ? ' done' : '');
      chip.textContent = t.name;
      chip.addEventListener('click', () => {
        state.view = 'checklist';
        selectTrophy(t.id);
        switchView('checklist');
      });
      chips.appendChild(chip);
    }
    li.appendChild(head);
    li.appendChild(p);
    li.appendChild(chips);
    list.appendChild(li);
  }
}

function renderMissables() {
  const grid = $('missableList');
  grid.innerHTML = '';
  for (const t of state.trophies.filter((x) => x.missable)) {
    const earned = state.earned.has(t.id);
    const card = document.createElement('article');
    card.className = 'missable-card' + (earned ? ' done' : '');
    const h = document.createElement('h3');
    h.textContent = (earned ? '✓ ' : '') + t.name;
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = t.id === 28
      ? 'One-time moment: meditate at Jason’s house before leaving Chapter 1.'
      : 'Story trophy in a game with no mission replay — keep a manual save.';
    const p = document.createElement('p');
    p.textContent = t.description + ' ' + t.guide;
    card.appendChild(h);
    card.appendChild(why);
    card.appendChild(p);
    card.addEventListener('click', () => {
      state.view = 'checklist';
      selectTrophy(t.id);
      switchView('checklist');
    });
    grid.appendChild(card);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function switchView(view) {
  state.view = view;
  for (const btn of document.querySelectorAll('#viewTabs button')) {
    btn.classList.toggle('active', btn.dataset.view === view);
  }
  $('view-checklist').hidden = view !== 'checklist';
  $('view-roadmap').hidden = view !== 'roadmap';
  $('view-missables').hidden = view !== 'missables';
}

function selectTrophy(id) {
  state.selectedId = id;
  renderList();
  renderDetail();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress();
  renderAll();
}

function setCount(id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  state.counts[id] = n;
  saveProgress();
  renderAll();
}

function exportProgress() {
  const payload = {
    app: 'leonida-platinum',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    counts: state.counts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-platinum-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = new Set(state.trophies.map((t) => t.id));
      if (Array.isArray(data.earned)) {
        state.earned = new Set(data.earned.filter((n) => ids.has(n)));
      }
      if (data.counts && typeof data.counts === 'object') state.counts = data.counts;
      saveProgress();
      renderAll();
    } catch {
      window.alert('That file is not a Leonida Platinum export.');
    }
  };
  reader.readAsText(file);
}

function bindControls() {
  for (const btn of document.querySelectorAll('#viewTabs button')) {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  }
  $('searchBox').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderList();
  });
  for (const btn of document.querySelectorAll('#kindFilters button')) {
    btn.addEventListener('click', () => {
      state.kind = btn.dataset.kind;
      for (const b of document.querySelectorAll('#kindFilters button')) {
        b.classList.toggle('active', b === btn);
      }
      renderList();
    });
  }
  $('gradeFilter').addEventListener('change', (e) => {
    state.grade = e.target.value;
    renderList();
  });
  $('spoilerBox').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveProgress();
    renderAll();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies and counters?')) {
      state.earned = new Set();
      state.counts = {};
      saveProgress();
      renderAll();
    }
  });
}

async function boot() {
  loadSavedProgress();
  applyDemoParams();
  const response = await fetch(DATA_URL);
  const data = await response.json();
  state.trophies = data.trophies;
  state.roadmap = data.roadmap || [];
  if (state.selectedId === null && state.trophies.length > 0) {
    state.selectedId = state.trophies[0].id;
  }
  $('spoilerBox').checked = state.spoiler;
  $('missablePill').textContent = String(state.trophies.filter((t) => t.missable).length);
  bindControls();
  switchView(state.view);
  renderAll();
}

boot();

// Leonida Platinum — GTA VI trophy guide & tracker.
// Static, offline: the only thing it loads is ./data/trophies.json, its own file.
// Progress lives in localStorage under one key; export/import move it as JSON.
const DATA_URL = './data/trophies.json';
const STORE_KEY = 'leonida-platinum-progress-v1';

const KIND_LABELS = {
  story: 'Story', side: 'Side', activity: 'Activity', collectible: 'Collectible',
  crime: 'Crime', exploration: 'Exploration', misc: 'Other', platinum: 'Platinum',
  completion: 'Completion', missable: 'Missable',
};
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

const state = {
  trophies: [],
  roadmap: [],
  earned: new Set(),
  kind: 'all',
  grade: 'all',
  query: '',
  hideEarned: false,
  spoilerSafe: false,
  selectedId: null,
};

const $ = (sel) => document.querySelector(sel);
const listEl = $('#trophyList');
const detailEl = $('#detailPane');

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) state.earned = new Set(parsed.earned.filter(Number.isInteger));
    if (parsed.spoilerSafe === true) state.spoilerSafe = true;
  } catch { /* a corrupt save is ignored, never fatal */ }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      spoilerSafe: state.spoilerSafe,
      savedAt: new Date().toISOString(),
    }));
  } catch { /* private mode etc: the tracker still works for the session */ }
}

function isSpoilerHidden(t) {
  return state.spoilerSafe && t.spoiler && !state.earned.has(t.id);
}

function gradeCounts() {
  const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of state.trophies) if (state.earned.has(t.id)) c[t.grade]++;
  return c;
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length;
  $('#earnedCount').textContent = earned;
  $('#progressFill').style.width = total ? `${Math.round((earned / total) * 100)}%` : '0%';
  const c = gradeCounts();
  $('#gradeCounts').textContent =
    `Platinum ${c.platinum}/1 · Gold ${c.gold}/2 · Silver ${c.silver}/6 · Bronze ${c.bronze}/46`;
  const next = state.trophies.find((t) => !state.earned.has(t.id));
  $('#nextUp').textContent = earned >= total
    ? 'Platinum earned — you are a Leonida Legend.'
    : next ? `Next up: ${isSpoilerHidden(next) ? 'a hidden story trophy' : next.name}` : '';
}

function matchesFilters(t) {
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.hideEarned && state.earned.has(t.id)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function tagHtml(t) {
  const tags = [`<span class="tag grade-${t.grade}">${t.grade}</span>`];
  if (t.kind !== t.grade) tags.push(`<span class="tag">${KIND_LABELS[t.kind] || t.kind}</span>`);
  if (t.missable) tags.push('<span class="tag missable">Missable</span>');
  if (t.spoiler) tags.push('<span class="tag spoilered">Story spoiler</span>');
  return tags.join('');
}

function renderList() {
  const shown = state.trophies.filter(matchesFilters)
    .sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  if (shown.length === 0) {
    listEl.innerHTML = '<li class="empty">No trophies match these filters. Clear the search or pick another kind.</li>';
    return;
  }
  listEl.innerHTML = shown.map((t) => {
    const earned = state.earned.has(t.id);
    const hidden = isSpoilerHidden(t);
    const name = hidden ? 'Hidden story trophy' : escapeHtml(t.name);
    const desc = hidden ? 'Earn this trophy to reveal its name and description.' : escapeHtml(t.description);
    return `<li class="card${earned ? ' earned' : ''}${state.selectedId === t.id ? ' selected' : ''}" data-id="${t.id}" tabindex="0" role="button" aria-pressed="${earned}">
      <button class="checkbox" data-toggle="${t.id}" aria-label="${earned ? 'Mark not earned: ' : 'Mark earned: '}${escapeHtml(t.name)}">${earned ? '✓' : ''}</button>
      <div><p class="tname">${name}</p><p class="tdesc">${desc}</p><div class="tags">${tagHtml(t)}</div></div>
      <span class="grade-dot ${t.grade}" title="${t.grade}"></span>
    </li>`;
  }).join('');
}

function renderMissables() {
  const el = $('#missableList');
  const miss = state.trophies.filter((t) => t.missable);
  el.innerHTML = miss.map((t) => {
    const earned = state.earned.has(t.id);
    return `<li class="card${earned ? ' earned' : ''}" data-id="${t.id}" tabindex="0" role="button">
      <button class="checkbox" data-toggle="${t.id}" aria-label="${earned ? 'Mark not earned: ' : 'Mark earned: '}${escapeHtml(t.name)}">${earned ? '✓' : ''}</button>
      <div><p class="tname">${escapeHtml(t.name)}</p><p class="tdesc">${escapeHtml(t.description)}</p><div class="tags">${tagHtml(t)}</div></div>
      <span class="grade-dot ${t.grade}" title="${t.grade}"></span>
    </li>`;
  }).join('');
}

function renderRoadmap() {
  const el = $('#roadmapList');
  el.innerHTML = state.roadmap.map((s) => {
    const names = s.trophies.map((id) => {
      const t = state.trophies.find((x) => x.id === id);
      if (!t) return '';
      const done = state.earned.has(id);
      return `${done ? '✓ ' : ''}${escapeHtml(t.name)}`;
    }).join(' · ');
    const doneCount = s.trophies.filter((id) => state.earned.has(id)).length;
    return `<li class="stage"><span class="stage-num">${s.stage}</span><div>
      <h2>${escapeHtml(s.title)} <span style="color:var(--muted);font-size:14px">(${doneCount}/${s.trophies.length} earned)</span></h2>
      <p class="goal">${escapeHtml(s.goal)}</p>
      <p class="advice">${escapeHtml(s.advice)}</p>
      <p class="mini">${names}</p>
    </div></li>`;
  }).join('');
}

function renderDetail() {
  const t = state.trophies.find((x) => x.id === state.selectedId);
  if (!t) {
    detailEl.innerHTML = '<p class="detail-empty">Select a trophy to read its guide, its sources and when it can be missed.</p>';
    return;
  }
  const earned = state.earned.has(t.id);
  const hidden = isSpoilerHidden(t);
  const stage = state.roadmap.find((s) => s.stage === t.stage);
  detailEl.innerHTML = `
    <h2>${hidden ? 'Hidden story trophy' : escapeHtml(t.name)}</h2>
    <p class="desc">${hidden ? 'Spoiler-safe mode hides this story trophy until you earn it.' : escapeHtml(t.description)}</p>
    <div class="tags">${tagHtml(t)}</div>
    ${t.missable ? '<h3>Missable — read first</h3><p class="warn">The official description describes a single moment, choice or unbroken sequence that may not come back. Do this one deliberately (roadmap stage 5) and save before the attempt where the game allows it.</p>' : ''}
    <h3>Guide</h3>
    <p>${hidden ? 'Earn this trophy to reveal its guide.' : escapeHtml(t.guide)}</p>
    <h3>Roadmap</h3>
    <p>Stage ${t.stage}${stage ? ` — ${escapeHtml(stage.title)}` : ''}.</p>
    <h3>Sources</h3>
    <ul class="sources">
      <li>Name, description and grade: the official list on Exophase.</li>
      <li>PSN target counts where one exists: PSNProfiles.</li>
      <li>Guide: our own advice from the official description, not yet checked in the game.</li>
    </ul>
    <button class="earned-btn${earned ? ' earned' : ''}" data-toggle="${t.id}">${earned ? '✓ Earned — tap to unmark' : 'Mark as earned'}</button>`;
}

function renderAll() {
  renderProgress();
  renderList();
  renderMissables();
  renderRoadmap();
  renderDetail();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress();
  renderAll();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function switchView(name) {
  document.querySelectorAll('.tab').forEach((b) => {
    const on = b.dataset.view === name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({
    app: 'leonida-platinum',
    game: 'Grand Theft Auto VI',
    earned: [...state.earned].sort((a, b) => a - b),
    exportedAt: new Date().toISOString(),
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed.earned) ? parsed.earned : parsed;
      const valid = new Set(state.trophies.map((t) => t.id));
      const next = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
      state.earned = next;
      saveProgress();
      renderAll();
    } catch {
      alert('That file is not a Leonida Platinum progress export.');
    }
  };
  reader.readAsText(file);
}

async function boot() {
  loadProgress();
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`could not load ${DATA_URL}: ${res.status}`);
  const data = await res.json();
  state.trophies = data.trophies || [];
  state.roadmap = data.roadmap || [];

  $('#spoilerToggle').checked = state.spoilerSafe;
  $('#spoilerHint').hidden = !state.spoilerSafe;

  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
  document.querySelectorAll('#kindChips .chip').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#kindChips .chip').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.kind = b.dataset.kind;
    renderList();
  }));
  $('#gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); });
  $('#search').addEventListener('input', (e) => { state.query = e.target.value.trim(); renderList(); });
  $('#hideEarned').addEventListener('change', (e) => { state.hideEarned = e.target.checked; renderList(); });
  $('#spoilerToggle').addEventListener('change', (e) => {
    state.spoilerSafe = e.target.checked;
    $('#spoilerHint').hidden = !state.spoilerSafe;
    saveProgress();
    renderAll();
  });
  $('#exportBtn').addEventListener('click', exportProgress);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies? This cannot be undone — export first if you want a backup.')) {
      state.earned = new Set();
      state.selectedId = null;
      saveProgress();
      renderAll();
    }
  });

  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle]');
    if (toggle) { toggleEarned(Number(toggle.dataset.toggle)); return; }
    const card = e.target.closest('.card[data-id]');
    if (card) {
      state.selectedId = Number(card.dataset.id);
      renderList();
      renderDetail();
      if (window.innerWidth <= 900) detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) {
      e.preventDefault();
      state.selectedId = Number(e.target.dataset.id);
      renderList();
      renderDetail();
    }
  });

  renderAll();
}

boot().catch((err) => {
  listEl.innerHTML = `<li class="empty">The trophy list could not be loaded: ${escapeHtml(err.message)}</li>`;
});

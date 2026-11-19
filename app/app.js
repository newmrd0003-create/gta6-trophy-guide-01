// Leonida Trophy Guide: checklist + tracker + roadmap for GTA VI's 55 PS5 trophies.
// Loads data/trophies.json (a file of this app, never the network), saves earned
// trophies in localStorage, and renders the checklist, the trophy detail panel and
// the roadmap. URL views: ?grade=silver, ?kind=missable, ?trophy=<id>, ?spoiler=1.
const KEY = 'gta6-trophy-guide-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoilers';
const listEl = document.getElementById('list');
const detailEl = document.getElementById('guide-detail');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');
const earnedOnlyEl = document.getElementById('earned-only');
const params = new URLSearchParams(location.search);

let earned = new Set();
try {
  earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
} catch {
  earned = new Set();
}
let hideSpoilers = localStorage.getItem(SPOILER_KEY) === '1';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [String(t.id), t]));
const byName = new Map(trophies.map((t) => [t.name, t]));

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort()));
  localStorage.setItem(SPOILER_KEY, hideSpoilers ? '1' : '0');
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isHiddenFromSpoilers(t) {
  return hideSpoilers && t.kind === 'story' && !earned.has(t.name);
}

function visibleName(t) {
  return isHiddenFromSpoilers(t) ? 'Hidden story trophy' : t.name;
}

function visibleDescription(t) {
  return isHiddenFromSpoilers(t)
    ? 'Spoilers hidden: earn this trophy to reveal its name and description.'
    : t.description;
}

function trophyMatches(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.kind} ${t.grade}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (kindEl.value === 'missable' && !t.missable) return false;
  if (kindEl.value !== 'all' && kindEl.value !== 'missable' && t.kind !== kindEl.value) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (earnedOnlyEl.checked && !earned.has(t.name)) return false;
  return true;
}

function tag(text, cls) {
  const s = document.createElement('span');
  s.className = `tag ${cls}`;
  s.textContent = text;
  return s;
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!trophyMatches(t)) continue;
    shown += 1;
    const card = document.createElement('article');
    card.className = `card grade-${t.grade}`;
    card.id = `trophy-${t.id}`;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      renderAll();
    });

    const body = document.createElement('div');
    body.className = 'card-body';
    const title = document.createElement('h3');
    title.textContent = visibleName(t);
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = visibleDescription(t);
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.append(tag(gradeLabel(t.grade), `grade-${t.grade}`));
    meta.append(tag(t.kind, 'kind'));
    if (t.missable) meta.append(tag(t.id === 28 ? 'Missable' : 'Story-locked', 'missable'));
    if (t.hidden) meta.append(tag('Hidden on PSN', 'hidden-flag'));
    meta.append(tag(`Roadmap stage ${t.stage}`, 'stage'));
    body.append(title, desc, meta);

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'guide-btn';
    open.textContent = 'Guide';
    open.addEventListener('click', () => showDetail(t));

    card.append(box, body, open);
    listEl.append(card);
  }
  document.getElementById('empty').hidden = shown !== 0;
  const total = trophies.length;
  document.getElementById('count-line').textContent =
    `Showing ${shown} of ${total} trophies · ${earned.size} earned · ${trophies.filter((t) => t.missable).length} flagged missable / story-locked`;
}

function showDetail(t) {
  detailEl.hidden = false;
  detailEl.replaceChildren();
  const head = document.createElement('div');
  head.className = 'detail-head';
  const title = document.createElement('h2');
  title.textContent = visibleName(t);
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close guide';
  close.addEventListener('click', () => {
    detailEl.hidden = true;
    detailEl.replaceChildren();
  });
  head.append(title, close);

  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.append(tag(gradeLabel(t.grade), `grade-${t.grade}`));
  meta.append(tag(t.kind, 'kind'));
  if (t.missable) meta.append(tag(t.id === 28 ? 'Missable' : 'Story-locked', 'missable'));
  meta.append(tag(`Roadmap stage ${t.stage}`, 'stage'));

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = `Official description: ${visibleDescription(t)}`;

  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = isHiddenFromSpoilers(t)
    ? 'Spoilers hidden: earn this trophy to reveal its guide.'
    : t.guide;

  detailEl.append(head, meta, desc, guide);
  if (t.missable_note && !isHiddenFromSpoilers(t)) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = `Missable note: ${t.missable_note}`;
    detailEl.append(note);
  }
  if (!isHiddenFromSpoilers(t) && Array.isArray(t.sources) && t.sources.length) {
    const srcTitle = document.createElement('p');
    srcTitle.className = 'sources-title';
    srcTitle.textContent = 'Sources for this guide:';
    const srcList = document.createElement('ul');
    srcList.className = 'source-list';
    for (const s of t.sources) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      li.append(a);
      srcList.append(li);
    }
    detailEl.append(srcTitle, srcList);
  }
  detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progress-text').textContent = `${done} of ${total} earned`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('bar-fill').style.width = `${pct}%`;
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
    return `${gradeLabel(g)} ${got}/${all}`;
  });
  document.getElementById('grade-counts').textContent = counts.join(' · ');
  document.getElementById('platinum-note').textContent =
    done === total
      ? 'Platinum complete — you are a Leonida Legend.'
      : done >= total - 1
        ? 'One trophy left to the platinum.'
        : `${total - done} trophies left to the platinum.`;
}

function renderRoadmap() {
  const steps = document.getElementById('roadmap-steps');
  steps.replaceChildren();
  for (const s of doc.roadmap ?? []) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = `Stage ${s.stage}: ${s.title} (${s.hours} hours)`;
    const p = document.createElement('p');
    p.textContent = s.text;
    const inStage = trophies.filter((t) => t.stage === s.stage);
    const earnedInStage = inStage.filter((t) => earned.has(t.name)).length;
    const count = document.createElement('p');
    count.className = 'stage-count';
    count.textContent = `${earnedInStage} of ${inStage.length} trophies in this stage earned.`;
    li.append(h, p, count);
    steps.append(li);
  }
  const miss = document.getElementById('missable-list');
  miss.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = visibleName(t);
    li.append(strong);
    li.append(document.createTextNode(` — ${t.missable_note ?? ''}`));
    miss.append(li);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderRoadmap();
}

function applyUrlViews() {
  if (params.get('grade')) gradeEl.value = params.get('grade');
  if (params.get('kind')) kindEl.value = params.get('kind');
  if (params.get('q')) searchEl.value = params.get('q');
  if (params.get('spoiler') === '1') hideSpoilers = true;
  spoilerEl.checked = hideSpoilers;
  // Roadmap view: hide the checklist so the roadmap sits at the top of the page
  // with no scroll race (the list renders after a fetch; a fragment jump alone
  // lands in the wrong place on a page that grows under it).
  if (params.get('view') === 'roadmap') {
    document.getElementById('checklist').hidden = true;
    document.querySelector('.toolbar').hidden = true;
  }
  if (params.get('trophy') && byId.has(params.get('trophy'))) {
    showDetail(byId.get(params.get('trophy')));
  }
}

document.getElementById('export').addEventListener('click', () => {
  const payload = {
    game: 'Grand Theft Auto VI',
    exported: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('not a progress file');
    const valid = names.filter((n) => byName.has(n));
    earned = new Set(valid);
    save();
    renderAll();
  } catch {
    alert('That file is not a valid trophy progress export.');
  }
  e.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    save();
    renderAll();
  }
});

for (const el of [searchEl, kindEl, gradeEl, earnedOnlyEl]) {
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}
spoilerEl.addEventListener('change', () => {
  hideSpoilers = spoilerEl.checked;
  save();
  renderAll();
});

function syncTabs() {
  const atRoadmap = location.hash === '#roadmap';
  document.getElementById('tab-roadmap').classList.toggle('active', atRoadmap);
  document.getElementById('tab-checklist').classList.toggle('active', !atRoadmap && location.hash !== '#sources');
  document.getElementById('tab-sources').classList.toggle('active', location.hash === '#sources');
}
window.addEventListener('hashchange', syncTabs);

applyUrlViews();
renderAll();
syncTabs();
// (No scrolling here: in roadmap view the checklist is hidden, so the roadmap
// already sits near the top of the page. A scroll after render raced the layout
// and left a blank band in screenshots.)

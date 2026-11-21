/* Leonida Platinum Log — offline GTA VI trophy guide & tracker.
   Data: app/data/trophies.json (fetched when served over http) with the
   identical window.TROPHIES_DATA mirror as fallback for file:// use.
   Progress lives only in localStorage; export/import moves it as a file. */
'use strict';

const STORE_KEY = 'leonida-platinum-log-v1';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABEL = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', online: 'Online', misc: 'Misc' };
const STAGES = [
  { n: 1, title: 'The Story', note: 'Chapters and named missions in order. Finish the missable-flagged stranger finales (stage 2) before the final mission, then let this stage close with the gold finale.' },
  { n: 2, title: 'Strangers & Errands', note: 'Every stranger strand, followed as it is offered — finales first-class here, because a strand never started has no finale to complete.' },
  { n: 3, title: 'Activities & Skill', note: 'Range golds, races, stunts and the one-of-each sampler. Spread the 42 range golds across sessions.' },
  { n: 4, title: 'The Great Sweep', note: 'Exploration and collections together: areas, meditation spots, cards, WAiNK locations, vehicles and garages all ride the same journeys.' },
  { n: 5, title: 'Free-Roam Feats & Fortune', note: 'Partner runs, robberies, one-off feats and the money counters, done with the whole map open.' },
  { n: 6, title: 'The 100% Finish', note: 'Whatever the completion tally still wants, then the platinum itself.' },
];
const SOURCE_DIRECTORY = [
  { name: 'PlayStation — official GTA VI trophy list', url: 'playstation.com', about: 'The publisher-side list: the 55 trophy names, descriptions and grades as officially published for PlayStation 5.' },
  { name: 'Exophase — GTA VI trophy list', url: 'exophase.com', about: 'Exophase’s listing of the official list — trophy names, descriptions and grades, used to cross-check every entry in this guide.' },
  { name: 'PSNProfiles — GTA VI trophy guide', url: 'psnprofiles.com', about: 'PSNProfiles’ listing of the official list and its guide pages — the counts in several official descriptions (42 range challenges, 500 choices) are stated there.' },
];

let DATA = null;
let state = loadState();
let ui = { view: 'tracker', kind: 'all', grade: 'all', search: '', selected: null };

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { earned: s.earned || {}, counts: s.counts || {}, spoiler: !!s.spoiler };
    }
  } catch (e) { /* storage unavailable: run in-memory */ }
  return { earned: {}, counts: {}, spoiler: false };
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* in-memory only */ }
}

const $ = (sel) => document.querySelector(sel);
const byId = (id) => DATA.trophies.find((t) => t.id === id);
const isEarned = (t) => !!state.earned[t.id];
const countOf = (t) => Math.min(state.counts[t.id] || 0, t.count || 0);
const shieldHides = (t) => state.spoiler && t.kind === 'story' && !isEarned(t);

function fmt(n) { return n.toLocaleString('en-US'); }

/* ---------------- rendering ---------------- */

function renderHeader() {
  const earned = DATA.trophies.filter(isEarned);
  $('#earnedTotal').textContent = earned.length + ' / ' + DATA.trophies.length + ' trophies';
  const per = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  earned.forEach((t) => { per[t.grade] += 1; });
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  DATA.trophies.forEach((t) => { totals[t.grade] += 1; });
  $('#gradeCounts').textContent =
    'Platinum ' + per.platinum + '/' + totals.platinum +
    ' · Gold ' + per.gold + '/' + totals.gold +
    ' · Silver ' + per.silver + '/' + totals.silver +
    ' · Bronze ' + per.bronze + '/' + totals.bronze;
  $('#progressBar').style.width = (earned.length / DATA.trophies.length * 100) + '%';
  $('#spoilerToggle').checked = state.spoiler;
}

function badge(grade) {
  return '<span class="badge ' + grade + '">' + grade + '</span>';
}

function counterHtml(t) {
  if (!t.count) return '';
  const c = countOf(t);
  const done = c >= t.count ? ' done' : '';
  return '<div class="row-counter" data-counter="' + t.id + '">' +
    '<button type="button" data-step="-1" aria-label="Decrease count">−</button>' +
    '<span class="count' + done + '">' + fmt(c) + ' / ' + fmt(t.count) + '</span>' +
    '<button type="button" data-step="1" aria-label="Increase count">+</button></div>';
}

function rowHtml(t) {
  const earned = isEarned(t);
  const hidden = shieldHides(t);
  const name = hidden ? 'Story trophy — hidden by the spoiler shield' : t.name;
  const desc = hidden ? 'Earn it (or lift the shield) to reveal what this one asks.' : t.description;
  let tags = '<span class="tag kind">' + KIND_LABEL[t.kind] + '</span>';
  if (t.missable) tags += '<span class="tag missable">Missable — see guide</span>';
  if (hidden) tags += '<span class="tag hidden-note">Spoiler shield</span>';
  return '<li class="trophy-row' + (earned ? ' earned' : '') + (ui.selected === t.id ? ' selected' : '') +
    '" data-open="' + t.id + '">' +
    '<input type="checkbox" data-earn="' + t.id + '"' + (earned ? ' checked' : '') +
    ' aria-label="Mark ' + (hidden ? 'story trophy' : t.name) + ' as earned">' +
    badge(t.grade) +
    '<div class="row-main"><h3>' + name + '</h3><p class="desc">' + desc + '</p>' +
    '<div class="row-tags">' + tags + '</div></div>' +
    counterHtml(t) + '</li>';
}

function matchesFilters(t) {
  if (ui.kind === 'missable' && !t.missable) return false;
  if (ui.kind === 'notearned' && isEarned(t)) return false;
  if (['story', 'collectibles', 'activities', 'online'].includes(ui.kind) && t.kind !== ui.kind) return false;
  if (ui.grade !== 'all' && t.grade !== ui.grade) return false;
  if (ui.search) {
    const q = ui.search.toLowerCase();
    const hay = (t.name + ' ' + t.description + ' ' + t.kind).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderTracker() {
  const list = DATA.trophies.filter(matchesFilters)
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  $('#trophyList').innerHTML = list.map(rowHtml).join('');
  $('#listSummary').textContent = 'Showing ' + list.length + ' of ' + DATA.trophies.length +
    ' trophies. Select any row to read its guide.';
}

function renderRoadmap() {
  $('#roadmapStages').innerHTML = STAGES.map((s) => {
    const items = DATA.trophies.filter((t) => t.stage === s.n)
      .sort((a, b) => a.id - b.id);
    const done = items.filter(isEarned).length;
    const lis = items.map((t) => {
      const hidden = shieldHides(t);
      const label = hidden ? 'Story trophy — hidden by the spoiler shield' : t.name;
      return '<li data-open="' + t.id + '">' + (isEarned(t) ? '<span class="done">✓</span> ' : '') +
        label + (t.missable ? ' <span class="tag missable">Missable</span>' : '') + '</li>';
    }).join('');
    return '<div class="stage"><h3>Stage ' + s.n + ' — ' + s.title +
      ' <span class="stage-progress">(' + done + '/' + items.length + ' earned)</span></h3>' +
      '<p class="stage-note">' + s.note + '</p><ol>' + lis + '</ol></div>';
  }).join('');
}

function renderMissables() {
  const list = DATA.trophies.filter((t) => t.missable).sort((a, b) => a.id - b.id);
  $('#missableList').innerHTML = list.map(rowHtml).join('');
}

function renderSources() {
  $('#sourceList').innerHTML = SOURCE_DIRECTORY.map((s) =>
    '<li><span class="src-name">' + s.name + '</span><br><span class="src-url">' + s.url + '</span><p>' + s.about + '</p></li>'
  ).join('');
}

function renderDetail() {
  const panel = $('#detailPanel');
  const t = ui.selected ? byId(ui.selected) : null;
  if (!t) { panel.hidden = true; document.querySelector('.layout').classList.add('no-detail'); return; }
  panel.hidden = false;
  document.querySelector('.layout').classList.remove('no-detail');
  const hidden = shieldHides(t);
  const name = hidden ? 'Story trophy — hidden by the spoiler shield' : t.name;
  const official = hidden ? 'Description hidden by the spoiler shield.' : t.description;
  let html = '<h2>' + name + '</h2>' + badge(t.grade) +
    ' <span class="tag kind">' + KIND_LABEL[t.kind] + '</span>' +
    (t.missable ? ' <span class="tag missable">Missable</span>' : '') +
    '<p class="official">“' + official + '” — official description</p>';
  if (t.count) {
    const c = countOf(t);
    html += '<h4>Progress counter</h4><div class="counter-box" data-counter="' + t.id + '">' +
      '<button type="button" data-step="-1" aria-label="Decrease count">−</button>' +
      '<strong>' + fmt(c) + ' / ' + fmt(t.count) + '</strong>' +
      '<button type="button" data-step="1" aria-label="Increase count">+</button></div>';
  }
  html += '<h4>Guide</h4><p>' + (hidden ? 'This guide is hidden until the trophy is earned or the shield is lifted — it discusses the mission it belongs to.' : t.guide) + '</p>';
  if (t.missable && !hidden) {
    html += '<div class="missable-box"><strong>Why this is flagged missable:</strong> ' + t.missableNote + '</div>';
  }
  html += '<h4>Sources</h4><p class="sources-line">' + t.sources.map((s) => 'Sources: ' + s).join('<br>') + '</p>';
  html += '<div class="earned-toggle">' +
    (isEarned(t)
      ? '<button type="button" class="undo" data-unearn="' + t.id + '">Mark as not earned</button>'
      : '<button type="button" data-earn-btn="' + t.id + '">Mark as earned</button>') +
    '</div>';
  $('#detailBody').innerHTML = html;
}

function renderAll() {
  renderHeader();
  renderTracker();
  renderRoadmap();
  renderMissables();
  renderSources();
  renderDetail();
}

/* ---------------- actions ---------------- */

function setEarned(id, val) {
  if (val) state.earned[id] = true; else delete state.earned[id];
  saveState(); renderAll();
}
function bumpCount(id, step) {
  const t = byId(id);
  if (!t || !t.count) return;
  const big = t.count >= 10000 ? 1000 : 1;
  const delta = step * big;
  let v = (state.counts[id] || 0) + delta;
  v = Math.max(0, Math.min(t.count, v));
  state.counts[id] = v;
  if (v >= t.count) state.earned[id] = true;
  saveState(); renderAll();
}
function openDetail(id) { ui.selected = id; renderTracker(); renderMissables(); renderDetail(); }
function switchView(v) {
  ui.view = v;
  document.querySelectorAll('.viewnav button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('.view').forEach((s) => s.classList.toggle('active', s.id === 'view-' + v));
}

function exportProgress() {
  const payload = JSON.stringify({
    app: 'leonida-platinum-log', version: 1,
    earned: state.earned, counts: state.counts, spoiler: state.spoiler,
  }, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-platinum-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const s = JSON.parse(reader.result);
      if (typeof s !== 'object' || !s) return;
      state = { earned: s.earned || {}, counts: s.counts || {}, spoiler: !!s.spoiler };
      saveState(); renderAll();
    } catch (e) { /* not a progress file: ignore quietly */ }
  };
  reader.readAsText(file);
}

/* ---------------- events ---------------- */

document.addEventListener('click', (ev) => {
  const stepBtn = ev.target.closest('[data-step]');
  if (stepBtn) {
    const wrap = stepBtn.closest('[data-counter]');
    if (wrap) { bumpCount(Number(wrap.dataset.counter), Number(stepBtn.dataset.step)); ev.stopPropagation(); return; }
  }
  const earnBox = ev.target.closest('[data-earn]');
  if (earnBox) { ev.stopPropagation(); return; }
  const earnBtn = ev.target.closest('[data-earn-btn]');
  if (earnBtn) { setEarned(Number(earnBtn.dataset.earnBtn), true); return; }
  const unearnBtn = ev.target.closest('[data-unearn]');
  if (unearnBtn) { setEarned(Number(unearnBtn.dataset.unearn), false); return; }
  const open = ev.target.closest('[data-open]');
  if (open) openDetail(Number(open.dataset.open));
});
document.addEventListener('change', (ev) => {
  const earnBox = ev.target.closest('[data-earn]');
  if (earnBox) setEarned(Number(earnBox.dataset.earn), earnBox.checked);
  if (ev.target.id === 'spoilerToggle') { state.spoiler = ev.target.checked; saveState(); renderAll(); }
  if (ev.target.id === 'importFile' && ev.target.files[0]) importProgress(ev.target.files[0]);
});
document.querySelectorAll('.viewnav button').forEach((b) =>
  b.addEventListener('click', () => switchView(b.dataset.view)));
document.querySelectorAll('#kindTabs button').forEach((b) =>
  b.addEventListener('click', () => {
    ui.kind = b.dataset.kind;
    document.querySelectorAll('#kindTabs button').forEach((x) => x.classList.toggle('active', x === b));
    renderTracker();
  }));
document.querySelectorAll('#gradeChips button').forEach((b) =>
  b.addEventListener('click', () => {
    ui.grade = b.dataset.grade;
    document.querySelectorAll('#gradeChips button').forEach((x) => x.classList.toggle('active', x === b));
    renderTracker();
  }));
$('#searchBox').addEventListener('input', (ev) => { ui.search = ev.target.value.trim(); renderTracker(); });
$('#exportBtn').addEventListener('click', exportProgress);
$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#detailClose').addEventListener('click', () => { ui.selected = null; renderAll(); });

/* ---------------- screenshot seeding (also handy for demos) ----------------
   ?seed=tracker|missables|roadmap|spoiler pre-fills a believable mid-run
   state on a fresh profile so the views can be photographed or demoed. */
function applySeed() {
  const seed = new URLSearchParams(location.search).get('seed');
  if (!seed) return;
  const fresh = !localStorage.getItem(STORE_KEY);
  if (fresh) {
    state.earned = { 2: true, 3: true, 8: true, 16: true, 21: true };
    state.counts = { 17: 27, 15: 120, 31: 34 };
  }
  if (seed === 'tracker') { ui.selected = 17; }
  if (seed === 'missables') { switchView('missables'); ui.selected = 37; }
  if (seed === 'roadmap') { switchView('roadmap'); }
  if (seed === 'spoiler') {
    state.spoiler = true;
    if (fresh) { state.earned = { 16: true, 21: true, 44: true }; }
    ui.selected = 44;
  }
}

/* ---------------- boot ---------------- */

async function boot() {
  let data = null;
  try {
    const res = await fetch('data/trophies.json');
    if (res.ok) data = await res.json();
  } catch (e) { /* file:// or offline fetch: use the mirror below */ }
  if (!data && window.TROPHIES_DATA) data = window.TROPHIES_DATA;
  if (!data) {
    document.querySelector('.content').innerHTML =
      '<p>The trophy data could not be loaded. Serve this folder with any static server, or open it where local file access is allowed.</p>';
    return;
  }
  DATA = data;
  applySeed();
  renderAll();
}
boot();

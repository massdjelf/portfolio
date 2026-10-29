/* ============ Données par défaut ============ */
const DEFAULT_OFFERS = [
  { id: 'single', name: '1 séance', sub: 'paiement à la séance', price: 500 },
  { id: 'w1', name: '1x / semaine', sub: 'abonnement mensuel', price: 2000 },
  { id: 'w2', name: '2x / semaine', sub: 'abonnement mensuel', price: 3500 },
  { id: 'w3', name: '3x / semaine', sub: 'abonnement mensuel', price: 4500 },
  { id: 'w5', name: '5x / semaine', sub: 'abonnement mensuel', price: 6000 },
  { id: 'unlimited', name: 'Illimité', sub: 'accès mensuel sans limite', price: 8000, unlimited: true }
];

/* ============ Stockage local ============ */
const K_PIN = 'gym_pin_hash';
const K_OFFERS = 'gym_offers';
const K_CLIENTS = 'gym_clients';
const K_SETTINGS = 'gym_settings';

const getOffers = () => JSON.parse(localStorage.getItem(K_OFFERS) || '[]');
const saveOffers = (o) => localStorage.setItem(K_OFFERS, JSON.stringify(o));
const getClients = () => JSON.parse(localStorage.getItem(K_CLIENTS) || '[]');
const saveClients = (c) => localStorage.setItem(K_CLIENTS, JSON.stringify(c));
const getSettings = () => JSON.parse(localStorage.getItem(K_SETTINGS) || '{"name":"Ma Salle"}');
const saveSettings = (s) => localStorage.setItem(K_SETTINGS, JSON.stringify(s));

function ensureInitialized() {
  if (!localStorage.getItem(K_OFFERS)) saveOffers(DEFAULT_OFFERS);
  if (!localStorage.getItem(K_CLIENTS)) saveClients([]);
  if (!localStorage.getItem(K_SETTINGS)) saveSettings({ name: 'Ma Salle' });
}

/* ============ Utilitaires ============ */
function formatMoney(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' DA';
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function csvEscape(s) {
  s = String(s);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
async function hashPin(pin) {
  const payload = 'gymapp-salt-' + pin;
  if (window.crypto && crypto.subtle && window.isSecureContext) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Repli non-cryptographique (contexte non sécurisé, ex. test local en file://)
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) | 0;
  return 'fallback-' + h;
}
function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

/* ============ Verrouillage par code PIN ============ */
const lockScreen = document.getElementById('lock-screen');
const mainApp = document.getElementById('main-app');
const pinDots = document.getElementById('pin-dots');
const lockTitle = document.getElementById('lock-title');
const lockHint = document.getElementById('lock-hint');
const keypad = document.getElementById('keypad');
const lockResetBtn = document.getElementById('lock-reset-btn');
const lockResetHint = document.getElementById('lock-reset-hint');

let unlockBuffer = [];
let forgotArmed = false;

function fillDots(container, count) {
  container.querySelectorAll('span').forEach((dot, i) => dot.classList.toggle('filled', i < count));
}

function unlockApp() {
  lockScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  renderOffers();
  renderClients();
  updateStats();
}

async function tryUnlock() {
  const entered = unlockBuffer.join('');
  const hash = await hashPin(entered);
  const stored = localStorage.getItem(K_PIN);
  if (hash === stored) {
    vibrate(15);
    unlockBuffer = [];
    fillDots(pinDots, 0);
    unlockApp();
  } else {
    vibrate([40, 40, 40]);
    pinDots.classList.add('error');
    lockHint.textContent = 'Code incorrect';
    setTimeout(() => {
      pinDots.classList.remove('error');
      lockHint.textContent = '\u00A0';
      fillDots(pinDots, 0);
    }, 500);
    unlockBuffer = [];
  }
}

keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-k]');
  if (!btn) return;
  const k = btn.dataset.k;
  if (k === 'del') { unlockBuffer.pop(); fillDots(pinDots, unlockBuffer.length); return; }
  if (unlockBuffer.length >= 4) return;
  unlockBuffer.push(k);
  fillDots(pinDots, unlockBuffer.length);
  if (unlockBuffer.length === 4) setTimeout(tryUnlock, 120);
});

lockResetBtn.addEventListener('click', () => {
  if (!forgotArmed) {
    forgotArmed = true;
    lockResetHint.classList.remove('hidden');
    lockResetBtn.textContent = 'Confirmer';
    return;
  }
  localStorage.removeItem(K_PIN);
  forgotArmed = false;
  lockResetHint.classList.add('hidden');
  lockResetBtn.textContent = 'Oublié';
  openSetPin({ isFirstRun: true });
});

/* ============ Création / changement de code PIN ============ */
const overlaySetPin = document.getElementById('overlay-set-pin');
const setPinTitle = document.getElementById('set-pin-title');
const setPinDots = document.getElementById('set-pin-dots');
const setPinKeypad = document.getElementById('set-pin-keypad');

let setPinState = { stage: 'enter', firstEntry: null, isFirstRun: false };
let setPinBuffer = [];

function openSetPin({ isFirstRun = false } = {}) {
  setPinState = { stage: 'enter', firstEntry: null, isFirstRun };
  setPinBuffer = [];
  setPinTitle.textContent = 'Créez un code à 4 chiffres';
  fillDots(setPinDots, 0);
  overlaySetPin.classList.remove('hidden');
  if (isFirstRun) {
    keypad.classList.add('hidden');
    pinDots.classList.add('hidden');
    lockTitle.textContent = 'Bienvenue';
    lockHint.textContent = "Configurez d'abord un code d'accès";
  }
}

setPinKeypad.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-k]');
  if (!btn) return;
  const k = btn.dataset.k;
  if (k === 'del') { setPinBuffer.pop(); fillDots(setPinDots, setPinBuffer.length); return; }
  if (setPinBuffer.length >= 4) return;
  setPinBuffer.push(k);
  fillDots(setPinDots, setPinBuffer.length);
  if (setPinBuffer.length < 4) return;

  if (setPinState.stage === 'enter') {
    setPinState.firstEntry = setPinBuffer.join('');
    setPinState.stage = 'confirm';
    setPinBuffer = [];
    setTimeout(() => {
      setPinTitle.textContent = 'Confirmez le code';
      fillDots(setPinDots, 0);
    }, 150);
    return;
  }

  // stage === 'confirm'
  const confirmEntry = setPinBuffer.join('');
  if (confirmEntry === setPinState.firstEntry) {
    const hash = await hashPin(confirmEntry);
    localStorage.setItem(K_PIN, hash);
    overlaySetPin.classList.add('hidden');
    setPinBuffer = [];
    if (setPinState.isFirstRun) {
      keypad.classList.remove('hidden');
      pinDots.classList.remove('hidden');
      lockTitle.textContent = 'Entrez le code';
      lockHint.textContent = '\u00A0';
      unlockApp();
    } else {
      toast('Code PIN mis à jour');
    }
  } else {
    setPinDots.classList.add('error');
    setPinTitle.textContent = 'Les codes ne correspondent pas';
    vibrate([40, 40, 40]);
    setTimeout(() => {
      setPinDots.classList.remove('error');
      setPinState = { stage: 'enter', firstEntry: null, isFirstRun: setPinState.isFirstRun };
      setPinBuffer = [];
      setPinTitle.textContent = 'Créez un code à 4 chiffres';
      fillDots(setPinDots, 0);
    }, 700);
  }
});

/* ============ Onglets ============ */
const tabOffers = document.getElementById('tab-offers');
const tabClients = document.getElementById('tab-clients');
const viewOffers = document.getElementById('view-offers');
const viewClients = document.getElementById('view-clients');

function switchTab(tab) {
  const onOffers = tab === 'offers';
  tabOffers.classList.toggle('active', onOffers);
  tabClients.classList.toggle('active', !onOffers);
  viewOffers.classList.toggle('hidden', !onOffers);
  viewClients.classList.toggle('hidden', onOffers);
  if (!onOffers) { renderClients(); updateStats(); }
}
tabOffers.addEventListener('click', () => switchTab('offers'));
tabClients.addEventListener('click', () => switchTab('clients'));

/* ============ Vue Offres ============ */
const offersList = document.getElementById('offers-list');

function renderOffers() {
  const offers = getOffers();
  offersList.innerHTML = offers.map(o => `
    <button class="offer-card ${o.unlimited ? 'unlimited' : ''}" data-offer-id="${o.id}">
      <div>
        <div class="offer-name">${escapeHtml(o.name)}</div>
        <div class="offer-sub">${escapeHtml(o.sub || '')}</div>
      </div>
      <div class="offer-price">${formatMoney(o.price)}</div>
    </button>
  `).join('');
}
offersList.addEventListener('click', (e) => {
  const card = e.target.closest('.offer-card');
  if (!card) return;
  const offer = getOffers().find(o => o.id === card.dataset.offerId);
  if (offer) openNewClientSheet(offer);
});

/* ============ Sheet : nouveau client ============ */
const overlayNewClient = document.getElementById('overlay-new-client');
const ncOfferName = document.getElementById('nc-offer-name');
const ncOfferPrice = document.getElementById('nc-offer-price');
const ncNameInput = document.getElementById('nc-name-input');
let currentOffer = null;

function openNewClientSheet(offer) {
  currentOffer = offer;
  ncOfferName.textContent = offer.name;
  ncOfferPrice.textContent = formatMoney(offer.price);
  ncNameInput.value = '';
  overlayNewClient.classList.remove('hidden');
  setTimeout(() => ncNameInput.focus(), 50);
}
document.getElementById('nc-cancel').addEventListener('click', () => overlayNewClient.classList.add('hidden'));
document.getElementById('nc-save').addEventListener('click', saveNewClient);
ncNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveNewClient(); });

function saveNewClient() {
  const name = ncNameInput.value.trim();
  if (!name) { toast('Saisissez un nom'); return; }
  if (!currentOffer) return;
  const clients = getClients();
  clients.unshift({
    id: 'c' + Date.now() + Math.random().toString(36).slice(2, 7),
    name,
    offerId: currentOffer.id,
    offerName: currentOffer.name,
    price: currentOffer.price,
    date: new Date().toISOString(),
    sessions: []
  });
  saveClients(clients);
  overlayNewClient.classList.add('hidden');
  renderClients();
  updateStats();
  toast('Client enregistré');
}

/* ============ Suivi des séances ============ */
function dateOnly(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  const tz = dt.getTimezoneOffset();
  return new Date(dt.getTime() - tz * 60000).toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dateOnly(d);
}
function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return dateOnly(d);
}
function resolveOfferForClient(client) {
  const found = client.offerId && getOffers().find(o => o.id === client.offerId);
  if (found) return found;
  return { name: client.offerName || '', unlimited: /illimit/i.test(client.offerName || '') };
}
// Weekly cap: explicit offer.weeklyCap, else parsed from "Nx / semaine" in the name, else null (no tracking — e.g. "1 séance").
function offerWeeklyCap(offer) {
  if (!offer || offer.unlimited) return null;
  if (typeof offer.weeklyCap === 'number') return offer.weeklyCap;
  const m = /^(\d+)\s*x/i.exec(offer.name || '');
  return m ? Number(m[1]) : null;
}
// Monthly cap over a 30-day cycle: weeklyCap * (30/7), rounded — e.g. 3x/semaine -> 13.
function offerMonthlyCap(offer) {
  if (!offer || offer.unlimited) return null;
  const wc = offerWeeklyCap(offer);
  return wc ? Math.round(wc * 30 / 7) : null;
}
function offerTracksSessions(offer) {
  return !!offer && (offer.unlimited === true || offerWeeklyCap(offer) !== null);
}
function cycleStartStr(client) { return dateOnly(client.date); }
function cycleEndStr(client) { return addDays(cycleStartStr(client), 29); }
function isExpired(client) { return dateOnly(new Date()) > cycleEndStr(client); }
function weeklyCount(sessions, dateStr) {
  const wk = mondayOf(dateStr);
  return sessions.filter(s => mondayOf(s) === wk).length;
}
function toggleSession(client, dateStr) {
  const offer = resolveOfferForClient(client);
  const sessions = client.sessions || (client.sessions = []);
  const idx = sessions.indexOf(dateStr);
  if (idx !== -1) { sessions.splice(idx, 1); return { ok: true }; }
  const today = dateOnly(new Date());
  if (dateStr > today) return { ok: false, reason: 'future' };
  if (dateStr < cycleStartStr(client) || dateStr > cycleEndStr(client)) return { ok: false, reason: 'range' };
  const monthlyCap = offerMonthlyCap(offer);
  if (monthlyCap !== null && sessions.length >= monthlyCap) return { ok: false, reason: 'monthly' };
  const weeklyCap = offerWeeklyCap(offer);
  if (weeklyCap !== null && weeklyCount(sessions, dateStr) >= weeklyCap) return { ok: false, reason: 'weekly' };
  sessions.push(dateStr);
  sessions.sort();
  return { ok: true };
}

/* ============ Vue Clients ============ */
const clientsList = document.getElementById('clients-list');
const clientSearch = document.getElementById('client-search');
const statCount = document.getElementById('stat-count');
const statTotal = document.getElementById('stat-total');

let clientStatusFilter = 'all';

function renderClients() {
  const q = clientSearch.value.trim().toLowerCase();
  let clients = getClients().filter(c => !q || c.name.toLowerCase().includes(q));

  if (clientStatusFilter !== 'all') {
    clients = clients.filter(c => {
      const offer = resolveOfferForClient(c);
      if (!offerTracksSessions(offer)) return false;
      const expired = isExpired(c);
      return clientStatusFilter === 'active' ? !expired : expired;
    });
  }

  if (!clients.length) {
    clientsList.innerHTML = `<div class="empty-state">Aucun client${q ? ' trouvé' : ' pour le moment'}</div>`;
    return;
  }
  clientsList.innerHTML = clients.map(c => {
    const offer = resolveOfferForClient(c);
    let badge = '';
    if (offerTracksSessions(offer)) {
      const expired = isExpired(c);
      const cap = offerMonthlyCap(offer);
      const used = (c.sessions || []).length;
      badge = `<span class="status-badge ${expired ? 'ended' : 'ok'}">${expired ? '✕' : '✓'} ${used}${cap !== null ? '/' + cap : ''}</span>`;
    }
    return `
    <div class="client-row" data-client-id="${c.id}">
      <div class="who">
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="offer">${escapeHtml(c.offerName)} · ${formatDate(c.date)}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        ${badge}
        <div class="amount">${formatMoney(c.price)}</div>
        <button class="del-btn" data-del-id="${c.id}" aria-label="Supprimer">✕</button>
      </div>
    </div>
  `;
  }).join('');
}
clientSearch.addEventListener('input', renderClients);
document.getElementById('status-filter').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  clientStatusFilter = btn.dataset.filter;
  document.querySelectorAll('#status-filter .filter-btn').forEach(b => b.classList.toggle('active', b === btn));
  renderClients();
});
clientsList.addEventListener('click', (e) => {
  const delBtn = e.target.closest('.del-btn');
  if (delBtn) {
    const id = delBtn.dataset.delId;
    const clients = getClients();
    const c = clients.find(x => x.id === id);
    if (!c) return;
    if (!confirm(`Supprimer ${c.name} (${c.offerName}) ?`)) return;
    saveClients(clients.filter(x => x.id !== id));
    renderClients();
    updateStats();
    return;
  }
  const row = e.target.closest('.client-row');
  if (row) openClientDetail(row.dataset.clientId);
});

/* ============ Sheet : détail client + calendrier ============ */
const overlayClientDetail = document.getElementById('overlay-client-detail');
const cdName = document.getElementById('cd-name');
const cdOfferEl = document.getElementById('cd-offer');
const cdStatus = document.getElementById('cd-status');
const cdProgress = document.getElementById('cd-progress');
const cdCalendar = document.getElementById('cd-calendar');
const cdDelete = document.getElementById('cd-delete');
let cdClientId = null;

function openClientDetail(clientId) {
  const client = getClients().find(c => c.id === clientId);
  if (!client) return;
  cdClientId = clientId;
  const offer = resolveOfferForClient(client);

  cdName.textContent = client.name;
  cdOfferEl.textContent = `${client.offerName} · ${formatMoney(client.price)} · débuté le ${formatDate(client.date)}`;

  if (!offerTracksSessions(offer)) {
    cdStatus.innerHTML = '';
    cdProgress.innerHTML = '<div class="cd-progress-text">Séance unique — pas de suivi de calendrier pour cette offre.</div>';
    cdCalendar.innerHTML = '';
    overlayClientDetail.classList.remove('hidden');
    return;
  }

  const sessions = client.sessions || [];
  const expired = isExpired(client);
  cdStatus.innerHTML = expired
    ? `<span class="status-badge ended">✕ Terminé le ${formatDate(cycleEndStr(client))}</span>`
    : `<span class="status-badge ok">✓ Actif jusqu'au ${formatDate(cycleEndStr(client))}</span>`;

  const monthlyCap = offerMonthlyCap(offer);
  cdProgress.innerHTML = monthlyCap !== null
    ? `<div class="cd-progress-text">${sessions.length} / ${monthlyCap} séances utilisées</div>`
    : `<div class="cd-progress-text">${sessions.length} séance(s) ce mois-ci</div>`;

  cdCalendar.innerHTML = buildCalendarHtml(client, sessions);
  overlayClientDetail.classList.remove('hidden');
}

function buildCalendarHtml(client, sessions) {
  const start = cycleStartStr(client);
  const end = cycleEndStr(client);
  const today = dateOnly(new Date());
  const gridStart = mondayOf(start);
  const gridEnd = addDays(mondayOf(end), 6);

  let html = '<div class="cd-grid-labels">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(l => `<span>${l}</span>`).join('') + '</div>';
  html += '<div class="cd-grid">';
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const inRange = cursor >= start && cursor <= end;
    const isFuture = cursor > today;
    const isMarked = sessions.includes(cursor);
    const classes = ['cd-day'];
    if (!inRange) classes.push('out');
    else if (isFuture) classes.push('future');
    if (isMarked) classes.push('marked');
    if (cursor === today) classes.push('today');
    const clickable = inRange && !isFuture;
    html += `<button type="button" class="${classes.join(' ')}" ${clickable ? `data-date="${cursor}"` : 'disabled'}>${Number(cursor.slice(8, 10))}</button>`;
    cursor = addDays(cursor, 1);
  }
  html += '</div>';
  return html;
}

cdCalendar.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-date]');
  if (!btn || !cdClientId) return;
  handleDayClick(cdClientId, btn.dataset.date);
});

function handleDayClick(clientId, dateStr) {
  const clients = getClients();
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  const result = toggleSession(client, dateStr);
  if (!result.ok) {
    const msgs = {
      future: 'Impossible de cocher une date future',
      monthly: 'Quota mensuel déjà atteint',
      weekly: 'Quota hebdomadaire déjà atteint',
      range: "Hors période d'abonnement"
    };
    toast(msgs[result.reason] || 'Action impossible');
    return;
  }
  saveClients(clients);
  openClientDetail(clientId);
  renderClients();
}

document.getElementById('cd-close').addEventListener('click', () => overlayClientDetail.classList.add('hidden'));
cdDelete.addEventListener('click', () => {
  if (!cdClientId) return;
  const clients = getClients();
  const c = clients.find(x => x.id === cdClientId);
  if (!c) return;
  if (!confirm(`Supprimer ${c.name} (${c.offerName}) ?`)) return;
  saveClients(clients.filter(x => x.id !== cdClientId));
  overlayClientDetail.classList.add('hidden');
  renderClients();
  updateStats();
});

function updateStats() {
  const clients = getClients();
  statCount.textContent = clients.length;
  statTotal.textContent = formatMoney(clients.reduce((s, c) => s + Number(c.price || 0), 0));
}

/* ============ Réglages ============ */
const overlaySettings = document.getElementById('overlay-settings');
const settingsGymName = document.getElementById('settings-gym-name');
const settingsOffersList = document.getElementById('settings-offers-list');
const gymNameHeader = document.getElementById('gym-name');

document.getElementById('settings-btn').addEventListener('click', openSettings);
document.getElementById('settings-close').addEventListener('click', () => overlaySettings.classList.add('hidden'));
document.getElementById('settings-save').addEventListener('click', saveSettingsSheet);
document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
document.getElementById('change-pin-btn').addEventListener('click', () => {
  overlaySettings.classList.add('hidden');
  openSetPin({ isFirstRun: false });
});

function openSettings() {
  settingsGymName.value = getSettings().name || 'Ma Salle';
  const offers = getOffers();
  settingsOffersList.innerHTML = offers.map(o => `
    <div class="offer-row-edit">
      <div class="offer-name">${escapeHtml(o.name)}</div>
      <input type="number" inputmode="numeric" min="0" step="50" data-offer-id="${o.id}" value="${o.price}">
    </div>
  `).join('');
  overlaySettings.classList.remove('hidden');
}

function saveSettingsSheet() {
  const name = settingsGymName.value.trim() || 'Ma Salle';
  saveSettings({ name });
  gymNameHeader.textContent = name;

  const offers = getOffers();
  settingsOffersList.querySelectorAll('input[data-offer-id]').forEach(inp => {
    const offer = offers.find(o => o.id === inp.dataset.offerId);
    if (offer) offer.price = Math.max(0, Number(inp.value) || 0);
  });
  saveOffers(offers);
  renderOffers();
  overlaySettings.classList.add('hidden');
  toast('Réglages enregistrés');
}

function exportCSV() {
  const clients = getClients();
  const header = 'Nom,Offre,Prix,Date\n';
  const rows = clients.map(c => [
    csvEscape(c.name), csvEscape(c.offerName), c.price, c.date
  ].join(',')).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clients_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function importCSV(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCSV(String(reader.result))
      .filter(r => r.length >= 3 && r[0] && r[0] !== 'Nom');
    if (!rows.length) { toast('Aucune ligne valide dans ce fichier'); return; }

    const clients = getClients();
    const offers = getOffers();
    let imported = 0, skipped = 0, dateIssues = 0;

    rows.forEach(r => {
      const [name, offerName, priceRaw, dateRaw] = r;
      const price = Number(priceRaw) || 0;
      let iso = dateRaw;
      const parsed = new Date(dateRaw);
      if (!dateRaw || isNaN(parsed.getTime())) {
        iso = new Date().toISOString();
        dateIssues++;
      } else {
        iso = parsed.toISOString();
      }
      const alreadyThere = clients.some(x => x.name === name && x.date === iso && x.price === price);
      if (alreadyThere) { skipped++; return; }
      const matchedOffer = offers.find(o => o.name === offerName);
      clients.unshift({
        id: 'c' + Date.now() + Math.random().toString(36).slice(2, 7),
        name: name.trim(),
        offerId: matchedOffer ? matchedOffer.id : null,
        offerName: offerName || '',
        price,
        date: iso
      });
      imported++;
    });

    saveClients(clients);
    renderClients();
    updateStats();
    let msg = `${imported} client(s) importé(s)`;
    if (skipped) msg += `, ${skipped} déjà présent(s) ignoré(s)`;
    if (dateIssues) msg += `, ${dateIssues} date(s) illisible(s)`;
    toast(msg);
  };
  reader.readAsText(file);
}

document.getElementById('import-csv-btn').addEventListener('click', () => {
  document.getElementById('import-csv-input').click();
});
document.getElementById('import-csv-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importCSV(file);
  e.target.value = '';
});

/* ============ Démarrage ============ */
function boot() {
  ensureInitialized();
  gymNameHeader.textContent = getSettings().name || 'Ma Salle';
  if (!localStorage.getItem(K_PIN)) {
    openSetPin({ isFirstRun: true });
  }
  // Sinon : l'écran de verrouillage (déjà visible par défaut) attend la saisie du code.

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}
boot();

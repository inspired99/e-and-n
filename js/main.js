// Запуск E&N: выбор хранилища, модель для интерфейса, обработка действий.

import { DB_URL, ROOM } from '../config.js';
import * as R from './rules.js';
import * as C from './copy.js';
import * as UI from './ui.js';
import { demoState } from './demo.js';
import { buildModel, levelsOf, looksOf, playersOf } from './model.js';
import { createStore, newId, newRoomKey, prefs, readLocalRoom } from './store.js';
import { firebaseAdapter, localAdapter, memoryAdapter } from './sync.js';
import { checkVersion, hardReload } from './update.js';
import { BUILD } from './build.js';
import { mergeWrites } from './merge.js';

const app = document.getElementById('app');
const sheet = document.getElementById('sheet');
const sheetBody = document.getElementById('sheet-body');
const toastEl = document.getElementById('toast');
const shoutEl = document.getElementById('shout');
const ptrEl = document.getElementById('ptr');

const params = new URLSearchParams(location.search);
const isDemo = params.has('demo');

let store = null;
let me = null; // персонаж выбирается при каждом заходе и нигде не запоминается
let screen = 'home'; // home | stats | food | rules
let homeScroll = 0;
let viewStart = null;
let mode = prefs.view() === 'month' ? 'month' : 'week'; // вид дневника на главной
let boardTab = prefs.board() === 'food' ? 'food' : 'tracker'; // что под комнатой: трекер или еда, запоминается на устройстве
let month = null; // месяц на экранах итогов и питания, 'YYYY-MM'
let sheetState = null;
let undo = null;
let toastTimer = null;
let shownDay = null; // день, для которого нарисован экран
let stray = null; // ключ другого дневника, который был на этом устройстве до общего

const roomFromHash = () => (location.hash.match(/room=([A-Za-z0-9]+)/) || [])[1] || null;
const link = () => (ROOM ? `${location.origin}${location.pathname}` : `${location.origin}${location.pathname}#room=${store.room}`);

/** «Сегодня» у всего приложения по Москве. */
const today = () => R.moscowDay();

/** Первая неделя нового дневника: эта, чтобы сразу было что считать. */
function defaultStart(day) {
  return R.weekOf(day);
}

// --- модель ------------------------------------------------------------------

function model() {
  const view = { me, viewStart, month, mode, board: boardTab, screen, status: store.status, pending: store.pending, kind: store.kind, build: BUILD, room: store.room, fixed: Boolean(ROOM), stray: stray ? stray.slice(0, 4) : '' };
  shownDay = today();
  const built = buildModel(store.state, shownDay, view);
  // границы недели и месяца приводит модель, запоминаем приведенные значения
  viewStart = built.viewStart;
  month = built.month;
  return built;
}

// --- отрисовка ---------------------------------------------------------------

function keepFocus(fn) {
  const active = document.activeElement;
  const key = active && active.dataset ? active.dataset.key : null;
  fn();
  if (key) {
    const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (el) el.focus({ preventScroll: true });
  }
}

function renderWelcome(opts = {}) {
  if (app.querySelector('#create')) return;
  app.innerHTML = UI.welcome({ startDay: defaultStart(today()), local: !DB_URL, fixed: Boolean(ROOM), ...opts });
}

function renderSheet(m) {
  if (!sheetState) return;
  const active = document.activeElement;
  if (active && active.tagName === 'INPUT' && sheetBody.contains(active)) return; // не сбиваем ввод
  const top = sheetBody.scrollTop;
  if (sheetState.type === 'log') sheetBody.innerHTML = UI.logSheet(m, sheetState);
  else if (sheetState.type === 'look') sheetBody.innerHTML = UI.lookSheet(m, sheetState);
  else if (sheetState.type === 'goal') sheetBody.innerHTML = UI.goalSheet(m, sheetState);
  else sheetBody.innerHTML = UI.menuSheet(m);
  sheetBody.scrollTop = top;
}

function render() {
  if (!store) return renderWelcome();
  const state = store.state;
  if (!state.settings || !state.settings.players || !state.settings.start) {
    if (!store.loaded) {
      app.innerHTML = UI.loading(store.status);
      return;
    }
    return renderWelcome({ missing: true });
  }
  if (me == null) {
    if (sheet.open) sheet.close();
    app.innerHTML = UI.whoAreYou(playersOf(state), { demo: isDemo, levels: levelsOf(state, today()), looks: looksOf(state) });
    return;
  }
  const m = model();
  keepFocus(() => {
    app.innerHTML = UI.page(m);
    renderSheet(m);
  });
}

function openSheet(state) {
  sheetState = state;
  sheetBody.scrollTop = 0;
  renderSheet(model());
  if (!sheet.open) sheet.showModal();
}

function closeSheet() {
  if (sheet.open) sheet.close();
}

function toast(text, undoFn = null) {
  undo = undoFn;
  toastEl.innerHTML = `<span>${C.esc(text)}</span>${undoFn ? '<button class="link" type="button" data-act="undo">отменить</button>' : ''}`;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
    undo = null;
  }, 6000);
}

/** Возглас по центру экрана, как в старых играх: появляется рывками, мигает и уходит вверх. */
let shoutTimer = null;
function shout(code) {
  const item = C.SHOUT[code];
  if (!item) return;
  shoutEl.textContent = item.say[Math.floor(Math.random() * item.say.length)];
  shoutEl.dataset.tone = item.tone;
  shoutEl.hidden = true;
  void shoutEl.offsetWidth; // перезапуск анимации, если возглас еще на экране
  shoutEl.hidden = false;
  clearTimeout(shoutTimer);
  shoutTimer = setTimeout(() => {
    shoutEl.hidden = true;
  }, 2200);
}

// --- действия ----------------------------------------------------------------

function logEvents(kind, day, targets, n = 1) {
  const m = model();
  // возглас считаем до записи
  const cry = R.shoutFor(m.state, m.today, { targets, kind, day, n });
  const now = Date.now();
  const ids = [];
  const writes = targets.map((who, i) => {
    const id = newId();
    ids.push(id);
    return { path: `events/${id}`, value: { id, who, kind, day, at: now + i, ...(n > 1 ? { n } : {}) } };
  });
  store.write(writes);
  const text = `отмечено: ${C.KIND[kind].name}${n > 1 ? ` ×${n}` : ''}${targets.length > 1 ? ', обоим' : ''}${cry === 'over' ? ', перебор' : ''}`;
  toast(text, () => store.write(ids.map((id) => ({ path: `events/${id}/del`, value: true }))));
  shout(cry);
}

function createDiary(form) {
  const data = new FormData(form);
  const names = [String(data.get('n0') || '').trim(), String(data.get('n1') || '').trim()];
  const error = form.querySelector('.form-error');
  if (!names[0] || !names[1]) {
    error.textContent = 'Нужны оба имени.';
    error.hidden = false;
    return;
  }
  const day = today();
  const room = ROOM || newRoomKey();
  if (store) store.stop();
  store = createStore({ room, adapter: DB_URL ? firebaseAdapter(room, DB_URL) : localAdapter(room) });
  prefs.setRoom(room);
  if (!ROOM) history.replaceState(null, '', `#room=${room}`);
  store.subscribe(render);
  store.start();
  store.write([
    {
      path: 'settings',
      value: { v: 1, players: [{ name: names[0] }, { name: names[1] }], start: defaultStart(day), createdDay: day, looks: { p0: 'base', p1: 'base' } },
    },
  ]);
  app.innerHTML = '';
  render();
}

const actions = {
  'log-open'(el) {
    const m = model();
    const who = el.dataset.who != null ? Number(el.dataset.who) : me;
    // со строки еды лист открывается на еде, и этот продукт уже раскрыт
    const step = el.dataset.step || null;
    openSheet({ type: 'log', day: el.dataset.day || m.today, who, step, group: step ? 'food' : 'good' });
    if (el.dataset.step) sheetBody.querySelector('.opt-step')?.scrollIntoView({ block: 'nearest' });
  },
  'log-day'(el) {
    const picked = sheetState.pick;
    sheetState.day = el.dataset.day;
    sheetState.pick = false; // день выбран, сетка сворачивается, чтобы сразу были видны отметки
    keepFocus(() => renderSheet(model()));
    if (picked) sheetBody.querySelector('[data-key="log-pick"]')?.focus({ preventScroll: true });
  },
  'log-pick'() {
    sheetState.pick = !sheetState.pick;
    keepFocus(() => renderSheet(model()));
  },
  'log-group'(el) {
    sheetState.group = el.dataset.group === 'food' ? 'food' : 'good';
    sheetState.step = null;
    keepFocus(() => renderSheet(model()));
  },
  'log-who'(el) {
    sheetState.who = el.dataset.who === 'both' ? 'both' : Number(el.dataset.who);
    keepFocus(() => renderSheet(model()));
  },
  log(el) {
    const kind = el.dataset.kind;
    // еда в два шага: касание по продукту раскрывает выбор, касание по числу отмечает
    if (R.isFood(kind) && !el.dataset.n) {
      sheetState.step = sheetState.step === kind ? null : kind;
      keepFocus(() => renderSheet(model()));
      sheetBody.querySelector('.opt-step')?.scrollIntoView({ block: 'nearest' });
      return;
    }
    const { day, who } = sheetState;
    const m = model();
    let targets = who === 'both' ? [0, 1] : [who];
    // продукт отмечается только тем, кто его считает
    if (R.isFood(kind)) targets = targets.filter((w) => m.s.limits[kind][w] != null);
    closeSheet();
    if (targets.length) logEvents(kind, day, targets, Number(el.dataset.n) || 1);
  },
  /** Обнулить уровни с сегодняшнего дня. Журнал не трогаем, поэтому это можно отменить. */
  reset() {
    const ok = window.confirm('Обнулить уровни у обоих с сегодняшнего дня? Отметки и прошлые недели останутся в дневнике.');
    if (!ok) return;
    const was = (store.state.settings || {}).resetDay || null;
    store.write([{ path: 'settings/resetDay', value: today() }]);
    closeSheet();
    toast('уровни обнулены', () => store.write([{ path: 'settings/resetDay', value: was }]));
  },
  /** Поправить число в уже сделанной записи еды. Лист остается открытым: видно, что получилось. */
  'set-qty'(el) {
    const id = el.dataset.id;
    const ev = (store.state.events || {})[id];
    if (!ev) return;
    const was = R.qty(ev);
    const n = Number(el.dataset.n);
    if (n === was) return;
    const write = (v) => store.write([{ path: `events/${id}/n`, value: v > 1 ? v : null }]);
    write(n);
    toast(`${C.KIND[ev.kind].name} ×${n}`, () => write(was));
    if (n > was && R.overIds(store.state).has(id)) shout('over');
  },
  unlog(el) {
    const id = el.dataset.id;
    store.write([{ path: `events/${id}/del`, value: true }]);
    closeSheet();
    toast('запись убрана', () => store.write([{ path: `events/${id}/del`, value: null }]));
  },
  /** Лист «одежда»: касание по персонажу в комнате. */
  'look-open'(el) {
    openSheet({ type: 'look', who: Number(el.dataset.who) });
  },
  /** Выбор образа пишется в дневник: второй видит его сразу. */
  look(el) {
    const who = Number(el.dataset.who);
    const look = el.dataset.look;
    const was = model().looks[who];
    closeSheet();
    if (look === was) return;
    const write = (v) => store.write([{ path: `settings/looks/p${who}`, value: v }]);
    write(look);
    toast(`образ: ${C.LOOK[who][look]}`, () => write(was));
  },
  board(el) {
    boardTab = el.dataset.board === 'food' ? 'food' : 'tracker';
    prefs.setBoard(boardTab);
    render();
  },
  'diary-mode'(el) {
    mode = el.dataset.mode === 'month' ? 'month' : 'week';
    prefs.setView(mode);
    render();
  },
  'week-prev'() {
    viewStart = R.addDays(viewStart, -7);
    render();
  },
  'week-next'() {
    viewStart = R.addDays(viewStart, 7);
    render();
  },
  month(el) {
    month = R.addMonths(month, Number(el.dataset.d));
    render();
  },
  menu() {
    openSheet({ type: 'menu' });
  },
  'goal-open'(el) {
    openSheet({ type: 'goal', id: el.dataset.id });
  },
  reload() {
    closeSheet();
    refresh();
  },
  /** Перенести отметки из дневника, который был на этом устройстве раньше, в общий. */
  async 'stray-merge'() {
    const from = stray;
    if (!from || !store) return;
    toast('переношу отметки');
    let source = readLocalRoom(from);
    try {
      if (DB_URL) {
        const res = await fetch(`${DB_URL.replace(/\/+$/, '')}/rooms/${encodeURIComponent(from)}.json`);
        if (!res.ok) throw new Error(String(res.status));
        const remote = (await res.json()) || {};
        source = { events: { ...(remote.events || {}), ...(source.events || {}) } };
      }
    } catch {
      toast('Нет сети, перенести не вышло. Попробуй еще раз.');
      return;
    }
    const writes = mergeWrites(store.state, source);
    if (writes.length) store.write(writes);
    stray = null;
    prefs.setRoom(ROOM);
    render();
    const back = () => store.write(writes.map((w) => ({ path: `${w.path}/del`, value: true })));
    toast(writes.length ? `перенесено: ${writes.length}` : 'новых отметок там нет', writes.length ? back : null);
  },
  'stray-skip'() {
    stray = null;
    prefs.setRoom(ROOM);
    render();
  },
  close: closeSheet,
  switch() {
    closeSheet();
    me = null;
    screen = 'home';
    viewStart = null;
    render();
    window.scrollTo(0, 0);
  },
  'i-am'(el) {
    me = Number(el.dataset.who);
    // отмечаем, что этот человек заходил в дневник: по этому второй видит, что вы в одном дневнике
    const s = store.state.settings || {};
    if (!isDemo && !(s.joined && s.joined[`p${me}`])) store.write([{ path: `settings/joined/p${me}`, value: true }]);
    render();
    window.scrollTo(0, 0);
  },
  async 'copy-link'() {
    try {
      await navigator.clipboard.writeText(link());
      closeSheet();
      toast('ссылка скопирована');
    } catch {
      closeSheet();
      toast('Скопировать не вышло. Ссылка целиком стоит в адресной строке.');
    }
  },
  /** Число из настроек по пути в settings. Лимит еды ниже нуля становится «не считаем» (-1). */
  num(el) {
    const path = el.dataset.path;
    if (!/^[A-Za-z0-9/]+$/.test(path)) return;
    const d = Number(el.dataset.d);
    const min = Number(el.dataset.min);
    const max = Number(el.dataset.max);
    const v = el.dataset.v === '' ? null : Number(el.dataset.v);
    let next;
    if (v == null) next = d > 0 ? min : null;
    else if (v + d < min) next = el.dataset.none ? R.OFF : min;
    else next = Math.min(max, v + d);
    if (next == null || next === v) return;
    store.write([{ path: `settings/${path}`, value: next }]);
  },
  go(el) {
    if (screen === 'home') homeScroll = window.scrollY;
    screen = el.dataset.view;
    history.pushState({ screen }, '');
    render();
    window.scrollTo(0, 0);
  },
  back() {
    if (history.state && history.state.screen) history.back();
    else showHome();
  },
  export() {
    const blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `e-n-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  leave() {
    const ok = window.confirm(
      'Ссылка на дневник пропадет с этого устройства. Вернуться можно будет только по ссылке. Забыть дневник?',
    );
    if (!ok) return;
    prefs.setRoom(null);
    location.href = location.pathname;
  },
  undo() {
    if (undo) undo();
    undo = null;
    toastEl.hidden = true;
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el);
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-set]');
  if (!el || !store) return;
  const value = el.value.trim();
  if (!value) {
    render();
    return;
  }
  if (el.dataset.set === 'name') store.write([{ path: `settings/players/${el.dataset.who}/name`, value }]);
  if (el.dataset.set === 'start' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    viewStart = null;
    month = null;
    store.write([{ path: 'settings/start', value: R.weekOf(value) }]);
  }
});

/** Подключиться к готовому дневнику по вставленной ссылке: приложение с домашнего экрана ссылку открыть не может. */
function joinDiary(form) {
  const text = form.elements.link.value.trim();
  const room = (text.match(/room=([A-Za-z0-9]+)/) || [])[1] || (/^[A-Za-z0-9]+$/.test(text) ? text : '');
  if (room.length < 20) {
    const err = form.querySelector('.form-error');
    err.textContent = 'Это не похоже на ссылку дневника. Она заканчивается на #room= и длинный ключ.';
    err.hidden = false;
    return;
  }
  prefs.setRoom(room);
  location.hash = `room=${room}`;
  location.reload();
}

document.addEventListener('submit', (e) => {
  if (e.target.id === 'join') {
    e.preventDefault();
    joinDiary(e.target);
    return;
  }
  if (e.target.id !== 'create') return;
  e.preventDefault();
  createDiary(e.target);
});

function showHome() {
  screen = 'home';
  render();
  window.scrollTo(0, homeScroll);
}

// системная кнопка «назад» возвращает с экрана итогов, питания или правил на главную
window.addEventListener('popstate', (e) => {
  if (sheet.open) sheet.close();
  if (e.state && e.state.screen) {
    screen = e.state.screen;
    render();
    window.scrollTo(0, 0);
  } else showHome();
});

sheet.addEventListener('click', (e) => {
  if (e.target === sheet) closeSheet(); // касание по затемнению
});
sheet.addEventListener('close', () => {
  sheetState = null;
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && store && !newDay()) render();
});

// --- запуск ------------------------------------------------------------------

function boot() {
  if (isDemo) {
    store = createStore({ room: 'demo', adapter: memoryAdapter(demoState(today())), persist: false });
    const who = params.get('me');
    if (who === '0' || who === '1') me = Number(who);
    // в примере можно открыть нужный экран ссылкой: ?demo&me=0&open=stats|food|rules|log|look|menu|goal, &view=month включает месяц,
    // &board=food показывает еду под комнатой, &group=food открывает лист «отметить» на еде, &step=bun раскрывает продукт
    const open = params.get('open');
    if (['stats', 'food', 'rules'].includes(open)) screen = open;
    if (open === 'goal') screen = 'stats';
    if (['week', 'month'].includes(params.get('view'))) mode = params.get('view');
    if (['tracker', 'food'].includes(params.get('board'))) boardTab = params.get('board');
    if (me != null && ['log', 'menu', 'look', 'goal'].includes(open)) {
      const day = today();
      const step = params.get('step');
      const state = { log: { type: 'log', day, who: me, step, group: step || params.get('group') === 'food' ? 'food' : 'good' }, look: { type: 'look', who: me }, menu: { type: 'menu' }, goal: { type: 'goal', id: 'sport' } }[open];
      queueMicrotask(() => openSheet(state));
    }
  } else {
    // общий дневник зашит в сайт: открываем его, а другой дневник с этого устройства предлагаем перенести
    const before = [roomFromHash(), prefs.room()].find((r) => r && r !== ROOM) || null;
    const room = ROOM || roomFromHash() || prefs.room();
    if (!room) {
      renderWelcome();
      return;
    }
    if (ROOM) {
      stray = before;
      if (!stray) prefs.setRoom(ROOM);
      if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`);
    } else {
      prefs.setRoom(room);
      if (!roomFromHash()) history.replaceState(null, '', `#room=${room}`);
    }
    store = createStore({ room, adapter: DB_URL ? firebaseAdapter(room, DB_URL) : localAdapter(room) });
  }
  store.subscribe(render);
  store.start();
  render();
}

// --- обновление приложения -------------------------------------------------------

/** Перечитать файлы мимо кеша и перезагрузить страницу. Без сети остаемся как есть. */
async function refresh() {
  toast('обновляю');
  if (!(await hardReload())) toast('Нет сети, обновить не вышло.');
}

// Приложение с домашнего экрана: кнопки «обновить» там нет, поэтому страницу обновляет свайп вниз.
// В обычной вкладке это делает сам браузер.
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const PULL = 90; // сколько тянуть, px
let pull = null;

function showPull(dy) {
  if (dy < 12) {
    ptrEl.hidden = true;
    return;
  }
  const ready = dy >= PULL;
  ptrEl.hidden = false;
  ptrEl.dataset.state = ready ? 'ready' : 'pull';
  ptrEl.textContent = ready ? 'отпусти, чтобы обновить' : 'тяни, чтобы обновить';
  ptrEl.style.setProperty('--pull', `${Math.round(Math.min(dy, PULL + 24) * 0.6)}px`);
}

document.addEventListener(
  'touchstart',
  (e) => {
    pull = null;
    if (!standalone() || e.touches.length !== 1 || sheet.open || window.scrollY > 0) return;
    pull = { x: e.touches[0].clientX, y: e.touches[0].clientY, dy: 0 };
  },
  { passive: true },
);

document.addEventListener(
  'touchmove',
  (e) => {
    if (!pull) return;
    const dy = e.touches[0].clientY - pull.y;
    const dx = Math.abs(e.touches[0].clientX - pull.x);
    // страницу листают, а не тянут вниз от самого верха: это не наш жест
    if (e.touches.length !== 1 || window.scrollY > 0 || dy < 0 || dx > Math.max(24, dy)) {
      pull = null;
      ptrEl.hidden = true;
      return;
    }
    pull.dy = dy;
    showPull(dy);
  },
  { passive: true },
);

function endPull() {
  const go = pull && pull.dy >= PULL;
  pull = null;
  ptrEl.hidden = true;
  if (go) refresh();
}
document.addEventListener('touchend', endPull);
document.addEventListener('touchcancel', () => {
  pull = null;
  ptrEl.hidden = true;
});

// Приложение с домашнего экрана может жить в памяти сутками. Наступил новый день:
// перерисовываем сами и возвращаем дневник к текущей неделе и месяцу.
function newDay() {
  if (!store || !shownDay || today() === shownDay) return false;
  viewStart = null;
  month = null;
  render();
  return true;
}
window.addEventListener('focus', newDay);
setInterval(newDay, 60000);

// новая версия подтягивается сама: при запуске и когда в приложение вернулись
const wasHere = Boolean(prefs.room());
let checkedAt = 0;
function autoUpdate() {
  if (Date.now() - checkedAt < 60000) return;
  checkedAt = Date.now();
  checkVersion({ existing: wasHere, canReload: () => !sheet.open });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') autoUpdate();
});

boot();
autoUpdate();

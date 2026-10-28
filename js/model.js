// Модель для интерфейса: все, что нужно разметке, считается здесь из журнала и состояния экрана.
// Чистая функция без DOM, поэтому отрисовку можно проверять тестом.

import * as R from './rules.js';
import { LOOKS } from './sprites.js';

const live = (obj) => Object.values(obj || {}).filter((r) => r && !r.del && R.KINDS.includes(r.kind));
const byTime = (a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : (a.at || 0) - (b.at || 0));

export function playersOf(state) {
  const p = (state.settings && state.settings.players) || [];
  return [0, 1].map((i) => ({ name: (p[i] && p[i].name) || (i === 0 ? 'Елисей' : 'Неля') }));
}

/** Выбранный образ каждого; неизвестный образ заменяется базовым. */
export function looksOf(state) {
  const l = (state.settings && state.settings.looks) || {};
  return [0, 1].map((who) => (LOOKS[who].includes(l[`p${who}`]) ? l[`p${who}`] : 'base'));
}

/**
 * @param {object} state журнал: settings, events
 * @param {string} today 'YYYY-MM-DD' по Москве
 * @param {object} view состояние экрана: me, viewStart, month, mode, board, screen, status, pending, kind, build, room, fixed, stray
 * Возвращает модель; viewStart и month в ней уже приведены к допустимым границам.
 */
export function buildModel(state, today, view) {
  const s = R.normalize(state.settings);
  const { me, mode = 'week', screen = 'home' } = view;
  const board = view.board === 'food' ? 'food' : 'tracker';
  const curStart = R.weekOf(today);
  const firstView = today < s.start ? s.start : curStart;
  const weeks = R.timeline(state, today);
  const cur = weeks.find((w) => w.start === curStart) || R.preWeek(state, curStart);
  const minView = [R.weekOf(s.createdDay || s.start || today), s.start].filter(Boolean).sort()[0];
  const maxView = firstView > curStart ? firstView : curStart;
  let viewStart = view.viewStart || curStart;
  if (viewStart < minView) viewStart = minView;
  if (viewStart > maxView) viewStart = maxView;
  const weekAt = (w) => weeks.find((x) => x.start === w) || R.preWeek(state, w);
  const other = me === 0 ? 1 : 0;
  const minMonth = [R.firstMonth(s), minView.slice(0, 7)].filter(Boolean).sort()[0];
  const maxMonth = today.slice(0, 7);
  let month = view.month || maxMonth;
  if (month < minMonth) month = minMonth;
  if (month > maxMonth) month = maxMonth;
  const thisMonth = R.monthSummary(state, maxMonth, today);
  const shownMonth = month === maxMonth ? thisMonth : R.monthSummary(state, month, today);
  const events = live(state.events).sort(byTime);
  return {
    state,
    s,
    today,
    curStart,
    weeks,
    cur,
    viewStart,
    view: weekAt(viewStart),
    mode,
    board,
    canPrev: viewStart > minView,
    canNext: viewStart < maxView,
    month,
    canPrevMonth: month > minMonth,
    canNextMonth: month < maxMonth,
    // итог текущего месяца на главной и выбранного месяца в итогах и питании
    thisMonth,
    shownMonth,
    overIds: R.overIds(state),
    me,
    other,
    players: playersOf(state),
    looks: looksOf(state),
    events,
    moods: [0, 1].map((who) => R.mood(state, who, today)),
    together: {
      month: R.together(state, `${month}-01`, R.monthEnd(month) < today ? R.monthEnd(month) : today).length,
      all: R.together(state, '0000-01-01', today).length,
    },
    screen,
    stickers: R.stickers(state, today),
    status: view.status || 'local',
    pending: view.pending || 0,
    kind: view.kind || 'local',
    build: view.build || null, // версия сайта: хеш и время коммита, у себя на машине пусто
    joined: [0, 1].map((who) => Boolean(state.settings && state.settings.joined && state.settings.joined[`p${who}`])),
    roomCode: view.room && view.kind !== 'demo' ? view.room.slice(0, 4) : '',
    fixed: Boolean(view.fixed), // общий дневник зашит в сайт
    stray: view.stray || '', // код другого дневника на этом устройстве, который можно перенести
  };
}

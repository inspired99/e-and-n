// Тексты интерфейса и форматирование. Без буквы «е с точками» и без тире.

import { addDays, dow } from './rules.js';

export const DOW_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const DOW_LONG = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const DOW_GEN = ['понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы', 'воскресенья'];
const DOW_ACC = ['в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье'];
const MONTH = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];
const MONTH_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** Названия видов отметок. Еда во множественном числе, как в списке лимитов. */
export const KIND = {
  sport: { name: 'спорт' },
  read: { name: 'чтение' },
  cook: { name: 'готовка' },
  chips: { name: 'чипсы' },
  shawarma: { name: 'шаурма' },
  fastfood: { name: 'фастфуд' },
  burger: { name: 'бургеры' },
  bun: { name: 'булочки' },
  croissant: { name: 'круассаны' },
  chocolate: { name: 'шоколад' },
  flatbread: { name: 'лепешка' },
  curd: { name: 'сырки' },
};

export const MOOD = { idle: 'в порядке', fit: 'в форме', cough: 'давно без спорта', sleep: 'спит' };

/** Образы: подпись в листе «одежда». */
export const LOOK = [
  { base: 'футболка', summer: 'летний', sport: 'спортивный', city: 'в город' },
  { base: 'сарафан', casual: 'повседневный', winter: 'зимний', sport: 'спортивный', dressy: 'нарядный' },
];

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export const nDays = (n) => `${n} ${plural(n, 'день', 'дня', 'дней')}`;
export const nWeeks = (n) => `${n} ${plural(n, 'неделя', 'недели', 'недель')}`;
export const nTimes = (n) => `${n} ${plural(n, 'раз', 'раза', 'раз')}`;
export const nMonths = (n) => `${n} ${plural(n, 'месяц', 'месяца', 'месяцев')}`;

const parts = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return { y, m, d };
};
export const dayNum = (day) => parts(day).d;
/** 'YYYY-MM' -> «октябрь 2026» */
export const monthTitle = (month) => `${MONTH[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
/** 'YYYY-MM' -> «октябрь» */
export const monthName = (month) => MONTH[Number(month.slice(5, 7)) - 1];
export const dayMonth = (day) => `${parts(day).d} ${MONTH_GEN[parts(day).m - 1]}`;
export const dayLong = (day) => `${DOW_LONG[dow(day)]}, ${dayMonth(day)}`;
export const dayShort = (day) => `${DOW_SHORT[dow(day)]}, ${dayMonth(day)}`;
export const byEndOf = (day) => `до конца ${DOW_GEN[dow(day)]}`;
export const onDay = (day) => DOW_ACC[dow(day)];

/** Диапазон недели коротко: «05.10 - 11.10». */
export function weekRange(start) {
  const short = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
  return `${short(start)} - ${short(addDays(start, 6))}`;
}

/** Когда выложена версия сайта, по времени телефона: «версия от 15.10, 21:40». */
export function buildText(build) {
  const d = new Date(build.at);
  if (Number.isNaN(d.getTime())) return '';
  const two = (n) => String(n).padStart(2, '0');
  return `версия от ${two(d.getDate())}.${two(d.getMonth() + 1)}, ${two(d.getHours())}:${two(d.getMinutes())}`;
}

export const nGems = (n) => `${n} ${plural(n, 'бриллиант', 'бриллианта', 'бриллиантов')}`;

/** Из чего сложились бриллианты недели: спорт и чтение против цели. */
export function weekWhy(wk, who, s) {
  return ['sport', 'read'].map((k) => `${KIND[k].name} ${wk.counts[k][who]} из ${s.goals[k][who]}`).join(', ');
}

/** Из чего сложились бриллианты месяца: перебор и готовка. */
export function monthWhy(ms, who) {
  const over = ms.over[who].length ? `перебор: ${ms.over[who].map((k) => KIND[k].name).join(', ')}` : 'питание в лимитах';
  return `${over}, готовка ${ms.cook[who].done} из ${ms.cook[who].goal}`;
}

/** Возгласы после отметки: тон и варианты фразы. Вариант выбирается случайно. */
export const SHOUT = {
  good: { tone: 'good', say: ['так держать!', 'отлично!', 'плюс один!'] },
  together: { tone: 'together', say: ['вместе!'] },
  'week-goal': { tone: 'good', say: ['цель недели!'] },
  'month-goal': { tone: 'good', say: ['цель месяца!'] },
  ok: { tone: 'calm', say: ['в лимите'] },
  last: { tone: 'calm', say: ['лимит выбран'] },
  over: { tone: 'bad', say: ['перебор!'] },
};

/** Достижения в итогах: название и что считается. Сколько нужно, задается в листе достижения. */
export const STICKER = {
  sport: { name: 'спорт', how: 'Тренировки за все время.' },
  read: { name: 'чтение', how: 'Дни с чтением за все время.' },
  cook: { name: 'готовка', how: 'Готовка дома за все время, вместе с тем, что было до приложения.' },
  nofast: { name: 'без фастфуда', how: 'Закрытые месяцы без шаурмы, фастфуда и бургеров.' },
  gems: { name: 'три бриллианта', how: 'Недели на три бриллианта.' },
  level: { name: 'уровень', how: 'Уровень персонажа.' },
};

export const SYNC = {
  online: 'на связи',
  connecting: 'подключаюсь',
  offline: 'нет сети',
  local: 'локально',
  demo: 'пример',
  denied: 'нет доступа к базе',
};

// Дымовой тест разметки: каждый экран и каждый лист отрисовываются на демо-журнале без ошибок.
// Ловит то, что не видит проверка синтаксиса: забытую функцию, опечатку в имени поля.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoState } from '../js/demo.js';
import { buildModel } from '../js/model.js';
import { FOOD, addDays } from '../js/rules.js';
import * as UI from '../js/ui.js';

const TODAY = '2026-10-28'; // среда
const state = demoState(TODAY);
const model = (view, st = state, today = TODAY) => buildModel(st, today, { me: 0, kind: 'demo', status: 'demo', ...view });
const clean = (html) => assert.doesNotMatch(html, /undefined|NaN|\[object Object\]|null/);

test('главная: общая комната, оба персонажа, неделя, месяц и питание', () => {
  for (const mode of ['week', 'month']) {
    for (const me of [0, 1]) {
      const html = UI.page(model({ mode, me }));
      clean(html);
      assert.equal(html.split('class="room-hero ').length - 1, 2); // оба в одной комнате
      assert.match(html, /data-act="look-open" data-who="0"[^]*data-act="look-open" data-who="1"/);
      assert.match(html, mode === 'week' ? /class="diary"/ : /class="cal"/);
      assert.match(html, /id="g-week"[^]*id="g-month"/);
    }
  }
  const html = UI.page(model({}));
  assert.match(html, /src="assets\/sprites\/elisey-sport-fit\.webp"/); // образ из настроек, спорт на неделе
  assert.match(html, /src="assets\/sprites\/nelya-casual-cough\.webp"/); // давно без спорта
});

test('под комнатой переключатель: трекер без еды, еда таблицей с названиями', () => {
  const tracker = UI.page(model({}));
  assert.match(tracker, /aria-pressed="true" data-act="board" data-board="tracker"/);
  assert.match(tracker, /aria-pressed="false" data-act="board" data-board="food"/);
  assert.match(tracker, /id="g-week"[^]*id="g-month"/);
  assert.doesNotMatch(tracker, /id="g-food"|class="food food-board"/);
  const food = UI.page(model({ board: 'food' }));
  clean(food);
  assert.match(food, /aria-pressed="true" data-act="board" data-board="food"/);
  assert.doesNotMatch(food, /id="g-week"/);
  assert.match(food, /class="food food-board"/);
  // строка на продукт: значок и название рядом
  for (const name of ['чипсы', 'шаурма', 'фастфуд', 'бургеры', 'булочки', 'круассаны', 'шоколад', 'лепешка', 'сырки']) {
    assert.match(food, new RegExp(`<span class="rh"><svg[^]*?</svg><span>${name}</span></span>`), name);
  }
  // перебор красным с крестиком, «не считаем» прочерком, касание открывает отметку продукта
  assert.match(food, /data-who="1" data-step="chocolate" data-key="food-1-chocolate" aria-label="Неля, шоколад: 2 из 1, перебор. отметить"><span class="fc is-over">2 \/ 1</);
  assert.match(food, /class="nil" role="img" aria-label="Елисей: не считаем"/);
  assert.match(food, /class="nil" role="img" aria-label="Неля: не считаем"/);
});

test('рядом Неля около 90% роста Елисея: в комнате, на выборе и в шапках таблиц', () => {
  assert.match(UI.page(model({})), /class="room" style="--stature: 0\.84"/);
  const who = UI.whoAreYou([{ name: 'Елисей' }, { name: 'Неля' }]);
  assert.match(who, /class="stand" style="--stand: 136px"><img[^>]*elisey-base-idle\.webp" width="136"/);
  assert.match(who, /class="stand" style="--stand: 136px"><img[^>]*nelya-base-idle\.webp" width="114"/);
  assert.match(UI.page(model({ screen: 'stats' })), /nelya-casual-idle\.webp" width="40"/);
  // в листе «одежда» она одна: в полный размер
  assert.match(UI.lookSheet(model({}), { who: 1 }), /nelya-base-idle\.webp" width="96"/);
});

test('прошлая неделя и пустой дневник до первой недели', () => {
  clean(UI.page(model({ viewStart: addDays(TODAY, -13) })));
  const empty = { settings: { players: [{ name: 'А' }, { name: 'Б' }], start: '2026-11-02', createdDay: TODAY } };
  for (const mode of ['week', 'month']) {
    const html = UI.page(buildModel(empty, TODAY, { me: 0, mode }));
    assert.match(html, /class="scene/);
    clean(html);
  }
});

test('итоги, питание и правила', () => {
  for (const screen of ['stats', 'food', 'rules']) {
    const html = UI.page(model({ screen }));
    assert.match(html, /data-act="back"/);
    clean(html);
  }
  const stats = UI.page(model({ screen: 'stats' }));
  assert.equal(stats.split('class="cal"').length - 1, 2);
  assert.equal(stats.split('data-act="goal-open"').length - 1, 8); // четыре достижения у каждого
  assert.doesNotMatch(stats, /is-better|сравн/); // месяц на двоих, без «кто лучше»
  assert.match(stats, /вместе: \d+ раз/);
  const food = UI.page(model({ screen: 'food' }));
  assert.equal(food.split('<tr><th scope="row">').length - 1, FOOD.length + 2); // продукты, готовка, бриллианты
  assert.match(food, /не считаем/);
  assert.match(food, /class="fc is-over">2 \/ 1</);
  // прошлый месяц смотрится без кнопок
  const sept = UI.page(model({ screen: 'food', month: '2026-09' }));
  clean(sept);
  assert.doesNotMatch(sept, /class="fcell"/);
});

test('листы: отметить, одежда, меню, достижения', () => {
  const m = model({});
  const sheets = [
    UI.logSheet(m, { day: TODAY, who: 0 }),
    UI.logSheet(m, { day: addDays(TODAY, -3), who: 'both', pick: true }),
    UI.logSheet(model({ me: 1 }), { day: TODAY, who: 1, step: 'chocolate' }),
    UI.lookSheet(m, { who: 0 }),
    UI.lookSheet(m, { who: 1 }),
    UI.menuSheet(m),
    ...['sport', 'read', 'cook', 'nofast'].map((id) => UI.goalSheet(m, { id })),
  ];
  for (const html of sheets) {
    assert.ok(html.length > 200);
    clean(html);
  }
  assert.equal(sheets[3].split('data-act="look"').length - 1, 5);
  assert.equal(sheets[4].split('data-act="look"').length - 1, 5);
  assert.match(sheets[4], /aria-pressed="true" data-act="look" data-who="1" data-look="casual"/);
  assert.match(sheets[6], /data-path="goalSport"/);
});

test('отметить: полезное или еда по очереди, еда с названиями и в два шага', () => {
  const html = UI.logSheet(model({ me: 1 }), { day: TODAY, who: 1 });
  // по умолчанию полезное, еды в листе нет
  assert.match(html, /aria-pressed="true" data-act="log-group" data-group="good"/);
  assert.match(html, /data-act="log" data-kind="sport" data-key="log-sport"/);
  assert.doesNotMatch(html, /data-kind="bun"/);
  // переключатель стоит сразу под днем и «кому»
  assert.ok(html.indexOf('aria-label="кому"') < html.indexOf('data-act="log-group"'));
  assert.ok(html.indexOf('data-act="log-group"') < html.indexOf('class="logged"'));
  const food = UI.logSheet(model({ me: 1 }), { day: TODAY, who: 1, group: 'food' });
  clean(food);
  assert.doesNotMatch(food, /data-kind="sport"/);
  assert.match(food, /data-kind="bun" data-key="log-bun" aria-expanded="false">[^]*?<span class="opt-name">булочки<\/span>/);
  assert.doesNotMatch(food, /data-kind="chocolate" data-n=/); // выбор числа еще не раскрыт
  assert.doesNotMatch(food, /data-kind="curd"/); // Неля сырки не считает
  // со строки еды: лист открывается на еде, продукт раскрыт, ×1..×6 прямо под ним
  const open = UI.logSheet(model({ me: 1 }), { day: TODAY, who: 1, step: 'bun' });
  assert.match(open, /aria-pressed="true" data-act="log-group" data-group="food"/);
  assert.equal(open.split('data-kind="bun" data-n=').length - 1, 6);
  assert.match(open, /data-kind="bun" data-key="log-bun" aria-expanded="true">[^]*?<\/button><div class="opt-step"/);
  // сегодня у Нели шоколад ×2: в «уже отмечено» шесть кнопок числа и пометка перебора
  assert.equal(html.split('data-act="set-qty"').length - 1, 6);
  assert.match(html, /aria-pressed="true" data-act="set-qty"[^>]*data-n="2"/);
  assert.match(html, /перебор/);
  assert.ok(html.indexOf('class="logged"') < html.indexOf('class="opts"'));
  // обоим: еда, которую считает хотя бы один
  const both = UI.logSheet(model({}), { day: TODAY, who: 'both', group: 'food' });
  assert.match(both, /data-kind="curd"/);
  assert.match(both, /data-kind="croissant"/);
});

test('меню: все числа правил и лимит «не считаем», без уровня и бриллиантов недели', () => {
  const menu = UI.menuSheet(model({}));
  for (const path of ['weekly/sport/goal/p0', 'weekly/read/goal/p1', 'monthly/cook/goal/p1', 'food/chips/p0', 'food/croissant/p0', 'overCost', 'cookCost', 'coughDays', 'fitSport']) {
    assert.match(menu, new RegExp(`data-path="${path}"`), path);
  }
  assert.doesNotMatch(menu, /data-path="(gem[123]|lvl\w+|badMonthGems)"/);
  // круассаны Елисей не считает: минус закрыт, плюс вернет в счет
  assert.match(menu, /data-path="food\/croissant\/p0" data-v="" [^>]*data-d="-1"[^>]*disabled/);
  assert.match(menu, /<span class="num-value is-off">не считаем<\/span>/);
  assert.doesNotMatch(menu, /data-act="reset"|обнулить/); // обнуление было только для уровня
});

test('нет ни уровня, ни бриллиантов недели: главная, дневник, итоги, правила, кто заходит', () => {
  const pages = [
    UI.page(model({})),
    UI.page(model({ board: 'food' })),
    UI.page(model({ mode: 'month' })),
    UI.page(model({ viewStart: '2026-10-12' })), // закрытая неделя в дневнике
    UI.page(model({ screen: 'stats' })),
    UI.page(model({ screen: 'rules' })),
    UI.whoAreYou([{ name: 'Елисей' }, { name: 'Неля' }]),
  ];
  for (const html of pages) {
    assert.doesNotMatch(html, /lvl|уров/i);
    assert.doesNotMatch(html, /бриллиант\S* недел|неделя: \d+ бриллиант|cal-gems/);
  }
  // бриллианты остались только у месяца: на главной по одному ряду у каждого
  const home = UI.page(model({}));
  assert.equal(home.match(/class="gems[ "]/g).length, 2);
  assert.match(home, /aria-label="Елисей, месяц: \d бриллиант/);
  // итог недели в дневнике: спорт и чтение против цели
  const week = UI.page(model({ viewStart: '2026-10-12' }));
  assert.match(week, /<tfoot>[^]*class="wk-goals"[^]*спорт <b>\d+<\/b> из 3[^]*чтение <b>\d+<\/b> из 3/);
});

test('версия сайта видна внизу главной и в меню, а у себя на машине ее нет', () => {
  const build = { v: 'abc1234', at: '2026-10-15T18:40:00Z' };
  assert.match(UI.page(model({ build })), /class="build">версия от \d\d\.\d\d, \d\d:\d\d</);
  assert.match(UI.menuSheet(model({ build })), /Сейчас стоит версия от/);
  assert.doesNotMatch(UI.page(model({})), /class="build"/);
});

test('общий дневник: без ссылок и кодов, другой дневник на устройстве предлагают перенести', () => {
  const fixed = model({ kind: 'firebase', fixed: true, stray: 'Ab12' });
  assert.match(UI.page(fixed), /другой дневник, код <b>Ab12<\/b>[^]*data-act="stray-merge"[^]*data-act="stray-skip"/);
  const menu = UI.menuSheet(fixed);
  assert.match(menu, /один на двоих/);
  assert.doesNotMatch(menu, /data-act="leave"/);
  assert.doesNotMatch(UI.welcome({ startDay: '2026-10-26', local: false, fixed: true }), /id="join"/);
});

test('первый запуск, выбор персонажа в своих образах, загрузка', () => {
  const players = [{ name: 'Елисей' }, { name: 'Неля' }];
  assert.match(UI.welcome({ startDay: '2026-10-26', local: true }), /id="create"/);
  const who = UI.whoAreYou(players, { looks: ['city', 'winter'] });
  assert.match(who, /data-act="i-am"/);
  assert.match(who, /elisey-city-idle[^]*Елисей[^]*nelya-winter-idle[^]*Неля/);
  assert.match(UI.loading('offline'), /Нет сети/);
});

test('настоящий дневник с переносом октября: шоколад Нели 2 / 1, готовка 4 из 5, сырки Елисея 3 / 5', () => {
  const real = {
    settings: {
      players: [{ name: 'Елисей' }, { name: 'Неля' }],
      start: '2026-10-26',
      createdDay: '2026-10-28',
      carry: { '2026-10': { p0: { cook: 1, bun: 2, chocolate: 1, curd: 3 }, p1: { cook: 4, bun: 1, croissant: 2, chocolate: 2 } } },
    },
  };
  const html = UI.page(buildModel(real, TODAY, { me: 0, kind: 'firebase', status: 'online', fixed: true }));
  clean(html);
  const food = UI.page(buildModel(real, TODAY, { me: 0, kind: 'firebase', status: 'online', fixed: true, board: 'food' }));
  assert.match(food, /aria-label="Неля, шоколад: 2 из 1, перебор/);
  assert.match(food, /aria-label="Елисей, сырки: 3 из 5/);
  assert.match(html, /<span>готовка<\/span><\/dt><dd><b>1<\/b> из 5[^]*<span>готовка<\/span><\/dt><dd><b>4<\/b> из 5/);
  // утро: никто ничего не отметил, оба спят
  assert.equal(html.split('-sleep.webp').length - 1, 2);
});

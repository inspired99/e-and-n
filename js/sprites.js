// Пиксельная графика E&N. Значки и наклейки заданы сетками строк
// (символ задает цвет) и рисуются в SVG: один path на цвет, масштаб без размытия.

const INK = '#171717';
const PAPER = '#fdfbf9';

export const BASE = {
  K: INK,
  W: PAPER,
  G: '#d6d4d3', // светло-серый: пар, фольга
  D: '#8a8887', // серый
  O: '#ff6f1e',
  B: '#3b82f6',
  R: '#ff66cf',
  N: '#22c55e', // зелень: гантель, салат
  Y: '#f5c542', // желтое: картошка, сыр, чипс
  C: '#6fd3f2', // бриллиант
  S: '#2f8fcf', // его темная грань
  X: '#e3342f', // красное: пачка, помидор, обертка
  T: '#d38b3c', // корочка выпечки
  U: '#f6d79b', // мякиш, лаваш
  H: '#7a4320', // шоколад, котлета, мясо
  M: '#45240f', // темный шоколад, прожилки
  A: '#9aa6b2', // металл кастрюли
  I: '#dfe6ec', // блик на металле
};

// Персонажи и образы нарисованы владельцем: assets/src/looks/<кто>-<образ>.png, нарезка tools/sprites.mjs looks.
// Индекс совпадает с индексом игрока: 0 это Елисей, 1 это Неля.
export const WHO = ['elisey', 'nelya'];
/** Образы каждого: первый базовый. Картинка берется по `${кто}-${образ}-${поза}`. */
export const LOOKS = [
  ['base', 'summer', 'sport', 'city'],
  ['base', 'casual', 'winter', 'sport', 'dressy'],
];
export const POSES = ['idle', 'fit', 'cough', 'sleep'];

// --- значки отметок 12x12 --------------------------------------------------

const ICONS = {
  // спорт: гантель, как в fixgaz
  sport: [
    '............',
    '............',
    '.KK......KK.',
    'KNNK....KNNK',
    'KNNK....KNNK',
    'KNNKKKKKKNNK',
    'KNNKKKKKKNNK',
    'KNNK....KNNK',
    'KNNK....KNNK',
    '.KK......KK.',
    '............',
    '............',
  ],
  // чтение: раскрытая книга в синей обложке
  read: [
    '............',
    '.KKKK..KKKK.',
    'KWWWWKKWWWWK',
    'KWKKWKKWKKWK',
    'KWWWWKKWWWWK',
    'KWKKWKKWKKWK',
    'KWWWWKKWWWWK',
    'KWKKWKKWKWWK',
    'KWWWWKKWWWWK',
    'KBBBBKKBBBBK',
    '.KKKKKKKKKK.',
    '............',
  ],
  // готовка: кастрюля с крышкой и паром
  cook: [
    '...G...G....',
    '..G...G...G.',
    '...G...G..G.',
    '.....KK.....',
    '..KKKKKKKK..',
    '.KAAAAAAAAK.',
    'KKKKKKKKKKKK',
    'K.KAIAAAAK.K',
    '..KAIAAAAK..',
    '..KAAAAAAK..',
    '...KKKKKK...',
    '............',
  ],
  // чипсы: красная пачка с чипсом
  chips: [
    '..KKKKKKKK..',
    '..KGKGKGKK..',
    '.KXXXXXXXXK.',
    'KXXXXXXXXXXK',
    'KXXKKKKKXXXK',
    'KXKYYYYYKXXK',
    'KXKYYTYYYKXK',
    'KXXKYYYYYKXK',
    'KXXXKKKKKXXK',
    '.KXXXXXXXXK.',
    '..KGKGKGKK..',
    '..KKKKKKKK..',
  ],
  // шаурма: лаваш в бумаге, сверху начинка
  shawarma: [
    '....KKKK....',
    '...KNXHNK...',
    '..KHNXNHXK..',
    '..KUUUUUUK..',
    '..KUUUTUUK..',
    '..KUUUUUUK..',
    '..KWWWWWWK..',
    '..KXXXXXXK..',
    '..KWWWWWWK..',
    '..KWWWWWWK..',
    '...KWWWWK...',
    '....KKKK....',
  ],
  // фастфуд: картошка фри в красной коробке
  fastfood: [
    '.....KK.....',
    '.KK.KYYK.KK.',
    'KYYKKYYKKYYK',
    'KYYKKYYKKYYK',
    'KYYKKYYKKYYK',
    'KKKKKKKKKKKK',
    'KXXXXXXXXXXK',
    '.KXXXXXXXXK.',
    '.KXWWWWWWXK.',
    '.KXXXXXXXXK.',
    '..KXXXXXXK..',
    '..KKKKKKKK..',
  ],
  // бургер: булка с кунжутом, салат, сыр, котлета
  burger: [
    '............',
    '...KKKKKK...',
    '..KTTTTTTK..',
    '.KTTWTTWTTK.',
    '.KTWTTTTWTK.',
    'KKKKKKKKKKKK',
    'KNNNNNNNNNNK',
    'KYYYYKYYYYYK',
    'KHHHHHHHHHHK',
    'KKKKKKKKKKKK',
    '.KTTTTTTTTK.',
    '..KKKKKKKK..',
  ],
  // булочка: круглая сдоба с бликом и сахаром
  bun: [
    '............',
    '............',
    '....KKKK....',
    '..KKTTTTKK..',
    '.KTUUTTTTTK.',
    '.KTUTTWTTTK.',
    'KTTTTTTTWTTK',
    'KTTWTTTTTTTK',
    'KTTTTTTTTTTK',
    '.KKKKKKKKKK.',
    '............',
    '............',
  ],
  // круассан: полумесяц с долями
  croissant: [
    '............',
    '............',
    '....KKKK....',
    '..KKUTTUKK..',
    '.KTKUTTUKTK.',
    'KTTKTTTTKTTK',
    'KTTKTTTTKTTK',
    '.KTTKKKKTTK.',
    '..KTK..KTK..',
    '...K....K...',
    '............',
    '............',
  ],
  // шоколад: плитка, наполовину в обертке
  chocolate: [
    '............',
    '.KKKKKKKKKK.',
    '.KHHMHHMHHK.',
    '.KHHMHHMHHK.',
    '.KMMMMMMMMK.',
    '.KHHMHHMHHK.',
    '.KGGGGGGGGK.',
    '.KXXXXXXXXK.',
    '.KXWWWWWWXK.',
    '.KXXXXXXXXK.',
    '.KKKKKKKKKK.',
    '............',
  ],
  // лепешка: круглая, толстый край, узор в середине
  flatbread: [
    '............',
    '............',
    '...KKKKKK...',
    '.KKTTTTTTKK.',
    'KTTUUUUUUTTK',
    'KTUUTUUTUUTK',
    'KTUTUUUUTUTK',
    'KTUUTUUTUUTK',
    'KTTUUUUUUTTK',
    '.KKTTTTTTKK.',
    '...KKKKKK...',
    '............',
  ],
  // сырок: глазированный брусок в синей обертке, откушен край
  curd: [
    '............',
    '............',
    '............',
    '.KKKKKKKKK..',
    'KBWBBWBKHHK.',
    'KBWBBWBKHKWK',
    'KBWBBWBKHWWK',
    'KBWBBWBKHKWK',
    'KBWBBWBKHHK.',
    '.KKKKKKKKK..',
    '............',
    '............',
  ],
};

// значки разделов в шапке, та же сетка 12x12
const NAV = {
  stats: [
    '............',
    '.........KK.',
    '.........KK.',
    '.....KK..KK.',
    '.....KK..KK.',
    '.KK..KK..KK.',
    '.KK..KK..KK.',
    '.KK..KK..KK.',
    '.KK..KK..KK.',
    'KKKKKKKKKKKK',
    '............',
    '............',
  ],
  // питание: вилка и нож
  food: [
    '.K.K.K...K..',
    '.K.K.K..KK..',
    '.K.K.K..KK..',
    '.KKKKK..KK..',
    '..KKK...KK..',
    '...K....KK..',
    '...K.....K..',
    '...K.....K..',
    '...K.....K..',
    '...K.....K..',
    '...K.....K..',
    '............',
  ],
  rules: [
    '............',
    '..KKKKKKKK..',
    '..KOKWWWWK..',
    '..KOKWKKWK..',
    '..KOKWWWWK..',
    '..KOKWKKWK..',
    '..KOKWWWWK..',
    '..KOKWKKWK..',
    '..KOKWWWWK..',
    '..KKKKKKKK..',
    '............',
    '............',
  ],
  menu: [
    '............',
    '............',
    '.KKKKKKKKKK.',
    '.KKKKKKKKKK.',
    '............',
    '.KKKKKKKKKK.',
    '.KKKKKKKKKK.',
    '............',
    '.KKKKKKKKKK.',
    '.KKKKKKKKKK.',
    '............',
    '............',
  ],
};

// бриллиант 11x9: цветной получен, пустой нет
const GEM = [
  '..KKKKKKK..',
  '.KWWCCCCCK.',
  'KWCCCCCCCSK',
  'KCCCCCCCSSK',
  '.KCCCCCSSK.',
  '..KCCCSSK..',
  '...KCSSK...',
  '....KSK....',
  '.....K.....',
];
// пустое место под бриллиант: контур и пергамент
const GEM_EMPTY = { K: '#b79d68', W: '#e7d2a4', C: '#e7d2a4', S: '#e7d2a4' };

// --- наклейки 16x16 ---------------------------------------------------------

const STICKERS = {
  gems: [
    '................',
    '....KKKKKKKK....',
    '...KWWCCCCCCK...',
    '..KWWCCCCCCCSK..',
    '.KWWCCCCCCCCSSK.',
    '.KWCCCCCCCCCSSK.',
    '.KCCCCCCCCCSSSK.',
    '..KCCCCCCCSSSK..',
    '...KCCCCCSSSK...',
    '....KCCCCSSK....',
    '.....KCCSSK.....',
    '......KCSK......',
    '.......KK.......',
    '................',
    '................',
    '................',
  ],
  sport: [
    '................',
    '................',
    '..KK........KK..',
    '.KOOK......KOOK.',
    'KOOOK......KOOOK',
    'KOOOK......KOOOK',
    'KOOOKKKKKKKKOOOK',
    'KOOOKWWWWWWKOOOK',
    'KOOOKKKKKKKKOOOK',
    'KOOOK......KOOOK',
    'KOOOK......KOOOK',
    '.KOOK......KOOK.',
    '..KK........KK..',
    '................',
    '................',
    '................',
  ],
  read: [
    '................',
    '................',
    '..KKKKK..KKKKK..',
    '.KWWWWWKKWWWWWK.',
    '.KWKKKWKKWKKKWK.',
    '.KWWWWWKKWWWWWK.',
    '.KWKKKWKKWKKKWK.',
    '.KWWWWWKKWWWWWK.',
    '.KWKKKWKKWKKWWK.',
    '.KWWWWWKKWWWWWK.',
    '.KWKKWWKKWWWWWK.',
    '.KWWWWWKKWWWWWK.',
    '.KOOOOOKKOOOOOK.',
    '..KKKKKKKKKKKK..',
    '................',
    '................',
  ],
  cook: [
    '....G....G......',
    '...G....G....G..',
    '....G....G..G...',
    '...G....G....G..',
    '.......KK.......',
    '...KKKKKKKKKK...',
    '..KAAAAAAAAAAK..',
    'KKKKKKKKKKKKKKKK',
    'K.KAIIAAAAAAK..K',
    '..KAIAAAAAAAK...',
    '..KAIAAAAAAAK...',
    '..KAAAAAAAAAK...',
    '..KAAAAAAAAAK...',
    '...KKKKKKKKK....',
    '................',
    '................',
  ],
  // месяц без фастфуда: яблоко
  nofast: [
    '................',
    '.......KK.......',
    '........K.KKK...',
    '........KKNNNK..',
    '...KKKKKKKKKK...',
    '..KXXXXKXXXXXK..',
    '.KXWWXXXXXXXXXK.',
    '.KXWXXXXXXXXXXK.',
    '.KXXXXXXXXXXXXK.',
    '.KXXXXXXXXXXXXK.',
    '.KXXXXXXXXXXXXK.',
    '..KXXXXXXXXXXK..',
    '..KXXXXXXXXXXK..',
    '...KXXXKKXXXK...',
    '....KKK..KKK....',
    '................',
  ],
  // уровень: корона
  level: [
    '................',
    '................',
    '................',
    '.K.....KK.....K.',
    'KYK...KYYK...KYK',
    'KYYK..KYYK..KYYK',
    'KYYYKKYYYYKKYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYXYYYCYYYYXYYK',
    'KYXXXYCCCYYXXXYK',
    'KYYXYYYCYYYYXYYK',
    'KYYYYYYYYYYYYYYK',
    'KKKKKKKKKKKKKKKK',
    '................',
    '................',
    '................',
  ],
};

// --- отрисовка ---------------------------------------------------------------

function paths(rows, palette) {
  const byColor = new Map();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') {
        x += 1;
        continue;
      }
      let run = 1;
      while (row[x + run] === ch) run += 1;
      const d = `M${x} ${y}h${run}v1h-${run}z`;
      byColor.set(ch, (byColor.get(ch) || '') + d);
      x += run;
    }
  });
  let out = '';
  for (const [ch, d] of byColor) out += `<path fill="${palette[ch] || INK}" d="${d}"/>`;
  return out;
}

function render(rows, palette, { scale = 4, cls = '', label = '' } = {}) {
  const h = rows.length;
  const w = rows[0].length;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="px${cls ? ` ${cls}` : ''}" ${a11y} viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges">${paths(rows, palette)}</svg>`;
}

function picture(name, { size = 72, cls = '', label = '' } = {}) {
  const alt = label ? `alt="${label}"` : 'alt=""';
  return `<img class="pic${cls ? ` ${cls}` : ''}" src="assets/sprites/${name}.webp" width="${size}" height="${size}" ${alt} decoding="async" draggable="false">`;
}

/** Имя файла персонажа: неизвестный образ или поза заменяются базовыми. */
export function heroName(who, look = 'base', pose = 'idle') {
  const looks = LOOKS[who] || LOOKS[0];
  const lk = looks.includes(look) ? look : 'base';
  const ps = POSES.includes(pose) ? pose : 'idle';
  return `${WHO[who] || WHO[0]}-${lk}-${ps}`;
}

/** Персонаж в образе и позе: idle, fit, cough, sleep. */
export function hero(who, look = 'base', pose = 'idle', opts = {}) {
  return picture(heroName(who, look, pose), opts);
}

/**
 * Рост рядом друг с другом. Неля нарисована выше Елисея (548 и 513 пикселей в листах),
 * а вместе она около 90% его роста: ее картинка меньше, а коробка той же высоты, подошвы на одной линии.
 * Масштабируется размер картинки, а не transform: без размытия.
 */
export const STATURE = [1, 0.84];

export function heroTogether(who, look = 'base', pose = 'idle', { size = 72, ...opts } = {}) {
  const px = Math.round(size * (STATURE[who] || 1));
  return `<span class="stand" style="--stand: ${size}px">${picture(heroName(who, look, pose), { size: px, ...opts })}</span>`;
}

// Декор нарисован владельцем для fixgaz: assets/src/props.png, нарезка tools/sprites.mjs props.
const PROPS = {
  lantern: [220, 440],
  'leaf-orange': [306, 331],
  'leaf-yellow': [264, 311],
  candle: [268, 372],
};

/** Картинка декора заданной высоты. Декор только украшает, поэтому всегда без подписи. */
export function prop(name, height, cls = '') {
  const [w, h] = PROPS[name];
  const width = Math.round((height * w) / h);
  return `<img class="prop${cls ? ` ${cls}` : ''}" src="assets/props/${name}.webp" width="${width}" height="${height}" alt="" decoding="async" draggable="false">`;
}

export function icon(kind, opts = {}) {
  return render(ICONS[kind] || ICONS.sport, BASE, { scale: 2, ...opts });
}

export function navIcon(name, opts = {}) {
  return render(NAV[name], BASE, { scale: 2, ...opts });
}

export function gem(full, opts = {}) {
  return render(GEM, full ? BASE : { ...BASE, ...GEM_EMPTY }, { scale: 2, ...opts });
}

/** Картинка достижения. */
export function sticker(id, opts = {}) {
  return render(STICKERS[id], BASE, { scale: 3, ...opts });
}

/** Для тестов и превью: все сетки с их ожидаемым размером. */
export function allGrids() {
  const out = [];
  for (const [k, rows] of Object.entries(ICONS)) out.push({ name: `icon ${k}`, rows, w: 12, h: 12 });
  for (const [k, rows] of Object.entries(NAV)) out.push({ name: `nav ${k}`, rows, w: 12, h: 12 });
  for (const [k, rows] of Object.entries(STICKERS)) out.push({ name: `sticker ${k}`, rows, w: 16, h: 16 });
  out.push({ name: 'gem', rows: GEM, w: 11, h: 9 });
  return out;
}

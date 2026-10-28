# Промпты для картинок E&N

Стиль общий для всех картинок: 8-битный пиксель-арт как на листах образов (`assets/src/looks/`). Любой лист образа приложить в генератор как референс стиля.

## Общая квартира (замена комнаты)

Пока на главной стоит комната из fixgaz (замок осенью). Нужна одна общая уютная квартира на двоих: в ней Елисей стоит слева, Неля справа. Формат 3:2, например 1536 на 1024. Файл: `assets/src/room.png`.

```
Pixel art game background, landscape 3:2, a small cozy modern apartment living room for a young couple on an autumn evening, in exactly the same pixel style as the reference image. Warm wooden floor, soft warm walls. Along the back wall from left to right: a tall bookshelf full of colorful books with a reading lamp and a small plant; a compact kitchen corner with a stove, a pot with a little steam, a cutting board and hanging utensils; a window with city lights and rain outside, a few orange leaves on the sill; a rolled-up yoga mat and a pair of small dumbbells on the floor near the right wall. A string of warm fairy lights along the ceiling, a framed photo of two people on the wall, a sleeping cat on a cushion in the corner. All furniture stands along the back wall. The bottom 40 percent is empty wooden floor with a large soft round rug and no objects, where two characters will stand side by side. Warm amber and honey light, cozy and calm, no dark mood. No people, no characters, no text, no UI. Style: 8-bit pixel art, big chunky square pixels, 1-pixel dark outlines, flat colors, limited warm palette, no gradients, no blur.
```

Что проверить: пол внизу свободен, по центру нет мебели, нет людей и надписей. Я уменьшу до 1280 по ширине и подключу вместо `assets/bg/room.webp`.

## Иконка приложения

Сейчас иконка временная: два персонажа из спрайтов на темном фоне. Нужна своя. Квадрат 1024 на 1024, базовые листы обоих приложить как референс. Файл: `assets/src/icon.png`.

```
Pixel art app icon, square 1:1. The same two chibi characters as in the reference images, shown from the chest up, side by side and slightly leaning toward each other: on the left a young man with short brown hair and a swept-up quiff in a blue t-shirt, on the right a young woman with long straight dark brown hair and round thin gold-rimmed glasses in a cream sundress. Both smile. Between their heads one small pixel heart #ff66cf. The two figures fill about 80 percent of the frame. Simple bold shapes that stay readable at very small sizes, few details. Style: 8-bit pixel art, big chunky square pixels, 1-pixel near-black outline #171717, flat colors, at most one shade per color, no gradients, no glow, no shadow. Background: solid flat magenta #ff00ff, nothing else. No text, no letters, no frame, no border.
```

Фон заменю на теплый сам и нарежу 512, 192 и 180 для домашнего экрана и вкладки.

## Зимний образ Елисея

Остальные образы готовы. Это правка базового листа `assets/src/looks/elisey-base.png`: приложить его и попросить поменять только одежду. Файл: `assets/src/looks/elisey-winter.png`.

```
Edit the reference sprite sheet: keep everything exactly the same (the same character, the same four poses in the same 2x2 grid, the same size, the same pixel style, the same face, the same magenta background #ff00ff), change only the clothes. New outfit: a warm dark navy puffer jacket zipped up with a small fur-trimmed hood down on the back, a knitted mustard yellow beanie with a small pompom, his brown bangs still visible from under the beanie at the front, a gray knitted scarf, dark blue jeans, brown winter boots. Top left: standing relaxed, small smile. Top right: flexing both biceps through the jacket, proud grin. Bottom left: hunched and coughing, eyes squeezed shut, small gray cloud next to his head. Bottom right: asleep standing, eyes closed, two tiny letters z above his head. Style: 8-bit NES game sprite on a 32x32 pixel grid, large crisp square pixels, 1-pixel near-black outline #171717, flat colors, no gradients, no anti-aliasing, no glow, no ground shadow. No text labels, no frame, no grid lines. Each pose centered in its cell, same size in all four cells.
```

После этого: `node tools/sprites.mjs look assets/src/looks/elisey-winter.png elisey-winter`, образ `winter` в `LOOKS[0]` (`js/sprites.js`) и подпись «зимний» в `LOOK[0]` (`js/copy.js`).

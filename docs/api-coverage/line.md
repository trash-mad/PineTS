---
layout: default
title: Line
parent: API Coverage
---

## Line

### Styles

| Function                 | Status | Description       |
| ------------------------ | ------ | ----------------- |
| `line.style_arrow_both`  | ✅     | Arrow both style  |
| `line.style_arrow_left`  | ✅     | Arrow left style  |
| `line.style_arrow_right` | ✅     | Arrow right style |
| `line.style_dashed`      | ✅     | Dashed style      |
| `line.style_dotted`      | ✅     | Dotted style      |
| `line.style_solid`       | ✅     | Solid style       |

### Management

| Function        | Status | Description          |
| --------------- | ------ | -------------------- |
| `line.all`      | ✅     | All lines collection |
| `line()`        | ✅     | Casts na to line     |
| `line.copy()`   | ✅     | Copy line            |
| `line.delete()` | ✅     | Delete line          |
| `line.new()`    | ✅     | Create new line (supports both `x, y` and `point` signatures, with `force_overlay`) |

### Getters

| Function           | Status | Description       |
| ------------------ | ------ | ----------------- |
| `line.get_price()` | ✅     | Get line price    |
| `line.get_x1()`    | ✅     | Get x1 coordinate |
| `line.get_x2()`    | ✅     | Get x2 coordinate |
| `line.get_y1()`    | ✅     | Get y1 coordinate |
| `line.get_y2()`    | ✅     | Get y2 coordinate |

### Setters

| Function                  | Status | Description         |
| ------------------------- | ------ | ------------------- |
| `line.set_color()`        | ✅     | Set line color      |
| `line.set_extend()`       | ✅     | Set extend mode     |
| `line.set_first_point()`  | ✅     | Set first point     |
| `line.set_second_point()` | ✅     | Set second point    |
| `line.set_style()`        | ✅     | Set line style      |
| `line.set_width()`        | ✅     | Set line width      |
| `line.set_x1()`           | ✅     | Set x1 coordinate   |
| `line.set_x2()`           | ✅     | Set x2 coordinate   |
| `line.set_xloc()`         | ✅     | Set x-location      |
| `line.set_xy1()`          | ✅     | Set xy1 coordinates |
| `line.set_xy2()`          | ✅     | Set xy2 coordinates |
| `line.set_y1()`           | ✅     | Set y1 coordinate   |
| `line.set_y2()`           | ✅     | Set y2 coordinate   |

# Отчёт сборки

## Таблица показывает фактический режим сборки маршрутов и размер загрузки по результатам сборки.

### Загрузка в начале

| Маршрут             | Способ сборки | Размер загрузки (без сжатия) |
| ------------------- | ------------- | ---------------------------: |
| `/`                 | Dynamic       |                     474.6 KB |
| `/_not-found`       | Static        |                     455.8 KB |
| `/about`            | Static        |                     455.8 KB |
| `/districts`        | Dynamic       |                     456.7 KB |
| `/districts/[slug]` | Dynamic       |                     485.1 KB |
| `/help`             | Static        |                     455.8 KB |
| `/listings`         | Dynamic       |                     485.1 KB |
| `/listings/[id]`    | Dynamic       |                     482.7 KB |
| `/ui-kit`           | Static        |                     468.2 KB |

Размер взят по `firstLoadUncompressedJsBytes` из `.next/diagnostics/route-bundle-stats.json`.

### Загрузка в конце

| Маршрут             | Способ сборки     | Размер загрузки (без сжатия) |
| ------------------- | ----------------- | ---------------------------: |
| `/`                 | Partial Prerender |                     476.2 KB |
| `/_not-found`       | Partial Prerender |                     457.4 KB |
| `/about`            | Partial Prerender |                     457.4 KB |
| `/districts`        | Partial Prerender |                     458.3 KB |
| `/districts/[slug]` | Partial Prerender |                     486.7 KB |
| `/help`             | Partial Prerender |                     457.4 KB |
| `/listings`         | Partial Prerender |                     486.7 KB |
| `/listings/[id]`    | Partial Prerender |                     484.8 KB |
| `/ui-kit`           | Partial Prerender |                     469.8 KB |

Размер взят по `firstLoadUncompressedJsBytes` из `.next/diagnostics/route-bundle-stats.json`.

### Загрузка после завершения недели

| Маршрут             | Способ сборки     | Размер загрузки (без сжатия) |
| ------------------- | ----------------- | ---------------------------: |
| `/`                 | Partial Prerender |                     476.2 KB |
| `/_not-found`       | Partial Prerender |                     457.4 KB |
| `/about`            | Partial Prerender |                     457.4 KB |
| `/districts`        | Partial Prerender |                     458.3 KB |
| `/districts/[slug]` | Partial Prerender |                     486.7 KB |
| `/help`             | Partial Prerender |                     457.4 KB |
| `/listings`         | Partial Prerender |                     592.3 KB |
| `/listings/[id]`    | Partial Prerender |                     588.2 KB |
| `/ui-kit`           | Partial Prerender |                     469.8 KB |

Размер взят по `firstLoadUncompressedJsBytes` из `.next/diagnostics/route-bundle-stats.json`.

Размер JavaScript после релиза 7 увеличился по сравнению с замером во вторник, поскольку после него в приложение была добавлена новая функциональность.

Код галереи вынесен в динамический импорт и не загружается при первой загрузке страницы объявления.

## Контроль динамических маршрутов

### Без `cookies()` в корневой `layout`

| Страница         | Режим             | Причина                                                                     |
| ---------------- | ----------------- | --------------------------------------------------------------------------- |
| `/`              | Partial Prerender | `Header` содержит `RecentlyViewed`, который читает cookie через `cookies()` |
| `/about`         | Partial Prerender | `Header` содержит `RecentlyViewed`, который читает cookie через `cookies()` |
| `/districts`     | Partial Prerender | `Header` содержит `RecentlyViewed`, который читает cookie через `cookies()` |
| `/listings`      | Partial Prerender | `Header` содержит `RecentlyViewed`, который читает cookie через `cookies()` |
| `/listings/[id]` | Partial Prerender | `Header` содержит `RecentlyViewed`, который читает cookie через `cookies()` |

### С `cookies()` в корневой `layout`

`Next.js` не смог завершить prerender и выдал ошибку "Next.js encountered uncached or runtime data during prerendering".

## Вывод

После добавления блока «Вы смотрели» чтение cookie вынесено в отдельный серверный компонент `RecentlyViewed`, который подключён к `Header` через `Suspense`. В результате маршруты перешли в режим Partial Prerender: статическая часть страницы по-прежнему может быть подготовлена заранее, а компонент, использующий cookie, рендерится динамически.

Размер JavaScript при этом изменился незначительно: для большинства маршрутов увеличение ~1.6 KB.

Контрольный эксперимент с переносом `cookies()` в корневой `layout` показал, что чтение данных runtime в данном случае ломает prerendering. Поэтому чтение cookie вынесено в отдельный серверный компонент.

## Архитектура управления состоянием

| Вид состояния                   | Инструмент     | Пример в проекте                                                           |
| ------------------------------- | -------------- | -------------------------------------------------------------------------- |
| Серверное состояние             | TanStack Query | Списки объявлений недвижимости, идентификаторы избранного                  |
| Глобальное состояние интерфейса | Zustand        | Вид отображения сетки каталога, история недавно просмотренных объектов     |
| Параметры фильтрации и поиска   | URL            | Фильтры и сортировка                                                       |
| Локальное состояние компонентов | React Hooks    | Открытые карточки деталей заявки, буферные значения полей форм до отправки |

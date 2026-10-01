# Docker-образ витрины

## Сборка образа

Выбран путь **сборки при запущенном `api`**. При сборке Next.js заранее рендерит страницы и обращается к API: `generateStaticParams` в `/listings/[id]`, кешируемые (`"use cache"`) данные главной, каталога и районов, `sitemap.xml`. Так карточки объявлений собираются заранее, а код приложения не меняется.

Путь «пустой список при недоступном API» не подходит: с `cacheComponents: true` Next 16 завершает сборку ошибкой, если `generateStaticParams` вернул пустой массив (`empty-generate-static-params`).

Порядок:

1. Запустить `api` на порту `3000` (`npm run start:dev` в `api/` или контейнер из `api/Dockerfile`).
2. Положить значение `NEXT_BUILD_SECRET` в файл вне репозитория, например `/tmp/next_build_secret`.
3. Из корня репозитория:

```bash
docker build -t realty-web:dev \
  --build-arg API_URL=http://host.docker.internal:3000 \
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3001 \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 \
  --secret id=next_build_secret,src=/tmp/next_build_secret \
  web
```

`host.docker.internal` — адрес основной машины изнутри сборки Docker Desktop. `NEXT_BUILD_SECRET` передаётся как секрет BuildKit: он доступен только на шаге сборки и не попадает ни в слои образа, ни в `docker image history`.

Запуск:

```bash
docker run --rm -p 3001:3001 \
  -e API_URL=http://host.docker.internal:3000 \
  -e REDIS_HOST=host.docker.internal -e REDIS_PORT=6379 \
  -e REVALIDATE_SECRET=... -e NEXT_BUILD_SECRET=... \
  realty-web:dev
```

## Переменные: сборка и запуск

| Переменная                                                                   | Когда читается  | Как передаётся                             |
| ---------------------------------------------------------------------------- | --------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SENTRY_DSN` | при сборке      | `--build-arg`, вшиваются в бандл браузера  |
| `API_URL`                                                                    | сборка и запуск | `--build-arg` для сборки, `-e` для запуска |
| `NEXT_BUILD_SECRET`                                                          | сборка и запуск | `--secret` для сборки, `-e` для запуска    |
| `REVALIDATE_SECRET`, `REDIS_HOST`, `REDIS_PORT`, `SENTRY_*`                  | при запуске     | `-e` / файл окружения, в бандл не попадают |

Значения `NEXT_PUBLIC_*` фиксируются в момент сборки. Образ, собранный с адресом стенда, в прод не выкатывается: для прода собирается отдельный образ со своими `--build-arg`.

## Размер образа

| Сборка                                      | Размер (сжатый) | На диске |
| ------------------------------------------- | --------------: | -------: |
| В один этап (`docker build --target build`) |          522 MB |  1.93 GB |
| Многоэтапная (`output: "standalone"`)       |          100 MB |   440 MB |

В многоэтапном образе только `server.js`, `.next` (сборка и статика), `public` и 13 пакетов, которые Next.js отобрал в `node_modules` для сервера. Исходников, пакетов для разработки и файлов окружения в нём нет.

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

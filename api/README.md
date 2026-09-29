<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Redis

Redis используется для кеша и временных данных приложения.

### Базы Redis

Используются две Redis DB:

- **DB 0** — API: кеш объявлений и районов, блокировки, счётчики попыток входа, rate limiting и tag sets.
- **DB 1** — Web: пользовательские сессии.

### Ключи и TTL

| Ключ                        |  DB | Назначение                                |                 TTL |
| --------------------------- | --: | ----------------------------------------- | ------------------: |
| `listings:*`                |   0 | кеш списка объявлений                     |          300 секунд |
| `districts:*`               |   0 | кеш списка районов                        |        86400 секунд |
| `tag:listings`              |   0 | ключи кеша объявлений для инвалидирования |             без TTL |
| `lock:*`                    |   0 | краткосрочные блокировки                  |           3 секунды |
| `fail:login:*`              |   0 | счётчик неудачных попыток входа           |          900 секунд |
| `block:login:*`             |   0 | блокировка входа                          |          900 секунд |
| `throttler:*`               |   0 | ограничение частоты запросов              | зависит от лимитера |
| `throttler:viewingPublic:*` |   0 | ограничение заявок на просмотр            |          900 секунд |
| `session:*`                 |   1 | пользовательские сессии                   |             30 дней |
| `user-sessions:*`           |   1 | список сессий пользователя                |             30 дней |

`tag:listings` — исключение из правила о TTL. Это служебный набор для инвалидирования кеша, который удаляется вместе с ключами кеша при инвалидировании.

### Перезапуск Redis

Кеш (`listings:*`, `districts:*`) является восстанавливаемым. После перезапуска Redis кеш исчезает, но данные остаются в PostgreSQL и кеш создаётся заново при следующих запросах.

Сессии (`session:*`, `user-sessions:*`) являются невосстанавливаемыми. После перезапуска Redis сохранённые сессии исчезают, поэтому пользователям потребуется авторизоваться заново.

Временные данные (`lock:*`, `fail:login:*`, `block:login:*`, `throttler:*`) также теряются после перезапуска Redis. Они создаются заново по мере необходимости.

### Инвалидирование кеша

Для поиска ключей приложение не использует команду `KEYS`. При необходимости перебора ключей используется `SCAN`.

При инвалидировании ключи кеша удаляются вместе с tag set.

### Отказ Redis

Если Redis недоступен, каталог объявлений продолжает работать: данные загружаются из PostgreSQL.

`/health` показывает доступность Redis и статистику кеша:

- `redis` — доступен ли Redis;
- `cache.hits` — количество попаданий в кеш с момента запуска API;
- `cache.misses` — количество промахов кеша с момента запуска API.

## RabbitMQ — очереди и наблюдаемость

### Проверка нагрузки

| Сценарий                                | Поведение очереди                                   | Ответ API                                             |
| --------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| RabbitMQ остановлен после запуска API   | `/health` показывает `broker: false`;               | Заявка создаётся                                      |
|                                         | API продолжает принимать заявки на просмотр,        |                                                       |
|                                         | ошибка публикации сообщения логируется              |                                                       |
| --------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| 20 заявок подряд, два worker'а          | Все 20 сообщений обработаны;                        | Все 20 запросов успешно завершились                   |
|                                         | после обработки очереди `mail` и `activity` пустые  |                                                       |
| --------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Два worker'а с `prefetch(1)`            | Сообщения распределились между двумя                | Обработка выполняется независимо от отправки письма   |
|                                         | worker-процессами                                   |                                                       |
| --------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Нагрузка на API при публикации          | Запросы последовательно возвращались примерно за    | API не ждёт завершения обработки worker'ом            |
| 20 сообщений                            | 10–20 мс                                            |                                                       |
| --------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |

### Логи worker

Каждое обработанное сообщение оставляет одну итоговую строку с:

- routing key;
- message ID;
- результатом обработки;
- длительностью обработки.

Пример:

`[MAIL] routingKey=viewing.booked messageId=viewing-booked:3061 result=processed duration=10ms`

### Поведение при недоступном RabbitMQ

Если RabbitMQ становится недоступен после запуска API, endpoint создания заявки сохраняет заявку в БД, а ошибка публикации сообщения обрабатывается отдельно.

При запуске API с недоступным RabbitMQ приложение не стартует, поскольку подключение к брокеру требуется при инициализации QueueModule.

## Logdy — просмотр логов

Для локального просмотра логов API, queue worker и Temporal worker используется Logdy.

Logdy собирает логи трёх процессов в одном веб-интерфейсе и позволяет фильтровать их по уровню, процессу и request ID.

Все логи передаются только между процессами на локальной машине.

### Запуск Logdy

Сначала запустите центральный Logdy:

```bash
npm run logdy
```

После запуска веб-интерфейс доступен по адресу:

```text
http://127.0.0.1:8080/
```

### Запуск процессов с Logdy

Каждый процесс запускается в отдельном терминале.

API:

```bash
npm run start:dev:logdy
```

Queue worker:

```bash
npm run start:worker:logdy
```

Temporal worker:

```bash
npm run start:temporal-worker:logdy
```

Все три процесса передают логи в один экземпляр Logdy.

### Обычный запуск без Logdy

Logdy не требуется для обычной работы приложения.

API можно запустить стандартной командой:

```bash
npm run start:dev
```

Queue worker:

```bash
npm run start:worker
```

Temporal worker:

```bash
npm run start:temporal-worker
```

При обычном запуске логи выводятся в терминал в стандартном формате.

### Колонки логов

В Logdy настроены следующие колонки:

| Колонка       | Источник       | Назначение                   |
| ------------- | -------------- | ---------------------------- |
| Time          | `time`         | время записи                 |
| Level         | `level`        | уровень лога                 |
| Process       | `process`      | процесс, создавший запись    |
| Request ID    | `req.id`       | идентификатор HTTP-запроса   |
| Message       | `msg`          | сообщение                    |
| Response time | `responseTime` | время обработки HTTP-запроса |

Для уровня лога числовые значения Pino преобразуются в названия:

| Значение Pino | Уровень |
| ------------: | ------- |
|          `10` | `trace` |
|          `20` | `debug` |
|          `30` | `info`  |
|          `40` | `warn`  |
|          `50` | `error` |
|          `60` | `fatal` |

### Процессы

Каждый процесс имеет собственное имя в поле `process`:

| Процесс         | Значение          |
| --------------- | ----------------- |
| API             | `api`             |
| Queue worker    | `queue-worker`    |
| Temporal worker | `temporal-worker` |

Это позволяет отличать записи разных процессов в общем потоке логов.

### Фильтрация

В Logdy настроены facets для полей `Level` и `Process`.

По уровню можно оставить только сообщения определённого типа, например:

```text
Level → error
```

По процессу можно оставить записи только одного процесса:

```text
Process → api
```

или:

```text
Process → queue-worker
```

или:

```text
Process → temporal-worker
```

### Поиск по Request ID

Для HTTP-запросов API генерируется уникальный request ID.

Он отображается в Logdy в колонке `Request ID`.

Колонка `Request ID` используется как correlation ID в Logdy. Это позволяет связать записи, относящиеся к одному HTTP-запросу.

# Деплой на сервер (Ansible)

Сервер — VPS `realty` (Ubuntu 24.04), сайт — <https://realty-catalog.site>. Все команды ниже запускаются с Mac из папки `deploy/ansible`; адрес сервера, пользователь и ключ берутся из `~/.ssh/config` (`Host realty`).

## Подготовка Mac

```bash
brew install ansible
ssh realty true   # должно завершиться без ошибок
```

Пароль Ansible Vault хранится в связке ключей macOS, его читает `vault-pass.sh`. Создать его один раз — случайный, на экран он не выводится:

```bash
security add-generic-password -a "$USER" -s realty-ansible-vault -w "$(openssl rand -base64 32)"
```

Ansible запрашивает этот пароль при каждом запуске, поэтому запись нужна ещё до появления файла с секретами. Сам файл с секретами (`group_vars/prod/vault.yml`) в git не попадает: репозиторий публичный. Храните его копию и пароль от него (Связка ключей → `realty-ansible-vault`) в менеджере паролей.

## Шаг 1. Базовая настройка сервера

`base.yml` ставит Docker и Compose из пакетов Ubuntu, включает ротацию логов Docker, файрвол (входящие только 22, 80, 443) и файл подкачки 2 ГБ. Повторный запуск ничего не ломает.

```bash
cd deploy/ansible
ansible prod -m ping        # Ansible достучался до сервера: "pong"
ansible-playbook base.yml   # настройка
```

Проверка на сервере:

```bash
ssh realty 'docker compose version'                      # 2.24 или новее
ssh realty 'ufw status'                                  # 22, 80, 443 — ALLOW
ssh realty 'swapon --show'                               # /swapfile 2G
ssh realty 'docker pull postgres:18.6-trixie'            # Docker Hub доступен
ssh realty 'timeout 5 bash -c "</dev/tcp/smtp.yandex.ru/587" && echo smtp ok'
```

Если `docker pull` не проходит (ограничения Docker Hub), впишите зеркало в `group_vars/prod/vars.yml` — `docker_registry_mirrors: ["https://mirror.gcr.io"]` — и запустите `ansible-playbook base.yml` ещё раз.

## Шаг 2. Секреты (Ansible Vault)

Пароли БД и брокера, секреты JWT и ревалидации генерируются, пароль приложения Яндекса и DSN Sentry вписываются в редакторе — в историю терминала они не попадают:

```bash
cd deploy/ansible
{
  for k in postgres_password rabbitmq_password jwt_access_secret jwt_refresh_secret revalidate_secret next_build_secret; do
    echo "vault_$k: $(openssl rand -hex 32)"
  done
  echo 'vault_smtp_pass: "ЗАМЕНИ"'
  echo 'vault_sentry_dsn: "ЗАМЕНИ"'
} | ansible-vault encrypt --output group_vars/prod/vault.yml
EDITOR=nano ansible-vault edit group_vars/prod/vault.yml   # заменить оба ЗАМЕНИ, Ctrl+O, Enter, Ctrl+X
ansible-vault view group_vars/prod/vault.yml | sed 's/:.*/: ***/'   # восемь ключей, без значений
```

Если Ansible спрашивает `Vault password`, вы не в папке `deploy/ansible`: `ansible.cfg` читается только из текущей папки.

Несекретные настройки (домен, тег образов, пользователь БД, SMTP-сервер) — в `group_vars/prod/vars.yml`. `.env` на сервере собирается из обоих файлов при каждом деплое (`roles/app/templates/env.j2`), правки в нём на сервере затираются.

## Шаг 3. Деплой

`deploy.yml` копирует compose-файлы и Caddyfile в `/opt/realty`, пишет `.env`, ставит обёртку `realty-compose` (compose с тремя файлами), скачивает образы по `image_tag` и поднимает стек: инфраструктура → миграции → все сервисы → сброс кеша витрины → регистрация cron-задач в Temporal.

```bash
ansible-playbook deploy.yml
```

Новый релиз — новый `image_tag` в `vars.yml` (хеш merge-коммита в `main`, после того как CI опубликовал образы) и тот же запуск. Откат — прежний тег.

На сервере:

```bash
ssh realty realty-compose ps            # все сервисы, кроме worker и temporal-worker, (healthy)
ssh realty realty-compose logs -f api
```

## Шаг 4. Перенос рабочих данных

Копия базы заливается только в пустую базу, до миграций. Поэтому на первом деплое сначала поднимается одна пустая `postgres`, затем копия, затем полный деплой.

На Mac, из корня репозитория, при запущенном рабочем стеке (команды из README, «Обслуживание»):

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > backup-$(date +%F).sql
docker compose exec -T api tar -C /app/uploads -cf - . > uploads-$(date +%F).tar
```

Файлы в git не попадают (`.gitignore`). Дальше из `deploy/ansible`:

```bash
ansible-playbook deploy.yml -e only_db=true
ansible-playbook restore.yml -e backup=$PWD/../../backup-<дата>.sql -e uploads=$PWD/../../uploads-<дата>.tar
ansible-playbook deploy.yml
```

`restore.yml` отказывается работать, если в базе уже есть таблицы, и удаляет копии с сервера после восстановления.

## Фото объявлений

`picsum.photos` отвечает `403` на российские IP, поэтому на сервере фото из сидов не загружаются. Вместо них — 40 демо-фото из `api/public/demo` (раздаются как `/static/demo/*` через `web`; хост сайта разрешён в `remotePatterns` из `NEXT_PUBLIC_SITE_URL`). Один раз после деплоя образа с этими фото, из корня репозитория:

```bash
ssh realty 'realty-compose exec -T postgres psql -U realty -d realty' < deploy/sql/demo-photos.sql
cd deploy/ansible && ansible-playbook deploy.yml   # сбросить кеш витрины
```

Скрипт меняет только ссылки на picsum и печатает `demo | picsum_left` (ожидается `0` во втором столбце). Исходные ссылки остаются в копии базы, снятой перед переносом.

## Почта

На сервере `MAIL_TRANSPORT=real`. У перенесённых пользователей адреса на настоящих почтовых доменах, поэтому письма адресатам из данных, созданных раньше `MAIL_LEGACY_BEFORE` (пользователи и заявки на просмотр), только пишутся в лог (`Mail to an address from imported data written to the log, not sent`). Зарегистрированные на сайте после этого момента получают настоящие письма. Исключения — `vault_mail_allowed_recipients` в Vault (через запятую), личные адреса в git не попадают.

## Стек на сервере

На сервере работают три compose-файла: `docker-compose.yml`, `docker-compose.prod.yml` и `deploy/docker-compose.server.yml`. Третий добавляет то, что нужно только серверу:

- `caddy` — HTTPS перед `web`: сам получает и продлевает сертификат Let's Encrypt для `SITE_DOMAIN`, перенаправляет `http://` и `www.` на `https://<домен>`. Сертификаты лежат в томе `caddydata`.
- `temporal` — сервер Temporal (`start-dev`) с историей workflow в файле на томе `temporaldata`; без веб-интерфейса, наружу не открыт.
- `temporal-worker` — образ `api` с командой `node dist/temporal/worker.js` и томом `uploads` (задача `cleanup` удаляет фото без объявлений).

`web` наружу не публикуется, к нему ходит только Caddy. В `.env` на сервере: `TEMPORAL_ADDRESS=temporal:7233`, `SITE_DOMAIN`, `SENTRY_DSN`.

Sentry витрины: DSN и окружение для браузера вшиваются при сборке образа (переменная репозитория `NEXT_PUBLIC_SENTRY_DSN`, в CI окружение `production`), серверная часть читает `SENTRY_DSN` и `SENTRY_ENVIRONMENT` (по умолчанию `production`) при запуске.

Docker открывает опубликованные порты контейнеров в обход `ufw`, поэтому в продакшене порт публикует только Caddy (80/443), остальные сервисы доступны лишь внутри сети compose.

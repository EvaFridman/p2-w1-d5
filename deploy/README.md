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

Docker открывает опубликованные порты контейнеров в обход `ufw`, поэтому в продакшене порт публикует только Caddy (80/443), остальные сервисы доступны лишь внутри сети compose.

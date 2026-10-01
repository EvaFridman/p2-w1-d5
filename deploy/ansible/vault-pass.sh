#!/usr/bin/env bash
# Prints the Ansible Vault password from the macOS keychain; Ansible calls it via ansible.cfg.
# The entry is created once (deploy/README.md, "Подготовка Mac").
exec security find-generic-password -a "$USER" -s realty-ansible-vault -w

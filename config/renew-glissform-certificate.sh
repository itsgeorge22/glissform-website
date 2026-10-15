#!/bin/sh
# Install in /etc/letsencrypt/renewal-hooks/deploy/ with mode 0755.
set -eu

if [ "${RENEWED_LINEAGE:-}" = '/etc/letsencrypt/live/glissform.app' ]; then
    nginx -t
    systemctl reload nginx
fi

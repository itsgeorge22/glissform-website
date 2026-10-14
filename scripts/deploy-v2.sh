#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

test "$(git branch --show-current)" = 'codex/homepage-v2' || { echo 'Deploy v2 only from codex/homepage-v2.' >&2; exit 1; }
test -z "$(git status --porcelain)" || { echo 'Commit the approved v2 changes before deployment.' >&2; exit 1; }
commit=$(git rev-parse HEAD)
npm run build:v2
npm run test:deploy:v2

key="${GLISSFORM_VPS_KEY:-$HOME/.ssh/id_ed25519_glissform_vps}"
ssh_options=(-i "$key" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=config/production-known-hosts)
host=root@159.194.226.154
stage=$(mktemp -d)
remote_stage=''
cleanup() {
  rm -rf -- "$stage"
  if [[ "$remote_stage" =~ ^/tmp/glissform-v2\.[A-Za-z0-9]+$ ]]; then
    ssh "${ssh_options[@]}" "$host" "rm -rf -- '$remote_stage'" || true
  fi
}
trap cleanup EXIT

tar -czf "$stage/build.tar.gz" -C dist-v2 index.html assets models
remote_stage=$(ssh "${ssh_options[@]}" "$host" 'mktemp -d /tmp/glissform-v2.XXXXXXXX')
[[ "$remote_stage" =~ ^/tmp/glissform-v2\.[A-Za-z0-9]+$ ]] || { echo 'Unexpected staging directory.' >&2; exit 1; }
scp "${ssh_options[@]}" scripts/receive-v2-deploy.py "$host:$remote_stage/receive.py"
ssh "${ssh_options[@]}" "$host" "python3 '$remote_stage/receive.py' '$commit'" < "$stage/build.tar.gz"
curl --fail --silent --show-error "https://glissform.app/v2/deployment.json?commit=$commit" | python3 -c 'import json, sys; data=json.load(sys.stdin); assert data["commit"] == sys.argv[1] and data["path"] == "/v2/"; print("Verified https://glissform.app/v2/ at " + data["commit"])' "$commit"

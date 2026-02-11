#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f "$SCRIPT_DIR/../.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/../.env"
  set +a
fi

NETWORK="${ALEO_NETWORK:-testnet}"
ENDPOINT="${ALEO_ENDPOINT:-https://api.explorer.provable.com/v1}"

if ! command -v leo >/dev/null 2>&1; then
  echo "leo CLI not found in PATH"
  exit 1
fi

rm -rf build
leo build --network "$NETWORK" --endpoint "$ENDPOINT"

if [ -z "${ALEO_PRIVATE_KEY:-}" ]; then
  echo "ALEO_PRIVATE_KEY is not set. Export it or put it in contracts/.env"
  exit 1
fi

leo deploy --private-key "$ALEO_PRIVATE_KEY" --network "$NETWORK" --endpoint "$ENDPOINT" --broadcast --yes

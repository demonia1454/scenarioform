#!/usr/bin/env bash
set -euo pipefail
plugin_dir="$(cd "$(dirname "$0")/.." && pwd)"
for file in "$plugin_dir"/desktop/js/*.js; do node --check "$file"; done
for file in "$plugin_dir"/tests/*_regression.js "$plugin_dir"/tests/security_guards.js; do
    node "$file"
done
bash "$plugin_dir/tests/static_checks.sh"
echo 'Suite complète R122 étape 9 : OK'

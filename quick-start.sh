#!/usr/bin/env bash
# Builds the extension from a fresh checkout and installs it into VS Code
# and/or VSCodium. Safe to re-run: dependencies are only reinstalled when
# missing or out of date, and the .vsix is always rebuilt from current sources.
#
# Usage:
#   ./quick-start.sh              install deps if needed, build, package, install
#   ./quick-start.sh --no-install build and package only
#
# Afterwards, fully restart VS Code (or run "Developer: Reload Window").
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

do_install=1
case "${1:-}" in
    "") ;;
    --no-install) do_install=0 ;;
    -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "quick-start.sh: unknown argument '$1'" >&2; exit 2 ;;
esac

for tool in node npm; do
    command -v "$tool" >/dev/null 2>&1 || {
        echo "quick-start.sh: '$tool' not found (need Node 20+ and npm on PATH)" >&2
        exit 1
    }
done

node_major=$(node -p 'process.versions.node.split(".")[0]')
if (( node_major < 20 )); then
    echo "quick-start.sh: Node $(node -v) is too old (need 20+)" >&2
    exit 1
fi

# node_modules/.package-lock.json is npm's record of what was installed; if it
# is missing or older than package-lock.json (or package.json), (re)install.
marker=node_modules/.package-lock.json
if [[ ! -f "$marker" || package-lock.json -nt "$marker" || package.json -nt "$marker" ]]; then
    echo "==> installing dependencies (npm ci)"
    npm ci
else
    echo "==> dependencies up to date"
fi

echo "==> typecheck, lint, grammar tests"
npm test

echo "==> packaging (bundle + vsce package)"
version=$(node -p 'require("./package.json").version')
name=$(node -p 'require("./package.json").name')
vsix="$name-$version.vsix"
rm -f "$vsix"
npm run vsix
[[ -f "$vsix" ]] || { echo "quick-start.sh: expected $vsix was not produced" >&2; exit 1; }
echo "==> built $vsix"

if (( ! do_install )); then
    echo "==> --no-install given, skipping install"
    exit 0
fi

installed=0
for cli in code codium; do
    if command -v "$cli" >/dev/null 2>&1; then
        echo "==> installing into $cli"
        "$cli" --install-extension "$vsix" --force
        installed=1
    fi
done

if (( ! installed )); then
    echo "quick-start.sh: neither 'code' nor 'codium' found on PATH; install manually with:" >&2
    echo "    code --install-extension $PWD/$vsix" >&2
    exit 1
fi

echo "==> done - restart VS Code (or Developer: Reload Window) to load it"
echo "    Language server / debugger need wyrm-lsp / wyrm-dap from wypoc (optional; highlighting works without)."

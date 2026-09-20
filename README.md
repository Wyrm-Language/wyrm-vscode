# wyrm-vscode

TextMate grammar (syntax highlighting) for `.wy` / `.wyrm` files, derived
from the canonical `wyrm` grammar (`wyrm/doc/grammar.md`), plus an LSP client
that spawns `wyrm-lsp` (from the `wypoc` Python proof of concept), which uses wypoc's own
tokenizer/parser as the sole source of truth for:

- **diagnostics** - parse errors as red squiggles while you type;
- **outline** (`documentSymbol`) - classes, methods, slots, functions;
- **go-to-definition**, following `import` statements across files;
- **hover** - a declaration's signature and where it came from;
- **completion**, triggered on `.` (slots), `::` (module members), `!` and
  `@` (message selectors), or while typing a plain name (locals, then
  module level, then imports, then builtins and keywords).

A `wyrm` debug adapter type spawns `wyrm-dap` (also from `wypoc`) for real
breakpoint/step debugging - see "Debugging" below.

## Development

Requires Node 20+.

```sh
npm install
npm test                # typecheck + eslint + grammar tests
npm run check:drift     # compare grammar with ../wyrm/wy/wyrm/tokenizer.wy
npm run vsix            # build dist/ and package wyrm-vscode-<version>.vsix
code --install-extension --force wyrm-vscode-<version>.vsix
```

For day-to-day iteration open this folder in VS Code and press **F5**: it
builds with esbuild in watch mode and launches an Extension Development Host
with the current sources - no packaging needed.

`tsc` only typechecks; `esbuild.mjs` bundles `src/extension.ts` and
`vscode-languageclient` into `dist/extension.js`, which is what the manifest's
`main` points at and all the `.vsix` ships.

The language server (`wyrm-lsp`) and debug adapter (`wyrm-dap`) are separate
executables from the `wypoc` proof of concept (`pip install -e ".[lsp]"` in that
repo); this extension only spawns them. Syntax highlighting works without them.

### Grammar tests and drift

`test/grammar/*.wy` are `vscode-tmgrammar-test` scope assertions for the
TextMate grammar. The canonical language definition lives in the `wyrm`
repository (`doc/grammar.md`, `wy/wyrm/tokenizer.wy`);
`scripts/check-drift.mjs` fails if a hard keyword or operator symbol declared
there is not covered here. Pass the path or set `WYRM_REPO` if `wyrm` is not
a sibling directory. Grammar prose changes still need a human read.

## Files

- `package.json` — extension manifest: registers the `wyrm` language, the
  `wyrm-lang` grammar, the `wyrm.*` settings and commands, the `wyrm` debug
  adapter type, and the `vscode-languageclient` dependency.
- `language-configuration.json` — comments, brackets, auto-closing pairs.
- `syntaxes/wyrm.tmLanguage.json` — TextMate grammar (tokenization rules).
- `src/extension.ts` — activation entry point: server lifecycle (start,
  restart on a settings change, stop), command registration, "run this file".
- `src/config.ts` — every `wyrm.*` setting read/write, and the resolution
  rules that turn them into an executable to spawn and an environment to
  spawn it in. The language server, the debug adapter, and the run
  terminal all go through here.
- `src/interpreter.ts` — interpreter discovery, the picker, the status bar item.
- `src/modulePath.ts` — the `WYRM_PATH` folder dialog and list editor.
- `src/debug.ts` — the `wyrm` debug adapter type: how a launch
  configuration is resolved (including "F5 with nothing configured" ->
  debug the active file) and how `wyrm-dap` is started for a session.
- `esbuild.mjs` / `tsconfig.json` — bundle to `dist/extension.js` (the `main`
  in package.json) / typecheck only. `node_modules/` and `dist/` are gitignored.
- `test/grammar/`, `scripts/check-drift.mjs` — see "Grammar tests and drift".

## Settings

All settings are written to the **workspace** when a folder is open (a
search path and an interpreter are properties of the project, not of you),
and to user settings otherwise. Anywhere a path is accepted,
`${workspaceFolder}` and a leading `~` are expanded, and a path with a
separator in it resolves against the first workspace folder — the extension
does that substitution itself, since VS Code only does it for free in
built-in contexts like `launch.json`.

| Setting | What it does |
| --- | --- |
| `wyrm.interpreterPath` | The `wyrm` to run files with. Empty = auto-detect (`${workspaceFolder}/.venv/bin/wyrm`, then `PATH`). |
| `wyrm.modulePath` | Directories searched for `import`ed modules, in order — passed to both the interpreter and the language server as `WYRM_PATH`. |
| `wyrm.modulePathInheritEnvironment` | Append the `WYRM_PATH` VS Code was launched with to `wyrm.modulePath` rather than replacing it (default `true`). |
| `wyrm.lsp.serverPath` | The `wyrm-lsp` to spawn. Empty = auto-detect (see below). |
| `wyrm.lsp.enable` | `false` disables the language server entirely (syntax highlighting still works via the grammar alone). |
| `wyrm.dap.serverPath` | The `wyrm-dap` to spawn for debugging. Empty = auto-detect, same rule as `wyrm.lsp.serverPath` below. |

## Commands

- **Wyrm: Select Interpreter** — a quick-pick over every `wyrm` found in
  the workspace `.venv`, `$VIRTUAL_ENV` and `PATH`, plus **Browse…** for a
  file dialog and a way back to auto-detection. Also reachable by clicking
  the status bar item, which shows the interpreter in effect and the
  `WYRM_PATH` it will run with while a `.wy` file is open.
- **Wyrm: Add Folder to Module Search Path (WYRM_PATH)** — folder dialog,
  appends what you pick. Also on the explorer's folder context menu.
- **Wyrm: Edit Module Search Path (WYRM_PATH)** — lists the entries with
  the location each resolves to, with per-entry buttons to remove one or
  move it earlier in the search order, plus rows to add a folder or open
  the raw settings UI.
- **Wyrm: Run Current File** — saves and runs the active file with the
  selected interpreter in a terminal carrying `WYRM_PATH`. Also the ▷ button
  in the editor title bar.
- **Wyrm: Debug Current File** — saves and starts a debug session for the
  active file (breakpoints, stepping, variable inspection - see
  "Debugging" below). Also the debug-icon button next to Run in the editor
  title bar.
- **Wyrm: Restart Language Server**.

Changing any of the settings above restarts the server automatically: it
reads `WYRM_PATH` from its environment at spawn time (via
`wypoc/wyrm_modules.py`, exactly as the interpreter does), so a jump the
editor offers is a jump the interpreter would make — but only a restart
re-reads it.

## Language server

`src/config.ts` looks for the `wyrm-lsp` executable in this order:

1. the `wyrm.lsp.serverPath` setting, if set;
2. the `wyrm-lsp` sitting next to `wyrm.interpreterPath` — picking an
   interpreter out of a venv should get you that venv's server;
3. `${workspaceFolder}/.venv/bin/wyrm-lsp` — the wypoc dev layout
   (what `pip install -e ".[lsp]"` in wypoc produces);
4. `wyrm-lsp` on `PATH`.

The client declares no capabilities of its own, so the feature set is
whatever the server advertises - including which characters trigger
completion. What the server still lacks is **references** and **rename**;
see `wypoc/README.md`'s "Known gaps" for why (they need a reverse index over
the whole workspace, not just the files reachable through imports).

Completion answers from the last version of a document that parsed, so it
keeps working mid-identifier - which is exactly when the file is invalid and
when you want it. Slot completion after `.` offers every slot it knows about
rather than one class's: there is no type inference, so narrowing would mean
guessing. Each candidate's detail names the class it came from.

## Debugging

Click the gutter to set a breakpoint, then either **Wyrm: Debug Current
File** (the debug-icon button next to Run, or the command) or plain **F5**
(which, with no `launch.json` yet, debugs the active file the same way -
`src/debug.ts`'s `WyrmDebugConfigurationProvider` supplies the fallback).
Both save the file first, the same as Run does.

`wyrm-dap` (`wypoc/dap/`) is a from-scratch minimal DAP adapter, not a
wrapper around `pdb` or similar - it instruments wypoc's own tree-walking
evaluator directly, so breakpoints/stepping/variables see wyrm's own scopes
and call stack, not Python's. It supports breakpoints (by line), step
over/into/out, pause, and inspecting locals/closure/globals at any frame,
including a real (wyrm-level) stack trace on an uncaught error. It does
*not* yet support: conditional breakpoints, watch expressions or the debug
console's `evaluate`, expanding a structured value (list/dict/instance) in
the Variables view, or attaching to an already-running process (launch
only).

`src/config.ts` looks for `wyrm-dap` the same way it looks for `wyrm-lsp`
(see "Language server" below): the `wyrm.dap.serverPath` setting, then next
to `wyrm.interpreterPath`, then this repo's own `.venv` layout, then PATH.
A launch configuration's `args` (an array of strings) and `stopOnEntry`
(boolean) are optional; `program` defaults to `${file}` when omitted, which
is what makes the auto-generated "Wyrm: Debug Current File" configuration
work without editing it.

## Known gaps

The spec itself is still in flux in a few places (constructor syntax,
`elif`/`else` are not shown explicitly — see `wyrm/doc/grammar.md`). The grammar highlights on a best-effort
basis and does not attempt indentation-aware layout tokenization —
TextMate grammars are regex/line based and cannot reproduce the
Haskell-style layout rule; block structure highlighting relies on the
brace form and on `language-configuration.json`'s indent heuristics.

# Wyrm for VS Code

Language support for [Wyrm](https://wyrm-lang.com) (`.wy`, `.wyrm`): syntax highlighting,
plus diagnostics, navigation, completion, running and debugging through the Wyrm
language server and debug adapter.

## Features

- **Syntax highlighting** from a TextMate grammar that follows the canonical language
  definition (`doc/grammar.md` in the [wyrm](https://codeberg.org/wyrm-lang/wyrm)
  repository). Works on its own, with nothing else installed.
- With **`wyrm-lsp`** installed:
  - **diagnostics**: parse errors as squiggles while you type;
  - **outline** (`documentSymbol`): classes, methods, slots, functions;
  - **go to definition**, following `import` statements across files;
  - **hover**: a declaration's signature and where it came from;
  - **completion**, triggered on `.` (slots), `::` (module members), `!` and `@` (message
    selectors), or while typing a plain name (locals, then module level, then imports,
    then builtins and keywords).
- **Run** the current file in a terminal, and **debug** it with breakpoints and stepping
  through **`wyrm-dap`**.

## Requirements

- VS Code 1.91 or newer.
- For everything beyond highlighting: `wyrm-lsp`, `wyrm-dap` and the `wyrm` interpreter
  from [wypoc](https://github.com/Wyrm-Language/wypoc), the Python implementation of Wyrm
  (`pip install -e ".[lsp]"` in a wypoc checkout). The extension only spawns them; see
  [Language server](#language-server) for where it looks.

## Settings

All settings are written to the **workspace** when a folder is open (a search path and an
interpreter are properties of the project, not of you), and to user settings otherwise.
Anywhere a path is accepted, `${workspaceFolder}` and a leading `~` are expanded, and a path
with a separator in it resolves against the first workspace folder.

| Setting | What it does |
| --- | --- |
| `wyrm.interpreterPath` | The `wyrm` to run files with. Empty = auto-detect (`${workspaceFolder}/.venv/bin/wyrm`, then `PATH`). |
| `wyrm.modulePath` | Directories searched for `import`ed modules, in order — passed to both the interpreter and the language server as `WYRM_PATH`. |
| `wyrm.modulePathInheritEnvironment` | Append the `WYRM_PATH` VS Code was launched with to `wyrm.modulePath` rather than replacing it (default `true`). |
| `wyrm.lsp.serverPath` | The `wyrm-lsp` to spawn. Empty = auto-detect (see [Language server](#language-server)). |
| `wyrm.lsp.enable` | `false` disables the language server entirely (highlighting still works). |
| `wyrm.dap.serverPath` | The `wyrm-dap` to spawn for debugging. Empty = auto-detect, the same way as `wyrm-lsp`. |

Changing any of these restarts the language server automatically. It reads `WYRM_PATH` when
it starts and resolves imports exactly as the interpreter does, so a jump the editor offers is
a jump the interpreter would make.

## Commands

- **Wyrm: Select Interpreter**: a quick pick over every `wyrm` found in the workspace
  `.venv`, `$VIRTUAL_ENV` and `PATH`, plus **Browse…** and a way back to auto-detection.
  Also reachable from the status bar item, which shows the interpreter in effect and the
  `WYRM_PATH` it will run with while a `.wy` file is open.
- **Wyrm: Add Folder to Module Search Path (WYRM_PATH)**: folder dialog; appends what you
  pick. Also on the explorer's folder context menu.
- **Wyrm: Edit Module Search Path (WYRM_PATH)**: lists the entries with the location each
  resolves to, with buttons to remove one or move it earlier, plus rows to add a folder or
  open the settings UI.
- **Wyrm: Run Current File**: saves and runs the active file with the selected interpreter
  in a terminal carrying `WYRM_PATH`. Also the ▷ button in the editor title bar.
- **Wyrm: Debug Current File**: saves and starts a debug session for the active file. Also
  the debug button next to Run in the editor title bar.
- **Wyrm: Restart Language Server**.

## Language server

The extension looks for the `wyrm-lsp` executable in this order:

1. the `wyrm.lsp.serverPath` setting, if set;
2. the `wyrm-lsp` next to `wyrm.interpreterPath`, so picking an interpreter from a venv
   gets you that venv's server;
3. `${workspaceFolder}/.venv/bin/wyrm-lsp`, the layout `pip install -e ".[lsp]"` produces;
4. `wyrm-lsp` on `PATH`.

The client declares no capabilities of its own, so the feature set is whatever the server
advertises, including which characters trigger completion. The server doesn't support
**references** or **rename** yet.

Completion answers from the last version of a document that parsed, so it keeps working
mid-identifier. Slot completion after `.` offers every slot it knows about rather than one
class's: there is no type inference, so narrowing would mean guessing. Each candidate's
detail names the class it came from.

## Debugging

Click the gutter to set a breakpoint, then run **Wyrm: Debug Current File** or press **F5**.
With no `launch.json`, F5 debugs the active file the same way. Both save the file first.

`wyrm-dap` drives wypoc's evaluator directly, so breakpoints, stepping and variables see
Wyrm's own scopes and call stack. It supports line breakpoints, step over/into/out, pause,
and inspecting locals, closure and globals at any frame, including a Wyrm-level stack trace
on an uncaught error. It does *not* yet support conditional breakpoints, watch expressions
or the debug console's `evaluate`, expanding a structured value in the Variables view, or
attaching to a running process (launch only).

`wyrm-dap` is found the same way as `wyrm-lsp`: the `wyrm.dap.serverPath` setting, then next
to `wyrm.interpreterPath`, then the workspace `.venv`, then `PATH`. In a launch
configuration, `args` (an array of strings) and `stopOnEntry` (boolean) are optional, and
`program` defaults to `${file}`.

## Known limitations

- Highlighting is best effort. TextMate grammars are regex and line based, so they can't
  follow Wyrm's offside rule (indentation-based blocks); indentation comes from
  `language-configuration.json`'s heuristics.
- The language is still evolving, and the grammar may trail the canonical definition in
  places.

## Development

Requires Node 20+.

```sh
npm install
npm test                # typecheck + eslint + grammar tests
npm run vsix            # build dist/ and package wyrm-vscode-<version>.vsix
code --install-extension wyrm-vscode-<version>.vsix --force
```

`./quick-start.sh` does all of that in one go, for VS Code and VSCodium.

For day-to-day work, open this folder in VS Code and press **F5**: it builds with esbuild in
watch mode and launches an Extension Development Host with the current sources.

`tsc` only typechecks; `esbuild.mjs` bundles `src/extension.ts` and `vscode-languageclient`
into `dist/extension.js`, which is the manifest's `main` and all the `.vsix` ships.

`test/grammar/*.wy` are `vscode-tmgrammar-test` scope assertions for the TextMate grammar.
Every grammar rule you touch needs one. Keep the grammar in step with `doc/grammar.md` and
`src/embed/wyrm/tokenizer.wy` in the wyrm repository.

| File | What it is |
| --- | --- |
| `package.json` | manifest: the `wyrm` language, grammar, settings, commands and debug adapter type |
| `language-configuration.json` | comments, brackets, auto-closing pairs, indentation |
| `syntaxes/wyrm.tmLanguage.json` | the TextMate grammar |
| `src/extension.ts` | activation: server lifecycle, command registration, "run this file" |
| `src/config.ts` | every `wyrm.*` setting, and how they resolve to an executable and environment |
| `src/interpreter.ts` | interpreter discovery, the picker, the status bar item |
| `src/modulePath.ts` | the `WYRM_PATH` folder dialog and list editor |
| `src/debug.ts` | the `wyrm` debug adapter type and its "debug the active file" fallback |

## License

MIT

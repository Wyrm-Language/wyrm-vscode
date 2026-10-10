# Agent Development Guide

VS Code extension for the Wyrm language: TextMate grammar, language configuration, and a
thin client for `wyrm-lsp` / `wyrm-dap` (executables from the `wypoc` repository).
Split out of `wypoc/editors/vscode`. This is *not* the handcrafted `wyrm` repository.

- Canonical language definition: `doc/grammar.md` and `src/embed/wyrm/tokenizer.wy` in the
  `wyrm` repository. Add a `test/grammar/*.wy` assertion for every grammar rule you touch.
- `npm test` must pass before committing. `tsc` typechecks only; esbuild builds `dist/`.
- Keep `syntaxes/wyrm.tmLanguage.json` regex-only: TextMate cannot do offside-rule layout.
- Keep `@types/vscode` pinned to the `engines.vscode` minimum, so the typecheck rejects newer
  APIs. Raise both together, and never below what `vscode-languageclient` requires.

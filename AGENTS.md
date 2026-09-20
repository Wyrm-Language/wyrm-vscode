# Agent Development Guide

VS Code extension for the Wyrm language: TextMate grammar, language configuration, and a
thin client for `wyrm-lsp` / `wyrm-dap` (executables from the `wypoc` repository).
Split out of `wypoc/editors/vscode`. This is *not* the handcrafted `wyrm` repository.

- Canonical language definition: `wyrm/doc/grammar.md` and `wyrm/wy/wyrm/tokenizer.wy`
  (sibling repo, read-only from here). Run `npm run check:drift` after grammar changes
  on either side; add a `test/grammar/*.wy` assertion for every grammar rule you touch.
- `npm test` must pass before committing. `tsc` typechecks only; esbuild builds `dist/`.
- Keep `syntaxes/wyrm.tmLanguage.json` regex-only: TextMate cannot do offside-rule layout.

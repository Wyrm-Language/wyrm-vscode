# Changelog

## 0.1.0 (unreleased)

- Initial split from `wypoc/editors/vscode`.
- Grammar synced with the canonical Wyrm grammar (`doc/grammar.md` and
  `src/embed/wyrm/tokenizer.wy` in the wyrm repository): triple-quoted strings now close on
  `"""`; added `0b` binary literals, `4.` floats, operator symbols (`'+`, `'<=>`, ...),
  `...`, the reserved keywords `emit`/`signal`/`task`/`thread`, and decorators without an
  argument list (`@accept stmt`).
- Requires VS Code 1.91 or newer (the minimum for `vscode-languageclient` 10).

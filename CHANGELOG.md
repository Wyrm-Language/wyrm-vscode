# Changelog

## 0.1.0 (unreleased)

- Initial split from `wypoc/editors/vscode`.
- Grammar synced with the canonical `wyrm` grammar (`wyrm/doc/grammar.md`,
  `wyrm/wy/wyrm/tokenizer.wy`): triple-quoted strings now close on `"""`;
  added `0b` binary literals, `4.` floats, operator symbols (`'+`, `'<=>`, ...),
  `...`, the reserved keywords `emit`/`signal`/`task`/`thread`, and decorators
  without an argument list (`@accept stmt`).

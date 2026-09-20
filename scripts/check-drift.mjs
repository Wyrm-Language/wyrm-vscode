// Compares the TextMate grammar against the canonical wyrm tokenizer.
//
//   node scripts/check-drift.mjs [path/to/wyrm]     (default: $WYRM_REPO or ../wyrm)
//
// Checks every hard keyword and operator-symbol spelling declared in
// wy/wyrm/tokenizer.wy is accounted for in syntaxes/wyrm.tmLanguage.json.
// It is a tripwire, not a proof: prose changes in wyrm/doc/grammar.md still
// need a human read. Exits non-zero on drift.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const wyrm = resolve(process.argv[2] ?? process.env.WYRM_REPO ?? "../wyrm");
const tok = readFileSync(resolve(wyrm, "wy/wyrm/tokenizer.wy"), "utf8");
const grammar = readFileSync("syntaxes/wyrm.tmLanguage.json", "utf8");

const listBody = (name) => {
  const m = tok.match(new RegExp(`^${name} := \\[([\\s\\S]*?)^\\]`, "m"));
  if (!m) throw new Error(`${name} not found in tokenizer.wy`);
  return m[1];
};

const keywords = [...listBody("_HARD_KEYWORDS").matchAll(/\("(\w+)"/g)].map((m) => m[1]);
const opSymbols = [...listBody("_OPERATOR_SYMBOLS").matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const problems = [];

for (const kw of keywords) {
  if (!new RegExp(`[(|]${kw}[|)]`).test(grammar) && !grammar.includes(`\\\\b${kw}\\\\b`)) {
    problems.push(`keyword not highlighted: ${kw}`);
  }
}

// Operator symbols: the grammar's symbol pattern must list each spelling,
// either escaped literally or inside the single-character class.
const symRule = JSON.parse(grammar).repository.symbols.patterns.find((p) =>
  p.name?.includes("symbol.operator"),
);
if (!symRule) {
  problems.push("no operator-symbol rule in repository.symbols");
} else {
  const re = new RegExp(symRule.match);
  for (const op of opSymbols) {
    if (!re.test(`'${op}`) || new RegExp(symRule.match).exec(`'${op}`)[0] !== `'${op}`) {
      problems.push(`operator symbol not matched whole: '${op}`);
    }
  }
}

if (problems.length) {
  console.error(`grammar drift vs ${wyrm}:\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`ok: ${keywords.length} keywords, ${opSymbols.length} operator symbols in sync with ${wyrm}`);

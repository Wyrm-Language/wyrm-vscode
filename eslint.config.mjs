import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", ".vscode-test/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      eqeqeq: "error",
      curly: ["error", "multi-line"],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);

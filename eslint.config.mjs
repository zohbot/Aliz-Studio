import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      ".tools/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      "data/*.json",
      "data/*.json.*.tmp",
      "*.log",
      "qa-*.png"
    ]
  }
];

export default eslintConfig;

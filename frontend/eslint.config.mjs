import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
	]),
	{
		rules: {
			// 1 tab = 4 spaces
			indent: ["error", "tab", { SwitchCase: 1 }],
			// Semicolons mandatory at end of lines
			semi: ["error", "always"],
		},
	},
]);

export default eslintConfig;

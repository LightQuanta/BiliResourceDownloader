import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";


export default [
    { files: ["**/*.{js,mjs,cjs,ts,vue}"] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    {
        // 解决auto-import的报错
        rules: { "no-undef": "off" },
    },
    ...pluginVue.configs["flat/strongly-recommended"],
    {
        // 关闭pages下的命名检查
        files: ["src/pages/**"],
        rules: {
            'vue/multi-word-component-names': 'off',
        }
    },
    { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
];
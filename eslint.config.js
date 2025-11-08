import eslint from "eslint";

export default [
    {
        files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
        ignores: ["vendor/**", "node_modules/**", "public/**"],
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        rules: {
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
        },
    },
];

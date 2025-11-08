import eslint from "eslint";

export default [
    {
        files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        rules: {
            // Add your rules here
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
        },
    },
];

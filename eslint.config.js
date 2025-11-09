import eslint from "eslint";
import babelParser from "@babel/eslint-parser";
import reactPlugin from "eslint-plugin-react";

export default [
    {
        ignores: [
            "vendor/**",
            "node_modules/**",
            "public/**",
            "storage/**",
            "bootstrap/**",
            "*.min.js",
            "public/build/**",
            "**/vendor/**",
            "**/node_modules/**",
        ],
    },
    {
        files: ["**/*.js", "**/*.jsx"],
        languageOptions: {
            parser: babelParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                requireConfigFile: false,
                babelOptions: {
                    presets: ["@babel/preset-react"],
                },
            },
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                process: "readonly",
            },
        },
        plugins: {
            react: reactPlugin,
        },
        rules: {
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];

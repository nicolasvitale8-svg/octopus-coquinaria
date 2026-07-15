import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
    { ignores: ['dist', 'node_modules', 'coverage', 'scripts', '*.config.js', '*.config.ts'] },
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'no-console': ['warn', { allow: ['error'] }],
            // catch {} intencionales (best-effort); regex escapes cosmeticos -> backlog
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-useless-escape': 'warn',
            '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
            // Reglas nuevas del compilador de react-hooks v7: hallazgos reales pero
            // requieren refactor puntual; quedan como warning hasta abordarlos.
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/set-state-in-render': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/preserve-manual-memoization': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/use-memo': 'warn',
        },
    },
    {
        files: ['**/logger*.ts', '**/test/**'],
        rules: { 'no-console': 'off' },
    },
];

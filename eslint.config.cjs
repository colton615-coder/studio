module.exports = [
  // Basic ignore patterns
  { ignores: ["node_modules/**", ".next/**"] },

  // Apply to JS/TS/JSX/TSX files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks')
    },
    rules: {
      // Basic rules kept minimal initially; enable stricter rules iteratively.
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'react/jsx-uses-react': 'off'
    }
  }
]

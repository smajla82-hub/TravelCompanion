# Travel Companion PWA

## Local-first trips and optional sync

Travel Companion remains fully usable without an account: local Trips, itinerary,
import, export, and edits continue to use browser `localStorage` and work offline.
Signing in is optional and adds a separate **Synced & shared trips** section in
My Trips. Local-only Trips are never automatically uploaded or merged.

Use the **Account** tab to create an account, sign in, or log out. The production
API is `https://cestovatel.duckdns.org`; local development may override it with
`VITE_API_BASE_URL`. The server's `ALLOWED_CORS_ORIGIN` is already configured
for `https://smajla82-hub.github.io`, so no server CORS change is required.

Synced Trips use short-lived edit locks. Owners and Editors obtain a lock before
editing and the app renews it while the edit dialog is open. If another member
holds the lock, or a save conflicts, the app shows a message rather than silently
overwriting their change. Owners can create Editor or Viewer invitations and copy
the generated link to share manually. Invitation recipients open the link and
sign in with the invited email before accepting or declining.

Importing existing local Trips into an account is intentionally deferred to
Feature 10.5; the existing local import/export behavior is unchanged.

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

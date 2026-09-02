PROJECT TECH STACK :

| Vrstva        | Volba                                            |
| ------------- | ------------------------------------------------- |
| Jazyk         | ✅ TypeScript                                       |
| UI            | ✅ React                                            |
| Platforma     | ✅ PWA (Progressive Web App) — web + installable   |
| Mobil         | ✅ PWA (žádný nativní obal — Capacitor/Tauri nejsou plánovány) |
| Perzistence   | ✅ Browser storage (localStorage now; IndexedDB when needed) — SQLite/Drizzle nejsou plánovány |
| Stav aplikace | ✅ React state/hooks (lightweight store zavedeme, jen pokud to komplexita vyžádá) |
| Routing       | ✅ React Router                                     |
| Build         | ✅ Vite                                             |
| Import dat    | ✅ XLSX (RoadBook import z Google Sheets exportu)   |
| Testy         | ✅ Vitest (plán, zatím nenasazeno)                  |
| Linting       | ✅ ESLint + Prettier                                |

> Poznámka: Předchozí verze této tabulky uváděla Tauri, Capacitor, SQLite, Drizzle ORM a Zustand jako doporučený stack.
> Projekt se rozhodl pro **PWA cestu** (viz `docs/decisions/ADR-002-PWA-Architecture.md`), takže nativní desktop/mobile obaly a SQL databáze nejsou součástí plánu. Tabulka výše odpovídá aktuálnímu směru.

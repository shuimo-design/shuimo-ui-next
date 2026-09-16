# AGENTS.md

shuimo-ui-next — a rewrite of the ink-wash ("水墨") style component library that supports **both Vue 3 and React 19**. All ink artwork (rice paper, mountains, brush strokes, seals) is generated programmatically as SVG; there are no bitmaps in the repo. Published to npm as `@shuimo-design/{core,vue,react}` (currently `1.0.0-beta.x`). Docs site: shuimo-ui-next.vercel.app (the `playground/` package).

**Read `notes/COMPONENT-CONVENTIONS.md` before writing any component code.** `notes/MIGRATION.md` (old-API → new-API changes) and `notes/PLAN.md` (design decisions) are also authoritative.

## Layout

- `packages/core` — all logic, all styles, the ink engine. Pure TypeScript, **zero framework dependencies**.
- `packages/vue`, `packages/react` — thin shells: templates/bindings only.
- `packages/core/src/styles/manifest.ts` — `COMPONENT_STYLES` registry powering the on-demand `style/<Name>` entries.
- `scripts/` — guard scripts (`check-architecture.ts`, `check-style.ts`, `check-ssr.ts`, `gen-meta.ts`).
- `docs/api/*.json` — **generated** by `pnpm gen:meta`; never hand-edit.
- `notes/` — conventions and plans (Chinese).

## Commands

```sh
pnpm dev                  # playground docs site
pnpm check                # vp check (lint + format via vite-plus/oxfmt)
pnpm fmt                  # format
pnpm typecheck            # all packages (vue uses vue-tsc)
pnpm test                 # all packages; vitest browser mode on real Chromium
pnpm build                # build packages, then gen:meta
pnpm check:arch           # architecture guard
pnpm check:style          # style guard
pnpm check:ssr            # SSR smoke test — consumes dist, run only after build
pnpm attw                 # verify package exports

# focused component tests
pnpm -C packages/vue exec vp test src/components/<kebab>
pnpm -C packages/react exec vp test src/components/<kebab>
```

CI (`.github/workflows/ci.yml`) runs: check → check:arch → check:style → typecheck → test → build → check:ssr → attw. Keep all of these green.

## Toolchain quirks

- pnpm ≥ 12 workspaces; Node ≥ 24.11. Shared dependency versions live in the `catalog:` of `pnpm-workspace.yaml` — write `"catalog:"`, not literal versions.
- Toolchain is **vite-plus** (`vp`): `vp pack` builds, `vp test`, `vp check`, `vp fmt`. `vite` is aliased to `@voidzero-dev/vite-plus-core`; vitest is pinned at 4.1.11 by vite-plus and cannot be bumped alone.
- TypeScript is locked to 5.9.x — vue-tsc 3.3.11 cannot run on TS 7 (no `lib/tsc`).
- Releases use changesets in pre-release mode (`pnpm changeset` / `pnpm version`). The release workflow is disabled until the `RELEASE_ENABLED` repo variable is set — do not "fix" that gate.
- Target browsers: Chrome/Edge 120+, Safari 17+, Firefox 128+.

## Architecture rules (machine-enforced — `pnpm check:arch` / `check:style`)

1. `core` must not import any framework (vue/react/…) or contain `.vue`/`.tsx` files.
2. For any component that exists in **both** shells, the shell code must not contain `document.`, `window.`, `setTimeout`, `addEventListener`, `ResizeObserver`, `getBoundingClientRect`, `Math.`, etc. If you need one of those, the logic belongs in core.
3. The React shell must not have components the Vue shell lacks; exports of the two shells must stay aligned.
4. CSS lives only in `packages/core`. Core `.ts` files must not import `.css` (only the root `src/index.ts` may). Every core `.css` must be listed in `packages/core/src/styles/index.css`, and registered in `styles/manifest.ts` (including the `renders` field — a missing entry silently breaks on-demand styles for child components).

## Component conventions (summary — see notes/COMPONENT-CONVENTIONS.md)

- Per component: `core/src/components/<kebab>/{types.ts,index.ts,<kebab>.css}` + `vue/src/components/<kebab>/M<Name>.vue` + `react/src/components/<kebab>/M<Name>.tsx`, each with a browser-mode test.
- Stateful core logic = controller `{ getSnapshot, getServerSnapshot, subscribe, update, connect, disconnect }`. `update()` is pure assignment (no notify, no DOM); `getServerSnapshot()` returns a stable reference computable on the server; `connect/disconnect` are idempotent (React StrictMode runs twice). Pure prop derivations stay pure functions.
- SSR: server output must equal the client's first frame. No `Math.random()` / `Date.now()` on the render path — drive randomness with a `seed` prop. Overlay/teleport content never renders on the server.
- Both shells must emit **identical** class names (BEM: `.m-<name>__part--state`) and share the same CSS. Use semantic tokens from `core/src/theme/tokens.css`, never raw `--m-color-*`.
- Vue: `defineOptions({ name: "M<Name>" })`, destructured prop defaults, `defineModel` for two-way binding. React: same export names; `v-model:x` becomes `x` + `onXChange` + `defaultX` (support both controlled and uncontrolled).
- No drawing libraries — ink effects are CSS/SVG filters plus pure algorithms in `core/src/ink`. Icon geometry exists once in `core/src/icons/index.ts`.
- Register new components in three places: `packages/vue/src/components/index.ts`, `packages/react/src/index.ts`, and `COMPONENT_NAMES` in `packages/vue/src/nuxt/components.ts` (`pnpm gen:meta` validates consistency). Components with required props also need an entry in `MINIMAL_PROPS` in `scripts/check-ssr.ts`. Docs-site pages are manual: add a `catalog.ts` entry plus a `<Name>Demo` in both `playground/src/vue/demos/` and `playground/src/react/demos/`.

## Notes

- Repo documentation and code comments are written in Chinese — keep that style.
- Browser tests run in real Chromium at a 1280×800 viewport (the default 414px pushes horizontal layouts off-screen).

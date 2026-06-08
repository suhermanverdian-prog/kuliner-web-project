# 👑 KEN ENTERPRISE UI – GLOBAL DESIGN SYSTEM (Version 6.0)

## 1️⃣ DESIGN FOUNDATION & THEME TOKENS
- **All colors** are defined as CSS custom properties in `src/styles/theme.css`:
  - `--color-background` / `--color-surface` / `--color-card`
  - `--color-primary-bg` (`amber-500`), `--color-primary-text` (`white` in light, `zinc-900` in dark)
  - `--color-success-bg` / `--color-error-bg` / `--color-info-bg` (emerald / rose / sky families)
  - `--radius-card`, `--radius-button`, `--radius-modal`
  - `--spacing-1` = 4px, `--spacing-2` = 8px, `--spacing-3` = 12px, … up to `--spacing-10` = 40px
- **Dark mode** overrides are placed under `.dark` selector using the same variable names.
- **Tailwind config** now only contains `theme: { extend: { spacing: { ... } } }` for the 8‑px grid, no hard‑coded color classes.

## 2️⃣ GLOBAL UI COMPONENTS (Shadcn / Radix + Framer Motion)
| Component | Variant(s) | Key Tokens |
|-----------|------------|------------|
| `Button` | `primary`, `secondary`, `ghost` | `--color-primary-bg`, `--color-primary-text`, `--radius-button`, `transition`, `active:scale-95` |
| `Card` | – | `--color-card`, `--radius-card`, `shadow-lg` (light only) |
| `Modal` | Desktop only | Framer‑Motion entry/exit, `--radius-modal`, backdrop blur |
| `Sheet` | Mobile‑first Bottom‑Sheet | Drag‑snap, `--radius-modal`, smooth slide animation |
| `Tooltip` | – | Radix UI, `--color-background`, `--color-foreground` |
| `Input` | – | `height: var(--spacing-12)`, `border`, `focus-visible:ring-amber-500/20` |
| `Badge` | `success`, `error`, `info` | Semantic colors, opacity `/30` in dark mode |

All components consume the CSS variables via `className="bg-[var(--color-primary-bg)] text-[var(--color-primary-text)]"` etc., guaranteeing **single‑source‑of‑truth** styling.

## 3️⃣ LAYOUT & GRID
- **8 px grid** remains the sole spacing system (`p-2`, `p-4`, `p-6`, `gap-4`, `gap-6`).
- **Border radius**: `--radius-card` = 8 px (`rounded-lg`), `--radius-button` = 8 px, `--radius-modal` = 16 px (`rounded-2xl`).
- **Shadows**: Enabled only in light mode (`shadow-lg`). Dark mode uses subtle borders instead of shadows.

## 4️⃣ MOTION & ANIMATIONS
- **Framer Motion** is the global animation engine.
  - Page transitions: `initial={{ opacity:0 }}` → `animate={{ opacity:1 }}` (150 ms).
  - Hover / focus scaling: `whileHover={{ scale:1.05 }}`.
  - Modal & Sheet entry/exit: slide‑up / slide‑down with `duration:0.25`.
- **No CSS‑only animations** that depend on `animate-quantum-fade` or `glass-quantum` – they have been **removed**.

## 5️⃣ DATA VISUALIZATION
- **Recharts** (or Chart.js) is the standard chart library.
- All charts read colors from the CSS variables, e.g. `stroke: var(--color-primary-bg)`.
- Dark‑mode palette uses the same variables with dark overrides (`--color-primary-bg` becomes a darker amber, grid lines use `zinc-700`).
- Interactive features: tooltip, legend, zoom, and responsive resizing.

## 6️⃣ ACCESSIBILITY & WCAG 2.1 AA
- Minimum contrast **4.5:1** enforced via `axe-core` CI step.
- **Never use static `text-white`** on adaptive backgrounds – replaced by `text-[var(--color-foreground)]`.
- All icon buttons receive `aria-label` and `role="button"`.
- Focus ring: `focus-visible:ring-[var(--color-primary-bg)]/20`.
- Tap targets ≥ 44 × 44 dp.
- Keyboard navigation order is logical; `Esc` closes modals/sheets.

## 7️⃣ DEPRECATED / REMOVED RULES
- **Glass‑Quantum**, **Animate‑Quantum‑Fade**, **rounded‑2xl** (outside of modal), **rounded‑full**, **bg‑amber‑** incomplete classes, **border‑white/10**, **border‑amber‑500/20 on dark backgrounds** without opacity – all eliminated.
- Any usage of `text-white` on non‑static backgrounds is now a violation.
- `rounded‑md`, `rounded‑xl` are no longer allowed; only `rounded‑lg` (8 px) for cards/buttons and `rounded‑2xl` (16 px) for modals/sheets.

## 8️⃣ COMPONENT LIBRARY & DISTRIBUTION
- The UI library is published as **`@ken/ui`** to the internal npm registry.
- Versioning follows Semantic Versioning; major bump required for any token change.
- Documentation lives in `STYLE_GUIDE.md` and includes live Storybook examples.

## 9️⃣ CONTINUOUS INTEGRATION
- **Lint**: Tailwind‑lint + ESLint (React, TypeScript).
- **Tests**: Unit tests (Jest + React Testing Library), visual regression (Storybook + Chromatic), accessibility audit (`npm run lint:axe`).
- **CI/CD** runs on every push; any rule violation blocks the pipeline.

---
*All developers must conform to these updated global UI/UX rules. Any deviation must be approved through a design‑review ticket.*

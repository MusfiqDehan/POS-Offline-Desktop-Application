# Visual QA checklist — desktop POS vs web `/pos`

Target resolution: **1920×1080**

Compare side-by-side with Sortorium_Frontend `/pos`:

- [x] Header: logo (favicon), branch selector, cash register, today sale, sync, logout
- [x] Three-panel grid proportions (products | order | sidebar)
- [x] Primary CTA buttons use `#0AC79E`
- [x] Secondary headings/chrome use `#092C4C`
- [x] Status toast dark `#333` / warning `#B45309`
- [x] Offline banner visible when disconnected
- [x] Payment pills and Pay & Print placement in right sidebar

Fixes applied during implementation:

- Outer shell `p-6` (24px) matching `pos-layout-shell`
- Grid `xl:grid-cols-[689fr_370fr_330fr]` with `gap-3.5`
- Brand tokens mapped in `@theme` / CSS variables

# Vee Rubber GProcurement Tracker — DESIGN.md
> Enterprise B2B Tire & Government Procurement Intelligence Design System  
> Inspired by HP Design Language (https://getdesign.md/hp/design-md)

---

## 1. Design Philosophy
- **Pure White Canvas (`#ffffff`):** Content-first presentation eliminating visual noise and cognitive fatigue.
- **Hairline Precision (`#e8e8e8`):** 1px borders providing structure without heavy dividers.
- **Near-Black Ink (`#1a1a1a`):** High typographic contrast for effortless readability.
- **Dual Brand Anchor:** Vee Rubber Deep Corporate Navy (`#003366`) paired with Electric Blue (`#024ad8`) for signal actions.
- **Financial Clarity (`#059669`):** Emerald Green strictly reserved for budget and contract values.

---

## 2. Design Tokens

### Colors
```yaml
colors:
  # Primary Signal & Brand
  primary: "#003366"           # Vee Rubber Deep Navy
  primary-electric: "#024ad8"  # HP Signal Blue (Active CTA, interactive highlights)
  primary-hover: "#013ab0"     # Darker electric blue
  primary-soft: "#eff6ff"      # 5% tint for active row/pill backgrounds
  on-primary: "#ffffff"

  # Ink / Typography
  ink: "#1a1a1a"               # High-contrast headline / title
  ink-deep: "#0a0a0a"          # Pure dark text
  ink-soft: "#475569"          # Secondary metadata / labels
  ink-muted: "#94a3b8"         # Helper captions / placeholders
  on-ink: "#ffffff"

  # Canvas & Slabs
  canvas: "#ffffff"            # Main app background / card surface
  paper: "#ffffff"             # Pure white card surface
  cloud: "#f8fafc"             # Slate-50 subtle surface / sidebar background
  fog: "#f1f5f9"               # Slate-100 hover backgrounds
  hairline: "#e8e8e8"          # 1px hairline border
  hairline-strong: "#cbd5e1"   # Focused / active border

  # Semantics
  budget-emerald: "#059669"    # Project budget & value text
  budget-bg: "#ecfdf5"         # Budget highlight container
  budget-border: "#a7f3d0"     # Budget highlight border

  alert-coral: "#dc2626"       # Red alert (Due today / Urgent)
  alert-bg: "#fef2f2"
  warning-amber: "#d97706"     # Amber warning (Pending review)
  warning-bg: "#fffbeb"
```

### Typography
- **Primary Thai & Latin Font:** `'Anuphan'`, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Code / Monospace:** 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace
- **Scale:**
  - `title-xl`: `22px` / weight 700 / line-height 1.2
  - `title-lg`: `18px` / weight 700 / line-height 1.3
  - `title-md`: `16px` / weight 600 / line-height 1.35
  - `body-lg`: `15px` / weight 400 / line-height 1.45
  - `body-sm`: `13px` / weight 500 / line-height 1.4
  - `caption`: `11.5px` / weight 600 / uppercase letter-spacing +0.04em

---

## 3. Product Group Color Coding (6 Categories)
- 🚗 `passenger_car_tires`: Blue Accent (`#2563eb`, `#eff6ff`)
- 🚛 `truck_bus_tires`: Cyan / Slate Accent (`#0284c7`, `#f0f9ff`)
- 🏍️ `motorcycle_tires`: Amber / Violet Accent (`#7c3aed`, `#f5f3ff`)
- 🚜 `otr_heavy_machinery`: Emerald / Forest Accent (`#16a34a`, `#f0fdf4`)
- 🚲 `bicycle_specialty_tires`: Teal Accent (`#0d9488`, `#f0fdfa`)
- 🔘 `tube_accessories`: Indigo Accent (`#4f46e5`, `#eef2ff`)

---

## 4. Components

### Announcement Card
- Minimalist, pure-white card with 1px border `#e8e8e8`.
- Project title displayed in high-contrast near-black `#1a1a1a` (hover color: `#024ad8`).
- Budget prominently featured with emerald highlight tag.
- One-click copy project ID and direct e-GP link with verified external icon.

### Member Management Dashboard (`admin.html`)
- High-density user table with status pills (Approved, Pending, Suspended).
- Modal for PBKDF2 password reset with copy-to-clipboard.
- Real-time role switching between Admin and Viewer.
- Live session activity tracker.

---

## 5. Twin-File Architecture
`v2.html` and `dashboard.html` must remain exact duplicates at all times.
Command to sync:
```powershell
Copy-Item -Path "frontend/v2.html" -Destination "frontend/dashboard.html" -Force
```

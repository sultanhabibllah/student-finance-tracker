# Student Finance Tracker

A fully accessible, responsive, vanilla HTML/CSS/JS web app for tracking ALU student expenses.

**Live Demo:** 


## Theme
**Student Finance Tracker** — log, search, and analyse spending with categories, budget caps, and currency conversion.


## Features
- Add, edit (inline), and delete expense records
- Live regex-powered search with match highlighting
- Sort records by date, description, or amount
- Dashboard with total stats, top category, 7-day bar chart, and category breakdown
- Monthly budget cap with ARIA live region alerts (polite/assertive)
- JSON import & export with validation
- Currency conversion: GBP → USD / EUR (manual rates in Settings)
- Custom categories (add/remove)
- Mobile-first responsive design (360px, 768px, 1024px breakpoints)
- Full keyboard navigation and ARIA accessibility
- LocalStorage persistence across sessions



## How to Run
```bash
git clone 
cd student-finance-tracker
# Open index.html with Live Server in VS Code
# Important: must use a server, not file:// directly
```

To load seed data: go to **Records** → **Import JSON** → select `seed.json`

To run tests: open `tests.html` via Live Server


## Regex Catalog

| Pattern | Purpose | Example |
|---|---|---|
| `/^\S(?:.*\S)?$/` | No leading/trailing spaces | `"Lunch"` ✓, `" Lunch"` ✗ |
| `/  +/` | No double spaces | `"Lunch  at"` ✗ |
| `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Valid amount | `12.50` ✓, `12.505` ✗ |
| `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Date YYYY-MM-DD | `2025-09-25` ✓ |
| `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Category name | `Out-of-pocket` ✓, `Food123` ✗ |
| `/\b(\w+)\s+\1\b/i` | **Advanced** — duplicate words (back-reference) | `"the the"` ✗ |
| User input | Live regex search | `coffee\|tea`, `^\d`, `\.\d{2}\b` |


## Keyboard Map

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move between focusable elements |
| `Enter` / `Space` | Activate buttons and links |
| `Escape` | Close dialog or mobile nav |
| First `Tab` on page | Reveals skip-to-content link |
| Arrow keys | Navigate select dropdowns |


## Accessibility Notes
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- All inputs have associated `<label>` elements
- Errors announced via `role="alert"` and `aria-live="assertive"`
- Status messages via `role="status"` and `aria-live="polite"`
- Budget cap switches to `aria-live="assertive"` when exceeded
- Visible focus styles on all interactive elements via `:focus-visible`
- Skip-to-content link as first focusable element
- Delete dialog traps focus and closes on `Escape`
- Color contrast meets WCAG AA


## File Structure
```
student-finance-tracker/
├── index.html
├── tests.html
├── seed.json
├── README.md
├── styles/
│   └── main.css
└── scripts/
    ├── app.js
    ├── state.js
    ├── storage.js
    ├── ui.js
    ├── validators.js
    └── search.js
```


## Individual Work Confirmation
This repository is solelyy authored by Habibllah Ayodele
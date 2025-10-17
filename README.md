# Uni Portal Demo (GitHub Pages Ready)

A simple, modern UTAR-themed login page with glass blur, separated assets, and a landscape logo well.

## Structure
```
university-portal/
├─ index.html
└─ assets/
   ├─ css/
   │  └─ styles.css
   ├─ js/
   │  └─ main.js
   └─ img/
      └─ logo-placeholder.svg
```

## Customising
- Replace `assets/img/logo-placeholder.svg` with the actual logo and update the `<img src>` path in `index.html` if the file name changes.
- Tweak colours in `assets/css/styles.css` under the `:root { ... }` brand tokens.
- `assets/js/main.js` currently blocks actual form submission for safety — wire it to the back-end if needed.

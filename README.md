# UTAR Portal Demo (GitHub Pages Ready)

A simple, UTAR-themed Apple-style login page with glass blur, separated assets, and a landscape logo well.

## Structure
```
utar-portal-site/
├─ index.html
└─ assets/
   ├─ css/
   │  └─ styles.css
   ├─ js/
   │  └─ main.js
   └─ img/
      └─ logo-placeholder.svg
```

## How to publish on GitHub Pages
1. Create a new public repo on GitHub (e.g. `utar-portal-site`).
2. Upload the contents of this folder (keep the structure).
3. Keep `index.html` at the root.
4. Go to **Settings → Pages** and set:
   - Source: **Deploy from a branch**
   - Branch: **main** (or master), Folder: **/** (root)
5. Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Customising
- Replace `assets/img/logo-placeholder.svg` with your actual logo and update the `<img src>` path in `index.html` if the file name changes.
- Tweak colours in `assets/css/styles.css` under the `:root { ... }` brand tokens.
- `assets/js/main.js` currently blocks actual form submission for safety — wire it to your back-end if needed.

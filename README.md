# on-time.ge — website source

Simple static website (plain HTML, CSS, and a tiny bit of JavaScript —
no build tools, no frameworks). Anyone can open `index.html` directly
in a browser to preview it.

## Structure

```
on-time-website/
├── index.html        ← page content and structure
├── css/style.css      ← all styling (colors, fonts, layout)
├── js/script.js        ← small scripts (currently just the footer year)
├── images/            ← photos and the logo go here (see below)
└── README.md           ← this file
```

## Current status

- **Logo** — `images/logo-trimmed.png` (auto-cropped from the original
  file) is in place, used in the header and footer.
- **Hero photo** — `images/hero-truck.jpg` is in place as the full-bleed
  background of the homepage hero. This is a **temporary/trial photo**
  per Lasha — swap it by replacing the file and/or updating the
  `background-image` in `css/style.css` (`.hero` rule) once a final
  photo is chosen.
- **More services** — only "Refrigerated Transport" is listed so far.
  Once the full service list is confirmed, add one
  `<article class="service-card">` per service inside the `#services`
  section in `index.html`, following that card as a template.

## Previewing while editing

The easiest way to see live changes while editing in VS Code:

1. Install the **Live Server** extension (Extensions icon in the left
   sidebar → search "Live Server" → Install).
2. Right-click `index.html` → **Open with Live Server**.
3. The page opens in your browser and refreshes automatically every
   time you save a file.

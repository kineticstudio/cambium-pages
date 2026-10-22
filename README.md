# Cambium: Sawmills page

The new **For Sawmills** page for cambium.com (`/supply-chain/sawmills`),
ready to build. Design by Kinetic Studio.

Live design: https://cambium.kineticstudio.com/designs/cambium/03-sawmills-page-v3

## The one structural change

The Sawmills page currently runs on a CMS template, so reordering or hiding
its sections changes every page on that template. **Move it to its own
static page first**, keep the same URL (`/supply-chain/sawmills`), then
build the sections below on it. The other supply chain pages stay on the
template untouched.

## Sections, top to bottom

| Section | What changed |
| --- | --- |
| Hero | The lumber photo is now a short band behind the nav that ends just under the Sawmills pill (about 125px at 1440, same image). New headline and paragraph; Get in Touch stays. |
| How to work with us | Replaces What we do. Same three-column cards and icons (fit, demand, growth). Each card: title, a lead line in full cream, then the body at 70%. |
| Map + Join / Log in | Heading, paragraph and the two buttons as before. The map is one embed (below). The "220+" status pill is gone. |
| Case studies | New. Three cards: photo (4:3), mono label (mill and state), title, paragraph. Photos are in `images/`. |
| The demand on the other side | The buyer logos, unchanged, moved to the bottom. |

**Removed:** the tall lumber photo, What we do, Three ways to partner and the
supplier portal block under the map, the four long story sections, Get
inspired, Environmental impact, and Start with what you're producing.

All copy is in `sawmills/index.html`, exactly as it should read. Open that
file in a browser for the full page at any width; it is the design reference,
not code to paste.

## The map embed

Paste `map/embed.html` into one Embed element inside the map section (dark
`#261107` background, under the heading). It is about 5,300 characters. It
loads:

- `map/network.css` and `map/network.js` from this repo through jsDelivr
  (`@v1`), plus d3 7.9 and topojson-client 3.1 from unpkg
- the site's own fonts (Abc Social, Abc Social Mono), already on cambium.com

Everything in the CSS is scoped to `.cb-net`, so nothing leaks into the page.
`map/demo.html` is the embed on a blank page if you want to test it locally
(`python3 -m http.server` in this folder, then open `/map/demo.html`).

**Updating the mills and programs** needs no code: the rows live in the
embed itself. Paste each Display tab of the "Supplier Landing Page Data"
Google Sheet between its backticks, header row included. Only the Display
tabs, never the Raw tabs (they hold real mill names).

On phones (under 720px wide) the map switches to region tabs and swipeable
cards under it; nothing to build for that.

## Changes

Every later design change is pushed here, with a line in `CHANGELOG.md`. When
the map code changes, the jsDelivr tag moves to `@v2` and the embed's two
URLs say so.

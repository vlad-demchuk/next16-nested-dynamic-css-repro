# Repro: nested `next/dynamic` gets no SSR stylesheet link (Turbopack, App Router)

```
app/page.js                 server component
  └─ components/Resolver.js      "use client", imported statically
       └─ dynamic(WidgetX)            level 1  -> CSS gets <link ... data-precedence="dynamic">
            └─ dynamic(VariantY)      level 2  -> CSS gets NO link in the server HTML
```

Both `WidgetX` and `VariantY` import their own CSS module, and both are server-rendered
(`ssr` is left at its default `true`).

## Run

```bash
npm install
npm run build     # Turbopack (the Next 16 default)
npm run check
```

`check.mjs` reads the prerendered HTML, lists its stylesheet links, then locates the CSS chunk that
contains each module's class name and reports whether that chunk is linked.

## Manual check in a browser

```bash
npx next start -p 3200
```

Open http://localhost:3200 and use **view-source** (not the Elements panel — by the time you look at
the DOM, hydration has already inserted the missing link). The server HTML contains exactly one
`<link rel="stylesheet">`, the level-1 one.

To see the shift itself, throttle the network (DevTools -> Network -> Slow 3G) and hard-reload: the
two columns first stack full width, then snap to 62% / 38% once the level-2 stylesheet arrives. On
an unthrottled localhost the chunk is a few hundred bytes, so the flash is too quick to catch.

Without a browser:

```bash
curl -s localhost:3200 | grep -o '<link rel="stylesheet"[^>]*>'
```

Running the same page off `next build --webpack` shows two stylesheet links and no shift.

## Results

| build                    | level 1 CSS linked in SSR HTML | level 2 CSS linked in SSR HTML |
|--------------------------|--------------------------------|--------------------------------|
| 16.3.4, Turbopack        | yes (`data-precedence="dynamic"`) | **no**                      |
| 16.3.4, `next build --webpack` | yes                      | yes                            |
| 16.0.11, Turbopack       | yes                            | yes                            |
| 16.4.0-canary.34, Turbopack | yes                         | **no**                         |

So on the same Next version the webpack build links both stylesheets and the Turbopack build links
only the first level, and the Turbopack build did link both on 16.0.x.

In the browser the missing link means `VariantY` paints without `display: flex` and without the
62% / 38% column widths, then reflows once the client chunk loader fetches the stylesheet after
hydration.

## Reproducing each row

```bash
npm run build          && npm run check   # turbopack
npm run build:webpack  && npm run check   # webpack, same version
npm i next@16.0.11     && npm run build && npm run check
npm i next@16.3.4      && npm run build && npm run check
```

Reproduces on 16.1.0 through 16.3.5 and on 16.4.0-canary.34; clean on 16.0.x.

# Walkthrough

Read this before any interview where this project might come up.

## The stack

- **React** builds the page from **components** (functions that return what to show). When **state** changes, React re-renders the affected parts automatically.
- **TypeScript** is JavaScript with types. The compiler (`npm run typecheck`) catches mistakes such as passing a string where a number is expected, before the code runs.
- **Vite** runs the development server and bundles the code for production.
- **Vitest** runs the tests; **oxlint** checks code quality.

## `src/lib/bonds.ts`: data

- `interface Bond` defines the shape of a bond record, so TypeScript can check every use of it.
- `BONDS` is the same Treasury data as the Python library. `ILLUSTRATIVE_YIELDS` are starting values for the curve, clearly labelled as not live data.

## `src/lib/calc.ts`: the maths

- A line-by-line port of the Python `calc.py`: coupon dates, schedule, ex-coupon check, accrued interest, all-in and clean price, and bisection for yield.
- **Day numbers:** dates are stored as days since 1 January 1970 using `Date.UTC`. JavaScript dates are otherwise tied to the user's time zone, which can shift a date by a day; working in UTC whole days avoids that bug.
- `**` is the power operator: `(1 + ytm / 2) ** t`.
- `reduce` adds up the discounted cash flows.

*Likely question:* "Why duplicate the maths instead of always calling the API?" The site then works instantly and for free on static hosting, with no server to pay for or wake up; the API cross-check proves both versions agree.

## `src/lib/calc.test.ts`: tests

Seven tests, including one that reproduces the Python library's exact R2032 prices. If either implementation changes, that test catches the disagreement.

## `src/lib/api.ts`: talking to the backend

- `import.meta.env.VITE_API_URL` reads a setting at build time; if it's empty, the API button is hidden.
- `fetchPrice` builds the URL with `URL` and `searchParams` (so values are encoded safely), calls `fetch`, checks `res.ok` and returns the JSON. It's `async`, so the page doesn't freeze while waiting.

## `src/components/YieldCurveChart.tsx`: the chart

- Plain SVG, no chart library. `x()` and `y()` are **scale functions** that convert years and yields into pixel positions.
- The curve is one `<path>`: `M` moves to the first point, `L` draws lines to the rest.
- Labels alternate above and below points so neighbouring labels don't overlap.
- Each point is focusable (`tabIndex`) and responds to Enter as well as clicks, for keyboard users. `<title>` gives a hover tooltip.

## `src/App.tsx`: the page

- `useState` holds the settlement date, the yields and the selected bond. Changing any of them re-renders the page with fresh calculations.
- `useMemo` remembers the list of bonds still alive on the settlement date, recalculating only when the date changes.
- The yield inputs update state with `setYields({ ...yields, [code]: value })`: the **spread** copies the old object and replaces one value. React needs a new object to notice the change.
- `e.stopPropagation()` on the input stops a click in the yield box from also selecting the table row.
- `{API_URL && (...)}` only renders the API section when an API is configured.

## Styling

`index.css` defines colour **variables** with a dark-mode version under `prefers-color-scheme: dark`. `App.css` lays out the page with CSS grid, collapsing to one column on narrow screens; tables scroll sideways on phones instead of breaking the layout.

## `.github/workflows/deploy.yml`: CI and deployment

On every push: install exact dependency versions (`npm ci`), type-check, lint, test and build. On `main`, the built site is published to GitHub Pages.

## Ideas to extend it yourself

1. Add a "parallel shift" slider that moves every yield up or down by N basis points.
2. Show each bond's modified duration in the table.
3. Let users download the table as CSV.
4. Save the user's yields in the browser's local storage.

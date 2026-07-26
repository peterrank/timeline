# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Storybook dev server (primary way to develop and preview the component)
npm run storybook

# Run tests
npm test

# Run a single test file
npx jest src/calendar/__tests__/lcal.js

# Build the library for npm publishing (outputs to dist/)
npm run publish:npm

# Build static Storybook
npm run build-storybook
```

There is no lint script. The Babel config (`@babel/preset-react`) lives in `package.json`.

## Publishing

1. Bump `version` in `package.json` and commit
2. `npm run publish:npm` — transpiles `src/` to `dist/` via Babel with `NODE_ENV=production`
3. `npm publish`

## Architecture

This is a **React npm component library** (`react-canvas-timeline`, Apache-2.0). It renders a fully interactive timeline onto an HTML5 `<canvas>`. There is no webpack or Rollup for the library build — the output is plain Babel-transpiled JS in `dist/`.

### Component hierarchy

```
ReactCanvasTimeline          (src/timeline/reactcanvastimeline.js)
  └── InstrumentedTimeline   (src/timeline/instrumentedtimeline.js)
        └── Timeline          (src/timeline/timeline.js)
              └── BasicTimeline (src/timeline/basictimeline.js)
                    └── SwipeCanvas (src/swipecanvas/swipecanvas.js)
```

- **`SwipeCanvas`** — owns the `<canvas>` element; implements pan, swipe, pinch-zoom, long-press via the Pointer Events API.
- **`BasicTimeline`** — converts pixel offsets and zoom levels into `LCal` time windows.
- **`Timeline`** — core drawing engine; dispatches to painter modules; manages drag-and-drop and shape rendering (pins, clouds, stars, arrows, charts, etc.). Shape constants (`PIN`, `CLOUD`, `STAR`, …) are defined here.
- **`InstrumentedTimeline`** — wraps `Timeline` with navigation UI (now-button, zoom slider, vertical resource slider).
- **`ReactCanvasTimeline`** — the public API component; converts `resources`/`tasks` props into a `TaskModel`, applies prop defaults, and renders `InstrumentedTimeline`.

### Data model

- **`AbstractModel`** (`src/model/abstractmodel.js`) — base CRUD store; handles lazy image loading.
- **`TaskModel`** extends `AbstractModel` — holds `Task` objects; calls `recomputeDisplayData` after mutations to stack overlapping tasks into vertical levels via `stacker.js`.
- **`ResourceModel`** extends `AbstractModel` — holds `Resource` objects.
- **`Task`** extends `LCalInterval` — carries `id`, `resID`, `name`, `secname`, `displData` (visual properties), and optional `innerEvents`.
- **`Resource`** — carries `id`, `name`, `secname`, `displData`.

### Calendar system (`src/calendar/`)

The project uses a custom calendar (`LCal`) stored internally as **Julian minutes**, supporting dates from the Big Bang (~−13.8 Gigayear) to the far future across 14 precision levels (0 = Gigayear, 13 = minute). Pre-1582 dates use the Julian calendar; post-1582 use Gregorian.

- **`LCal`** — the core date/time value
- **`LCalInterval`** — a start/end `LCal` pair (base class for `Task`)
- **`LCalFormatter`** — formats `LCal` values to strings per precision and locale
- **`LCalHelper`** — static math helpers (leap years, day-of-week, time conversion)

### Painter modules (`src/timeline/painter/`)

Non-React functions that each receive a Canvas 2D context and draw one concern:
- `timelineheaderpainter.js` — time axis ticks and labels
- `gridpainter.js` — vertical grid lines
- `resourcepainter.js` — resource row headers
- `tasks/` — one painter per shape (arrow, chart, circle, cloud, cross, curlybrace, document, pin, speechbubble, star, …)

### Config

`src/timeline/timelineconfig.js` exports an object with defaults for colors, fonts, dimensions, and callbacks. It is merged with the user-supplied `config` prop at construction time.

### i18n

`src/i18n/` — simple key-lookup with three locales: German (default, `i18n_res.js`), English (`i18n_res_en.js`), Ukrainian (`i18n_res_ua.js`).

### Public API

`src/index.js` re-exports everything consumers need: `LCal`, `LCalFormatter`, `LCalHelper`, `LCalInterval`, `Task`, `Resource`, `TaskModel`, `ResourceModel`, `Timeline`, `InstrumentedTimeline`, `ReactCanvasTimeline`, `Slider`, `NowButton`, `paintChart`, and all shape constants.

### Storybook

41 stories in `.storybook/stories/` cover every documented feature. The Storybook config uses `@storybook/react-vite` with a custom Vite plugin that pre-processes `.js` files as JSX via esbuild — this is needed because library sources are `.js`, not `.jsx`.

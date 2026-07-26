# Optimierungspotenziale

Identifiziert am 2026-07-26. Nach jeder umgesetzten Änderung abhaken.

---

## [ ] 1. `getTaskBarBounds()` — 3-7× pro Task pro Frame

**Dateien:** `src/timeline/timeline.js:1622, 1854, 2017, 2077, 2159`
**Aufwand:** mittel | **Wirkung:** hoch

Pro Paint-Zyklus wird `ctx.measureText()` und `ctx.font =` mehrfach für denselben Task aufgerufen (einmal in `paintTaskBar`, nochmal in `paintIcon`, nochmal in `paintTaskBarLabel`, usw.).

**Fix:** Am Anfang von `paint()` eine `Map<taskID, bounds>` anlegen, lazily befüllen, am Ende des Frames verwerfen.

```js
// Oben in paint():
this._boundsCache = new Map();

// getTaskBarBounds() wrappen:
getCachedTaskBarBounds(task) {
  if (!this._boundsCache.has(task.getID())) {
    this._boundsCache.set(task.getID(), this.getTaskBarBounds(task));
  }
  return this._boundsCache.get(task.getID());
}
```

---

## [ ] 2. `paintTasks()` — 4-6 separate O(n)-Läufe pro Frame

**Datei:** `src/timeline/timeline.js:2485–2523`
**Aufwand:** mittel | **Wirkung:** hoch

Hintergrund, Bars, Charts und Labels werden in vier getrennten Loops über alle Tasks iteriert. Zusammen mit `paintTransparentShapedTasks()` (Zeile 2276) und `paintConnections()` (Zeile 2599) sind es 6+ vollständige Durchläufe pro Frame.

**Fix:** Nach `recomputeDisplayData()` Tasks einmalig in Buckets einteilen und in `paintTasks()` nur noch die Buckets iterieren.

```js
// In recomputeDisplayData() oder am Frame-Anfang:
this._buckets = { background: [], bars: [], charts: [], labels: [] };
for (const task of model.getAll()) {
  if (isBackground(task)) this._buckets.background.push(task);
  else if (isChart(task))  this._buckets.charts.push(task);
  else                     this._buckets.bars.push(task);
  this._buckets.labels.push(task);
}
```

---

## [x] 3. `JSON.parse(task.dataset)` im Render-Pfad — kein Cache

**Datei:** `src/timeline/timeline.js:1758`
**Aufwand:** gering | **Wirkung:** mittel
*(Im Code bereits mit `//TODO: Cache` markiert)*

Bei 50 Chart-Tasks × 60 fps entstehen ~3.000 JSON-Parses pro Sekunde derselben unveränderlichen Strings.

**Fix:** Ergebnis direkt am Task-Objekt cachen, mit Raw-String-Vergleich als Invalidierung.

```js
// Statt:
let dataset = JSON.parse(task.dataset);

// So:
if (task._cachedDatasetRaw !== task.dataset) {
  task._cachedDataset    = JSON.parse(task.dataset);
  task._cachedDatasetRaw = task.dataset;
}
let dataset = task._cachedDataset;
```

---

## [ ] 4. `new TaskModel()` bei jedem React-Render

**Datei:** `src/timeline/reactcanvastimeline.js:10`
**Aufwand:** gering | **Wirkung:** mittel

Jede Zustandsänderung im Parent baut das gesamte Modell neu auf: alle Callbacks werden neu registriert, `recomputeDisplayData` läuft von vorn, Layout-Cache wird verworfen.

**Fix:** `useMemo` verwenden.

```js
const model = useMemo(() => {
  const m = new TaskModel();
  m.getResourceModel().setAll(props.resources);
  m.setAll(props.tasks);
  m.barSize = props.barSize || 40;
  m.setStackDirection(props.stackDirection);
  return m;
}, [props.resources, props.tasks, props.barSize, props.stackDirection]);
```

---

## [ ] 5. `getTask()` — O(n)-Scan bei jedem `mousemove`

**Datei:** `src/timeline/timeline.js:1503`
**Aufwand:** mittel | **Wirkung:** mittel

Bei jeder Mausbewegung werden für alle Tasks `getTaskBarBounds()` neu berechnet, um den getroffenen Task zu finden. Bei 1.000 Tasks bedeutet das 1.000 teure Canvas-Operationen pro Event.

**Fix:** Nach `recomputeDisplayData()` einen nach x sortierten Hit-Test-Cache aufbauen und per Binärsuche suchen.

```js
// Nach recomputeDisplayData():
this._hitCache = model.getAll().map(task => {
  const b = this.getTaskBarBounds(task);
  return { xMin: b.getMinStartX(), xMax: b.getMaxEndX(), task };
}).sort((a, b) => a.xMin - b.xMin);

// In getTask(x, y):
// Binärsuche auf this._hitCache nach xMin <= x <= xMax, dann y prüfen
```

---

## [ ] 6. `isDarkBackground()` / `toTransparent()` — Hex-Parsing pro Frame

**Datei:** `src/helper/helper.js:375, 394`
**Aufwand:** gering | **Wirkung:** mittel

`parseInt(color.substr(1,2), 16)` wird dreimal pro Task pro Frame aufgerufen, ohne Cache. Das Map-Cache-Pattern ist in `helper.js:6-9` für Text-Metriken bereits etabliert — dasselbe hier anwenden.

```js
// Oben im Modul (neben den bestehenden Caches):
const colorDarknessCache  = new Map(); // "#rrggbb" -> boolean
const transparentColorCache = new Map(); // "#rrggbb,0.3" -> "rgba(...)"

static isDarkBackground(col) {
  if (colorDarknessCache.has(col)) return colorDarknessCache.get(col);
  const result = Helper.getGrayValue(col) < 127000;
  colorDarknessCache.set(col, result);
  return result;
}
```

---

## [ ] 7. `resID2TaskCnt`-Cache wird nie invalidiert

**Dateien:** `src/model/taskmodel.js:26`, `src/model/abstractmodel.js:133, 151, 204`
**Aufwand:** gering | **Wirkung:** korrektheit (Bug)

Nach `removeByID()`, `setAll()` oder `clear()` bleibt der Cache veraltet. Das kann dazu führen, dass der "Drücke hier 2 Sekunden..."-Hinweis auf nicht-leeren Ressourcen erscheint (oder auf leeren fehlt).

**Fix:** `this.resID2TaskCnt.clear()` in die betroffenen Mutations-Methoden ergänzen.

```js
// abstractmodel.js — removeByID(), setAll(), clear() je ergänzen:
this.resID2TaskCnt.clear();
```

---

## [ ] 8. `getGroup2GroupInfo()` mehrfach pro Frame berechnet

**Datei:** `src/timeline/timeline.js:420, 422, 1148, 1276`
**Aufwand:** mittel | **Wirkung:** gering–mittel

Die Methode iteriert selbst wieder über alle Tasks und ruft dabei `getTaskBarBounds()` auf. In `onTap()` wird sie zweimal hintereinander für leicht unterschiedliche Y-Werte aufgerufen.

**Fix:** Als Instanzfeld mit Dirty-Flag cachen, das bei Daten- oder Zoom-Änderungen gesetzt wird.

```js
// Instanzfeld:
this._group2GroupInfoDirty = true;
this._group2GroupInfoCache = null;

getGroup2GroupInfo() {
  if (this._group2GroupInfoDirty) {
    this._group2GroupInfoCache = this._computeGroup2GroupInfo();
    this._group2GroupInfoDirty = false;
  }
  return this._group2GroupInfoCache;
}
```

---

## Übersicht

| # | Stelle | Aufwand | Wirkung | Status |
|---|--------|---------|---------|--------|
| 1 | `getTaskBarBounds()` Frame-Cache | mittel | hoch | offen |
| 2 | `paintTasks()` Bucket-Loops | mittel | hoch | offen |
| 3 | `JSON.parse` dataset-Cache | gering | mittel | erledigt |
| 4 | `new TaskModel()` → `useMemo` | gering | mittel | offen |
| 5 | `getTask()` Hit-Test-Cache | mittel | mittel | offen |
| 6 | `isDarkBackground` Farb-Cache | gering | mittel | offen |
| 7 | `resID2TaskCnt` Invalidierung | gering | Bug-Fix | offen |
| 8 | `getGroup2GroupInfo` Dirty-Flag | mittel | gering | offen |

**Empfehlung für den Einstieg:** #3, #4 und #7 sind je unter 10 Zeilen und risikoarm.

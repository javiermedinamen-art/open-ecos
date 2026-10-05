const app = document.querySelector("#app");
const state = {
  catalog: null,
  query: "",
  theme: "todos",
  lang: localStorage.getItem("open-ecos-lang") === "en" ? "en" : "es",
};
let renderToken = 0;
let leafletPromise = null;
let detachOverture = () => {};
const seriesCache = new Map();

function beats() {
  if (state.lang === "en") {
    return [
      { kicker: "Home", title: "Open Ecosystems", body: "" },
      {
        kicker: "What it is",
        title: "A catalog, not a repository.",
        body: "Each record arrives with the file and with what the file leaves unsaid: what it is for, how to read it, and where it stops. The reading is for understanding it quietly. The sheet, for citing it.",
      },
      {
        kicker: "Why it exists",
        title: "The place that is measured is the place where one lives.",
        body: "Snow at a station, the water of a wetland, the temperature of a river. Shared networks keep these series, and they speak of the same ground that gives water and harvest. To lock the file, or to charge for consulting it, puts that ground out of reach. Here it stays in view, with its unit and its limit.",
      },
    ];
  }
  return [
    { kicker: "Inicio", title: "Open Ecosystems", body: "" },
    {
      kicker: "De qué se trata",
      title: "Un catálogo, no un depósito.",
      body: "Cada registro llega con el archivo y con lo que el archivo calla: para qué sirve, cómo se lee y dónde se detiene. La lectura es para comprenderlo con calma. La ficha, para citarlo.",
    },
    {
      kicker: "Por qué existe",
      title: "El lugar que se mide es el lugar donde se vive.",
      body: "La nieve en una estación, el agua de un humedal, la temperatura de un río. Esas series las sostienen redes comunes, y hablan del mismo sitio que da de beber y de cosechar. Guardar el archivo, o cobrar por consultarlo, lo deja fuera de alcance. Aquí sigue a la vista, con su unidad y con su límite.",
    },
  ];
}

const COPY = {
  es: {
    skip: "Saltar al contenido",
    catalog: "Catálogo",
    langLabel: "Idioma",
    colophon: "Los registros salen de <span class=\"mono\">catalog/index.json</span> y de la ficha de cada dataset. No hay una base de datos detrás de esta página.",
    loading: "Cargando el catálogo…",
    publishedOne: "publicado",
    publishedMany: "publicados",
    recordOne: "registro",
    recordMany: "registros",
    coverage: "cobertura del catálogo",
    search: "Buscar por lugar, tema o título",
    all: "Todos",
    empty: "Ningún dataset coincide con ese filtro.",
    reading: "Lectura",
    sheet: "Ficha",
    back: "← Catálogo",
    missing: "Ese dataset no está en el catálogo.",
    place: "Lugar",
    period: "Periodo",
    license: "Licencia",
    noDoi: "Sin DOI",
    technical: "Ficha técnica",
    made: "Cómo está hecho",
    instruments: "Instrumentos",
    unstated: "No indicados",
    crsOriginal: "CRS de origen",
    crsPublished: "CRS publicado",
    extent: "Extensión",
    preparation: "Preparación",
    variables: "Variables",
    wideTable: "tabla ancha, índice {column}",
    files: "Archivos",
    download: "Qué se puede descargar",
    cite: "Cita",
    howCite: "Cómo citarlo",
    copy: "Copiar cita",
    copied: "Copiada",
    notSay: "Esto no lo dice",
    sameData: "Los mismos datos",
    look: "Míralo",
    sheetLink: "La ficha",
    sheetNote: " tiene unidades, métodos y la cita.",
    chooseReading: "Elige una estación. Un hueco en la línea es un día sin medición, no un día en cero.",
    chooseSheet: "Elige una estación. La serie diaria se lee entonces, no antes.",
    filterPoints: "Filtrar puntos",
    readingSeries: "Leyendo la serie de esta estación…",
    noColumn: "Esta estación no tiene una columna en la tabla ancha.",
    previewPoints: "Puntos del archivo de vista previa",
    chosen: "Punto elegido",
    unitOf: "Unidad de",
    point: "Punto",
    noSeries: "No se pudo leer la serie.",
    noTime: "La columna de tiempo no está en el archivo.",
    noMap: "No se pudo cargar el mapa.",
    noCatalog: "No se pudo leer el catálogo. Abre el sitio desde un servidor estático, no como archivo local.",
    notFound: "No se encontró",
    answers: "Responde",
    doesNot: "No responde",
    readingKind: "Tipo de lectura",
    part: "Parte",
    down: "Baja",
    days: "días con valor",
    minimum: "mínimo",
    maximum: "máximo",
    publishedCoverage: "cobertura publicada",
    noNumbers: "no tiene valores numéricos.",
    statusPublished: "Publicado",
    statusExample: "Ejemplo",
    statusDraft: "Borrador",
    code: "Código",
    name: "Nombre",
    elevation: "Elevación",
    basin: "Cuenca",
    network: "Red",
    sensor: "Sensor",
    start: "Inicio",
    end: "Fin",
    station: "Estación",
    temperature: "Temperatura",
    from: "De",
    to: "a",
  },
  en: {
    skip: "Skip to content",
    catalog: "Catalog",
    langLabel: "Language",
    colophon: "Records come from <span class=\"mono\">catalog/index.json</span> and from each dataset sheet. There is no database behind this page.",
    loading: "Loading the catalog…",
    publishedOne: "published",
    publishedMany: "published",
    recordOne: "record",
    recordMany: "records",
    coverage: "catalog coverage",
    search: "Search by place, theme, or title",
    all: "All",
    empty: "No dataset matches that filter.",
    reading: "Reading",
    sheet: "Sheet",
    back: "← Catalog",
    missing: "That dataset is not in the catalog.",
    place: "Place",
    period: "Period",
    license: "License",
    noDoi: "No DOI",
    technical: "Technical sheet",
    made: "How it was made",
    instruments: "Instruments",
    unstated: "Not stated",
    crsOriginal: "Source CRS",
    crsPublished: "Published CRS",
    extent: "Extent",
    preparation: "Preparation",
    variables: "Variables",
    wideTable: "wide table, index {column}",
    files: "Files",
    download: "What can be downloaded",
    cite: "Citation",
    howCite: "How to cite it",
    copy: "Copy citation",
    copied: "Copied",
    notSay: "This does not say",
    sameData: "The same data",
    look: "Look",
    sheetLink: "The sheet",
    sheetNote: " has the units, the methods, and the citation.",
    chooseReading: "Choose a station. A gap in the line is a day without a measurement, not a day at zero.",
    chooseSheet: "Choose a station. The daily series is read then, not before.",
    filterPoints: "Filter points",
    readingSeries: "Reading this station’s series…",
    noColumn: "This station has no column in the wide table.",
    previewPoints: "Points from the preview file",
    chosen: "Chosen point",
    unitOf: "Unit of",
    point: "Point",
    noSeries: "The series could not be read.",
    noTime: "The time column is not in the file.",
    noMap: "The map could not be loaded.",
    noCatalog: "The catalog could not be read. Open the site from a static server, not as a local file.",
    notFound: "Not found",
    answers: "It answers",
    doesNot: "It does not answer",
    readingKind: "Kind of reading",
    part: "Part",
    down: "Scroll",
    days: "days with a value",
    minimum: "minimum",
    maximum: "maximum",
    publishedCoverage: "published coverage",
    noNumbers: "has no numeric values.",
    statusPublished: "Published",
    statusExample: "Example",
    statusDraft: "Draft",
    code: "Code",
    name: "Name",
    elevation: "Elevation",
    basin: "Basin",
    network: "Network",
    sensor: "Sensor",
    start: "Start",
    end: "End",
    station: "Station",
    temperature: "Temperature",
    from: "From",
    to: "to",
  },
};

function t(key) {
  return (COPY[state.lang] && COPY[state.lang][key]) || COPY.es[key] || key;
}

function statusLabel(status) {
  return { published: t("statusPublished"), example: t("statusExample"), draft: t("statusDraft") }[status] || status;
}

function fieldLabel(key) {
  return {
    code_internal: t("code"),
    name: t("name"),
    elevation: t("elevation"),
    basin: t("basin"),
    source: t("network"),
    sensor: t("sensor"),
    start_date: t("start"),
    end_date: t("end"),
    coverage: t("publishedCoverage"),
    station_id: t("station"),
    temp_c: t("temperature"),
  }[key] || key.replaceAll("_", " ");
}

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("hashchange", render);
render();

function scrollToStart() {
  window.scrollTo(0, 0);
}

async function render() {
  detachOverture();
  detachOverture = () => {};
  scrollToStart();
  const token = ++renderToken;
  const route = routeFromHash();
  try {
    if (!state.catalog) state.catalog = await fetchJson("catalog/index.json");
    if (token !== renderToken) return;
    if (route) await renderDataset(route.id, route.mode, token);
    else renderCatalog();
    scrollToStart();
    requestAnimationFrame(scrollToStart);
  } catch (error) {
    if (token !== renderToken) return;
    app.innerHTML = `<p class="status-line">${esc(error.message)}</p>`;
    scrollToStart();
  }
}

function renderCatalog() {
  const data = state.catalog.datasets;
  document.title = "Open Ecosystems";
  const themes = [...new Set(data.flatMap((item) => item.themes))].sort();
  const published = data.filter((item) => item.status === "published").length;
  const span = yearSpan(data);
  app.innerHTML = `
    ${overtureHtml()}
    <section class="catalog-block" id="catalogo">
    <h2 class="catalog-title">Catálogo</h2>
    <ul class="stats">
      <li><b>${published}</b><span>${published === 1 ? "publicado" : "publicados"}</span></li>
      <li><b>${data.length}</b><span>${data.length === 1 ? "registro" : "registros"}</span></li>
      <li><b>${esc(span)}</b><span>cobertura del catálogo</span></li>
    </ul>
    <div class="toolbar">
      <input class="search" id="q" type="search" placeholder="Buscar por lugar, tema o título" value="${esc(state.query)}">
      <div class="themes" id="themes">
        ${themeButton("todos", "Todos")}
        ${themes.map((theme) => themeButton(theme, theme)).join("")}
      </div>
    </div>
    <div class="entries" id="rows"></div>
    </section>
  `;
  document.querySelector("#q").addEventListener("input", (event) => {
    state.query = event.target.value;
    paintRows();
  });
  document.querySelector("#themes").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.theme = button.dataset.theme;
    for (const item of document.querySelectorAll("#themes button")) {
      item.setAttribute("aria-pressed", String(item === button));
    }
    paintRows();
  });
  paintRows();
  bindOverture();
}

function paintRows() {
  const needle = state.query.trim().toLowerCase();
  const rows = state.catalog.datasets
    .filter((item) => state.theme === "todos" || item.themes.includes(state.theme))
    .filter((item) => {
      if (!needle) return true;
      return [item.title, item.place, item.summary, item.themes.join(" ")].join(" ").toLowerCase().includes(needle);
    })
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || b.updated.localeCompare(a.updated));
  const host = document.querySelector("#rows");
  host.innerHTML = rows.length
    ? rows.map(entryHtml).join("")
    : `<p class="empty">Ningún dataset coincide con ese filtro.</p>`;
}

function entryHtml(item) {
  const badge = item.status === "published"
    ? ""
    : `<span class="badge ${esc(item.status)}">${esc(statusLabel(item.status))}</span>`;
  return `
    <a class="entry" href="#/dataset/${esc(item.id)}">
      <div>
        <h2 class="entry-title">${item.hasReading ? '<span class="badge">Lectura</span>' : ""}${esc(item.title)}</h2>
        <p>${esc(item.summary)}</p>
      </div>
      <p class="meta">${badge}${esc(item.place)}<br>${esc(item.temporal.start)} – ${esc(item.temporal.end)}<br>${esc(item.themes.join(" · "))}</p>
    </a>
  `;
}

async function renderDataset(id, mode, token) {
  const entry = state.catalog.datasets.find((item) => item.id === id);
  if (!entry) throw new Error("Ese dataset no está en el catálogo.");
  const dataset = await fetchJson(entry.path);
  if (token !== renderToken) return;
  document.title = `${dataset.title} — Open Ecosystems`;
  const figures = dataset.files.filter((file) => file.role === "figure" && file.path);
  const wide = dataset.variables.find((variable) => variable.layout && variable.layout.type === "wide");
  const reading = Boolean(dataset.divulgacion) && mode !== "ficha";
  const readingImages = new Set((dataset.divulgacion?.sections || []).map((section) => section.image).filter(Boolean));
  const lead = figures.find((file) => !readingImages.has(file.path)) || figures[0];
  app.innerHTML = reading
    ? readingDocument(dataset)
    : `
    <p><a class="back" href="#/">← Catálogo</a></p>
    ${modeSwitch(dataset, false)}
    <p class="kicker">${esc(statusLabel(dataset.status))} · v${esc(dataset.version)}</p>
    <h1>${esc(dataset.title)}</h1>
    <p class="summary">${esc(dataset.summary)}</p>
    ${lead ? figureHtml(lead) : ""}
    <dl class="facts">
      ${fact("Lugar", dataset.spatial.place)}
      ${fact("Periodo", `${dataset.temporal.start} – ${dataset.temporal.end}`)}
      ${fact("Licencia", dataset.rights.license)}
      ${fact("DOI", dataset.doi ? "" : "Sin DOI")}
    </dl>
    <div id="viewer"></div>
    <div id="chart"></div>
    ${tripticoHtml(dataset.triptico)}
    <section class="panel-block">
      <p class="index">Ficha técnica</p>
      <h2>Cómo está hecho</h2>
      ${sheetHtml([
        ["Instrumentos", dataset.methods.instruments.join(", ") || "No indicados"],
        ["CRS de origen", dataset.methods.crsOriginal],
        ["CRS publicado", dataset.spatial.crs],
        ["Extensión", dataset.spatial.bbox.join(", ")],
        ["Preparación", dataset.provenance.preparationNote],
      ])}
      <h2>Variables</h2>
      <table class="sheet">
        <tbody>
          ${dataset.variables.map(variableRow).join("")}
        </tbody>
      </table>
    </section>
    <section class="panel-block">
      <p class="index">Archivos</p>
      <h2>Qué se puede descargar</h2>
      <ul class="files">
        ${dataset.files.map((file) => fileHtml(dataset, file)).join("")}
      </ul>
    </section>
    <section class="panel-block">
      <p class="index">Cita</p>
      <h2>Cómo citarlo</h2>
      <textarea class="citation" id="citation" readonly>${esc(dataset.citation)}</textarea>
      <p><button class="copy" type="button" id="copy">Copiar cita</button></p>
      <p class="chart-note">${esc(dataset.rights.attribution)}</p>
    </section>
  `;
  if (!reading) {
    const doiFact = dataset.doi
      ? `<a href="https://doi.org/${esc(dataset.doi)}">doi.org/${esc(dataset.doi)}</a>`
      : "Sin DOI";
    document.querySelector(".facts div:last-child strong").innerHTML = doiFact;
    document.querySelector("#copy").addEventListener("click", copyCitation);
  }
  if (dataset.preview && dataset.preview.kind && dataset.preview.kind !== "none") {
    mountViewer(
      dataset,
      wide,
      token,
      reading ? "Elige una estación. Un hueco en la línea es un día sin medición, no un día en cero." : ""
    );
  }
  if (!reading) previewSmallTables(dataset, token);
}

function readingDocument(dataset) {
  const reading = dataset.divulgacion;
  const sections = reading.sections.map((section) => `
    <section class="story">
      <h2>${esc(section.title)}</h2>
      <p>${esc(section.body)}</p>
      ${section.image ? `<figure class="figure"><img src="${esc(fileUrl(dataset, section.image))}" alt="${esc(section.caption || section.title)}"><figcaption>${esc(section.caption || "")}</figcaption></figure>` : ""}
    </section>
  `).join("");
  return `
    <article class="reading">
    <p><a class="back" href="#/">← Catálogo</a></p>
    ${modeSwitch(dataset, true)}
    <p class="kicker">Lectura</p>
    <h1>${esc(reading.title)}</h1>
    <p class="lede">${esc(reading.lede)}</p>
    ${sections}
    <section class="limits">
      <h2>Lo que no dice</h2>
      <ul>${reading.limits.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </section>
    <section class="panel-block">
      <p class="index">El mismo archivo</p>
      <h2>Para mirarlo</h2>
      <div id="viewer"></div>
      <div id="chart"></div>
      <p class="chart-note"><a href="#/dataset/${encodeURIComponent(dataset.id)}/ficha">La ficha</a> tiene unidades, métodos y la cita.</p>
    </section>
    </article>
  `;
}

function modeSwitch(dataset, reading) {
  if (!dataset.divulgacion) return "";
  const base = `#/dataset/${encodeURIComponent(dataset.id)}`;
  return `
    <nav class="modes" aria-label="Tipo de lectura">
      <a href="${base}/lectura"${reading ? ' aria-current="page"' : ""}>Lectura</a>
      <a href="${base}/ficha"${reading ? "" : ' aria-current="page"'}>Ficha</a>
    </nav>
  `;
}

function overtureHtml() {
  const list = beats();
  const marks = list.map((_, index) => `<button type="button" data-beat="${index}" aria-label="Parte ${index + 1}"></button>`).join("");
  const beatHtml = list.map((beat, index) => `
    <article class="beat" data-beat="${index}">
      <p class="kicker">${esc(beat.kicker)}</p>
      <h1>${esc(beat.title)}</h1>
      ${beat.body ? `<p class="lede">${esc(beat.body)}</p>` : `<p class="scroll-hint">Baja</p>`}
    </article>
  `).join("");
  return `
    <section class="overture" id="overture">
      <div class="overture-pin">
        <div class="overture-stage">${beatHtml}</div>
        <div class="overture-marks">${marks}</div>
      </div>
    </section>
  `;
}

function smoothstep(value) {
  const u = Math.min(1, Math.max(0, value));
  return u * u * (3 - 2 * u);
}

function bindOverture() {
  const root = document.querySelector("#overture");
  if (!root) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const beats = [...root.querySelectorAll(".beat")];
  const marks = [...root.querySelectorAll(".overture-marks button")];
  const markRow = root.querySelector(".overture-marks");
  const catalog = document.querySelector("#catalogo");

  if (reduced) {
    root.classList.add("is-stacked");
    beats.forEach((beat) => beat.removeAttribute("aria-hidden"));
    return;
  }

  const travel = beats.length - 1 + 1.15;

  function pose(index, cursor) {
    const last = index === beats.length - 1;
    const delta = cursor - index;
    if (index > 0 && delta >= -0.22 && delta < 0) {
      const u = smoothstep((delta + 0.22) / 0.22);
      return { opacity: u, y: (1 - u) * 26 };
    }
    if (delta >= 0 && delta < (last ? 0.42 : 0.5)) return { opacity: 1, y: 0 };
    if (!last && delta >= 0.5 && delta < 0.74) {
      const u = smoothstep((delta - 0.5) / 0.24);
      return { opacity: 1 - u, y: -26 * u };
    }
    if (last && delta >= 0.42 && delta < 0.78) {
      const u = smoothstep((delta - 0.42) / 0.36);
      return { opacity: 1 - u, y: -26 * u };
    }
    return { opacity: 0, y: delta < 0 ? 26 : -26 };
  }

  function place(progress) {
    const cursor = Math.min(travel, Math.max(0, progress * travel));
    let shown = 0;
    beats.forEach((beat, index) => {
      const frame = pose(index, cursor);
      shown = Math.max(shown, frame.opacity);
      beat.style.opacity = String(frame.opacity);
      beat.style.transform = `translate3d(0, ${frame.y.toFixed(2)}px, 0)`;
      beat.style.visibility = frame.opacity < 0.02 ? "hidden" : "visible";
      beat.setAttribute("aria-hidden", frame.opacity < 0.08 ? "true" : "false");
    });
    const enter = smoothstep((cursor - (beats.length - 1 + 0.8)) / 0.32);
    if (catalog) {
      catalog.style.opacity = String(enter);
      catalog.style.transform = `translate3d(0, ${(1 - enter) * 24}px, 0)`;
    }
    const marksLeft = shown * (1 - enter);
    markRow.style.opacity = String(marksLeft);
    markRow.style.pointerEvents = marksLeft < 0.35 ? "none" : "auto";
    marks.forEach((mark, index) => {
      const heat = Math.max(0, 1 - Math.abs(cursor - (index + 0.2)) / 0.65);
      mark.style.transform = `scaleX(${0.55 + heat * 0.65})`;
      if (heat > 0.7) mark.setAttribute("aria-current", "true");
      else mark.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    const span = Math.max(root.offsetHeight - window.innerHeight, 1);
    const passed = Math.min(Math.max(-root.getBoundingClientRect().top, 0), span);
    place(passed / span);
  }

  marks.forEach((mark, index) => {
    mark.addEventListener("click", () => {
      const span = Math.max(root.offsetHeight - window.innerHeight, 1);
      const top = root.getBoundingClientRect().top + window.scrollY;
      const progress = Math.min(1, (index + 0.16) / travel);
      window.scrollTo({ top: top + span * progress, behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  detachOverture = () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

function mountViewer(dataset, wide, token, chartHint) {
  const kind = dataset.preview.kind;
  const host = document.querySelector("#viewer");
  if (kind === "map-points" || kind === "map-polygons") {
    host.innerHTML = `
      <div class="stage">
        <div>
          <div class="map" id="map"></div>
          <p class="legend" id="legend"></p>
        </div>
        <div class="panel">
          <input class="search" id="station-q" type="search" placeholder="Filtrar puntos">
          <div class="station-list" id="stations"></div>
        </div>
      </div>
      <div id="selected"></div>
    `;
    if (wide) {
      document.querySelector("#chart").innerHTML = `
        <div class="chart-block">
          <p class="chart-note" id="chart-note">${esc(chartHint || "Elige una estación. La serie diaria se lee entonces, no antes.")}</p>
          <div id="chart-view" aria-live="polite"></div>
        </div>
      `;
    }
    loadMap(dataset, wide, token);
    return;
  }
  if (kind === "time-series" || kind === "table") {
    host.innerHTML = `<div id="inline-table"></div>`;
  }
}

async function loadMap(dataset, wide, token) {
  const preview = dataset.preview;
  try {
    await loadLeaflet();
    const geojson = await fetchJson(fileUrl(dataset, preview.file));
    if (token !== renderToken || !window.L) return;
    const features = geojson.features || [];
    features.forEach((feature, index) => { feature.__index = index; });
    const values = features
      .map((feature) => Number(feature.properties?.[preview.valueField]))
      .filter((value) => Number.isFinite(value));
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const variable = dataset.variables.find((item) => item.column === preview.valueField);
    const unit = variable ? variable.unit : "";
    document.querySelector("#legend").textContent = variable
      ? `${variable.name} (${unit}): ${formatNumber(min)} – ${formatNumber(max)}`
      : preview.valueField
        ? `${preview.valueField}: ${formatNumber(min)} – ${formatNumber(max)}`
        : "Puntos del archivo de vista previa";

    const map = L.map("map", { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 16,
    }).addTo(map);

    const markers = [];
    const layer = L.geoJSON(geojson, {
      pointToLayer(feature, latlng) {
        const marker = L.circleMarker(latlng, pointStyle(feature, preview.valueField, min, max, false));
        markers.push({ feature, marker });
        return marker;
      },
      style: () => ({ color: "#0f6e6e", weight: 1.5, fillColor: "#0f6e6e", fillOpacity: 0.25 }),
      onEachFeature(feature, layerItem) {
        layerItem.on("click", () => choose(feature));
      },
    }).addTo(map);
    if (features.length) map.fitBounds(layer.getBounds().pad(0.12));
    else map.setView([-33.4, -70.6], 4);
    requestAnimationFrame(() => map.invalidateSize());

    const list = document.querySelector("#stations");
    let selected = null;
    const paintList = () => {
      const needle = document.querySelector("#station-q").value.trim().toLowerCase();
      const visible = markers.filter(({ feature }) => featureText(feature).includes(needle));
      list.innerHTML = visible.map(({ feature }) => stationButton(feature, preview.valueField, min, max)).join("");
      for (const button of list.querySelectorAll(".station")) {
        if (selected && Number(button.dataset.index) === selected.__index) button.setAttribute("aria-current", "true");
      }
      for (const { feature, marker } of markers) {
        const on = featureText(feature).includes(needle);
        const style = pointStyle(feature, preview.valueField, min, max, feature === selected);
        if (!on) { style.opacity = 0.15; style.fillOpacity = 0.08; }
        if (marker.setStyle) marker.setStyle(style);
      }
    };
    document.querySelector("#station-q").addEventListener("input", paintList);
    list.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      choose(features[Number(button.dataset.index)]);
    });
    paintList();

    function choose(feature) {
      selected = feature;
      paintList();
      list.querySelector(`[data-index="${feature.__index}"]`)?.scrollIntoView({ block: "nearest" });
      document.querySelector("#selected").innerHTML = selectedHtml(feature, dataset);
      if (wide) showSeries(dataset, wide, feature);
    }
  } catch (error) {
    if (token !== renderToken) return;
    document.querySelector("#viewer").innerHTML = `<p class="status-line">${esc(error.message)}</p>`;
  }
}

async function showSeries(dataset, variable, feature) {
  const note = document.querySelector("#chart-note");
  const view = document.querySelector("#chart-view");
  note.textContent = "Leyendo la serie de esta estación…";
  view.innerHTML = "";
  try {
    const series = await loadSeries(dataset, variable);
    const key = seriesKey(feature.properties, series.columns);
    if (!key) {
      note.textContent = "Esta estación no tiene una columna en la tabla ancha.";
      return;
    }
    const values = series.columns[key];
    const finite = values.map((value, index) => [index, value]).filter((pair) => pair[1] != null);
    if (!finite.length) {
      note.textContent = `${featureLabel(feature.properties)} no tiene valores numéricos.`;
      return;
    }
    const nums = finite.map((pair) => pair[1]);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const first = finite[0][0];
    const last = finite[finite.length - 1][0];
    const span = [];
    for (let index = first; index <= last; index++) span.push([index, values[index]]);
    const start = series.dates[first];
    const end = series.dates[last];
    const coverage = feature.properties.coverage;
    note.textContent = `${featureLabel(feature.properties)} · ${variable.name} (${variable.unit}) · ${start} – ${end}`;
    view.innerHTML = `
      <ul class="stats">
        <li><b>${finite.length.toLocaleString("es-CL")}</b><span>días con valor</span></li>
        <li><b>${formatNumber(min)}</b><span>mínimo (${esc(variable.unit)})</span></li>
        <li><b>${formatNumber(max)}</b><span>máximo (${esc(variable.unit)})</span></li>
        ${coverage ? `<li><b>${esc(coverage)}</b><span>cobertura publicada</span></li>` : ""}
      </ul>
      ${chartSvg(span, min, max, start, end, variable)}
    `;
  } catch (error) {
    note.textContent = error.message;
  }
}

function chartSvg(points, min, max, start, end, variable) {
  const width = 800;
  const height = 220;
  const left = 64;
  const right = 12;
  const top = 12;
  const bottom = 28;
  const span = max - min || 1;
  const x0 = points[0][0];
  const x1 = points[points.length - 1][0];
  const x = (index) => (x1 === x0
    ? left + (width - left - right) / 2
    : left + ((index - x0) / (x1 - x0)) * (width - left - right));
  const y = (value) => top + (1 - (value - min) / span) * (height - top - bottom);
  let path = "";
  let drawing = false;
  const dots = [];
  for (const [index, value] of points) {
    if (value == null) { drawing = false; continue; }
    const px = x(index).toFixed(1);
    const py = y(value).toFixed(1);
    path += `${drawing ? "L" : "M"}${px},${py}`;
    drawing = true;
    if (x1 === x0) dots.push(`<circle cx="${px}" cy="${py}" r="3" fill="#0f6e6e"/>`);
  }
  const label = `${variable.name}, ${variable.unit}. De ${start} a ${end}. Mínimo ${min}, máximo ${max}.`;
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">
      <line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" stroke="#d9d1c3"/>
      <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="#d9d1c3"/>
      <path d="${path}" fill="none" stroke="#0f6e6e" stroke-width="1.4"/>
      ${dots.join("")}
      <text x="${left - 8}" y="${top + 10}" text-anchor="end" fill="#5c564c" font-size="12" font-family="IBM Plex Mono, monospace">${esc(formatNumber(max))}</text>
      <text x="${left - 8}" y="${height - bottom}" text-anchor="end" fill="#5c564c" font-size="12" font-family="IBM Plex Mono, monospace">${esc(formatNumber(min))}</text>
      <text x="${left}" y="${height - 8}" fill="#5c564c" font-size="12" font-family="IBM Plex Mono, monospace">${esc(start)}</text>
      <text x="${width - right}" y="${height - 8}" fill="#5c564c" font-size="12" text-anchor="end" font-family="IBM Plex Mono, monospace">${esc(end)}</text>
    </svg>
  `;
}

async function loadSeries(dataset, variable) {
  const cacheKey = `${dataset.id}|${variable.layout.file}`;
  if (seriesCache.has(cacheKey)) return seriesCache.get(cacheKey);
  const response = await fetch(fileUrl(dataset, variable.layout.file));
  if (!response.ok) throw new Error("No se pudo leer la serie.");
  const rows = parseCsv(await response.text());
  const header = rows[0] || [];
  const index = header.indexOf(variable.layout.indexColumn);
  if (index < 0) throw new Error("La columna de tiempo no está en el archivo.");
  const columns = {};
  header.forEach((name, column) => {
    if (column !== index) columns[name] = [];
  });
  const dates = [];
  for (const row of rows.slice(1)) {
    dates.push(row[index] || "");
    header.forEach((name, column) => {
      if (column === index) return;
      const raw = (row[column] || "").trim();
      const value = raw === "" ? null : Number(raw);
      columns[name].push(Number.isFinite(value) ? value : null);
    });
  }
  const series = { dates, columns };
  seriesCache.set(cacheKey, series);
  return series;
}

async function previewSmallTables(dataset, token) {
  const wideFiles = new Set(dataset.variables.filter((item) => item.layout).map((item) => item.layout.file));
  for (const file of dataset.files) {
    if (file.role !== "table" || !file.path || wideFiles.has(file.path)) continue;
    const response = await fetch(fileUrl(dataset, file.path));
    if (!response.ok || token !== renderToken) continue;
    const rows = parseCsv(await response.text());
    if (rows.length < 2 || rows.length > 31) continue;
    const host = document.querySelector(`[data-table="${CSS.escape(file.path)}"]`);
    if (host) host.innerHTML = tableHtml(rows);
  }
}

function tableHtml(rows) {
  const [header, ...body] = rows;
  return `<table class="sheet"><thead><tr>${header.map((cell) => `<th>${esc(cell)}</th>`).join("")}</tr></thead><tbody>${
    body.map((row) => `<tr>${header.map((_, index) => `<td>${esc(row[index] || "")}</td>`).join("")}</tr>`).join("")
  }</tbody></table>`;
}

function tripticoHtml(triptico) {
  return `
    <div class="triptico">
      ${panelHtml("01", triptico.contexto.title, triptico.contexto.body, `<ul class="chips">${triptico.contexto.highlights.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`)}
      ${panelHtml("02", triptico.lectura.title, triptico.lectura.body, `<ul class="caveats">${triptico.lectura.caveats.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`)}
      ${panelHtml("03", triptico.uso.title, triptico.uso.body, `
        <div class="split">
          <div><h3>Responde</h3><ul>${triptico.uso.answers.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
          <div><h3>No responde</h3><ul>${triptico.uso.doesNotAnswer.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
        </div>
      `)}
    </div>
  `;
}

function panelHtml(index, title, body, extra) {
  return `<section class="panel-block"><p class="index">${index}</p><h2>${esc(title)}</h2><p>${esc(body)}</p>${extra}</section>`;
}

function figureHtml(file) {
  return `<figure class="figure"><img src="${esc(fileUrl({ id: currentDatasetId() }, file.path))}" alt="${esc(file.description)}"><figcaption class="mono">${esc(file.title)}. ${esc(file.description)}</figcaption></figure>`;
}

function fileHtml(dataset, file) {
  const href = file.url || (file.path ? fileUrl(dataset, file.path) : "");
  const external = Boolean(file.url);
  return `
    <li>
      <a href="${esc(href)}" ${external ? 'target="_blank" rel="noopener noreferrer"' : ""}>${esc(file.title)}</a>
      <span class="badge">${esc(file.role)}</span>
      <p>${esc(file.description)}</p>
      ${file.path ? `<p class="file-path">${esc(file.path)}</p>` : ""}
      <div data-table="${esc(file.path || "")}"></div>
    </li>
  `;
}

function variableRow(variable) {
  const where = variable.layout
    ? `tabla ancha, índice ${variable.layout.indexColumn}`
    : variable.column;
  return `<tr><th>${esc(variable.name)}</th><td><span class="mono">${esc(variable.unit)}</span> · ${esc(where)}<br>${esc(variable.description)}</td></tr>`;
}

function sheetHtml(rows) {
  return `<table class="sheet"><tbody>${rows.map(([key, value]) => `<tr><th>${esc(key)}</th><td>${esc(value)}</td></tr>`).join("")}</tbody></table>`;
}

function fact(label, value) {
  return `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function stationButton(feature, valueField, min, max) {
  const props = feature.properties || {};
  const index = featureIndex(feature);
  return `
    <button class="station" type="button" data-index="${index}">
      <span class="swatch" style="background:${colorFor(Number(props[valueField]), min, max)}"></span>
      <span>${esc(featureLabel(props))}</span>
      <small>${esc(featureMeta(props, valueField))}</small>
    </button>
  `;
}

function selectedHtml(feature, dataset) {
  const props = feature.properties || {};
  const rows = Object.entries(props)
    .filter(([key]) => key !== "name")
    .map(([key, value]) => [fieldLabel(key), value]);
  const variable = dataset.variables.find((item) => item.column && props[item.column] != null);
  if (variable) rows.unshift(["Unidad de " + variable.name, variable.unit]);
  return `<section class="panel-block"><p class="index">Punto elegido</p><h2>${esc(featureLabel(props))}</h2>${sheetHtml(rows)}</section>`;
}

function pointStyle(feature, valueField, min, max, selected) {
  const value = Number(feature.properties?.[valueField]);
  return {
    radius: selected ? 8 : 5.5,
    color: selected ? "#17211b" : "#f3efe6",
    weight: selected ? 2 : 1,
    fillColor: colorFor(value, min, max),
    fillOpacity: 0.92,
    opacity: 1,
  };
}

function colorFor(value, min, max) {
  if (!Number.isFinite(value)) return "#8d877c";
  const t = max === min ? 0.5 : (value - min) / (max - min);
  const from = [214, 196, 168];
  const to = [15, 110, 110];
  const mix = from.map((channel, index) => Math.round(channel + (to[index] - channel) * t));
  return `rgb(${mix.join(",")})`;
}

function featureLabel(props) {
  return props.name || props.station_id || props.code_internal || "Punto";
}

function featureMeta(props, valueField) {
  return [props.source, props[valueField], props.station_id].filter((value) => value != null && value !== "").join(" · ");
}

function featureText(feature) {
  return Object.values(feature.properties || {}).join(" ").toLowerCase();
}

function featureIndex(feature) {
  return feature.__index;
}

function seriesKey(props, columns) {
  return [props.code_internal, props.station_id, props.id, props.name].map((value) => String(value ?? "")).find((value) => value && Object.prototype.hasOwnProperty.call(columns, value));
}

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("No se pudo cargar el mapa."));
      document.head.appendChild(script);
    });
  }
  return leafletPromise;
}

function currentDatasetId() {
  return datasetIdFromHash();
}

function routeFromHash() {
  const match = decodeURIComponent(location.hash.replace(/^#/, "")).match(/^\/dataset\/([^/]+)(?:\/(lectura|ficha))?\/?$/);
  if (!match) return null;
  return { id: match[1], mode: match[2] || "lectura" };
}

function datasetIdFromHash() {
  return routeFromHash()?.id || "";
}

function fileUrl(dataset, relative) {
  return `datasets/${dataset.id}/${relative}`;
}

function yearSpan(datasets) {
  const years = datasets.flatMap((item) => [item.temporal.start, item.temporal.end].map((value) => value.slice(0, 4)));
  if (!years.length) return "—";
  const sorted = [...years].sort();
  return sorted[0] === sorted[sorted.length - 1] ? sorted[0] : `${sorted[0]}–${sorted[sorted.length - 1]}`;
}

function statusRank(status) {
  return { published: 0, draft: 1, example: 2 }[status] ?? 3;
}

function themeButton(theme, label) {
  const pressed = state.theme === theme;
  return `<button type="button" data-theme="${esc(theme)}" aria-pressed="${pressed}">${esc(label)}</button>`;
}

function formatNumber(value) {
  return Number(value).toLocaleString("es-CL", { maximumFractionDigits: 1 });
}

async function copyCitation() {
  const text = document.querySelector("#citation").value;
  try {
    await navigator.clipboard.writeText(text);
    document.querySelector("#copy").textContent = "Copiada";
  } catch {
    document.querySelector("#citation").select();
  }
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new Error("No se pudo leer el catálogo. Abre el sitio desde un servidor estático, no como archivo local.");
  }
  if (!response.ok) throw new Error(`No se encontró ${url}`);
  return response.json();
}

function parseCsv(text) {
  const src = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 1; }
        else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((item) => item.some((value) => value.trim() !== ""));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

# Arquitectura

Open Ecos es un catálogo estático de datasets ambientales curados. Cada dataset es una ventana cerrada: no se actualiza solo. Se publica cuando alguien prepara los archivos, escribe el tríptico y regenera el índice.

El producto no es un portal de archivos. Es el archivo junto con una explicación obligatoria de para qué sirve, cómo se lee y qué no puede responder.

## Qué queda fuera

- No replica a datos.gob.cl ni ingesta APIs de instituciones.
- No tiene base de datos ni servidor propio.
- No guarda rasters, nubes de puntos ni ortomosaicos en git.
- El sitio estático lee solo los archivos definidos aquí. No infiere significado que el JSON no declare.

## Tres capas

**Curaduría.** Ocurre fuera del sitio, en tu computador. Ahí viven el CSV original, el GeoTIFF del Mavic, la nube del L2 y los scripts de limpieza de esa campaña. Esa carpeta puede llamarse `raw/` y no se versiona.

**Publicación.** Es este repositorio. Una carpeta por dataset, un `dataset.json` que cumple el esquema, y vistas livianas en `data/`. El comando `python scripts/build_catalog.py` revisa todo y escribe `catalog/index.json`. La carpeta `datasets/_plantilla/` es el molde para un registro nuevo: no entra al catálogo. La página `#/contribuir` hace las mismas preguntas y descarga un `dataset.json`. No lo publica: no hay a quién enviárselo.

**Lectura.** `index.html` y `site/` sirven estos archivos. No calculan nada. Si un archivo no está en el repo o no está enlazado con su URL externa, el sitio no lo puede mostrar. La ruta `#/dataset/<id>/lectura` usa `divulgacion` cuando existe; `#/dataset/<id>/ficha` muestra el tríptico.

```text
curaduría local          publicación                lectura
raw/ y Zenodo     ->     datasets/ + catalog/  ->   sitio estático
(no es el producto)      (este repo)                (index.html)
```

## El tríptico

Tres paneles, los tres obligatorios. Si falta uno, el dataset no entra al catálogo.

1. **Contexto.** Lugar y pregunta. Qué ventana de tiempo es, y qué no es.
2. **Lectura.** Unidades, columnas, CRS y advertencias. Aquí se mata el `VALOR_1`.
3. **Uso.** Preguntas que el dataset sí responde y preguntas que parece responder pero no. La cita va en la ficha, no escondida en un PDF.

Eso es lo que lo distingue de un portal de descarga. datos.gob.cl puede seguir siendo la fuente de un archivo. Open Ecos es la capa que lo hace reusable: FAIR en la ficha, y un límite explícito de interpretación en el tercer panel.

`divulgacion` es opcional y no reemplaza al tríptico. Es la misma evidencia en lenguaje llano, con imágenes y con los límites repetidos. La ficha sigue siendo la versión para citar.

## Dónde va cada archivo

| Pieza | Dónde | Por qué |
| --- | --- | --- |
| Ficha y tríptico | `datasets/<id>/dataset.json` | Es el contrato. El sitio no infiere significado. |
| CSV, GeoJSON, figura chica | `datasets/<id>/data/` | Se pueden mirar en el navegador. Tope: 8 MB por archivo. |
| GeoTIFF, LAS/LAZ, mosaicos | Zenodo, enlazados en `files[]` con `role: archive` | DOI, versión y almacenamiento de investigación. Git no es un archivo científico. |
| Índice del sitio | `catalog/index.json` | Generado. Se commitea para que el host no necesite un build. |

El bbox publicado va siempre en EPSG:4326, orden oeste, sur, este, norte. El CRS de captura se anota en `methods.crsOriginal`. Si el origen es desconocido, se escribe `desconocido` y se repite en las advertencias. `country` es una lista de códigos ISO: un dataset puede cubrir Chile y Argentina. Si hay DOI, va en `doi`. Si hay un artículo que publica el registro, va en `publication`. Si no lo hay, el campo no va.

Una variable se declara de una de estas dos formas. Si el valor vive en una columna, `column` nombra esa columna y ella tiene que existir en un CSV o en las propiedades del GeoJSON. Si el valor es una tabla ancha —el tiempo en una columna y una serie distinta en cada columna siguiente, aunque el encabezado sea un código de estación— la variable usa `layout.type: wide`, con el archivo y la columna índice. El validador rechaza la ficha cuando eso no se cumple.

## Árbol

```text
schema/dataset.schema.json     contrato de un dataset
schema/catalog.schema.json     contrato del índice
scripts/build_catalog.py       valida y regenera catalog/index.json
scripts/validate_datasets.py   solo valida
catalog/index.json             lo que va a leer el futuro listado
datasets/<id>/dataset.json
datasets/<id>/data/            solo vistas livianas
raw/                           local, ignorada por git
```

Hay un dataset de muestra, `ejemplo-salar-huasco-temperatura`. Sus números son inventados. Sirve para probar el contrato, no para citar.

## Cómo se publica un dataset

1. Copiar `datasets/ejemplo-salar-huasco-temperatura` a `datasets/<id-nuevo>`.
2. Dejar en `data/` solo la vista liviana, ya limpia y en WGS84.
3. Si hay un binario grande, subirlo a Zenodo y poner la URL y el DOI en `files` con rol `archive`.
4. Escribir el tríptico, incluidas las preguntas que el dataset no responde.
5. Correr `python scripts/build_catalog.py`.
6. Si pasa, commitear la carpeta del dataset y `catalog/index.json`.

No hay otro camino de escritura. Una actualización manual sube `version`, cambia `updated` y vuelve a generar el índice. La versión anterior que importe se conserva en Zenodo, no reescribiendo la historia del DOI.

Temas previstos, sin lista cerrada: `nieve`, `humedales`, `temperatura`, `teledeteccion`, `agua`, `biodiversidad`, `suelos`, `clima`.

## Lo que el frontend va a poder asumir

Cuando exista, el sitio solo depende de estas reglas:

- El listado sale de `catalog/index.json`.
- La ficha sale de `datasets/<id>/dataset.json`.
- `preview.kind` dice qué vista intentar: `map-points`, `map-polygons`, `time-series`, `table` o `none`.
- Si el kind no se reconoce, se muestra el tríptico y la lista de archivos. No se inventa un gráfico.
- `status: example` se puede mostrar como muestra. `published` es lo citable. `draft` no debería enlazarse como fuente.
- Los archivos `archive` se descargan desde su URL. El sitio no los proxea.

Esa frontera permite cambiar el frontend sin tocar los datos, y publicar un dataset sin esperar a que el visor sepa dibujarlo.

## Límites

El cuello de botella queda en la curaduría. El esquema no limpia datos: impide publicar una ficha muda. Si durante seis meses no entra un dataset, el catálogo se ve quieto porque lo está. Eso es preferible a una ingesta automática que se rompe cuando una institución cambia una columna.

El primer dataset real tiene que ser uno chico y propio, o una republicación corta con licencia clara. Un mosaico multiespectral completo no es el primer publicado: primero va la ficha, el GeoJSON o el CSV de apoyo, y el enlace al archivo grande.

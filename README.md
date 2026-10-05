# Open Ecos

Catálogo estático de datos ambientales curados. Cada dataset se publica a mano e incluye un tríptico: contexto, cómo leerlo y para qué sirve.

La arquitectura está en [ARCHITECTURE.md](ARCHITECTURE.md). El sitio estático es `index.html`: lee el catálogo y no tiene servidor propio.

```bash
python -m http.server 8765
```

Abre `http://127.0.0.1:8765/`.

```bash
python scripts/build_catalog.py
```

Ese comando valida `datasets/` y regenera `catalog/index.json`.

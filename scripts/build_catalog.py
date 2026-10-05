"""Regenera catalog/index.json a partir de datasets válidos.

El índice se commitea. El sitio estático lo lee; no hay un servidor que lo calcule.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from schema_validate import validate_schema
from validate_datasets import ROOT, collect_datasets

CATALOG_PATH = ROOT / "catalog" / "index.json"
CATALOG_SCHEMA_PATH = ROOT / "schema" / "catalog.schema.json"


def main() -> int:
    datasets, errors = collect_datasets()
    if errors:
        for error in errors:
            print(f"error: {error}")
        print("\nno se escribió el catálogo")
        return 1

    catalog = {
        "formatVersion": 1,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "datasets": [_entry(dataset) for dataset, _folder in _sorted(datasets)],
    }
    schema = json.loads(CATALOG_SCHEMA_PATH.read_text(encoding="utf-8"))
    schema_errors = validate_schema(catalog, schema)
    if schema_errors:
        for error in schema_errors:
            print(f"error: catálogo generado inválido: {error}")
        return 1

    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"ok: {CATALOG_PATH.relative_to(ROOT).as_posix()} ({len(catalog['datasets'])} datasets)")
    return 0


def _sorted(datasets: list[tuple[dict, Path]]) -> list[tuple[dict, Path]]:
    return sorted(datasets, key=lambda item: (item[0]["updated"], item[0]["id"]), reverse=True)


def _cover(dataset: dict) -> str | None:
    reading = dataset.get("divulgacion") or {}
    for section in reading.get("sections") or []:
        image = section.get("image")
        if image:
            return f"datasets/{dataset['id']}/{image}"
    for item in dataset.get("files") or []:
        if item.get("role") == "figure" and item.get("path"):
            return f"datasets/{dataset['id']}/{item['path']}"
    return None


def _entry(dataset: dict) -> dict:
    return {
        "id": dataset["id"],
        "title": dataset["title"],
        "summary": dataset["summary"],
        "status": dataset["status"],
        "language": dataset["language"],
        "license": dataset["rights"]["license"],
        "themes": dataset["themes"],
        "place": dataset["spatial"]["place"],
        "country": dataset["spatial"]["country"],
        "bbox": dataset["spatial"]["bbox"],
        "temporal": dataset["temporal"],
        "version": dataset["version"],
        "updated": dataset["updated"],
        "previewKind": dataset["preview"]["kind"],
        "path": f"datasets/{dataset['id']}/dataset.json",
        "doi": dataset.get("doi"),
        "hasReading": "divulgacion" in dataset,
        "readingTitle": (dataset.get("divulgacion") or {}).get("title"),
        "cover": _cover(dataset),
    }


if __name__ == "__main__":
    sys.exit(main())

"""Valida cada carpeta en datasets/.

Reglas que el esquema no puede expresar: la carpeta se llama como el id,
los archivos livianos existen y son chicos, las columnas declaradas existen,
el bbox está en grados y las referencias cruzadas apuntan a otro dataset.
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from schema_validate import validate_schema

ROOT = Path(__file__).resolve().parents[1]
DATASETS_DIR = ROOT / "datasets"
SCHEMA_PATH = ROOT / "schema" / "dataset.schema.json"
MAX_LOCAL_BYTES = 8 * 1024 * 1024
LOCAL_ROLES = {"preview", "table", "figure"}


def main() -> int:
    datasets, errors = collect_datasets()
    for error in errors:
        print(f"error: {error}")
    if errors:
        print(f"\n{len(errors)} error(es), {len(datasets)} dataset(s) válido(s)")
        return 1
    print(f"ok: {len(datasets)} dataset(s)")
    for dataset, _folder in datasets:
        print(f"  {dataset['id']} ({dataset['status']})")
    return 0


def collect_datasets() -> tuple[list[tuple[dict, Path]], list[str]]:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []
    found: list[tuple[dict, Path]] = []

    if not DATASETS_DIR.is_dir():
        return [], ["no existe la carpeta datasets/"]

    folders = sorted(
        path for path in DATASETS_DIR.iterdir() if path.is_dir() and not path.name.startswith("_")
    )
    if not folders:
        return [], ["no hay datasets. Copia el ejemplo y cambia el id."]

    for folder in folders:
        dataset, folder_errors = _load_dataset(folder, schema)
        if folder_errors:
            errors.extend(folder_errors)
            continue
        found.append((dataset, folder))

    known_ids = {dataset["id"] for dataset, _folder in found}
    for dataset, _folder in found:
        for related_id in dataset["related"]:
            if related_id == dataset["id"]:
                errors.append(f"{dataset['id']}: related no puede apuntar a sí mismo")
            elif related_id not in known_ids:
                errors.append(f"{dataset['id']}: related '{related_id}' no existe")

    return found, errors


def _load_dataset(folder: Path, schema: dict) -> tuple[dict | None, list[str]]:
    path = folder / "dataset.json"
    label = folder.name
    if not path.is_file():
        return None, [f"{label}: falta dataset.json"]

    try:
        dataset = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return None, [f"{label}: dataset.json no es JSON válido ({exc})"]

    if not isinstance(dataset, dict):
        return None, [f"{label}: dataset.json debe ser un objeto"]

    errors = [f"{label}: {message}" for message in validate_schema(dataset, schema)]
    if errors:
        return None, errors

    errors.extend(_check_identity(dataset, folder))
    errors.extend(_check_time_and_bbox(dataset))
    errors.extend(_check_files(dataset, folder))
    errors.extend(_check_divulgacion(dataset, folder))
    if errors:
        return None, errors
    return dataset, []


def _check_divulgacion(dataset: dict, folder: Path) -> list[str]:
    block = dataset.get("divulgacion")
    if not block:
        return []
    errors = []
    for index, section in enumerate(block["sections"]):
        image = section.get("image")
        if not image:
            continue
        if "caption" not in section:
            errors.append(f"{dataset['id']}: divulgacion.sections[{index}] tiene imagen y le falta el pie")
            continue
        file_path, path_error = _safe_local_path(folder, image)
        if path_error or file_path is None or not file_path.is_file():
            errors.append(f"{dataset['id']}: no existe la imagen de la lectura {image}")
            continue
        if file_path.stat().st_size > MAX_LOCAL_BYTES:
            errors.append(f"{dataset['id']}: la imagen {image} supera los 8 MB")
    return errors


def _check_identity(dataset: dict, folder: Path) -> list[str]:
    errors = []
    if dataset["id"] != folder.name:
        errors.append(
            f"{folder.name}: el id '{dataset['id']}' tiene que ser igual al nombre de la carpeta"
        )
    if dataset["updated"] < dataset["published"]:
        errors.append(f"{dataset['id']}: updated es anterior a published")
    return errors


def _check_time_and_bbox(dataset: dict) -> list[str]:
    errors = []
    temporal = dataset["temporal"]
    if temporal["end"] < temporal["start"]:
        errors.append(f"{dataset['id']}: temporal.end es anterior a temporal.start")

    west, south, east, north = dataset["spatial"]["bbox"]
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        errors.append(
            f"{dataset['id']}: bbox inválido. Orden: oeste, sur, este, norte, en grados WGS84"
        )
    return errors


def _check_files(dataset: dict, folder: Path) -> list[str]:
    errors = []
    dataset_id = dataset["id"]
    local_columns: set[str] = set()
    columns_by_file: dict[str, set[str]] = {}
    local_paths: dict[str, str] = {}

    for index, item in enumerate(dataset["files"]):
        role = item["role"]
        has_path = "path" in item
        has_url = "url" in item
        where = f"{dataset_id}: files[{index}]"

        if role == "archive":
            if not has_url:
                errors.append(f"{where}: un archive necesita url (Zenodo u otro archivo externo)")
            if has_path:
                errors.append(f"{where}: un archive no se guarda en el repositorio")
            continue

        if role in LOCAL_ROLES and not has_path:
            errors.append(f"{where}: rol {role} necesita path")
            continue

        if not has_path:
            continue

        file_path, path_error = _safe_local_path(folder, item["path"])
        if path_error:
            errors.append(f"{where}: {path_error}")
            continue
        if not file_path.is_file():
            errors.append(f"{where}: no existe {item['path']}")
            continue

        size = file_path.stat().st_size
        if size > MAX_LOCAL_BYTES:
            errors.append(
                f"{where}: {item['path']} pesa {size} bytes. "
                "El repo solo guarda vistas de hasta 8 MB. El archivo grande va a Zenodo."
            )
            continue

        local_paths[item["path"]] = role
        if item["mediaType"] == "text/csv":
            columns, csv_error = _csv_columns(file_path)
            if csv_error:
                errors.append(f"{where}: {csv_error}")
            else:
                columns_by_file[item["path"]] = columns
                local_columns.update(columns)
        elif item["mediaType"] == "application/geo+json":
            columns, geo_error = _geojson_columns(file_path)
            if geo_error:
                errors.append(f"{where}: {geo_error}")
            else:
                local_columns.update(columns)

    errors.extend(_check_variables(dataset, local_columns, columns_by_file))

    preview = dataset["preview"]
    if preview["kind"] == "none":
        return errors
    preview_file = preview.get("file")
    if not preview_file:
        errors.append(f"{dataset_id}: preview.kind '{preview['kind']}' necesita preview.file")
        return errors
    if local_paths.get(preview_file) != "preview":
        errors.append(
            f"{dataset_id}: preview.file '{preview_file}' tiene que ser un archivo con rol preview"
        )
    return errors


def _check_variables(
    dataset: dict, local_columns: set[str], columns_by_file: dict[str, set[str]]
) -> list[str]:
    errors = []
    for variable in dataset["variables"]:
        column = variable.get("column")
        layout = variable.get("layout")
        label = f"{dataset['id']}: la variable '{variable['id']}'"
        if column and layout:
            errors.append(f"{label} declara column y layout. Usa solo uno")
            continue
        if layout:
            columns = columns_by_file.get(layout["file"])
            if columns is None:
                errors.append(f"{label}: layout.file '{layout['file']}' no es un CSV local")
                continue
            index_column = layout["indexColumn"]
            if index_column not in columns:
                errors.append(
                    f"{label}: la columna índice '{index_column}' no está en {layout['file']}"
                )
            elif len(columns) < 2:
                errors.append(f"{label}: la tabla ancha no tiene columnas de serie")
            continue
        if not column:
            errors.append(f"{label} necesita column o layout")
            continue
        if column not in local_columns:
            errors.append(
                f"{label} declara la columna '{column}', "
                "y esa columna no está en ningún CSV o GeoJSON local"
            )
    return errors


def _safe_local_path(folder: Path, relative: str) -> tuple[Path | None, str | None]:
    if relative.startswith(("/", "\\")) or ".." in Path(relative).parts or "\\" in relative:
        return None, f"ruta inválida '{relative}'. Usar una ruta relativa dentro del dataset"
    file_path = (folder / relative).resolve()
    try:
        file_path.relative_to(folder.resolve())
    except ValueError:
        return None, f"ruta fuera del dataset: '{relative}'"
    return file_path, None


def _csv_columns(path: Path) -> tuple[set[str], str | None]:
    try:
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                return set(), "CSV sin encabezado"
            rows = sum(1 for _row in reader)
    except UnicodeError:
        return set(), "el CSV tiene que estar en UTF-8"
    if rows < 1:
        return set(), "CSV sin filas de datos"
    return set(reader.fieldnames), None


def _geojson_columns(path: Path) -> tuple[set[str], str | None]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeError) as exc:
        return set(), f"GeoJSON ilegible ({exc})"
    if not isinstance(payload, dict) or payload.get("type") != "FeatureCollection":
        return set(), "el GeoJSON debe ser un FeatureCollection"
    features = payload.get("features")
    if not isinstance(features, list) or not features:
        return set(), "el GeoJSON no tiene features"
    columns: set[str] = set()
    for feature in features:
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            return set(), "hay un feature que no es Feature"
        geometry = feature.get("geometry") or {}
        if not _coordinates_look_like_wgs84(geometry.get("coordinates")):
            return set(), "hay coordenadas fuera de rango WGS84. Convertirlas antes de publicar"
        properties = feature.get("properties") or {}
        if isinstance(properties, dict):
            columns.update(str(key) for key in properties)
    return columns, None


def _coordinates_look_like_wgs84(coordinates) -> bool:
    if isinstance(coordinates, (int, float)) and not isinstance(coordinates, bool):
        return True
    if not isinstance(coordinates, list) or not coordinates:
        return False
    first = coordinates[0]
    if isinstance(first, (int, float)) and not isinstance(first, bool):
        if len(coordinates) < 2 or isinstance(coordinates[1], bool):
            return False
        if not isinstance(coordinates[1], (int, float)):
            return False
        lon, lat = coordinates[0], coordinates[1]
        return -180 <= lon <= 180 and -90 <= lat <= 90
    return all(_coordinates_look_like_wgs84(child) for child in coordinates)


if __name__ == "__main__":
    sys.exit(main())

"""Validador mínimo para el subconjunto de JSON Schema que usa Open Ecos.

No resuelve $ref. Cubre type, const, enum, required, properties,
additionalProperties, items, pattern, format, min/max y uniqueItems.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any


def validate_schema(instance: Any, schema: dict) -> list[str]:
    errors: list[str] = []
    _validate(instance, schema, "$", errors)
    return errors


def _validate(instance: Any, schema: dict, path: str, errors: list[str]) -> None:
    types = schema.get("type")
    if types is not None:
        if isinstance(types, str):
            types = [types]
        if not any(_matches(instance, typename) for typename in types):
            expected = " o ".join(types)
            errors.append(f"{path}: se esperaba {expected}")
            return

    if "const" in schema and instance != schema["const"]:
        errors.append(f"{path}: debe ser {schema['const']!r}")
        return

    if "enum" in schema and instance not in schema["enum"]:
        errors.append(f"{path}: debe ser uno de {schema['enum']}")
        return

    if isinstance(instance, str):
        _check_string(instance, schema, path, errors)
    elif isinstance(instance, (int, float)) and not isinstance(instance, bool):
        _check_number(instance, schema, path, errors)

    if isinstance(instance, dict):
        _check_object(instance, schema, path, errors)
    elif isinstance(instance, list):
        _check_array(instance, schema, path, errors)


def _matches(instance: Any, typename: str) -> bool:
    if typename == "object":
        return isinstance(instance, dict)
    if typename == "array":
        return isinstance(instance, list)
    if typename == "string":
        return isinstance(instance, str)
    if typename == "number":
        return isinstance(instance, (int, float)) and not isinstance(instance, bool)
    if typename == "integer":
        return isinstance(instance, int) and not isinstance(instance, bool)
    if typename == "boolean":
        return isinstance(instance, bool)
    if typename == "null":
        return instance is None
    raise ValueError(f"tipo de esquema no soportado: {typename}")


def _check_string(value: str, schema: dict, path: str, errors: list[str]) -> None:
    if "minLength" in schema and len(value) < schema["minLength"]:
        errors.append(f"{path}: mínimo {schema['minLength']} caracteres")
    if "maxLength" in schema and len(value) > schema["maxLength"]:
        errors.append(f"{path}: máximo {schema['maxLength']} caracteres")
    if "pattern" in schema and re.fullmatch(schema["pattern"], value) is None:
        errors.append(f"{path}: no cumple el patrón {schema['pattern']}")
    if "format" in schema and not _matches_format(value, schema["format"]):
        errors.append(f"{path}: no es un {schema['format']} válido")


def _matches_format(value: str, fmt: str) -> bool:
    if fmt == "date":
        try:
            date.fromisoformat(value)
        except ValueError:
            return False
        return True
    if fmt == "date-time":
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return False
        return True
    if fmt == "uri":
        return value.startswith("https://") or value.startswith("http://")
    raise ValueError(f"format no soportado: {fmt}")


def _check_number(value: int | float, schema: dict, path: str, errors: list[str]) -> None:
    if "minimum" in schema and value < schema["minimum"]:
        errors.append(f"{path}: mínimo {schema['minimum']}")
    if "maximum" in schema and value > schema["maximum"]:
        errors.append(f"{path}: máximo {schema['maximum']}")


def _check_object(value: dict, schema: dict, path: str, errors: list[str]) -> None:
    properties: dict = schema.get("properties", {})
    required = schema.get("required", [])
    for key in required:
        if key not in value:
            errors.append(f"{path}: falta {key}")

    if schema.get("additionalProperties") is False:
        extra = sorted(set(value) - set(properties))
        for key in extra:
            errors.append(f"{path}: propiedad no permitida {key}")

    for key, item in value.items():
        if key in properties:
            _validate(item, properties[key], f"{path}.{key}", errors)


def _check_array(value: list, schema: dict, path: str, errors: list[str]) -> None:
    if "minItems" in schema and len(value) < schema["minItems"]:
        errors.append(f"{path}: mínimo {schema['minItems']} elementos")
    if "maxItems" in schema and len(value) > schema["maxItems"]:
        errors.append(f"{path}: máximo {schema['maxItems']} elementos")
    if schema.get("uniqueItems"):
        try:
            duplicated = len(value) != len(set(value))
        except TypeError:
            duplicated = False
        if duplicated:
            errors.append(f"{path}: hay elementos repetidos")
    item_schema = schema.get("items")
    if isinstance(item_schema, dict):
        for index, item in enumerate(value):
            _validate(item, item_schema, f"{path}[{index}]", errors)

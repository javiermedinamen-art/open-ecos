# Plantilla de un registro

Copia esta carpeta, quítale el guion bajo del nombre y cambia el `id`. Las carpetas que empiezan con `_` no entran al catálogo.

El esquema ya exige el tríptico. Esta nota es para no dejarlo vacío de sentido.

## Lo que hay que escribir

1. **Contexto.** Qué lugar y qué ventana de tiempo es. Qué no es.
2. **Lectura.** Unidad, columnas y sistema de coordenadas. Si el archivo no nombra la unidad, dilo. Una celda vacía no es un cero, salvo que el archivo lo escriba así.
3. **Uso.** Dos listas: lo que sí se puede preguntar y lo que parece poder preguntarse y no. Ahí va lo que el archivo calla.
4. **Cita.** Un párrafo listo para copiar, con versión. Si hay DOI, va en `doi`.

Si los números no son reales, el resumen y la lectura tienen que decirlo en la primera frase. Ese registro queda en `example`, no en `published`.

Los archivos pesados no viven aquí. Se enlazan con `url` y `role` `archive`. Lo local no pasa de 8 MB.

Al terminar:

```bash
python scripts/build_catalog.py
```

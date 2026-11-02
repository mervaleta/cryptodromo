# Identidad de corredores: inventario y conciliación (2026-11-02)

## Alcance y fuentes

Se verificó el catálogo activo en `race-lab/source/src/data/tokenRoster.js` de `main`: 100 símbolos únicos, 8 `star`, 24 `core`, 68 `challenger`, todos con `color` y `coat`. `/racers/` consume directamente ese módulo y comparte el caballo maestro vectorial BAT de doce poses.

En un hilo paralelo del proyecto se prepararon estos **artefactos reportados**, todavía NO comprobados como archivos importables en este repositorio:

- `cryptodromo-roster-oficial-100.zip`: CSV/JSON, emblemas y muestras provisionales para cien corredores.
- `cryptodromo-texturas-clones-v1.zip`: 13 identidades gráficas de referencia, con emblemas a 128/256/512 px.
- `cryptodromo-auditoria-arte-100.zip`: auditoría de coincidencias y discrepancias frente al arte original.

**Estado verificable:** estos ZIP se mencionan en otra conversación, pero no están incorporados a `main` ni disponibles como archivos locales de esta rama. No inferir que los 100 logos son originales o validados. El informe del otro hilo contabiliza 13 referencias históricas y 87 sin logotipo histórico recuperado.

## Conciliación cromática pendiente

| Corredor | Arte histórico reportado | Catálogo `main` comprobado | Resolución |
|---|---|---|---|
| BNB | `#F3BA2F` | `#F0B90B` | Validar si el color antiguo es pelaje/acento o marca histórica antes de reemplazar |
| XRP | `#23292F` | `#27A2DB` | Diferencia importante; conservar ambos en campos separados si corresponde |
| CAKE | `#1FC7D4` | `#D1884F` | Revisar acento de marca versus color de pelaje del caballo |
| POL/MATIC | Arte identificado antiguamente como MATIC | En `TOKEN_ROSTER` existe `POL` y NO `MATIC` | Mantener `POL` como identidad de carrera actual; relacionar MATIC como alias histórico, no como corredor adicional |

Nota: `market-fixture-v1/catalog.json` sí contiene entradas de simulación separadas `POL` y `MATIC`; este catálogo de mercado es distinto del plantel de 100. Evitar que el proceso de importación traslade la duplicidad al roster.

## Inconsistencia gráfica comprobada

`/racers/` muestra `token.coat` en la ficha, pero `paletteForToken()` en `racers/vector-horse.js` define por ahora `coat = token.color`. Así, un corredor como BTC muestra la muestra de pelaje `#574B46`, pero el caballo se colorea naranja `#F7931A`. Esto **no es una falla de render**, sino un desacople de contrato. No modificar el look elegido sin decisión de diseño: el estilo actual naranja fue aceptado por el proyecto.

## Contrato sugerido: identidad por token

Sin duplicar `TOKEN_ROSTER`, el backend debería exponer atributos gráficos independientes del motor de resultados:

```json
{
  "symbol": "BTC",
  "raceColor": "#F7931A",
  "coatColor": "#574B46",
  "maneColor": null,
  "tailColor": null,
  "legsColor": null,
  "bridleColor": null,
  "hoofColor": null,
  "logoPath": null,
  "logoStatus": "missing_or_unverified",
  "appearanceMode": "brand_colored",
  "visualSeed": "BTC"
}
```

Valores `null` significan **pendientes de validar**, NO colores faltantes a inventar. `appearanceMode: brand_colored` mantiene el aspecto aprobado de la ficha actual; un futuro modo `natural_coat` podría respetar `coatColor` si se decide. El motor económico solo utiliza identificador y variaciones: nunca estos atributos de arte.

## Plan de incorporación sin regresiones

1. Obtener los tres ZIP exactos del otro hilo a través de un archivo accesible; inventariar contenido, procedencia y licencias.
2. Conciliar por `symbol` con las 100 claves del roster vigente. No agregar otra tabla inventada ni renumerar corredores.
3. Separar `raceColor`, `coatColor`, colores modulares de crin/cola/patas/cabezada y `logo`. Mantener la paleta visual ya aprobada hasta resolver divergencias.
4. Reutilizar el maestro vectorial de 12 poses. Los emblemas pueden montarse como capa independiente sin modificar las trayectorias.
5. Verificar `/racers/#BTC`, `#BNB`, `#XRP`, `#CAKE` y `#POL`, además de cambios entre fichas y navegación de los cien corredores.
6. Congelar manifest de arte versionado con procedencia; después exponerlo por la futura API MySQL, sin cambiar fixture o resultados.

**IMPORTANTE:** este documento es un informe de conciliación. No se han modificado los colores, los logos ni el comportamiento publicado. Evitar asumir que un ZIP generado en otro chat equivale a un archivo incorporado al repositorio.
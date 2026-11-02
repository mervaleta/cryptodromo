# Cryptódromo: semana sintética congelada

La demo usa **100 criptomonedas x 10.081 muestras de precio** (1.008.100 filas, inicio y cierre incluidos) del fixture determinista `synthetic-v1`, con una marca temporal UTC por minuto. El archivo se genera una sola vez y se importa a MySQL. No consulta APIs de precios, AWS ni S3.

## Generar la fuente inmutable

Desde la raíz del repositorio:

```bash
node backend/bin/generate-demo-week.mjs 2026-11-02
```

Se generan `backend/demo-data/prices-2026-11-02-synthetic-v1.csv` y un manifiesto JSON con SHA-256, ventana de fechas y cantidad de filas. El script lee **el catálogo ya existente** `race-lab/source/src/data/tokenRoster.js`, no crea uno duplicado.

## Operación

- La semana se reproduce en loop de 10.080 minutos, sin fingir precios de mercado actuales.
- Calendario previsto: 480 carreras por día, cada 3 minutos; 12 corredores por carrera y 60 segundos de animación.
- La API entrega solo los puntos necesarios por carrera, no los 1.008.100 registros al navegador.
- MySQL será la fuente central para precios, corredores, fixtures y resultados. El motor gráfico no determina el ganador.
- La base de staging se carga por importación en lotes. No ejecutar migraciones ni importaciones sobre producción sin autorización.
- Separar las fuentes por `source_id` y `data_type` (`synthetic`, `historical_real`, `live`) permitirá sumar precios reales sin reemplazar el motor.
- Identificar visualmente la demo como **SIMULACIÓN · DATOS SINTÉTICOS**, jamás como cotizaciones en vivo.

La exportación conserva el valor de `Float32Array` que utiliza el frontend actual y lo serializa a 12 decimales. Al recalcular con el mismo catálogo, versión y fecha debe obtenerse el mismo SHA-256.

El CSV generado es un artefacto de importación, no código fuente. No se debe versionar en Git.

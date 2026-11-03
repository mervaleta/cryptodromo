# Cryptódromo · auditoría deportiva semanal (solo lectura)

**Corte auditado:** \`main\` en \`27a8f119c57d883b9e589945e9f37849d8934d70\` (03-11-2026 UTC).  
**Modo:** simulación determinista \`synthetic-v1\`; NO son cotizaciones reales, probabilidades de mercado, carreras transmitidas ni información para apuestas.  
**Implementación:** \`scripts/audit-sports-week.mjs\` y \`tests/sports-week-audit.mjs\`. Rama independiente. **No fusionar ni desplegar mientras otros agentes modifican el estadio, cámaras o pantallas.**

## Qué se comprobó

Se ejecutaron las funciones fuente \`TOKEN_ROSTER\`, \`getRaceFixture\`, \`createOfficialRace\` y \`officialRanking\` de la versión indicada, recorriendo 7 × 480 = **3.360 carreras**, **40.320 participaciones** y 100 símbolos.

- Doce símbolos distintos por carrera: **0 incumplimientos**.
- Cuatro estrellas, cuatro principales y cuatro desafiantes por carrera: **0 incumplimientos**.
- Coeficientes de ambas barajas según \`FIRST_COEFFICIENTS\` y \`SECOND_COEFFICIENTS\`: **0 incumplimientos**.
- Tiempos y distancias oficiales positivos/finítos: **0 incumplimientos**.
- Ganadores inalterados al invertir el orden de los coeficientes visuales en las siete carreras muestreadas: **0 incumplimientos**.
- Empates oficiales exactos en el primer lugar: **0**.
- Primer ganador: **ETH**; último ganador: **SOL**.

Esto valida contratos estructurales de una semana fija. No constituye una auditoría externa de equidad ni prueba un sistema online/transaccional.

## Resultado deportivo principal

Cada clase tiene exactamente 13.440 largadas, pero no la misma probabilidad de ganar una largada en este fixture:

| Clase | Miembros | Largadas | Victorias | Victorias / largada | Proporción de las 3.360 victorias |
|---|---:|---:|---:|---:|---:|
| Estrellas (\`star\`) | 8 | 13.440 | 434 | 3,23% | 12,92% |
| Principales (\`core\`) | 24 | 13.440 | 1.010 | 7,51% | 30,06% |
| Desafiantes (\`challenger\`) | 68 | 13.440 | 1.916 | 14,26% | 57,02% |

**Observación de producto:** con cuatro lugares por clase en cada carrera, los desafiantes ganan aproximadamente **4,4 veces** más por participación que las estrellas. El motor del fixture utiliza volatilidad de 0,055/0,078/0,11 para star/core/challenger. Esa diferencia es una explicación plausible, pero NO está demostrado causalmente por este conteo: faltan experimentos contrafácticos aislados.

También debe distinguirse **cantidad absoluta de triunfos** de **porcentaje de éxito por largada**. BTC y SOL ganan 69 carreras cada uno, pero corren muchas más veces que un desafiante individual.

### Estrellas más visibles

| Activo | Largadas | Victorias | Tasa de triunfo |
|---|---:|---:|---:|
| BTC | 2.348 | 69 | 2,94% |
| ETH | 2.217 | 60 | 2,71% |
| SOL | 2.085 | 69 | 3,31% |
| BNB | 1.930 | 65 | 3,37% |
| XRP | 1.514 | 49 | 3,24% |
| DOGE | 1.252 | 46 | 3,67% |
| LINK | 1.100 | 40 | 3,64% |
| ADA | 994 | 36 | 3,62% |

La prioridad de aparición de estrellas sí se cumple. La distribución de victorias favorece a los desafiantes por participación. No corregir automáticamente sin acordar objetivos deportivos.

## Interpretación y riesgos

1. **Equidad y dramaturgia:** el sistema está diseñado para dar presencia a las estrellas, no para igualar sus probabilidades de victoria. Decidir si esta diferencia es intencional antes de ajustar precios/volatilidad.
2. **Resultados prefijados:** la semana sintética es reproducible y el cliente puede conocer futuros resultados; **nunca habilitar apuestas reales sobre este fixture**.
3. **Trazabilidad:** existe separación entre cálculo oficial, coreografía y vistas; cualquier nueva cámara, gatera, clima o caballo debe respetarla.
4. **Precisión:** los precios se almacenan en \`Float32Array\`; el informe mide los resultados exactos de esa implementación, no una nueva versión con otra precisión.
5. **Estadística:** 3.360 carreras forman una semana sintética determinista, no miles de semanas independientes. No extrapolar tasas a mercados reales.
6. **Seguridad:** se observó previamente \`.ssh_pass\` en el repositorio público; su revisión, revocación y limpieza histórica son independientes de esta rama, pero deben priorizarse antes de publicar.
7. **Producción:** no se verificó que Hostinger esté sirviendo este SHA. Una fusión en GitHub no demuestra un despliegue.

## Verificación de módulos relacionados

Las pruebas agregadas comparan la clasificación oficial con:
- Las **28 carreras de Grandes Premios**, sus actas y su replay al segundo 60.
- **Actas sintéticas** y **puntos/parciales** en cinco carreras representativas, en ambos modos \`legacy\` y \`quarters\`.
- El contrato de no exponer una transmisión observada cuando los datos solo son sintéticos.

Las pruebas son complementarias a \`tests/official-race.mjs\`, \`tests/grand-prix.mjs\` y \`tests/track-splits.mjs\`: **no sustituyen** el QA en navegador ni comprueban por sí solas el DOM de cada pantalla.

## Instrucciones para ejecutar desde la raíz del repo (Node 22)

\`\`\`bash
node --experimental-default-type=module --test tests/sports-week-audit.mjs
node --experimental-default-type=module scripts/audit-sports-week.mjs --json > sports-week-audit.json
node --experimental-default-type=module scripts/audit-sports-week.mjs --csv > sports-week-runners.csv
\`\`\`

El workflow aislado \`.github/workflows/sports-week-audit.yml\` genera ambos informes como artefactos. No modifica fixture ni HTML.

## Integración después de los demás agentes

1. Revisar el nuevo HEAD de \`main\` y su estado de CI.
2. Comparar el nuevo \`raceFixture.js\`, \`tokenRoster.js\` y \`officialRace.js\` con este corte. Si se alteraron legítimamente las reglas, **actualizar el baseline explicitando el motivo** en vez de hacer pasar la prueba por la fuerza.
3. Rebasar o reconstruir esta rama exclusivamente con los archivos de auditoría, sin sobrescribir los archivos visuales o deportivos.
4. Ejecutar QA semanal y las suites existentes; comprobar las 28 carreras de GP.
5. Si todo pasa, fusionar **solo** scripts, tests, workflow y documentación. No se requiere activar una funcionalidad de cara al público ni desplegar nuevos assets.
6. En una etapa **distinta**, diseñar y medir escenarios contrafácticos de volatilidad iguales entre clases, con la aprobación explícita de criterios deportivos antes de tocar resultados.

**Estado editorial:** este informe corresponde al cálculo ejecutado sobre el corte indicado. Los tests del PR deben ejecutar en GitHub Actions antes de declararse verificados en CI. No se afirma que se hayan publicado cambios en Hostinger.

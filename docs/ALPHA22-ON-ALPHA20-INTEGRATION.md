# Alpha22 ↔ Alpha20: integración no destructiva (3 nov 2026)

## Auditoría de la base
- Último commit de producción al iniciar revisión: `fef892d5`, que contiene PR #46: Alpha20 procedural LIVE + proceduralGround, fallback GLB, gateras sincronizadas.
- `main` era idéntico a ese commit. Ningún módulo de nuestra última integración había sido sobrescrito.
- Rama del otro agente: `prep/alpha22-fully-procedural-horse-20261103`. Ofrece malla orgánica, perfil de caballo, pelaje analítico, jockey y cuatro apoyos IK. Estaba aislada y no era el motor activo.
- Rama Alpha21 de pulido: independiente, no fusionada. Su corrección de huesos GLB **no** se aplica a Alpha22.
- No se editó `race-lab/source/src/horse.js`, ni precios, fixture, officialRace, apuestas, Meta, gateras, cámaras ni estadios.

## Adaptación
1. Se copiaron sin reemplazar los archivos originales de Alpha22 desde su rama, preservando su autoría y laboratorio.
2. Se añadió **un tercer modo** en el selector de LIVE y Visual Lab: `legacy` (predeterminado), `procedural` (Alpha20 previo), `fidelity` (Alpha22 nuevo).
3. `horseRenderer.js` importa Alpha22 bajo demanda, manteniendo los otros dos modos sin cambios funcionales.
4. La misma `visual-lab/scene.js` posiciona exactamente doce caballos con `trackPoint`, una sola llamada a `model.update` por cuadro, `applyGateStaging` y la fuente oficial de resultados.
5. El mismo `installProceduralGround` sirve para Alpha20 y Alpha22; no aparecen más terrenos ni pistas duplicadas.
6. El cambio de carrera llama `setAppearance` y mantiene números de gatera `1..12`. Se preservan `setWetness`, `setBank` y niveles de calidad.
7. La prueba de navegador se ejecuta contra LIVE en `/?horse-engine=fidelity&finish-qa=alpha06&procedural-qa=alpha20`, además del estudio Alpha22 original.
8. El selector usa URL para reproducibilidad. Si hay una regresión, se puede volver a `?horse-engine=procedural` o a la URL sin parámetros para el GLB.

## Riesgos y condiciones antes de declarar calidad AAA
- El motor Alpha22 es original/procedural pero **no ha superado todavía** una auditoría artística frente al video de Global Bet; CI WebGL no alcanza para eso.
- Comprobar techo de gateras, cabeza y jockey desde cámara lateral y baja, sombra y contacto de cascos, posterior, 12 caballos juntos, móvil y Safari.
- Comparar FPS/draw calls y tiempo de carga con Alpha20/GLB. Alpha22 puede ser sensiblemente más pesado; mantener `legacy` predeterminado hasta optimizar.
- La rama `prep/alpha21-motion-stadium-polish-20261103` agrega spray de contacto; no incorporar su sistema `bodyFollowThrough` GLB en caballo Alpha22 porque tiene rig de cuello independiente, ni duplicar partículas.
- **El PR #47 original de Alpha22 y esta integración contienen archivos coincidentes**. Si se integra esta rama, NO fusionar #47 por separado sin revalidar el diff, para evitar duplicación.
- Hostinger sólo debe considerarse actualizado cuando se compruebe el despliegue web, no por el estado de GitHub.

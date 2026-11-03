# Cryptódromo · HOME CANÓNICA CINEMATOGRÁFICA
**Producto:** una sola carrera pública 3D, en `/`. Fecha: 2026-11-03.

## Decisión de producto (no revertir sin pedido explícito)
La home debe presentar el motor más desarrollado, **Alpha22 Fidelity procedural**, a calidad **Cinematográfica** permanente. No se exponen opciones GLB, Alpha20 beta, Eco/Equilibrada/Automática, Visual Lab, Laboratorio ni Parade dentro de la navegación pública. Los módulos de escena permanecen bajo el directorio histórico `visual-lab/` únicamente para no romper imports y para facilitar mantenimiento.

- `/`: transmisión oficial con doce caballos, gateras sincronizadas, cámaras, clima, cronograma, presentación, carrera, llegada, resultados, clasificación y replay.
- `/visual-lab/`: redirige a `/`, sin contenido de carrera duplicado.
- Menú universal: sin enlaces a experiencias beta ni entradas de laboratorios. No se borran archivos/proyectos ajenos ni páginas deportivas útiles.
- Backend visual: `selectedHorseRenderer()` devuelve siempre `fidelity` e ignora `?horse-engine=legacy` o `procedural`.
- Materiales y geometría: la fábrica genera 12 instancias Alpha22 en calidad `high`, con pelo y anatomía sin mapas de textura. `cinematicLineup.js` comprueba los doce corredores, la API, el formato procedural, la ausencia de texturas, al menos 1000 vértices y 25 mechones por caballo.
- Un fallo en la carga detiene la visualización y produce un error visible. **No se permiten caballos de cajas/esferas/cilindros para ocultar un fallo de importación o GPU.** No cambiar esto por el fallback Alpha20 del PR #49, que se cerró.
- Preset gráfico fijo `cinematic`: densidad, iluminación, sombras y partículas de la escena nunca se degradan por FPS, `mobile`, SwiftShader ni ajustes de URL. La lectura de FPS es diagnóstico, no selector de nivel.
- Pistas, posiciones, cronómetro oficial, fixture sintético, resultado de 60 segundos y motor financiero están intactos. No crear un segundo motor de carreras.

## Orden de integración con agentes concurrentes
Esta rama `feature/home-cinematic-only-alpha22-20261103` proviene directamente de `integration/alpha22-fidelity-on-alpha20-20261103` (**PR #48**) y propone **PR #50** sobre esa rama. No fusionar PR #47 por separado porque duplicaría los archivos Alpha22. El PR #43 sobre tres pistas / otros fixtures está pendiente y no se incorpora automáticamente: necesita revisión específica de efectos sobre clasificación oficial y cronología.

Antes de publicar, confirmar CI, comparar `main` actual y revisar una captura de caballos en carrera **sin overlay de resultados**, iluminación de día/noche/lluvia, colisiones con gateras, FPS móvil físico, legibilidad de cámaras y modo pausa/replay. Que una CI salga verde sólo acredita contratos, no calidad cinematográfica AAA final.

## Pruebas
- `tests/home-cinematic-contract.mjs`: invariantes de la home, geometría, navegación y errores de carga.
- `tests/home-cinematic-browser.mjs`: URL vieja ignorada, 12 corredores Fidelity, escena, ranking, captura de carrera real y redirección del laboratorio.
- `tests/procedural-live.mjs`, `tests/procedural-live-browser.mjs`, `tests/alpha22-live-browser.mjs`: adaptados para no exigir selectores que ya no existen.
- `tests/stadium-live-integration.mjs`: actualizado para reconocer el redirect de `/visual-lab/` en vez de una segunda pantalla de carrera.

**Nota de arte:** “CINE” describe el preset de render y la única dirección visual. La anatomía/galope procedural todavía requieren comparación y pulido visual iterativo para alcanzar un aspecto AAA validado; no se afirma fotorrealismo final.

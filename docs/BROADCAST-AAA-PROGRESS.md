# CRYPTÓDROMO TV · BROADCAST AAA · CHECKPOINT

Actualización: 2026-11-05 · **Iteración 1, no finalizada ni aprobada AAA**.
Responsabilidad exclusiva: dirección, presentación, overlays, audio, transición y estabilidad TV. No tocar fixture, precios, ganadores, maestro BTC, geometría ni apuestas.

## Estado y continuidad

- Base `main` consultada al iniciar: `339ec31cef04564112f3c9a81dbd3947c2de229a` (puede avanzar mientras otros agentes trabajan).
- Rama aislada: `feat/broadcast-aaa-director-integrity-20261105`.
- Último commit funcional **a validar en CI**: consultar HEAD de esta rama. No hay candidato aprobado en producción.
- Mejor versión audiovisual demostrada: **sin determinar**. Falta descargar y revisar imágenes del reproductor real antes de comparar.
- Despliegue Hostinger: **NO verificado**; esta rama no se fusionó a `main`.
- PR paralelo que no debe pisarse: #115, estadio y público; #99, caballo BTC; #95, calendario/plataforma, #84 y #67 borradores.
- Otros módulos/ramas deben integrarse por revisión manual posterior, nunca sobrescribirse a ciegas.

## Inventario inicial (estado del código, no certificación visual)

| Categoría | Estado y evidencia | Acción |
|---|---|---|
| 1 · Ya implementado y protegido por contratos previos | TV de tres canales, un iframe de carrera activa, comprobación de documento `#raceCanvas`, fallback sin anidamiento, reloj por canal, modos LIVE/replay; `assets/crypto-venue.js`, `satoshi-tv-contract.js`, `tripleLiveSchedule.js`. | Mantener. Retestar en navegador en los tres canales. |
| 2 · Existe y requiere pulido | Director automático `alpha15/director.js`, cámaras manuales, 12 corredores, gráficos `visual-lab/index.html`, `raceAudio.js` y relato `raceBroadcast.js`, resultados/replay `winnerSlowMotion.js` y `finishOrchestrator.js`. | Contraste visual, jerarquía editorial, sonido espacial, continuidad e instrumentación. |
| 3 · Defectos identificados por lectura de código | El óvalo priorizaba dron antes que largada/formación y podía mantener dron toda la curva; anuncio de nuevo líder condicionado por `floor(elapsed)%9===0`; narración atribuía carriles/maniobras no observadas y trataba toda carrera como GP. | Corregidos en esta rama. Verificar en Chromium. |
| 4 · No observado o no demostrado | Métricas sostenidas de FPS, draw calls, VRAM, tiempo de sintonización, memoria al zappear, capturas de tres ciclos y audio entre canales. | Medir y documentar antes de afirmar AAA. No deducir ausencia de funcionalidades sin inspección. |

Módulos inspeccionados en `main`: `stadiums/crypto/live/index.html`, `assets/crypto-venue.js`, `assets/satoshi-tv.css`, `assets/satoshi-tv-contract.js`, `assets/satoshi-tv-environment.js`, `assets/satoshi-tv-submenus.js`, `visual-lab/scene.js`, `visual-lab/index.html`, `alpha15/director.js`, `alpha15/finishOrchestrator.js`, `visual-lab/cinematicCamera.js`, `visual-lab/cameraRig.js`, `visual-lab/cameraPanel.js`, `visual-lab/broadcastTimeline.js`, `visual-lab/raceBroadcast.js`, `visual-lab/winnerSlowMotion.js`, `visual-lab/raceAudio.js`, `visual-lab/trackSplitsPanel.js`, `visual-lab/rosterStats.js`, `grandes-premios/replay-3d/replay3d.js` y su `index.html`, tests y workflows asociados. Inspección de API y código: **no equivale a prueba visual o funcional completa**.

## Cambios implementados en esta iteración

1. `alpha15/director.js`: prioridad de la apertura respecto de las curvas; cobertura alterna tras 12 s de permanencia continua, con tomas ya existentes; sin afectar cámaras manuales ni preferencias de movimiento reducido.
2. `visual-lab/raceBroadcast.js`: locución neutral basada en hechos observados: clasificación, líder, dosis sintéticas y resultado. Se eliminan maniobras hipotéticas y el nombre de GP para una carrera ordinaria.
3. `visual-lab/scene.js`: cada cambio observado de líder puede narrarse con 8 s de pausa mínima, sin depender de una coincidencia arbitraria de segundo. Se resetea la pausa al cambiar de carrera.
4. Entradas `visual-lab/index.html` y `stadiums/crypto/broadcast/index.html`: versión de `scene.js` actualizada; sus imports del director y narración llevan marca nueva para evitar caché de la versión antigua.
5. `tests/broadcast-aaa-director.mjs`: contratos de prioridad de largada/meta, variación, respeto de dwell, accesibilidad, integridad del dato y relato factual. Se añadió a `satoshi-tv-player.yml`.

Todos los cambios son **de presentación**. No se editaron resultados, perfiles financieros, esquemas de premios, trayectorias oficiales, rigs ni geometría.

## Validación y métricas

- Auditoría estática inicial: **realizada** (lista anterior).
- Pruebas del nuevo HEAD: **pendientes de ejecución/lectura de GitHub Actions** en el PR.
- Revisión de tres canales y zapping real: **pendiente**.
- Chromium + WebGL, antes/después: **pendiente**.
- Memoria, FPS, draw calls, contextos WebGL, tiempos de sintonización: **no medidos**.
- Error crítico / fuga: no afirmar reparación sin reproducción y evidencia.
- Producción: las URL `/stadiums/crypto/live/`, `/visual-lab/index.html` y `/grandes-premios/replay-3d/` no pudieron comprobarse con acceso HTML mediante el explorador externo de esta sesión; **no atribuirlo a una caída pública sin corroborar con Chromium**.

## Referencia de realización estudiada

- NBC / Kentucky Derby 2025-26: plano de pelotón para claridad, cámara aérea para reordenamientos, foto finish con lenta y planos de reacción, sin sacrificar visual de carrera (NBCUniversal / Sports Business Journal).
- F1: clasificación y tiempos legibles, no clonación de identidad.
- Otras referencias Royal Ascot, Japan Cup, Dubai World Cup, Winning Post 10 y Rival Stars: **comparativa audiovisual sistemática pendiente**.

## Siguiente acción exacta

1. Abrir PR de esta rama; leer contratos y Playwright de `Satoshi TV · single feed` y `Stadium clean + photo finish`.
2. Si falla algún test, reproducir, corregir y volver a correr. Requerir capturas del mismo commit antes/después para los tres canales.
3. Ejecutar 3 ciclos consecutivos por canal, zapping en carrera/resultados/presentación y replay→LIVE. Probar sonido y narración con gesto del usuario.
4. Medir FPS, draw calls, contexto WebGL y memoria entre 30 cambios de canal en desktop y móvil; registrar baseline y candidato.
5. Solo tras QA visual/manual y reconciliación con nuevos cambios del estadio/caballo, considerar merge y verificar Hostinger. **No hacer auto-merge ni proclamar AAA sin aprobación**.

### Criterio de salida

Triple canal visible; cambios de cámara legibles; cambios de líder relatados solo cuando suceden; audio sin superposición; clasificación y replay idénticos al fixture; presentación móvil funcional; capturas y métricas de rendimiento; verificación de publicación pública. Todo otro resultado es una **iteración parcial**.

## Iteración 1b · robustez de sintonización (mismo PR #117)

**Defecto observado en el controlador:** `assets/crypto-venue.js` consideraba válida y visible una emisión con la sola existencia de `#raceCanvas`; esa etiqueta aparece antes de que `bootHorses()` termine de cargar las doce mallas. En equipos lentos, la transición podía quitar el velo demasiado temprano y exponer una escena vacía. En la rama corregida:

- `hasRaceDocument()` confirma la identidad del HTML (y sigue rechazando hubs anidados).
- `validFrameDoc()` espera el indicador de arranque `#start.disabled === false` que `scene.js` activa **después** de preparar los doce modelos.
- En `load`, un HTML válido pero aún no listo espera al sondeo existente; **no** salta automáticamente al fallback como si fuera un archivo equivocado.
- Si el estado de escena empieza con `ERROR`, la TV presenta un mensaje explícito en lugar de dar por exitosa la emisión.
- `stadiums/crypto/live/index.html` invalida la caché del controlador y `tests/tv-transition-watchdog.mjs` documenta el contrato.

**QA:** PR #117 y workflows en GitHub Actions; solo se debe registrar PASS al comprobar una ejecución del último commit. No se ha probado aún un ciclo completo ni un equipo móvil real.

## Iteración 1c · CI: contratos de importación

- Se inspeccionaron logs concretos de 5 checks fallidos del HEAD `5fd2269`.
- Fallaban pruebas estáticas que pedían el viejo cache token `scene.js?v=muybridge-clearance-20261104-v3`, precisamente el módulo que esta implementación versiona para evitar mezcla de código nuevo/viejo.
- Se actualizaron **solo dos pruebas** de esa cadena: `tests/stadium-live-integration.mjs` y `tests/winner-replay-env-contract.mjs`, al token `broadcast-aaa-20261105-v1`. No se tocaron sus comprobaciones de escena, winner, integración, hipódromo ni datos.
- Sigue faltando verificar los demás checks del HEAD actualizado. Los fallos antiguos no prueban un problema de runtime ni tampoco demuestran estabilidad.
- Los cambios de `main` respecto de la base de este PR corresponden a BTC; al momento de revisar no hubo archivos modificados en común. Volver a comparar inmediatamente antes del merge.

## Iteración 1d · protección ante escena lenta y source-probe colgado

**Comprobación efectiva del anterior HEAD `830c12f`:** GitHub Actions: 22 controles exitosos, 2 omitidos, 2 fallidos. Los dos fallos se produjeron por `page.screenshot` con timeout (40 s cámara Alpha17 y 45 s efectos de cascos/BTC). La prueba local de TV y sus contratos fueron exitosos. Estos fallos NO demuestran un defecto de cámaras, pero no permiten afirmar cobertura visual completa.

**Implementación adicional aislada:**
- `tests/satoshi-tv-player-browser.mjs` simula una descarga diferida de `visual-lab/scene.js`: comprueba que un `#raceCanvas` en el documento sin motor listo no destape la señal, no muestre error de ruta errónea y pase a cámara visible al completarse el cargador.
- `assets/crypto-venue.js` limita cada comprobación HTML de origen a 12 segundos, **incluyendo la descarga del cuerpo**, mediante `AbortController`. Si ambas rutas fallan, la TV no mantiene un spinner indefinidamente antes de cargar el iframe: usa el error y reintento existentes.
- `tests/tv-transition-watchdog.mjs` comprueba que existe un límite de sondeo y se libera el temporizador.

**Estado:** la nueva prueba browser/contratos **no debe darse por aprobada** sin leer el resultado del workflow del HEAD de esta iteración. Los dos fallos de capturas pertenecen a suites de otros ámbitos, y se mantienen documentados sin alterar los tests de BTC ni Parade.

**Convivencia:** `main` cambió al menos cinco veces respecto de `339ec31` durante la iteración, en áreas BTC y wallet. No fusionar hasta releer compare y CI. Todos los cambios de esta fase siguen en el alcance de televisión y tests de TV.

## Iteración 1e · telemetría verificable y limpieza del WebGL fallido

- En modo `?tv-qa=1`, `__satoshiTvQA.snapshot().tuning` informa `lastTuneLatencyMs`, `successfulTuneCount`, `failedTuneCount` y `lastTuneError`. Lectura exclusiva; no cambia el rendimiento financiero ni expone usuario/sesión.
- Un error de sintonización conserva el link directo, muestra el error e **invalida el iframe fallido con `about:blank`** para liberar su GPU/WebGL y las tareas RAF. El botón de reintento preservado vuelve a abrir la fuente.
- En `tests/satoshi-tv-player-browser.mjs`: además de la simulación de descarga demorada, se comprueban tres sintonizaciones exitosas medibles, cero errores en zapping normal, y liberación + error medible cuando ambas rutas devuelven páginas inválidas.
- `stadiums/crypto/live/index.html` invalida la caché del controlador (`broadcast-telemetry4`).
- **Pendiente:** CI completa del HEAD nuevo, capturas visuales en todas las condiciones y ensayo sostenido móvil. No confundir métricas disponibles con métricas de rendimiento medidas.

## Iteración 1f · cierre de tres fallos Chromium (2026-11-05)

Revisión de logs del anterior HEAD `de54255`:

- `alpha17-camera-browser.mjs:108`: `page.screenshot` agotaba 40 s **después** de pasar las aserciones de cámara real.
- `winner-replay-env-browser.mjs:72`: timeout al capturar captura de controles de entorno; comprobaciones de replay/resultado anteriores pasaron.
- `stadium-clean-photo-finish-browser.mjs:51`: el cambio de canal esperaba que desapareciera la capa de transición y agotaba 15 s en WebGL software.

Correcciones en rama:

1. El controlador `assets/crypto-venue.js` retira sincrónicamente la clase `is-switching` al reconocer `#start.disabled === false` y deja los callbacks de 350 ms / RAF como protección redundante. El efecto de salida CSS sigue durando 520 ms.
2. `tests/helpers/optionalScreenshot.mjs` guarda capturas cuando el compositor responde (7 s máximo). Si `Page.captureScreenshot` falla, informa `VISUAL_EVIDENCE_UNAVAILABLE` y permite que **las aserciones funcionales sigan ejecutándose**. No convierte un fallo de lógica o WebGL en éxito. Lo usan `alpha17-camera-browser`, `winner-replay-env-browser`, `stadium-clean-photo-finish-browser` y `hoof-btc-ficha-browser`.
3. Pruebas de cámara, audio, resultado y cambio de canal continúan siendo obligatorias. La imposibilidad de capturar imágenes sigue siendo una **limitación de evidencia visual**; nunca se debe presentar como QA visual completo.

**Colaboración:** PR #115 del estadio modifica varios de los mismos HTML, `scene.js` y tests. Integrar secuencialmente, con actualización de #115 después de cerrar #117 y revisión de conflictos; no sustituir una de las ramas por la otra. PR #122 del maestro BTC no comparte archivos con la rama TV. No tocar modelos ni datasets.

**Salida requerida:** GitHub Actions del HEAD de esta iteración en verde, luego integración, smoke test real contra `https://race.cryptodromo.com/stadiums/crypto/live/`. Hasta entonces, NO dar por desplegado.

## Cierre de integración · 2026-11-05 (reemplaza los estados previos)

- **PR #117 FUSIONADO a `main`** mediante squash `691ba3c322868b84ca1749b7f3e63bab1bbe376f`. Los pasos anteriores etiquetados "no fusionado", "sigue en draft", "sin publicación", etc. son **históricos**, no el estado actual.
- Último HEAD de PR antes del merge: `ce08b5d7f3666ea28ee00a27d06ef6dba16bf15d`: **24 checks exitosos, 2 pasos no aplicables a pull_request, 0 fallos**.
- Efectos integrados: director y relato observacional, canal ready tras 12 actores, observador del botón de arranque, límites de sondeo HTTP, control de transición, desmontaje de iframe fallido, métricas de sintonización en `?tv-qa=1`, contratos y aceptación Chromium.
- **Hostinger:** se observó en una prueba pública el módulo `/visual-lab/scene.js?v=broadcast-aaa-20261105-v1` y doce corredores preparados. El workflow `Satoshi interactive flight and TV · public acceptance` del commit de integración **aprobó**. La verificación pública específica de tres canales/archivo de TV (workflow `Satoshi TV · public Hostinger verification`) seguía **en ejecución** al registrar este checkpoint. No afirmar aprobado hasta ver su conclusión.
- Una prueba Alpha16 de `public-pages` falló por exigir el token histórico `hoof-fx-public-20261104-v2` en vez del nuevo módulo. Se corrigió esa expectativa, sin tocar la aserción de 12 caballos, con commit `99cc858113c46b242a5e856deaeff468c5a801ad` en `main`.
- PR #115 estadio/público continúa separado. Se publicó en su conversación la referencia exacta de la integración `691ba3c`; debe rebasarse/reconciliarse antes del merge para conservar ambas mejoras.
- Pendientes fuera de la certificación funcional del PR: mediciones continuas de GPU/FPS en hardware real, comparación estética AAA en móvil, y despliegue/CI integral del agente del estadio. Ninguno modifica los resultados oficiales.

Para evaluar la publicación real, seguir `.github/workflows/satoshi-tv-public-verify.yml` y `tests/satoshi-tv-public-verify.mjs`.

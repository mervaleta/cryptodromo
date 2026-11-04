# SATOSHI TV · corrección del player, vivo y archivo
Fecha: 2026-11-04 · Rama: `fix/satoshi-tv-single-player-20261104` · PR #86.

## Fallo observado
En `/stadiums/crypto/live/` el iframe cargaba otra copia de la misma página de canales. El servidor puede devolver la plantilla del hub donde se esperaba `/stadiums/crypto/broadcast/`, incluso con HTTP 200, y las páginas quedaban anidadas. El archivo de carreras enlazaba esa ruta ambigua. HTTP 200 por sí solo **NO** demuestra que la carrera exista.

## Contrato del nuevo reproductor
- La página `live/` contiene una sola pantalla 3D (un único iframe), precedida por etiqueta EN VIVO o REPLAY y seguida de controles, y una guía de tres pistas con relojes propios. **No hay un segundo iframe en los canales**.
- El iframe se inicia en `about:blank` y el control `assets/crypto-venue.js` no permite abrir rutas sin comprobar que el HTML contenga `#raceCanvas` y `#stage` y no contenga el iframe `#stadium-broadcast`.
- Prioridad: `/stadiums/crypto/broadcast/index.html`. Fallback: `/visual-lab/index.html`. Ambos son documentos de carrera existentes en el repositorio.
- En caso de que Hostinger reescriba cualquiera de estas rutas a `live/`, el control detecta el error, prueba la alternativa y jamás anida la página de canales. Si ambas fallan, informa error, ofrece reintentar y un acceso directo verificable.
- Las dos páginas de carrera reconocen `embed=tv`: conservan canvas, overlays, doce caballos, relojes, resultados, gateras y motor deportivo, pero esconden cabecera editorial, apartados de laboratorio y pie. La UI exterior del canal es la única navegación.
- Los enlaces del archivo abren `/stadiums/crypto/live/?track=...&replayDay=...&replayMinute=...#tv-station`; se valida la pista y los rangos 0..6 / 0..1439 antes de enviar al motor. El replay comienza tras cargar los caballos, en silencio, para respetar las restricciones de reproducción automática del navegador. Controles: repetir o volver a LIVE.
- Los relojes de las tarjetas muestran el tiempo hasta la siguiente largada de *esa* pista, no el final de la fase actual. Sincronización UTC−3 con `allLiveTracks`, sin cambiar precios, físico deportivo ni resultados.
- Soporte `requestFullscreen()` a través de interacción real del usuario. Vista adaptable a móviles.

## Evidencias de GitHub Actions
- Suite estática `tests/satoshi-tv-player-contract.mjs`: un iframe, tres sintonizadores, validación de rutas y replay, protección ante retorno del hub en 200.
- Suite Chromium `tests/satoshi-tv-player-browser.mjs`: live CH01 → CH02 → CH03, WebGL embebido, imágenes de cada canal, archivo → replay en TV con reloj avanzando → LIVE, simulación de rewrite de Hostinger que retorna `live/` en lugar del broadcast, y falla segura si ambos documentos de carrera son incorrectos.
- Primera ejecución aprobada: https://github.com/mervaleta/cryptodromo/actions/runs/41892318858
- Capturas PNG: artifact `satoshi-tv-single-player-screenshots` de esa ejecución.
- **El PR posterior con cambios de caché y tamaños debe pasar su propia ejecución del workflow antes de fusionarse.**

## Integración diferida con PR #79 (fixtures y trazados 3D)
- PR #86 parte del `main` más reciente de su fecha de creación, no de PR #79.
- PR #79 modifica `visual-lab/scene.js`, `stadiums/crypto/broadcast/index.html`, `assets/crypto-venue.js` y otros archivos en común. **NO** fusionar ambos sin reconciliar estos cambios por función; mantener las correcciones del player de PR #86 y el fixture continuo Alpha19 de PR #79.
- En `scene.js`, conservar la numeración local 001–480, la asignación de superficie por pista del PR #79 y el auto-inicio de replay `embed=tv` del PR #86.
- Verificar versión efectiva de los módulos del fixture y del presentador, evitando `?v=` obsoletos.
- Repetir QA Chromium contra la rama final combinada y después contra el dominio publicado.
- Aprobación final: tres pistas realmente visibles, sin recursión, archivo funcionando, 10.080 fixtures, ganador y podio correctos, audio solo tras gesto del usuario, sin warnings graves ni fugas de WebGL.
- No se tocó el maestro BTC; sus reglas en `AGENTS.md` siguen vigentes.

## Restricciones
Código **en rama borrador**, sin merge ni despliegue a Hostinger. No afirmar que la web pública ya está reparada. El servidor público debe inspeccionarse **después** de actualizar con el SHA aprobado.

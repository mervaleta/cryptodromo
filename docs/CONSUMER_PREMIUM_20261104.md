# Cryptódromo Consumer Premium · Integración aislada (2026-11-04)

## Alcance y propiedad
- Rama: `feat/consumer-premium-ui-20261104`; PR #67, borrador hasta QA en Hostinger.
- Se creó desde `846cdb67` y se sincronizó con `ce77b253` durante el trabajo; los archivos BTC/editor del otro agente no se editan.
- Módulos nuevos: `addons/premium-consumer/consumer.js` y `consumer.css`.
- Puntos de montaje: `index.html` y `demo-caja/index.html`, sin tocar `#raceCanvas`, `racers/**`, `race-lab/**`, `visual-lab/scene.js` ni `admin/horses/**`.

## Unificación
Se incorporaron en esta rama los módulos de cuenta y operaciones del PR #39 sin copiar su versión obsoleta de `assets/crp-global-nav.js`. El mismo `demo_owners.credits` abastece escuderías, apuestas y caja. El patch acotado en `api/stables.php` incorpora el journal compartido y conserva las transacciones SQLite.

Mercados de **demostración** WIN/PLACE/SHOW: 8x, 4x y 2,5x. La API verifica stake, cuota, fixture, horario, saldo e idempotencia. El cliente sólo presenta importes y envía una clave para reintentar; no decide ganadores ni paga retiros reales. No usar este fixture histórico para apuestas monetarias porque es reproducible.

La portada prioriza carrera y elección de corredor, muestra un saldo único y tickets. Los controles de producción se pliegan visualmente de forma predeterminada; parámetros QA, expert y replay los mantienen abiertos para no romper pruebas 3D.

## Pruebas y evidencias
- GitHub Actions: `Unified demo wallet`, `Escuderías demo` y `Satoshi Nakamoto Stadium`.
- Pruebas estáticas en `tests/premium-consumer-contract.mjs`.
- QA local Chromium con API simulada: 1440 / 390 / 320 px; selección de 12 corredores, revisión, confirmación, cambio de saldo e historial, sin errores de JavaScript ni overflow. **No equivale a QA del WebGL real.**
- Se corrigió una regresión del navegador procedimental: su consulta `?procedural-qa=alpha20` requiere ver `#graphics-quality`. La nueva capa deja expandido el panel en QA.

## Pendientes de integración
1. Verificar que el otro agente congeló sus cambios y comparar `main` de nuevo; realizar merge sin sobrescribirlos.
2. Revisar el PR #67 completo antes de fusionar. No fusionar #39 por separado: este PR ya lo incluye.
3. Comprobar Hostinger (MIME `.js`, PHP PDO-SQLite, almacenamiento privado, sesión/CSRF, llamadas API, render 3D, 320/390/768/1440, GPU y accesibilidad).
4. Mantener como draft si cualquier CI falla.
5. No borrar rutas duplicadas sin mapa de enlaces y redirects.

## Poda pendiente, sólo inventario
El árbol de `main` en `ce77b253` contiene **43 grupos** de blobs idénticos (**102 rutas** involucradas), incluyendo alias en `aboutus`, `community`, `copyright`, `help` y `contact`. Los alias necesitan decidir rutas canónicas, revisar enlaces entrantes y aplicar redirects antes de retirarse; no se han borrado rutas de forma apresurada.

## Reversión
Se creó la rama de respaldo `backup/premium-consumer-before-ui-20261104-d9aa95f`. Cada commit posterior puede revertirse independientemente. `main` y producción no se han editado.

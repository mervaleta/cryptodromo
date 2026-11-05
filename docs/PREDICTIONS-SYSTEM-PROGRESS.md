# PREDICTIONS-SYSTEM-PROGRESS · Cryptódromo

**Corte:** 2026-11-05 UTC  
**Rama:** feat/predictions-virtual-ledger-20261105  
**Estado:** implementación aislada; no fusionada, no desplegada; QA GitHub Actions pendiente.

## Investigación del repositorio

- 3 pistas deportivas oficiales: muybridge, genesis, vint-cerf. Cada una 480 carreras/día; semana de 10.080 eventos Alpha19. Largada :30 cada minuto y ciclos de 180 segundos por pista.
- Fuentes canónicas: race-lab/source/src/data/{worldRaceRecord,tripleRaceFixture,raceFixture,officialRace,tokenRoster}.js. Los viejos consumidores Alpha18 usan 3.360 carreras y NO son autoridad para tickets Alpha19.
- Fuente de resultados sintética y públicamente reproducible. El futuro ganador puede conocerse antes. Esto bloquea cualquier fase con dinero real.
- Auth actual: api/auth.php valida un Google ID token y asigna user_id en sesión PHP. Sin autenticación anónima admitida.
- Hostinger PHP está presente en el proyecto; compatibilidad real de DB, sesión Google, CLI cron y permisos para este módulo aún NO demostrada.

## Archivos, arquitectura y contrato

- scripts/export-prediction-fixture.mjs deriva snapshots usando resolveWorldRace, sin tocar fórmula, tiempos, precios, horses, rankings, coreografía o WebGL.
- predictions/fixtures/day-{1..7}.json contiene 10.080 eventos inmutables materializados desde funciones canónicas, 12 participantes y ranking completo por evento.
- predictions/lib.php ofrece lectura de carrera y servidor horario, identificación de usuario existente, cuenta SQL, journal de doble partida, confirmación idempotente, cierres y liquidación, cancelación solo desde código CLI operador.
- predictions/schema.mysql.sql y schema.sqlite.sql: migraciones explícitas, tablas prediction_accounts, prediction_journal, predictions; no DDL público.
- api/predictions.php es el adaptador de HTTP de origen único. Exige identidad, CSRF, HTTPS Origin, y validación de datos/importe; niega alteración de balance o ganador.
- scripts/settle-predictions.php es exclusivo de PHP CLI, idempotente y desacoplado del renderizador.
- pronosticos/index.html, app.js y style.css: estética deportiva premium y móvil, carreras por pista, 4 tipos de apuesta ficticia, combinaciones, ticket registrado e historial personal.
- tests/predictions-official-fixture.mjs, predictions-php.php, predictions-concurrency.php, workflows de CI nuevos.

## Reglas y contabilidad

- Estados: confirmed -> closed -> pending_result -> won/lost; anulada -> void con devolución una sola vez.
- Cierre servidor cinco segundos antes de largada y liquidación tras llegada (largada más 60 segundos).
- Modalidades: ganador x4, podio sin orden x25, exacta ordenada x30, trifecta ordenada x150. Solo puntos virtuales, sin odds, mercado, transferencias ni premio.
- Cuenta inicial: 1000 CR ficticios via GRANT a usuario Google; stake entero 1..1000 via STAKE; premio virtual via PAYOUT; resultado RESULT de valor cero; anulación REFUND.
- Cada evento contable tiene dos líneas contrapuestas y clave de evento única. Balance de cuenta debe conciliar con suma del journal; diferencia bloquea el servicio. Operaciones bloqueadas por fila en MySQL y transacción inmediata en SQLite.
- ID de instancia YYYY-MM-DD#worldRaceRecord.key para evitar confundir ciclos semanales repetidos.

## Pruebas y cambios verificados

- Auditoría de fuente y fixture de main realizada; manifiestos de siete días creados y subidos directamente desde los mismos módulos JavaScript del repositorio.
- Tests de modos, fraude de cliente, ausencia de usuario, recuperación, reintentos, anulación, doble liquidación y 100 usuarios concurrentes redactados.
- **No declarar que los tests corrieron exitosamente:** GitHub Actions estuvo en cola al finalizar el corte. Un error YAML inicial de título de workflow fue corregido.
- **No hay prueba de Google positivo, CSRF real en navegador, WebGL UI, base MySQL de Hostinger ni cron real todavía.**
- No se modificaron los módulos de otros agentes ni el main; no hay despliegue, capturas ni rollback ejecutado.

## Riesgos y decisiones abiertas

P0: CI y cobertura transaccional reales deben pasar, luego QA de sesión Google/DB/cron en Hostinger.

P0: reconciliar identidad y créditos con agente de perfiles y PR #39/#67. users.balance_credits y demo_owners.credits son economías existentes diferentes. No fusionar silenciosamente ni crear promesa de una billetera única.

P0: fuente sintética pública deja filtrados ganadores futuros. Incompatible con apuestas reales o seguridad del resultado impredecible.

P1: programar auditoría periódica del journal, alertas de cron, sesiones y recuperación de una migración fallida.

P1: revisar diferencias PHP/MySQL, seguridad de cookies y políticas de publicidad para fase posterior.

## Migración, historia y próxima acción exacta

- No se han migrado tablas en servidores públicos. Aplicar migración SOLO por operador con copia de respaldo, control de acceso y configuración privada.
- Unificar cuentas de pronósticos con cajero/escuderías se pospone a un contrato explícito con el agente de usuarios; no desplegar un saldo engañosamente único.
- Comparar el branch con el HEAD de main en cuanto termine el resto de agentes. No copiar cambios de visual-lab, race-lab, horses ni casco del estadio.
- **Próxima acción:** revisar CI de ambos workflows por SHA; corregir fallas; coordinar auth/wallet; probar fixture, seguridad, transacciones y 100 concurrencias en staging Hostinger; abrir y revisar el PR sin fusión automática. El estado producción sigue SIN CAMBIOS.

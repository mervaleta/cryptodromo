# Cryptódromo · Entrega deportiva fase III
## Temporadas, clubes y ceremonia LIVE | integración protegida

**Base:** main 8e5d36f8 (replay 3D de GP, estadio Alpha18, navegación unificada, comunidad local). Fusionar solo tras verificar el main más reciente y ejecutar CI. No sustituir visual-lab, parade, race-lab, la base sintética ni los clubes existentes.

### 1. Qué se agrega

- sports/seasonArchive.js: snapshots de semanas completas bajo el contrato cryptodromo.synthetic-season.v1; 28 Grandes Premios, 100 corredores, ganadores, podios, clasificaciones 1–12, puntos y trofeos. Todo se recalcula desde el fixture existente. historicalPalmares() suma temporadas y rechaza duplicados.
- sports/archiveWriter.mjs y scripts/archive-season.mjs: escritura append-only con SHA-256, bloqueo por escritor, protección contra reemplazos y reintentos idempotentes. La fuente siempre es synthetic-v1, nunca emisiones observadas.
- temporadas/ y temporadas/data/index.json: archivo público que verifica checksum y contrato antes de publicar estadísticas. Índice inicialmente vacío: no se inventan semanas anteriores.
- sports/fanClubs.js y clubes/: 100 clubes ligados al roster, con palmarés, forma, calendario y rivalidades. Club principal y cinco favoritos se guardan solo en localStorage bajo cryptodromo-sports-fan-local-v1. Sin cuentas ni miembros públicos.
- sports/grandPrixCeremony.js y CSS: fail-closed ante finishState.crossedCount distinto de 12, finishState.revealed distinto de true o lastCrossAt anterior a los 60 s. No tiene motores de resultados.
- visual-lab/scene.js: único archivo de escena editado, con cuatro adiciones pequeñas: importar la ceremonia, montarla en el overlay de resultados, resetear en setRace() y mostrar después de showOfficialResult() tras pasar el finishOrchestrator.
- Enlaces mínimos en comunidad/index.html y grandes-premios/index.html, sin modificar formularios o almacenamiento del agente Comunidad.

### 2. Primera temporada y operatoria
- Ancla del programa: lunes 2 de noviembre de 2026, zona de Buenos Aires. La primera semana puede archivarse desde el lunes 9 de noviembre de 2026 a las 00:00 AR (03:00 UTC).
- Antes de esa hora el script se niega a escribir. No rellenar fechas anteriores ni usar reloj falso en producción.
- Una vez cerrada la semana, desde la raíz del repositorio, con Node 22:
 
    node scripts/archive-season.mjs 2026-11-02

- Crea temporadas/data/2026-11-02.json y actualiza temporadas/data/index.json. Revisar diff y publicar ambos mediante PR. No activa cron ni modifica precios.
- Semanas siguientes: ejecutar con fecha de cada lunes únicamente después del cierre completo. Un reintento idéntico informa alreadyArchived, pero si la data existente fue modificada el script falla. Un bloqueo .archive.lock stale requiere revisión manual de operaciones activas.
- SHA-256 detecta modificaciones, no certifica identidad del emisor. Fixture synthetic-v1 se repite idéntico todas las semanas. Los registros NO prueban que se transmitieron carreras LIVE.

### 3. Integración audiovisual
- La ceremonia aparece dentro del overlay oficial solo en Grandes Premios, tras confirmar el cruce de los 12 caballos, y se oculta al cambiar de carrera.
- Mantiene el motor CRP-DOSE-FAIR-V1, clima, animaciones, ranking y controlador de cámara.
- Desde el podio se puede abrir el replay 3D ya integrado.
- No hay podio escenográfico físico dentro de Three.js; el nuevo podio de la carrera LIVE es una banda de presentación en el acta. Una ceremonia 3D cinematográfica in-scene requerirá pruebas con el estadio final.

### 4. QA
    node --check sports/seasonArchive.js
    node --check sports/archiveWriter.mjs
    node --check sports/fanClubs.js
    node --check sports/grandPrixCeremony.js
    node --check visual-lab/scene.js
    node --experimental-default-type=module --test tests/sports-season-clubs-ceremony.mjs tests/grand-prix.mjs tests/grand-prix-3d.mjs tests/official-race.mjs tests/track-splits.mjs

CI: .github/workflows/sports-season-clubs.yml. Además realizar QA visual en móviles, verificar navegación, restablecimiento y GPU después de fusionar.

### 5. Límites y seguridad
- Sin base de datos de cuentas, sin usuarios reales, sin conteo de socios, sin cartera ni pagos.
- Persistencia real en temporadas con resultados de fuentes NO sintéticas requiere una base de actas efectivamente emitidas, mercado auditable, servidores autenticados y firmas. Esta demo no reemplaza eso.
- No se verificó la publicación final en Hostinger.
- Nunca liquidar apuestas monetarias contra fixture precomputado y conocido.

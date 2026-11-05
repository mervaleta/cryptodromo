# Cryptódromo · Pronósticos virtuales Alpha19

**SIN DINERO / SIN PREMIOS CANJEABLES / SIN APUESTAS REALES.** Paquete independiente PHP + SQL, con un ledger y resultados oficiales sintéticos.

## Fuente única deportiva

El script scripts/export-prediction-fixture.mjs materializa el resultado de resolveWorldRace (worldRaceRecord.js) sin crear otra fórmula. Los 7 archivos predictions/fixtures/day-1.json a day-7.json incluyen 10.080 eventos, con 1.440 por día entre las pistas Muybridge, Genesis y Vint Cerf.

**Advertencia:** las posiciones son sintéticas y cualquiera puede conocerlas antes de la largada. Esto descalifica el motor actual para apostar dinero real.

El ID de una instancia es YYYY-MM-DD#CRP19-CRYPTO-TRACK-Dxx-Sxxx. El prefijo calendario diferencia ciclos semanales que se repiten. La hora es America/Argentina/Buenos_Aires; largada :30 de cada minuto, cierre 5 segundos antes (:25), llegada 60 segundos después. El renderizador WebGL no define ni liquida resultados.

## Instalación segura en Hostinger

1. Verificar PHP 8.1+, PDO MySQL o PDO SQLite, HTTPS, sesiones y una base de datos privada. No habilitar identidades visitantes.
2. Usar la MISMA base de usuarios verificados de api/auth.php. Ejecutar manualmente predictions/schema.mysql.sql o predictions/schema.sqlite.sql, sin exponer migraciones en HTTP. El campo users.id debe ser positivo y estable.
3. Para MySQL configurar DB_HOST, DB_NAME, DB_USER, DB_PASS. Para SQLite crear previamente el archivo fuera del document root y pasar su ruta absoluta como CRP_AUTH_SQLITE_PATH. El backend se niega a crear la base dentro del directorio público.
4. Configurar GOOGLE_OAUTH_CLIENT_ID y verificar que api/auth.php haya creado una sesión Secure/HttpOnly con user_id. Este módulo no agrega inicio de sesión paralelo ni almacena contraseñas.
5. Ejecutar el exportador desde la raíz en la versión exacta de motor deportivo desplegada:
   - node --experimental-default-type=module scripts/export-prediction-fixture.mjs --check
   - node --experimental-default-type=module --test tests/predictions-official-fixture.mjs
6. Publicar predictions/fixtures, el núcleo PHP y /pronosticos/. Si falta un manifiesto, el servicio responde 503.
7. Programar cron de PHP CLI una vez por minuto: php /path/to/repo/scripts/settle-predictions.php. Las credenciales deben estar en el entorno privado de cron, nunca en un parámetro HTTP.
8. Comprobar autenticación real, PHP, permisos, reconciliación contable, cierres, cron, móvil y HTTPS EN HOSTINGER. CI no equivale a validación de despliegue.

Si no está configurada la sesión Google o la base de datos, la confirmación debe permanecer deshabilitada. No reemplazar por una identidad falsa en producción.

## API

GET /api/predictions.php?action=races: próximas nueve carreras, 12 símbolos oficiales, pista, inicio/cierre/llegada, reloj del servidor y multiplicadores. No publica posiciones futuras en esta respuesta, pero el fixture sí es reproducible en el cliente.

GET /api/predictions.php?action=me: sesión Google verificada requerida. Devuelve CSRF, historial de hasta 40 comprobantes, créditos y saldo recalculado del journal. Una diferencia contable bloquea la consulta.

POST /api/predictions.php?action=confirm: requiere sesión verificada, Origin HTTPS idéntico, X-CSRF-Token, Content-Type application/json y JSON con race_id, modality, picks (lista de símbolos), stake entero (1 a 1000) e idempotency_key UUID v4. El backend nunca acepta ID de usuario, saldo, reloj o resultados del cliente.

El sistema usa transacciones SQL. MySQL InnoDB hace SELECT ... FOR UPDATE; SQLite BEGIN IMMEDIATE. Cada movimiento tiene dos asientos compensados, cuya suma es cero. La cuenta cacheada facilita la concurrencia, pero el journal permite reconstruir el saldo.

Estados persistentes: confirmed, closed, pending_result, won, lost, void. Un reintento del mismo comprobante no debita dos veces. Se rechazan intentos después de la hora oficial salvo una repetición idempotente idéntica. El job de liquidación es independiente del canvas.

## Reglas matemáticas de demostración

| Modalidad | Acierto | Recompensa virtual |
| --- | --- | --- |
| Ganador | Primer corredor | Apuesta x4 |
| Podio | Los tres primeros sin orden | Apuesta x25 |
| Exacta | Primer y segundo en orden | Apuesta x30 |
| Trifecta | Tres primeros en orden | Apuesta x150 |

Los multiplicadores son reglas ficticias, NO cuotas probabilísticas ni de dinero real. Un usuario verificado recibe 1.000 CR virtuales con asiento GRANT:user; la confirmación deja asiento STAKE:ticket; ganar produce PAYOUT:ticket y el resultado se audita mediante RESULT:ticket. La anulación autorizada reintegra mediante REFUND:ticket. No hay comprar, transferir, retirar, cambiar por criptomonedas o canjear premios.

## Pruebas reproducibles

Con Node 22, PHP CLI, PDO SQLite y pcntl:
- node --experimental-default-type=module scripts/export-prediction-fixture.mjs --check
- node --experimental-default-type=module --test tests/predictions-official-fixture.mjs
- php -l predictions/lib.php && php -l api/predictions.php
- php tests/predictions-php.php
- php tests/predictions-concurrency.php

Cubren 10.080 cruces con fuente oficial, cuatro modalidades, combinaciones inválidas, cierres, liquidaciones, reintentos, anulación, historial privado, reconstrucción, asientos balanceados y 100 usuarios de prueba concurrentes.

## Coordinación necesaria

El agente de usuarios mantiene api/auth.php con users.id, y el módulo legado todavía tiene users.balance_credits. Los PR #39 y #67 proponen otra economía demo anónima. **No presentar estos sistemas como una billetera unificada sin migración y reconciliación aprobadas.** Este motor mantiene un ledger aislado de pronósticos con identidad Google, no consume la sesión guest de escuderías.

No activar apuestas monetarias. En Argentina, el juego online se regula por jurisdicción: una fase distinta requiere determinar territorios, licencias, controles de edad e identidad, AML, privacidad, juego responsable, integridad de resultados, auditoría externa, geolocalización, protección del consumidor y normas publicitarias. Fuentes oficiales:
- https://www.alea.org.ar/juego-online-en-argentina
- https://loteria.gba.gob.ar/juego-online
- https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-446-2025-419693/actualizacion

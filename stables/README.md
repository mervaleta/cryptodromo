# Escuderías Alpha18: implementación de la DEMO

## Estado
Módulo autónomo integrado con el sitio actual en `/stables/` y `/championship/`. No modifica resultados, cámaras, animaciones, estadio ni cuotas. Las páginas heredan el encabezado unificado existente.

**Modo exclusivo de demostración**: no hay dinero real, compras, depósitos, apuestas, retiros ni cuentas verificadas. Los 5.000 créditos iniciales son ficticios y existen sólo en el servicio de escuderías. La taquilla actual sigue desactivada. No reutilizar este servicio para saldos monetarios.

## Arquitectura real del sitio
- **Fixture oficial**: `race-lab/source/src/data/raceFixture.js`, con 100 tokens, 12 participantes, 480 carreras cada día y ciclo de 7 días.
- **Clasificación oficial**: `race-lab/source/src/data/officialRace.js` con `officialRanking` y `CRP-DOSE-FAIR-V1`.
- **Hora del estadio**: `visual-lab/liveSchedule.js`, zona `America/Argentina/Buenos_Aires`, lunes 2/11/2026 a las 00:00 como día 0.
- **Resultados congelados de la misma fuente**: `stables/official-week-v1.json`, 3.360 carreras calculadas con idénticos algoritmos y 12 posiciones por carrera. La prueba verifica TODAS las llegadas frente al motor JavaScript.
- **API**: `api/stables.php`, PHP 8+ y PDO SQLite, sin dependencias externas.
- **Vistas**: `stables/index.html` y `championship/index.html`, CSS y JS compartidos en `assets/stables.*`.
- **Navegación**: entradas nuevas de Escuderías y Campeonatos en `assets/crp-global-nav.js`.

## Comportamiento
- Una escudería por visitante anónimo con cookie de sesión HttpOnly. Nombre, colores, capitán y 2/3/5/8/12 tokens, compartibles entre distintos usuarios.
- Créditos demo: 5.000 iniciales. Licencias: 100/250/600/1500/3500. Ampliación: sólo diferencia.
- XP POR ACTUACIÓN (contando la participación): 27/17/12 para posiciones 1/2/3; 7 para 4-6; 2 para 7-12.
- Los caballos puntúan una vez para cada escudería que los haya inscrito antes de la carrera. No hay puntos retroactivos ni multiplicador de capitán.
- Dos reemplazos de plantilla por semana como máximo, aplicados a partir de la siguiente largada.
- Clasificaciones por **XP total** y **XP/participación**. Eficiencia provisional hasta 5/10/30/100 actuaciones para día/semana/temporada de 28 días/histórico.
- Ranking basado en registros de XP únicos por escudería/carrera/caballo.
- Operaciones de crédito atómicas y con idempotency key. Nunca se aceptan resultados, posiciones o XP proporcionados por el navegador.

## Hostinger
1. Confirmar PHP 8+ con **pdo_sqlite/sqlite3** habilitados (a diferencia de una instalación estática, se necesita ejecutar PHP).
2. La carpeta que contiene `api/`, `stables/`, `assets/`, etc. debe ser la raíz pública. Un despliegue que copie sólo `public/` NO incluirá este módulo.
3. El proceso PHP debe poder escribir en `../cryptodromo-stables-private`, ubicado **fuera de la raíz pública**, para la base `stables-demo-v1.sqlite`. No publicar ni descargar esa base.
4. Verificar `/api/stables.php?action=bootstrap` (respuesta JSON con `ok: true`). Si devuelve HTML/503, ajustar PHP/almacenamiento antes de habilitar la navegación.
5. Revisar creación, refresh, rango de XP y rankings desde dos sesiones separadas.
6. Las actualizaciones del fixture deben reconstruir `official-week-v1.json` y ejecutar `node --test tests/stables-demo.mjs` antes de publicar. Cambiar `FIXTURE_VERSION`/migración cuando cambie la fórmula.
7. Mantener backup privado de SQLite y ejecutar smoke checks tras cada despliegue.

**Alcance del producto**: es una demo de escuderías con tablero compartido de visitantes de sesión. Los invitados pueden generar más de una identidad limpiando cookies y no hay recuperación de cuentas, antifraude robusto ni moderación. Para una versión comercial conectar el login verificado, la billetera regulada y un servicio de resultados inmutable antes de ofrecer créditos con valor. El `api/auth.php` del legado acepta direcciones de correo sin validar identidad: NO se utiliza como login de esta funcionalidad.

## Pruebas
```sh
php -l api/stables.php
node --check assets/stables.js
node --test tests/stables-demo.mjs
node --test tests/stables-api.mjs
```
La prueba API levanta un servidor PHP local, requiere PDO SQLite y verifica: creación y débito, reintentos sin cobro, datos inválidos, XP sólo desde la largada posterior, conteo único, cambio de plantilla, bloqueo de cambios conflictivos, ampliación por diferencia, clasificación por total y eficiencia, y aislamiento entre sesiones.

## Siguientes mejoras opcionales
Cuentas verificadas, snapshots comparables para la variación de puesto, importación de XP histórico (si se recupera la fórmula original), logros persistentes y ligas privadas. No son bloqueantes para esta demo, pero sí para un lanzamiento con identidades y saldo real.

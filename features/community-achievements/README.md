# Cryptódromo · Comunidad y logros (propuesta aislada)
Estado: **listo para integración, NO desplegado**. Rama: `feat/community-achievements-20261102`.

## Concepto
Un álbum de insignias, identidad comunitaria y recuerdos de carreras, sin premios económicos, apuestas, créditos ni ventaja competitiva. Los logros recompensan exploración, conocimiento y participación, no dinero ni tiempo compulsivo.

### Colección inicial (18)
- **Bienvenida**: `founder` (perfil creado), `first_visit` (primera visita verificada).
- **Afición**: `first_race` (primera carrera vista), `grandstand_5` (5 carreras distintas), `grandstand_25` (25 carreras distintas), `photo_finish` (ver una llegada), `replay_5` (5 replays distintos).
- **Exploración**: `explorer_5` (5 corredores distintos), `explorer_25` (25), `token_historian` (leer historia del proyecto), `weather_watcher` (ver carreras con 3 climas distintos).
- **Comunidad**: `profile_complete` (perfil completado), `first_favorite` (primer favorito), `collector_5` (5 favoritos distintos), `curator` (exhibir 3 insignias), `first_post` (primer aporte moderado).
- **Especiales**: `opening_day` (campaña inicial, por asignación administrativa), `seven_days` (participar en 7 fechas distintas, sin obligación consecutiva).

## Perfil comunitario
Alias público único, avatar aprobado, biografía corta, caballo/token favorito, hasta tres insignias exhibidas, álbum completo con progreso, vitrina de recuerdos y controles de privacidad. Por defecto, perfil **privado**. No mostrar correo, saldo, transacciones ni información financiera.

## Integración técnica
1. Confirmar la tabla de identidad real de staging y el mecanismo de sesión antes de conectar el endpoint. **No confiar en IDs enviados por navegador ni en `api/auth.php` como prueba de identidad**: el endpoint legado permite suplantación mediante email.
2. Ejecutar una sola vez `001_achievements.sql` en staging. Migración **aditiva**, no elimina ni modifica tablas existentes. Las tablas usan `user_id BIGINT UNSIGNED` sin FK hacia `users` hasta conocer su tipo real.
3. Integrar `AchievementService.php` desde acciones confirmadas en servidor. Ejemplo: `awardEvent($pdo,$userId,'race_watched','race:2026-11-02:42', ['race_id'=>'...'])`. `event_key` debe ser único por usuario y acontecimiento, no por request.
4. Adaptar `community-profile.php` al middleware de autenticación y CSRF definitivo. Este endpoint no permite otorgar logros. Publicarlo solo después de revisar el contrato de sesión.
5. Incorporar tarjetas y vitrina en el nuevo perfil del sitio institucional (no reutilizar la pantalla antigua de caja/apuestas), usando `/assets/site-shell.css`.
6. Activar eventos verificables: ver carrera completa, leer una ficha, guardar favorito, publicar aporte aprobado. Evitar otorgar logros por clics sin verificación.
7. Probar idempotencia, concurrencia, privacidad, XSS, límites de perfil y acceso no autenticado antes de fusionar.

## Eventos admitidos por el servicio
`account_created`, `first_visit`, `race_watched`, `finish_watched`, `replay_watched`, `racer_viewed`, `project_history_read`, `weather_race_watched`, `profile_completed`, `favorite_added`, `badges_showcased`, `post_approved`, `event_day_attended`.
Para métricas de entidades distintas usar claves estables (`race:<id>`, `racer:<symbol>`, `weather:<mode>`, `day:<YYYY-MM-DD>`).

## Criterios de aceptación
- Misma carrera vista 10 veces: 1 evento válido y 1 avance.
- Una carrera distinta: avance adicional.
- Ningún usuario puede atribuirse eventos a sí mismo mediante POST directo.
- Equipar insignia ajena o bloqueada: 403.
- Perfil privado no visible para terceros.
- Se pueden exhibir 0 a 3 insignias; no duplicadas.
- SQL instalable en base nueva o existente sin DROP.
- Sin apuestas, saldos, compras, streaks punitivas ni recompensas monetarias.

## Dependencias pendientes
**Bloqueadores reales:** identidad/sesiones verificadas, tabla de usuarios definitiva, fuentes de eventos verificables y página de perfil unificada por los otros agentes. Por eso la rama está preparada, pero **no conectada ni desplegada**.

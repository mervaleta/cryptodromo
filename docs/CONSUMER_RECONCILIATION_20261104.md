# Consumer Premium · reconciliación Alpha19 (4 noviembre 2026)

El nuevo `main` (b0009b54808baa76806c2d29e39c8e557742a570) ya no monta la carrera en `/`: es el hub de ocho estadios. La carrera WebGL de Satoshi vive en `/stadiums/crypto/broadcast/` y la selección de canales en `/stadiums/crypto/live/`. Los tres canales tienen 1.440 carreras/día (10.080/semana), largadas a :30, mientras que la API de tickets del PR #67 sigue en el fixture legacy de 480 carreras/día / 3.360 posiciones semanales.

## Decisión aplicada
Conservar íntegramente la nueva portada de otros agentes, **retirando el antiguo patch de `index.html` del PR #67**. Mantener los componentes `addons/premium-consumer/*` staged y sin montar en la nueva portada ni en el WebGL. Reparar los enlaces de favoritos hacia el LIVE actual y mejorar copy de la cuenta sin cambiar su servidor. Mantener el PR como DRAFT. Backup: `backup/premium-before-new-stadium-home-20261104-9d914`.

## Bloqueos / prioridades
1. P0: generar un snapshot oficial de los **10.080** eventos a partir de `getTripleRaceFixture` y `officialRace`, con versionado, hash y paridad. No calcular ganadores de manera independiente en PHP.
2. P0: adaptar tickets, odds, cierre y liquidación al `raceId` por pista; el backend actual usa `absolute_round` (480/día) y el horario antiguo. Hasta entonces no habilitar apuestas en los tres canales LIVE.
3. P0: unir autenticación Google (`PHPSESSID` + `users.balance_credits`) con la identidad de escuderías/billetera (`crp_stables_demo` + `demo_owners.credits`) sin saldo duplicado ni migración insegura.
4. P0 para dinero real: definir si las cuotas son fijas WIN 8x/PLACE 4x/SHOW 2,5x o el reparto de pool original, comisiones, reglas versionadas y garantías de resultado no predecible.
5. P1: montar la taquilla en el **contenedor LIVE externo al iframe**, asociada al canal activo y con relojes del servidor. Conservar siempre el motor 3D intacto.
6. P1: revisar PR #70 (fixture), #72 (logos gatera), #32 (transparencia), #40 (comunidad) y elegir solo un sistema de navegación entre #23/#35. No fusionar PR #39 por separado: wallet está portada en #67.
7. P1: realizar QA real contra Hostinger (ruta, MIME, WebGL, PHP SQLite, cookie, CSRF, 320/390/768/1440px, pérdidas de red), comparando SHA servido; esta sesión no logró abrir el sitio directamente.

## Archivos fuera de alcance
No modificar `racers/**`, `race-lab/**`, `visual-lab/**`, `estadio/**`, `admin/horses/**`, modelos 3D, ni el sistema de estadísticas/fixture del otro agente. `main` y producción permanecen intactos.

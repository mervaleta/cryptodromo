# Cryptódromo · Racing Demo (2026)

[Carrera](https://race.cryptodromo.com/) · [Corredores](https://race.cryptodromo.com/racers/) · [Maestro BTC](https://race.cryptodromo.com/racers/#BTC) · [Presentación](https://race.cryptodromo.com/institucional/)

Cryptódromo convierte **variaciones de precios en una competencia visual de 12 corredores**. Esta edición es una **demo reproducible con precios sintéticos precargados**, NO usa cotizaciones en tiempo real ni acepta apuestas, depósitos, retiros o premios con dinero real. La historia original del producto contempla otros modos y una fase posterior de apuestas reguladas, pero no están habilitados aquí.

## Estructura actual

| Área | Ruta | Fuente principal |
| --- | --- | --- |
| Transmisión de carrera | `/` | `index.html`, `visual-lab/`, `race-lab/source/` |
| Corredores y maestro BTC | `/racers/` | `racers/`; contrato en `docs/HORSE-MASTER-CONNECTION.md` |
| Fixture, resultados, estadísticas | `/fixture/`, `/resultados/`, `/estadisticas/` | `race-lab/source/src/data/` y adaptadores de cada vista |
| Grandes Premios | `/grandes-premios/` | `grandes-premios/` |
| Estadios y desfile | `/stadiums/`, `/estadio/`, `/parade/` | `stadiums/`, `estadio/`, `parade/` |
| Escuderías y campeonato | `/stables/`, `/championship/` | `stables/`, `api/stables.php` |
| Información institucional | `/institucional/` | `institucional/`, `assets/institutional.*` |
| Editor administrativo de caballos | `/admin/horses/` | `admin/horses/`, `api/horse-profiles.php` |
| Editor de borradores de fixture | `/admin/fixture/` | `admin/fixture/` |

La identidad de **100 activos/corredores**, el fixture semanal de **3.360 carreras** (7 × 480) y la clasificación oficial dependen de `tokenRoster.js`, `raceFixture.js` y `officialRace.js`. El renderizador y las coreografías no deben redefinir ganadores. La auditoría reproducible está en `docs/SPORTS-WEEK-AUDIT-20261103.md`.

## Desarrollo y QA

Requisitos recomendados: **Node 22**, **PHP 8.1+** para los módulos administrativos y sus pruebas, y Chromium/Playwright para QA de WebGL. No es necesario disponer de credenciales de mercado ni iniciar flujos de apuestas para probar la demo.

```bash
node --experimental-default-type=module --test tests/official-race.mjs
node --experimental-default-type=module --test tests/sports-week-audit.mjs
node --test tests/site-integrity.mjs tests/auth-security.mjs
php -l api/auth.php
php -l admin/horses/api.php
php -l admin/fixture/api.php
```

Las pruebas browser y visuales tienen workflows separados bajo `.github/workflows/`. Su éxito o fallo debe revisarse por SHA, no inferirse de la existencia de archivos. `tests/public-site-smoke.mjs` verifica las rutas públicas y controles de seguridad **contra el dominio desplegado**.

## Despliegue y seguridad

- `main` es la referencia de código del sitio. **Un commit no demuestra que Hostinger ya esté sirviendo ese SHA.** Confirmar con el smoke público, URL y caché.
- Los scripts heredados `deploy.php`, `cryptodromo/deploy.php` y `prode-bursatil/deploy.php` se retiraron por contener tokens públicos; ahora responden HTTP **410**. No volver a habilitarlos con secretos incrustados.
- El archivo histórico `.ssh_pass` fue eliminado del HEAD, pero **se deben rotar las credenciales que estuvieron expuestas** y evaluar limpieza histórica de Git con coordinación. No incluir secretos en Git ni en HTML público.
- `api/auth.php` exige ID token de Google verificado por servidor. Sin `GOOGLE_OAUTH_CLIENT_ID` y una base de usuarios válida, devuelve error seguro y no inicia sesión. Ver `docs/AUTH-INTEGRATION-20261104.md`.
- `/admin/horses/` y `/admin/fixture/` requieren controles PHP reales y variables de entorno. Sin configuración, deben rechazar el acceso. Ver `docs/HORSE-EDITOR-ADMIN.md` y `docs/FIXTURE-ADMIN-SECURE-20261103.md`.
- `robots.txt` **no** constituye una barrera de seguridad: la protección de almacenamiento, directorios privados y backups depende del servidor.

## Límites de la demo

Los precios son sintéticos y los resultados futuros del fixture son reproducibles y conocidos por el cliente. **No habilitar dinero real ni apuestas sobre estos resultados.** Las cuotas ilustrativas de `/apuestas/` no son probabilidades de mercado ni consejos financieros.

El maestro anatómico BTC está en revisión independiente en `/racers/#BTC`. No tocar `racers/btc-maya-master.js`, la animación ni el puente de 100 identidades sin comparar el contrato y validar visualmente al maestro. La fase de pulido AAA tiene pruebas específicas y es independiente del trabajo general del sitio.

## Documentación adicional

- `RACE-SITE-INTEGRATION.md`: integración de la transmisión y la web.
- `docs/SPORTS-WEEK-AUDIT-20261103.md`: integridad y sesgos del fixture.
- `docs/HORSE-MASTER-CONNECTION.md`: contrato y limitaciones actuales del maestro BTC.
- `docs/ALPHA20-BROADCAST-GATES-HANDOFF.md`: gateras y criterios de QA.
- `ASSET_CREDITS.md`: procedencia y licencias de recursos.

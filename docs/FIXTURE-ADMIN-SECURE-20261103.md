# Admin fixture Alpha20: integración segura y borradores compartidos

**Base de código:** main `d12f2bb`, ya con Alpha20 gateras, ocho estadios, siete fixtures editoriales, escuderías y auditoría deportiva. La rama sólo añade `admin/fixture/` y pruebas.

## Arquitectura
- `/admin/fixture/` resuelve a `index.php` y requiere autenticación HTTP Basic contra variables de entorno. **Sin variables configuradas retorna 503 y no muestra la interfaz.**
- `/admin/fixture/api.php` usa la misma autenticación, sesiones HttpOnly Secure SameSite=Strict, token CSRF, control del Origin, revisiones optimistas, guardado JSON atómico bajo flock y audit log append-only.
- Los archivos privados están **fuera** del document root, en `../cryptodromo-fixture-private/` (o `CRP_FIXTURE_TEST_DIR` en PHP CLI server).
- Validación en servidor de IDs 0..6:0..479, 12 símbolos únicos, 4 estrellas, 4 principales y 4 desafiantes; nombres del roster versionado `stables/official-week-v1.json`.
- Panel utiliza directamente los módulos actuales `raceFixture.js`, `tokenRoster.js` y `officialRace.js`. Las alteraciones son simulaciones de borradores, NO cambios oficiales.

## Variables de entorno obligatorias (NO incluir en Git)
`CRP_FIXTURE_ADMIN_USER`: nombre de cuenta administrativa.
`CRP_FIXTURE_ADMIN_PASSWORD_HASH`: resultado de `php -r 'echo password_hash("contraseña-larga-y-unica", PASSWORD_DEFAULT);'`.

Deben estar disponibles para el proceso PHP, servirse sólo bajo HTTPS y verificarse tras despliegue. Si el host no expone esas variables o no ejecuta PHP, **no habilitar la ruta**. En un servidor nginx el archivo `.htaccess` puede ser ignorado: el control real se aplica en PHP. No crear archivos `index.html` en esta carpeta.

## Pruebas
`node --experimental-default-type=module tests/fixture-admin-secure.mjs`
`php -l admin/fixture/index.php && php -l admin/fixture/api.php && php -l admin/fixture/_auth.php`
Requiere PHP y Node 22. El test utiliza PHP embebido y un directorio temporal aislado.

## Publicación del fixture real
**No habilitada automáticamente.** La web, Grandes Premios, datos de las 3.360 carreras, escuderías, estadios y campeonatos dependen de una misma fuente determinista. Un borrador aprobado exige generar una nueva versión de fixture y sus derivados, comparar auditorías, bloquear carreras iniciadas, registrar commit/revisión y desplegar todos los consumidores atómicamente. Evitar editar resultados de carreras disputadas y NO apostar sobre el fixture sintético con resultados futuros conocidos.

## Despliegue
1. Configurar usuario y hash en entorno PHP en Hostinger (nunca en archivos públicos).
2. Confirmar DocumentRoot = raíz del repo (no la carpeta `public/`).
3. Asegurar PHP 8.1+, HTTPS y permiso de escritura **fuera de public_html**.
4. Ejecutar la suite CI y smoke con 401 sin autenticación, 200 autenticado, POST con CSRF, 409 en conflicto, y verificar almacenamiento privado.
5. Recién entonces fusionar y desplegar. Verificar que `/admin/fixture/_auth.php` no imprima datos y que no haya indexación.
6. Revisar también el archivo público rastreado `.ssh_pass` (presente en main). Su sola eliminación no revoca posibles credenciales: hay que rotarlas y evaluar limpieza histórica.

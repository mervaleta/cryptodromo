# Autenticación verificada de Cryptódromo · 2026-11-04

## Estado
`api/auth.php` antes aceptaba `email` y `google_id` enviados directamente por el navegador sin prueba de identidad. Se elimina esa suplantación. El acceso nuevo requiere un ID token firmado y validado por Google. **Si no existe configuración, el endpoint niega POST sin tocar la base de datos.**

## Configuración necesaria en Hostinger (secreto fuera de Git)
- `GOOGLE_OAUTH_CLIENT_ID`: Client ID web válido de la consola de Google. Debe coincidir con el `aud` del ID token.
- Configurar `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST` para MySQL; alternativamente `CRP_AUTH_SQLITE_PATH` a un archivo SQLite YA provisionado **fuera de document root**.
- Tabla `users`: columnas `id`, `email` único, `google_id` (idealmente único), `name`, `avatar_url`, `balance_credits`, `last_login`. La migración y vinculación de cuentas existentes requieren revisión; se devuelve 409 ante email ya existente sin `google_id` coincidente.
- HTTPS obligatorio para sesión Secure; extensiones PHP PDO para driver de BD y cURL. Versiones compatibles con PHP 8.1 o posterior.

## Integración del cliente
Implementar Google Identity Services en la página que realmente requiera inicio de sesión. En el callback, enviar por POST HTTPS `/api/auth.php?action=login_google` con Content-Type `application/json` y `{"id_token": credential}`; **no enviar ni confiar en email/google_id del navegador**. Probar 200, 400, 401, 409 y 503. No mostrar una opción de sesión funcional hasta configurar todo. No se agrega ninguna compra/apuesta real.

## Criterios para activar
1. `node --test tests/auth-security.mjs` y `php -l api/auth.php`.
2. Prueba negativa: identidad inventada -> 400/401/503; no crear perfil ni emitir sesión.
3. Prueba positiva: un token legítimo emitido para el client ID correcto crea sesión Secure, HttpOnly.
4. Revisión de esquema, migración, CSRF en cualquier operación de modificación posterior y política de conservación de datos.
5. Smoke de regresión de carrera y de editor de caballos. El endpoint es independiente del motor de carreras.

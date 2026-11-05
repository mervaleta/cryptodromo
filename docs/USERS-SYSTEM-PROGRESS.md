# Cryptódromo · Sistema de usuarios · progreso y reanudación
Fecha: 2026-11-05. Rama: feat/users-identity-system-20261105. Base: main 339ec31cef04564112f3c9a81dbd3947c2de229a.

## Estado VERIFICABLE: implementación aislada, NO APROBADA PARA PRODUCCIÓN

No fusionar ni activar hasta pasar la suite de integración con la base definitiva, reparar los defectos documentados y comprobar el dominio desplegado. Este documento registra código existente en la rama, no un sistema que ya funcione en Hostinger.

### Arquitectura y compatibilidad
- El repositorio usa HTML/ESM y PHP. Main ya tiene api/auth.php (Google ID-token autenticado) con tabla legacy users, y api/stables.php con una sesión anónima y billetera demo totalmente separadas.
- La nueva API es api/users.php, con primitivas api/users-lib.php. Reutiliza la tabla users en lugar de crear otra autoridad para cuentas. No modifica resultados deportivos, caballos, fixture, estadios ni saldo de la wallet.
- Para persistencia utiliza PDO con MariaDB/MySQL del hosting por DB_HOST, DB_NAME, DB_USER y DB_PASS, o CRP_USERS_DSN. SQLite es SOLO opción local/entornos compatibles con pdo_sqlite, siempre con ruta absoluta FUERA del document root.
- La documentación pública de Hostinger confirma MariaDB para Web/Cloud y PDO MySQL. AÚN NO se comprobó qué plan, versión PHP, credenciales o base usa race.cryptodromo.com.
- La UI de /cuenta/ es un frontend real que consume api/users.php. No crea sesiones ni guarda contraseñas en localStorage.
- Sin credenciales/configuración correctas, la API falla cerrada y el panel muestra error de servicio, en vez de presentar cuentas simuladas. Se corrigió el parser para aceptar los objetos JSON vacíos de logout y otras acciones sin datos.
- Modelo persistente: users existente; user_profiles, user_credentials, user_sessions, user_favorites, user_notifications, user_security_events, user_action_tokens y user_rate_limits. Claves foráneas a users.id, claves únicas por alias y por par usuario/caballo.
- Las contraseñas usan PASSWORD_ARGON2ID. El session id solamente vive en cookie HttpOnly Secure SameSite=Lax y en el almacén de sesiones de PHP; la tabla guarda un SHA-256 del session id para revocaciones. CSRF por sesión y comprobación de origen en todas las escrituras. Se controla abuso por IP y cuenta usando hash HMAC; CRP_USERS_SECRET es obligatorio.

### Funciones implementadas en la rama
- Registro email/contraseña, login, logout, logout global, sesiones múltiples persistentes por siete días, modificación de perfil y de contraseña.
- Protección de acceso entre cuentas, vistas públicas opt-in por alias, idioma/zona horaria, preferencias de notificaciones, actividad de seguridad.
- Favoritos con símbolos validados contra los 100 integrantes del archivo oficial stables/official-week-v1.json. Panel que importa el fixture Alpha19 oficial para consultar futuras carreras, sin inventar resultados.
- API para guardar/listar/marcar notificaciones in-app. Los eventos reales de registro, verificación y cambio de contraseña ahora crean mensajes en la bandeja del usuario. Aún falta el productor de eventos deportivos y enlaces con pronósticos.
- Tokens de recuperación/verificación de email con 30 minutos de expiración y un solo uso. Para el envío real se contempla Resend con credenciales fuera del repositorio. Sin proveedor autorizado, request_reset devuelve 503 y no finge un correo enviado.
- Fichas y panel responsive, controles etiquetados, estados vacíos/errores, sin exponer datos privados en perfiles públicos.

### CONTRATO con el agente de pronósticos (sin implementación de apuestas)
- Identidad: la sesión validada por crp_users_current(PDO) del mismo origen. Ignorar cualquier userId que envíe el navegador. El id numérico users.id es únicamente para joins privados en backend.
- GET /api/users.php?action=bootstrap: {ok,csrf,user} y, solo para su dueño, user.id, alias, email y preferencias. No usar esta respuesta como prueba criptográfica en otro backend.
- GET /api/users.php?action=profile&alias=ALIAS: solo alias, avatar_url y joined_at cuando public_profile=1; jamás email, hash, saldo, sesiones ni IDs internos.
- Roles y permisos: usuario autenticado con acciones propias solamente. NO hay endpoint de administrador ni rol elevado. Toda creación de pronóstico debe resolver identidad y permisos del lado servidor, y controlar ownership por id.
- Logout y revocación: eliminación de user_sessions; eventos user_security_events logout/logout_all/password_reset. Integraciones futuras deben tratar revocación como consulta server-side, NO como evento confiable entregado por browser.
- Los pronósticos, tickets, balances, premios, wallet y settlements pertenecen a otro agente. No se implementan aquí.

### Dependencias/activación en Hostinger (NUNCA poner secretos en Git)
1. Copia de seguridad de la base y verificación de las tablas existentes users y sus columnas e índices. Si la tabla difiere de la usada por api/auth.php, preparar una migración conservativa supervisada.
2. Confirmar PHP >=8.1 con Argon2id, PDO MySQL y cURL. Configurar DB_HOST, DB_NAME, DB_USER y DB_PASS con permisos mínimos; o CRP_USERS_DSN con una base privada.
3. Definir CRP_USERS_SECRET como valor aleatorio de mínimo 32 caracteres distinto entre entornos. Configurar cookies de sesión HTTPS y almacenamiento privado de sesiones PHP; confirmar que el directorio de datos no sea público y que haya backups encriptados con control de acceso.
4. Desde CLI en Hostinger/entorno de migración: php scripts/users-migrate.php. Ejecutar inicialmente en una copia de la BD. **Limitación actual**: los CREATE INDEX simples deben revisarse antes de repetir el script; no ejecutar una segunda vez hasta reparar idempotencia.
5. Para mensajes reales, opcionalmente configurar CRP_MAIL_API_KEY, CRP_MAIL_FROM y CRP_SITE_URL (origen HTTPS propio). Se requiere aprobación explícita del proveedor y dominio de envío. Sin proveedor no se declara completada la recuperación de contraseña.
6. Verificar configuración de despliegue Hostinger del repositorio y rutas /cuenta/ y /api/users.php. Un commit no demuestra deploy.

### Pruebas
- Fuente de CI: .github/workflows/users-system.yml. Test HTTP + PDO SQLite: tests/users-system.mjs; migración repetible también validada por pasos MariaDB de CI. Las ejecuciones de GitHub Actions verificadas hasta el último acceso seguían en estado queued, no aprobadas. Incluye registro, sesiones simultáneas, revocación, privacidad, ownership de favoritos, edición de perfil, bloqueo de correo sin proveedor y validaciones.
- PHP 8.4 y Node 22 disponibles en el entorno de elaboración. No está instalada la extensión pdo_sqlite ni pdo_mysql, por lo que **el test de BD E2E no puede ejecutarse localmente aquí**. Se requiere resultado verde del workflow antes de merge.
- No se ejecutó QA Chromium, accesibilidad automatizada ni pruebas de Hostinger real. No se presenta una captura como prueba.
- No hubo despliegue ni modificación de base de datos de producción.

### Problemas pendientes conocidos
1. La ruta api/auth.php de Google ahora utiliza crp_users_login, el almacén revocable y el perfil canónico y se niega a crear usuarios si faltan migración o secreto. **Pendiente prueba positiva con un ID token real y OAuth en Hostinger**. La UI muestra Google Identity Services solo si GOOGLE_OAUTH_CLIENT_ID está configurado.
2. Resuelto: el frontend transmite correctamente los parámetros del perfil público; resta validación real desde browser y control de acceso entre cuentas.
3. Resuelto en código: creación de índices idempotente, y test de dos pasadas en MariaDB; RESTA ejecutar CI y verificar restricciones, migración de datos legacy y backups.
4. Faltan pruebas de reset/verificación con proveedor de correo autorizado, concurrencia/rate limits y login federado real en navegador. La API Google está enlazada en código, no verificada contra producción.
5. Crear eventos reales de notificación desde carreras y enlazar historial y estadísticas personales cuando el motor de pronósticos publique sus contratos; no fingir actividad ni logros.
6. Falta CTA a /cuenta/ en la navegación principal del portal. Evitar sobrescribir modificaciones concurrentes del agente del portal.
7. Hacer QA Chromium y móvil y verificar sitio publicado. No mezclar ramas de visualización de caballos, cámara, estadios ni saldo demo.

### Agentes concurrentes y control de cambios
- PR #67 (billetera y cuenta demo) está en DRAFT y declara colisión potencial entre identidad Google y billetera de escuderías. Este módulo no fusiona #67 ni crea un segundo saldo.
- PR #40 perfiles de comunidad están rotulados como demo; no migrarlos a usuarios reales sin reconciliar su ownership.
- PR #115 estadio, PR #95 fixture y ramas BTC trabajan en otras zonas; esta rama no modifica esos ficheros.
- Sincronizar de nuevo desde main y revisar diffs antes de cualquier merge.

### Última acción y próxima acción ejecutable
- Archivos trabajados en esta rama: api/users-lib.php, api/users.php, scripts/users-migrate.php, cuenta/index.html, assets/users.css, assets/users-app.js, tests/users-system.mjs, .github/workflows/users-system.yml, tests/auth-security.mjs, api/auth.php y este documento.
- Próxima acción EXACTA: obtener resultado completo de GitHub Actions para el último SHA, corregir cualquier fallo; verificar estructura y credenciales MariaDB por el administrador Hostinger, provisión segura del secreto y mail; validar Google con token legítimo; QA de dos cuentas + Chrome/móvil, comprobar /cuenta/ publicado; recién después proponer merge. No fusionar automáticamente.

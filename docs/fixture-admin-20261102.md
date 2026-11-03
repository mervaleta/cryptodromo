# Panel de fixture y resultados · Cryptódromo

## Rama de integración
`feat/fixture-admin-20261102` (no fusionar a `main` hasta habilitar protección del directorio).

## Adaptación efectuada
El panel viejo `src/pages/admin/fixture.tsx` dependía de Next.js y de un motor de 13 activos, por eso NO se trasladó.
La aplicación actual es una página estática que importa `race-lab/source/src/data/raceFixture.js`, `tokenRoster.js` y `officialRace.js`.
Se añadió `public/admin/fixture/index.html` sin alterar el estadio, los caballos ni las demás rutas.

## Funcionalidad
- Catálogo actual de 100 tokens y selección por carrera de 12.
- Consulta de los 480 turnos diarios, a lo largo de 7 jornadas sintéticas.
- Ganador y auditoría matemática calculados con `createOfficialRace`, `officialRanking` y `officialAudit`.
- Vista previa de sustitución de participantes y orden de gateras.
- Control de duplicados de símbolos.
- Borradores locales en `localStorage`, importación y exportación JSON con esquema validado.
- Indicación permanente de que son datos **sintéticos**.
- Sin edición de resultados oficiales, sin apuestas y sin escrituras al motor.

## Seguridad (obligatorio antes de desplegar)
**IMPORTANTE**: la ruta no es privada todavía. El tag `noindex` NO protege el acceso. No desplegar esta carpeta a un servidor público sin implementar autenticación a nivel de servidor/edge (Hostinger: protección de directorios, proxy protegido o backend con sesión) y limitar acceso con roles.
No se incluyen credenciales en JavaScript ni en Git.
Si el dominio se sirve mediante un host puramente estático sin autenticación, implementar primero un backend autenticado para el panel o mantenerlo en ambiente privado.

## Límite deliberado
Los borradores son **locales a cada navegador**. Nunca afirman que se aplicaron a otros visitantes.
La publicación de un fixture compartido requiere un endpoint administrativo autenticado, con CSRF, control optimista de versión, validación en servidor de los 12 símbolos y su vínculo a las 100 monedas, y auditoría append-only.
Si se permiten cambios de carreras futuras, deben versionarse antes de abrir la inscripción. Carreras concluidas o en curso serán inmutables.
Los resultados oficiales dependen de las variaciones de precios, nunca de las dosis animadas ni de los controles de dirección visual.

## Verificación sugerida
1. Crear entorno privado y servir `public/` como raíz; verificar que `/race-lab/source/src/data/` es accesible desde el dominio.
2. Abrir `/admin/fixture/` en dicho entorno.
3. Comprobar: 100 activos, 480 carreras y 5760 participaciones por día, 7 jornadas.
4. Buscar BTC, cambiar un participante por otro no incluido, comprobar el recálculo de la auditoría y guardar.
5. Exportar JSON, borrar borradores, importar JSON y verificar que se restauren.
6. Probar el bloqueo de símbolos repetidos y archivos importados inválidos.
7. Ejecutar `node --experimental-default-type=module tests/fixture-admin-contract.mjs` desde la raíz del repositorio.

## Integración posterior
La siguiente fase será un API privado (no incluido) para publicar versiones inmutables del fixture. Evitar fusionar esta rama con otras ramas de escenografía sin resolver los cambios concurrentes.

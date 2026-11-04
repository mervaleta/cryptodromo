# Cryptódromo World · protocolo de integración cuando terminen los demás agentes

**No fusionar ni publicar automáticamente.** Paquete aislado en `prep/stadium-world-integration-20261104`; base conocida `main@7c28e14a`.

### Al recibir la confirmación de los otros agentes
1. Leer `AGENTS.md`, `RACE-SITE-INTEGRATION.md` y los cambios de `main` posteriores a `7c28e14a`. Revisar PR BTC 76–78 (o sucesores) y cualquier cambio de escenarios, transmisión, layout o fixture que hayan integrado.
2. Crear una **rama de integración nueva basada en el main más reciente**. Aplicar los cambios aislados de este paquete con cherry-pick o selección de archivos; no fusionar a ciegas ni sobrescribir `scene.js` de un agente. En `visual-lab/scene.js` los cambios propios son el import versionado del presentador y la asignación de superficie por pista; preservar los ajustes nuevos del motor de los otros agentes.
3. Comparar el DOM de `stadiums/crypto/broadcast/index.html` y `visual-lab/index.html`; garantizar contenedor `#present-horse-3d` y los otros 87 selectores directos. No conservar dos copias del presentador ni dos WebGL de escena principal.
4. Ejecutar:
   ```bash
   npm ci --prefix race-lab/source
   node --experimental-default-type=module --test tests/stadium-broadcast-contract.mjs tests/stadium-world-record.mjs tests/satoshi-complete-fixture-week.mjs tests/satoshi-three-course-geometry.mjs
   node --experimental-default-type=module --test tests/alpha19-stadium-hub.mjs tests/alpha19-triple-fixture.mjs tests/stadium-live-integration.mjs
   ```
5. Ejecutar GitHub Actions `stadium-world-preflight.yml`, que inicia Chromium/SwiftShader contra la rama mediante servidor local. Guardar los seis PNG de pre/post carrera para Muybridge, Genesis y Vint Cerf, más la vista general y las cuatro capturas de la maqueta de Satoshi. Si falla GPU o la prueba automática, no dar por aprobada la transmisión sin una repetición alternativa real y documentada.
6. Probar además manualmente una presentación completa, cambio de pista en LIVE, cruces de medianoche y sábado/domingo (UTC−3), retorno desde archivo, y cada cámara del explorador `/estadio/?venue=crypto`. Medir FPS y RAM/VRAM donde el navegador lo permita, en escritorio y teléfono.
7. Antes de merge, descargar de GitHub Actions `satoshi-seven-day-synthetic-fixture` (CSV de 10.080 carreras y resumen SHA-256). Comparar campo de 12, ganador, podio y horario para el mismo `dayIndex/trackId/slot` en archivo, transmisión, fixtures y estadísticas. El contrato `worldRaceRecord.js` todavía no está conectado a las vistas: integrarlo por etapas y conservar los formatos legados.
8. Fusionar sólo con pruebas y revisión del diff. Registrar **SHA aprobado**. Esperar despliegue normal GitHub → Hostinger; no ejecutar acciones de publicación manuales fuera del flujo.
9. Verificar versión realmente servida, script importado, canvas inicializado y carrera real en:
   - `/`, `/stadiums/`, `/stadiums/fixture/` y las ocho fichas.
   - `/stadiums/crypto/live/`, `/stadiums/crypto/archive/` y `/stadiums/crypto/broadcast/?track=muybridge|genesis|vint-cerf`.
   - `/estadio/?venue=crypto` y `/racers/#BTC` (el caballo maestro no debe haber cambiado por este paquete).
10. Si falla producción, revertir sólo la fusión de este paquete, no cambios ajenos; dejar capturas, consola, SHA y estado real en la bitácora.

### Control de versión al integrar
La corrección del enlace semana 7→semana 1 se identifica como `alpha19-triple-v2-continuous-week`. Confirmar que `raceFixture.js` conserva los datos Alpha18, que `worldRaceRecord.js` propaga la nueva versión y que los dos últimos turnos de la jornada 7 (Genesis y Vint Cerf) ya no generan saltos de precios falsos. Las 10.080 clasificaciones del nuevo Alpha19 deben ser finitas.

### Exclusiones expresas
Este paquete no modifica anatomía/rig/crin/ojos/cola/shaders del BTC; tampoco modifica las fórmulas deportivas, los coeficientes, pagos, apuestas, retiros ni categorías de vehículos sin modelos propios. Sí corrige **exclusivamente** la continuidad del muestreo sintético al cerrar la semana de Alpha19; no habilita fuentes reales. No presenta la programación editorial de los otros siete mercados como carreras funcionales.

### Puerta de calidad
Para declarar Satoshi P0 **VERIFICADO EN HOSTINGER** son obligatorias tres carreras completas, dos cambios de modalidad (LIVE / replay), comprobación cruzada del resultado y ausencia de excepciones. Para declarar AAA, también requiere evidencia visual comparativa, mediciones de rendimiento y entornos diferenciados: hoy está pendiente.

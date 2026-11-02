# Cryptódromo · relevo de integración Alpha 14 (2 noviembre 2026)

## Estado de integración
La portada `/` y `/visual-lab/` utilizan `/visual-lab/scene.js`. No desplegar nuevamente `/race-lab/source/src/main.js` como portada: es el motor visual antiguo.

**Fuente única y reproducible:** `race-lab/source/src/data/raceFixture.js` (100 tokens, 7 jornadas, 480 carreras por jornada, 12 caballos por carrera) y `officialRace.js` para el resultado inmutable. No editar el cálculo financiero para resolver bugs de cámara/escenografía.

## Implementado
1. **Caballos:** `horseLivery.js` aplica los 47 SVG locales y genera sellos de ticker honestamente provisionales para los otros 53. El shader PBR repite pequeños sellos, máximo 24 texturas en caché y no carga todo el roster. `horse.js` agrega `setBank()`, inclinación suave sobre pivote del torso; `scene.js` calcula giro a partir de la tangente real y lo restituye a cero tras la meta.
2. **Meta:** `trackMath.js` evita reciclar la vuelta oval al pasar p>1. Continúa por tangente de salida, sin freno brusco por límite de 120 unidades. `scene.js` mantiene efectos de llegada más tiempo. La clasificación oficial permanece fija a los 60 s; los doce cruzan antes del acta.
3. **Cámara:** modos TV, rail, aerial, drone, finish, leader, pack, grandstand y orbit, con zoom, giro horizontal y altura independientes.
4. **Luces:** `nightLights.js` conserva luces reales actuales y agrega 16 faroles instanciados sin 16 nuevas luces dinámicas. Panel con potencia, tono, efecto, apertura de haz, luz ambiente, faroles perimetrales. Hora solar de Buenos Aires configurable y automática.
5. **Páginas automáticas:** `/fixture/` (navegación por 7 días y 480 carreras/día), `/resultados/` (últimas actas sintéticas del motor oficial), `/estadisticas/` (ranking de 100 caballos), `/apuestas/` (3 bots de favoritos y ratios ilustrativos; todos los controles transaccionales desactivados).
6. **Sitio:** menús de portada, laboratorio, corredores, estadísticas y página institucional conectados. `assets/race-site-hub.css` da identidad común a las tres páginas nuevas.

## Límites importantes
- **No son apuestas reales.** La pantalla /apuestas no crea tickets ni saldos, no almacena usuarios ni transacciones, no hace pagos. Los ratios son estimaciones de demostración normalizadas, basadas en el dataset sintético completo y NO pronósticos de mercado ni cuotas comerciales.
- Los 53 sellos de ticker son **placeholders tipográficos** y requieren arte de marcas verificado cuando esté disponible.
- Las actas se recalculan en el navegador desde el fixture determinista; no son una base histórica persistente. Un backend de persistencia es trabajo posterior.
- Los faroles extra son geometría emisiva, no 16 nuevos SpotLights: importante para FPS.
- Las modificaciones son cosméticas; no alterar `createOfficialRace`, dosis ni `officialRanking`.

## Validación
- `node --test tests/alpha14-site.mjs` comprueba la costura del óvalo, los 100 sellos, las páginas, los bots y los controles.
- `node tests/alpha14-pages-browser.mjs` comprueba el despliegue público en Hostinger.
- `tests/alpha09.mjs` verifica las 3.360 carreras y que los doce crucen la meta antes de revelar resultados.
- GitHub Actions `.github/workflows/visual-lab.yml` ejecuta los controles tras cambios a los módulos de la transmisión y páginas automáticas.

## Próxima inspección visual del agente del estadio
1. Recorrer óvalo: comprobar que la salida del disco de meta sea continua, sin teleport, cruzamientos de patas ni desaparición de caballo, con TV y cámara baja.
2. Verificar altura de bancos/pivotes del caballo sobre suelo y que los cascos no atraviesen tierra en curvas.
3. Evaluar los 16 faroles añadidos en madrugada/noche y ajustar su ubicación a la escenografía, sin multiplicar spotlights.
4. Revisar logo/sello en flancos con BTC, ETH y un token sin SVG (por ejemplo HYPE).
5. Revisar móvil y rendimiento sin GPU dedicada. Si surge un problema, ajustar solo el componente visual correspondiente.
6. Estadio `/estadio/`: unificar su navegación con los enlaces `/fixture/`, `/resultados/`, `/estadisticas/` y `/apuestas/` al finalizar el trabajo del agente de escenografía, para evitar conflicto entre ramas.

## Rutas
- https://race.cryptodromo.com/
- https://race.cryptodromo.com/visual-lab/
- https://race.cryptodromo.com/racers/
- https://race.cryptodromo.com/fixture/
- https://race.cryptodromo.com/resultados/
- https://race.cryptodromo.com/estadisticas/
- https://race.cryptodromo.com/apuestas/

Recordatorio: los cambios de GitHub no prueban, por sí solos, que Hostinger ya los sirva. Ver resultado de Actions y smoke-test del navegador.

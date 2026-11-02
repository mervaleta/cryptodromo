# Cryptódromo Alpha 15 · paquete preparado para integrar

**Estado:** PREPARADO Y PROBADO, NO DESPLEGADO. Esta rama está separada de `main` para no interferir con el agente que trabaja en el estadio. **No fusionar hasta terminar ese trabajo y revisar los nuevos commits.**

## Qué contiene

| Archivo | Contrato | Estado |
| --- | --- | --- |
| `alpha15/director.js` | Dirección automática por eventos con duración mínima de plano y final prioritario | Puro, probado |
| `alpha15/quality.js` | Perfiles eco/balanced/cinematic y regulador por FPS con histéresis | Puro, probado |
| `alpha15/finishOrchestrator.js` | Conteo de 12 cruces y acta solo después del último + pausa | Puro, probado |
| `alpha15/raceRecords.js` | Acta de resultados deterministas con trazabilidad explícita | Puro, probado con 3.360 carreras |
| `alpha15/chronicle.js` | Primer triunfo, racha, victoria de desafiante, llegada ajustada, resumen | Puro, probado |
| `alpha15/careers.js` | Carrera deportiva, mejor tiempo, forma reciente y rivales frecuentes de 100 caballos | Puro, probado |
| `alpha15/preview/` | Pantalla de revisión sin publicar para cámaras, calidad, crónicas y fichas | Preparado para revisión visual |
| `tests/alpha15-prep.mjs` | Suite sin GPU y sin servidor | Automatizado |
| `.github/workflows/alpha15-preflight.yml` | CI separada sobre esta rama | Ejecución automática |

### Invariantes esenciales

- No modificar `raceFixture.js`, `officialRace.js`, las dosis ni `officialRanking()`.
- **Fuente única sintética**: `PRICE_FIXTURE.version = synthetic-v1`, siete días × 480 carreras, 12 caballos por carrera y 100 tokens.
- El resultado se congela a los **60 segundos**. El desplazamiento 3D posterior no cambia ni ganador ni distancias oficiales.
- La transmisión de cada carrera dura **180 segundos**: 60 de competición, 60 para llegada y resultados, 60 para presentación.
- Las actas calculadas del fixture **no prueban que una carrera se haya transmitido**. El campo `transmissionObserved:false` nunca se debe convertir en `true` sin un registro real persistido.
- La crónica generada es **borrador de replay sintético**. No mezclar con la Gaceta independiente de `cryptodromo-gazette/`, cuya fuente, restricciones y cron son diferentes.
- La UI de apuestas de Alpha 14 permanece **sin operaciones**, sin pagos ni saldos, y los bots actuales son ilustrativos, no una oferta.

## Orden concreto de integración después del agente del estadio

### 1. Reconciliar y ejecutar pruebas
```sh
git fetch origin
git switch main
git pull --ff-only
git merge --no-ff prep/alpha15-director-telemetry-editorial
node --test tests/alpha15-prep.mjs
node --test tests/alpha09.mjs
node --test tests/alpha14-site.mjs
```
**No ejecutar esta fusión sin revisar los cambios del otro agente.** Si modificó los mismos módulos del estadio, adaptar primero. La rama Alpha 15 evita modificar directamente los archivos de producción.

### 2. Director automático (opción de cámara "Transmisión TV")

En `visual-lab/scene.js`, importar desde `../alpha15/director.js`:

```js
import {createBroadcastDirector} from '../alpha15/director.js';
const director=createBroadcastDirector({minDwell:6});
```

Cuando empieza una carrera, `director.reset()`. Para evaluar un plano, pasar `elapsed`, `phase`, `layout`, `progress`, `leadMarginMeters`, `overtakes` y `reduceMotion`. El resultado `choice.shot` coincide con modos ya soportados por Alpha 14: `rail`, `drone`, `leader`, `pack`, `grandstand`, `finish` y `orbit`. Integrar **solo** cuando `camSelect.value==='broadcast'`; las selecciones manuales del usuario siempre prevalecen. Recomiendo evaluar 4 veces por segundo, no cada fotograma.

Evitar cambios de cámara inducidos por una simple lectura de `elapsed` al entrar en presentación; esa fase debe priorizar la ficha de competidores.

### 3. Calidad gráfica automática

Importar `recommendQuality`, `rendererSettings`, `createQualityGovernor` desde `../alpha15/quality.js`. El perfil inicial puede surgir de `softwareGPU`, móvil, memoria aproximada y preferencia de movimiento reducido. Registrar la duración de cada fotograma sólo para obtener FPS de visualización; **nunca usar FPS para avanzar el reloj de carrera**. Al cambiar de perfil, aplicar pixel ratio y shadow budget de forma diferida, y gestionar tamaños de partículas **sin recrear toda la escena por cuadro**.

Criterios sugeridos para revisión, no mediciones verificadas:
- Equipo económico: apuntar a 30 FPS con efecto de lluvia reducido.
- Equipo medio: apuntar a 50–60 FPS con doce caballos.
- Equipo alto: apuntar a 60 FPS con sombras y crowd completo.
- Evitar subida y bajada continua de perfil mediante `cooldownMs` y histéresis.

### 4. Llegada estable

Importar `createFinishOrchestrator` desde `../alpha15/finishOrchestrator.js` y crear una instancia por carrera. En cada frame pasar `elapsed`, `distances` de los doce caballos y la distancia de meta oficial. Ejecutar `reset()` en `setRace()`.

Reemplazar el control de aparición de resultados **una sola vez** para evitar llamadas duplicadas a `showOfficialResult()`. Si `overdue=true`, registrar el problema y mantener el acta oculta. No usar un temporizador de emergencia para mostrar resultados sin el último cruce. Si se escoge `holdAfterLast=2.4`, extender la fase visual de runout al menos hasta 18 segundos después del minuto oficial, **sin modificar el bloque de 60 segundos reservado para resultados**.

En el óvalo, comprobar continuidad de `trackPoint('oval',p)` al pasar p=1; los caballos deben seguir por la tangente de salida y no reaparecer en la largada.

### 5. Historias, fichas y estadísticas

```js
import {syntheticRaceRecord} from '../alpha15/raceRecords.js';
import {buildSyntheticChronicle} from '../alpha15/chronicle.js';
import {buildSyntheticCareers} from '../alpha15/careers.js';

const acta=syntheticRaceRecord(0,42);
const crónicas=buildSyntheticChronicle({dayIndex:0,throughSlot:42,limit:6});
const fichas=buildSyntheticCareers({throughDay:0,throughSlot:42});
```

Los tres consumen `raceFixture` y el motor oficial, nunca inventan cotizaciones ni reordenan carreras. `throughSlot` es inclusivo. Las fichas `recentForm`, rachas y rivalidades **sólo usan carreras anteriores al corte**. No construir fichas de "forma previa" con el resumen de los 3.360 resultados completos: eso revelaría resultados futuros. Para una presentación *antes* de una carrera, pasar como corte la carrera **anterior**, incluyendo la corrección de cambio de día.

Crear una ruta editorial pública **solo después** de definir política de publicaciones, caché, fecha y distinción clara entre simulaciones y observaciones. No conectar directamente el generador a `cryptodromo-gazette/` sin reconciliar sus fuentes documentadas.

## Validación visual pendiente

1. Ver caballos con pelaje/logo BTC, ETH y un token con sello tipográfico provisional, tanto en recta como en óvalo y al cambiar de corrida.
2. Confirmar casco y sombra sobre pista en lluvia, día y noche; comprobar galope y orientación al tomar curvas sin saltos de articulación.
3. Simular una carrera completa, comprobar que los doce cruzan antes de presentar acta, y que la cámara de meta no tapa la llegada.
4. Forzar 15–30 FPS en navegador de prueba y revisar que el tiempo financiero de carrera siga siendo exactamente 60 segundos; no tomar el presupuesto visual como reloj de juego.
5. Probar modo de movimiento reducido, móvil, pantalla grande, zoom/altura independientes y cambio de presets sin saltos.
6. Confirmar navegación y enlaces de `/fixture/`, `/resultados/`, `/estadisticas/`, `/apuestas/`, `/racers/`, `/estadio/`.
7. Asegurar que los 53 sellos que no son logos oficiales se presenten como provisionales, y que no se carguen 100 texturas simultáneamente.
8. Validar una publicación verdaderamente desplegada en Hostinger; los tests de GitHub sobre código puro no garantizan un navegador 3D funcional.

## Para el otro agente
**No es necesario modificar la rama Alpha 15.** Puede seguir con estadio y caballos en `main`. Al terminar, avisar qué módulos tocó, especialmente `visual-lab/scene.js`, `trackMath.js`, `nightLights.js`, `horse.js` y `index.html`. Este paquete está aislado y se podrá adaptar en la integración posterior.

## Comandos para verificar preparación
```sh
node --test tests/alpha15-prep.mjs
node --check alpha15/director.js
node --check alpha15/quality.js
node --check alpha15/finishOrchestrator.js
node --check alpha15/raceRecords.js
node --check alpha15/chronicle.js
node --check alpha15/careers.js
node --check alpha15/preview/preview.js
```

**Vista local de la interfaz de prueba:** `/alpha15/preview/` si se sirve esta rama con un servidor web. No está publicada en Hostinger.

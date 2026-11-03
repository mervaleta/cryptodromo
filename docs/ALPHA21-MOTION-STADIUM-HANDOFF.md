# Alpha21 · Paquete de galope, cascos y acabado arquitectónico

## Estado de compatibilidad revisado · 3 noviembre 2026

Auditoría contra `main fef892d5` y la integración optativa **PR #48**:
- Alpha22 del PR #47 fue preservado íntegramente por PR #48 (archivos con SHA idéntico).
- El LIVE Alpha20 ya tiene `horse-engine=legacy` y `horse-engine=procedural`, y PR #48 agrega `horse-engine=fidelity`. **No reimplementar estos motores ni las gateras.**
- Esta rama Alpha21 sigue **separada, sin tocar el LIVE** y ofrece pulido opcional. Actualizado `racePolishKit.js` para ejecutar la corrección de cuello/cabeza/espalda/cola **exclusivamente en modelos legacy GLB**; en Alpha20 y Alpha22 conserva sus propias articulaciones. Los tres reciben sólo una llamada `horse.update` por fotograma.
- Alpha22 expone `hoofPhase`: se puede usar para el spray de cascos. Alpha20 procedural todavía no lo expone, por lo que no deben inventarse impactos a partir del reloj ni mezclarse varios sistemas de partículas.
- **No fusionar Alpha21 ni #47 directamente tras el PR #48 sin revisar diff.** Si se fusiona #48, el PR #47 queda duplicado; conservarlo sólo como referencia de desarrollo.
- Los efectos de tierra y acabados de estadio deben comprobarse contra el nuevo `proceduralGround.js`, las gradas existentes y Alpha19 tres pistas para no duplicar vegetación, señalética ni materiales.
- El renderizador GLB debe permanecer como respaldo hasta superar control visual, colisiones y FPS en equipos reales.
- Los modelos NONECG aportados son **únicamente referencias de anatomía/look**. No se prevé importar, convertir ni redistribuir esos assets; la estrategia acordada es **geometría + pelaje + animación originales y procedurales, sin PNG ni sprites**.
- Pruebas PR #48: Alpha22, gateras, estadio y Procedural LIVE aprobadas. La suite de cámaras falló por **timeout de una captura en Chromium SwiftShader**, no por una excepción demostrada del motor de carreras. Revalidar por separado.

---


**ESTADO: DESARROLLADO EN RAMA AISLADA · NO PUBLICADO · NO FUSIONAR HASTA VERIFICAR CAMBIOS AJENOS.**

Base confirmada: `main` en `dae4dfab3b13c0d9f6a0ae414a1f72964b8bd7e0` (Alpha20). Otros agentes trabajan sobre tribunas, Alpha19 (tres pistas), motores, comunidad, temporadas, billetera. Este paquete NO edita `visual-lab/scene.js`, `race-lab/source/src/horse.js`, `gaitRefiner.js`, `windMane.js`, `trackSurface.js`, el fixture ni los resultados.

## Implementado

| Archivo | Función | Restricción |
| --- | --- | --- |
| `visual-lab/polish/motionDirector.js` | Cadencia suave .86–1.74x del clip nativo .583 s; aceleración rápida y deceleración controlada | No cambia distancia/tiempo oficial |
| `visual-lab/polish/bodyFollowThrough.js` | Cuello, cabeza, columna y cola con inercia aditiva sutil y reversible; usa el rig existente | Se deshace antes de llamar al mixer y nunca desplaza el cuerpo completo |\n| `visual-lab/polish/hoofContacts.js` | Interpreta la fase real `model.hoofPhase` y emite 4 contactos por ciclo | No inventa velocidad ni modifica esqueleto |
| `visual-lab/polish/contactSpray.js` | Spray de tierra/césped/agua desde contactos; pool de 224 instancias, 1 draw call, presets eco/balanced/high | Complementa huellas/sombras actuales, no las reemplaza |
| `visual-lab/polish/stadiumFinishing.js` | 4 grupos instanciados, 3 carteles temáticos, 8 identidades de estadio, control de noche/humedad | Geometría alejada de la pista (z>=57), sin espectadores adicionales |
| `visual-lab/polish/racePolishKit.js` | Fachada opt-in con `updateHorse`, `updateFrame`, `beginRace`, `setQuality`, `setLayout`, `dispose` | Nunca ejecutar `model.update` dos veces |
| `visual-lab/polish-preview/` | Visor 3D aislado de doce caballos, gateras Alpha20, clima, cuatro cámaras y ajustes | Trayectoria simulada, no carrera financiera |
| `tests/alpha21-motion-contract.mjs` | Contratos numéricos e invariantes | No requiere WebGL |
| `tests/alpha21-motion-browser.mjs` | Prueba Chromium con capturas READY y lluvia con cámara baja | Requiere browser y descarga GLB |
| `.github/workflows/alpha21-motion-polish.yml` | Syntax + contracts + WebGL QA, artefactos PNG | No despliega |

## Principios para el galope

La fuente GLB ya posee `Gallop` y un refiner de 8 posturas que corrige cuello, lomo y articulaciones; también hay crines con shaders y marcas de cascos. La versión actual usa un multiplicador visual que puede alcanzar 3.15x. Alpha21 propone medir la cadencia como respuesta suave a la velocidad derivada de `broadcastSpeed`, y acotar el clip a .86–1.74x. A velocidad nominal, la meta está alrededor de 2.26 ciclos de galope por segundo. La corrección adicional de cuerpo usa `body.beforeUpdate` ANTES del mixer y `body.afterUpdate` DESPUÉS de `gaitRefiner`, deshaciendo exactamente su propio quaternion del frame anterior; no sustituye la interpolación esquelética nativa. Intensidad eco=0, balanced=.65, high=1, con amplitud menor a 2.2 grados.

El polvo nace sólo cuando `hoofPhase` cruza un contacto del ciclo, no por cada metro recorrido. El sonido de galope actual se conserva. Una siguiente mejora opcional es pasar los eventos de contacto al sintetizador existente, sin crear otro AudioContext.

## Integración contra la escena ACTUAL (hacer luego del nuevo diff)

```js
import {createRacePolishKit} from './polish/racePolishKit.js?v=alpha21-1';

// Después de crear stadiumDensity/trackFX, con la escena ya disponible:
const racePolish=createRacePolishKit({
 THREE,scene,horseCount:12,stadiumId:'satoshi',
 quality:softwareGPU||mobile?'eco':'balanced'
});

// Dentro de setRace() DESPUÉS del cambio de fixture:
racePolish.beginRace();

// Cuando cambie layout o calidad:
racePolish.setLayout(mode);
racePolish.setQuality(next==='high'?'high':next==='eco'?'eco':'balanced');

// En animate(), REEMPLAZAR, NO DUPLICAR:
// for(const h of horses)h.model.update(dt,running?h.visualSpeed:1);
for(const h of horses){
 const p=broadcastProfiles[h.index];
 const speed=!running?0:elapsed<60?
   broadcastSpeed(p,elapsed):
   coastSpeed(broadcastSpeed(p,59.99),elapsed-60);
 racePolish.updateHorse(h.index,{
   horse:h.model,delta:dt,metersPerSecond:speed,
   referenceSpeed:officialRanking(profiles)[0].distanceAt60/60,
   elapsed,phase:running?(elapsed>=60?'runout':'race'):'presentation',
   position:h.model.root.position,heading:h.model.root.rotation.y
 });
}
racePolish.updateFrame({delta:dt,weather:weatherSelect.value,
 surface:trackType.value,wetness:trackFX.wetness,
 localHour:getSolarMinutes()/60,
 racePhase:running?'race':'presentation'});

// En desmontaje: racePolish.dispose()
```

**REGLAS CRÍTICAS:** no cambiar `createOfficialRace`, `getRaceFixture`, `broadcastPosition`, `broadcastSpeed`, `trackPoint`, `horse.js` ni el estado de apuestas. El movimiento lineal continúa gobernado por la variación porcentual de mercado; el módulo únicamente controla la cadencia de animación, una pequeña inercia de huesos existentes y partículas de presentación. Conservar `h.model.setBank` existente. No llamar `racePolish.updateHorse` además de `h.model.update`: exactamente una actualización de la mezcladora por caballo y frame.

**ALPHA19:** una pista curva o con largada rotada requiere adaptar el kit de escena al sistema local de cada trazado, no asumir que la señalética exterior en z=57 sirve para todas las pistas. Mantener la decoración fuera del campo de carrera de cada hipódromo. Esta entrega modela físicamente únicamente Satoshi recto; los otros siete estilos son presets listos para utilizar en sus futuras escenas 3D.

## Criterios de aceptación

1. Ejecutar `node --test tests/alpha21-motion-contract.mjs` y QA Chromium; revisar capturas de gateras y cámara baja.
2. Confirmar que `bodyFollowThrough` no acumule rotaciones al pausar/reiniciar y que los huesos estén presentes en GLB. Comparar antes/después a igual carrera (misma clasificación oficial), medir FPS y draw calls desktop/móvil.
3. Comprobar exactamente 12 caballos, gateras sin intersecciones, aristas de cabeza/crines sin vibración, lluvia y niebla sin desbordes.
4. Inspeccionar cascos: no polvo en pausa, en superficies sintéticas o en estadios sin tierra; contacto sincronizado al gait actual.
5. Validar animaciones en arranque, t=5, 45, 55, meta, runout y replay; verificar transición entre Idle/Gallop.
6. Antes del merge, recalcular diff respecto del último `main` y revisar PR #19 (pistas), #30 (tribunas), cualquier cambio nuevo a horse.js / scene.js / FX.
7. Verificar que no haya sobrecarga en móviles ni fuga de materiales al cambiar de carrera o navegar.
8. Seguir dejando la etiqueta de DEMO: el visor no prueba resultados reales ni acredita calidad artística AAA por sí solo.

## Calidad AAA: alcance y límites

El paquete mejora el timing, el acabado, el acoplamiento casco/superficie y los encuadres; el caballo GLB es un respaldo opcional. El camino artístico principal ahora es el caballo **original y procedural** de Alpha20/Alpha22, cuyo pelaje, anatomía, crines y geometría se pueden refinar en iteraciones sin imágenes externas. NONECG se usa exclusivamente como referencia estética y anatómica. Se necesitan comparativas visuales, colisiones verificadas y perfiles de rendimiento móvil para declarar calidad AAA.

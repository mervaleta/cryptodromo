# Cryptódromo · sistema de tres estadios v1

## Punto de partida y compatibilidad

Esta integración se preparó sobre el estado de la rama main 43585f9501eb897e5b78bf217fb79823667f00a8 (alpha14, 2 noviembre 2026). El trabajo reciente de otros agentes en la carrera principal reside en `visual-lab/scene.js`, `visual-lab/trackMath.js`, `visual-lab/nightLights.js`, `visual-lab/stadiumBackdrop.js`, en cámaras y en resultados reproducibles.

**No se reemplazó nada de esa carrera.** Permanecen intactos el calendario de 480 carreras, los 100 corredores, la selección de doce competidores, los precios sintéticos, las animaciones, el scoring, la cámara de transmisión, los sistemas de clima y la pista alpha14. El generador es un subsistema de escenografía para `/estadio/`.

## Archivos

- `race-lab/source/src/stadium/presets.js`: identidades, cartelería, arquitectura y paletas de color.
- `race-lab/source/src/stadium/venue.js`: constructor 3D reutilizable; geografía, óvalo, arquitectura, tribunas, servicios, paddock, caballerizas, tiendas, vegetación, iluminación, público, meteorología y marcador.
- `estadio/index.html`: selector de sede, cinco recorridos de cámara, luz, clima y calidad.
- `estadio/estadio.js`: explorador WebGL independiente. Usa exactamente la importación Three.js 0.187.0 que ya declara la página.
- `tests/stadium-world.mjs`: contrato para los tres estadios y tres niveles de calidad.

## API y configuración

```js
import * as THREE from 'three';
import {createStadiumVenue} from '/race-lab/source/src/stadium/venue.js';

const venue=createStadiumVenue({
  THREE,scene,stadiumId:'satoshi',quality:'medium',weatherParticles:true
});
venue.setEnvironment({hour:17.5,type:'clear',wind:8});
venue.setScoreboard({raceNumber:'001',leader:'BTC',time:'00:41'});
venue.update(deltaSeconds);
venue.dispose();
```

IDs: `satoshi`, `exchange`, `horizon`. Las identidades Bolsa/Acciones y Horizonte/Commodities **son propuestas de dirección de arte**, no mercados comercialmente aprobados. Todas usan X para avance, Y para altura, Z para ancho; la forma del óvalo parte de un radio 72 y una semirrecta 250, al igual que el centro de la pista alpha14. El módulo ofrece `getLanePosition(progress,lane)` únicamente como transform visual. No usarlo para determinar ganadores.

## Regla de integración posterior con la carrera

**No montar el mundo completo sobre `visual-lab/scene.js` tal como está**: esa escena ya construye grada, pista, arcos, cielo, árboles y público; hacerlo duplicaría geometrías y el sistema de lluvia. Para llevar los tres estadios al vivo, crear un adaptador de entorno que seleccione las piezas no duplicadas, pase clima desde un único EnvironmentManager, y conserve exactamente las posiciones del actual `trackPoint`. Reusar `venue.js` para el museo, pero la carrera debe mantener una única pista y sus cámaras.

### Aceptación

1. Probar `node --test tests/stadium-world.mjs` después de `npm ci` en `race-lab/source`.
2. Abrir `/estadio/`, revisar las tres sedes y las cinco cámaras con mediodía, atardecer, noche, lluvia y niebla.
3. Comprobar WebGL en desktop y móvil, al menos un dispositivo real de gama media.
4. Verificar `/` y `/visual-lab/` durante una carrera completa: doce caballos, 60 segundos, misma clasificación y misma geometría de llegada.
5. Comprobar versión servida por Hostinger tras sincronización. Que GitHub tenga el commit no demuestra que la ruta de producción esté actualizada.

## Licencias y alcance

Las geometrías del nuevo sistema son código original y procedurales. No se han copiado modelos, imágenes ni logos de hipódromos reales. La implementación usa la versión Three.js 0.187.0 existente (licencia MIT); no agrega dependencias npm. El paisaje es una primera versión funcional de dirección de arte y requiere una pasada posterior de materiales y evaluación visual con capturas reales.

## Seguridad al desplegar

El repositorio público conserva en la raíz un archivo llamado `.ssh_pass` detectado previamente. No se inspeccionó ni se utilizó. Revisar si su contenido es una credencial: si lo fuera, retirarlo, rotar la contraseña y tratar también las copias del historial Git.

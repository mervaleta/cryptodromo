# Alpha18 · Luces, cámara, cockpit y pelaje (staging seguro)
Base auditada: main SHA 27a8f119. En esta rama NO se reemplaza el motor, ni se instala el rig de luces automáticamente, ni se publica en Hostinger.

## Qué detectamos en el código actual
- `parade/parade.js`: ACES tone mapping, PCFSoftShadowMap, una luz hemisférica y direccionales; arrastre izquierdo orienta la cámara y touch también. Ya incluye controles de cámara y pad táctil.
- `race-lab/source/src/stadium/venue.js`: el estadio ofrece puntos de luz nocturnos (`PointLight`) y materiales emisivos.
- `index.html`: la carrera LIVE ya tiene pestañas y sliders de iluminación, no deben duplicarse.
- `assets/camera-console.css`: existe consola de cámara Alpha17.
- `race-lab/source/src/horseLivery.js`: shader de pelaje con grano, fibra, rugosidad y logotipos sobre el cuerpo.
- `race-lab/source/src/horse.js`: materiales clonados y control de humedad, viento de crines y sombra. No tocar geometría/animación ni símbolo.

## Implementación staged
1. `visual-lab/softStadiumLighting.js`: halos difuminados basados en sprites, una sola textura compartida, dos luces direccionales sin sombra, presets 8/20/36 halos y controles de intensidad, halo, temperatura, dispersión y noche. Se añade a la escena solo al llamarlo, nunca automáticamente.
2. `parade/parade.js`: staging real de inversión de mouse: derecho orienta, izquierdo desplaza; touch sigue orientando. `window.crpCameraMouseSettings` permite cambiar botones, sensibilidad e inversión vertical. **No cambiar controles de carrera LIVE sin estudiar su rig independiente.**
3. `race-lab/source/src/horseVisualQuality.js`: módulo separado de acabado PBR ligero con tres presets, sin nuevos mapas ni efectos por fotograma. Mantiene escudos de activos, pigmentos, formas y animaciones. Debe conectarse al ciclo de vida de `createHorse` al integrarlo.
4. `assets/crp-visual-cockpit.js` + `.css`: interfaz con cuatro pestañas: Luces, Cámara, Caballos y Rendimiento, sliders y accesos. Se monta mediante `mountVisualCockpit` cuando los objetos de escena estén disponibles. No sustituye la consola existente hasta definir su adopción.

## Integración después de los otros agentes
- Releer HEAD, identificar si hubo nuevas ramas de clima/estadio/cámara.
- Comparar controles existentes con el nuevo cockpit: preservar sus funcionalidades, fusionar en una sola UI.
- Instanciar iluminación UNA vez en la escena y reutilizarla al cambiar clima, hora, distancias y calidad.
- No duplicar faroles ni crear sombras adicionales para cada halo. Reducir globos emisivos redundantes antes de subir intensidad.
- Aplicar acabado PBR al construir caballos y re-aplicarlo tras `setWetness`.
- Para dispositivos lentos, usar preset `performance` y permitir desactivar los halos.
- Evitar sombras de luces puntuales y postprocesado Bloom de pantalla completa por defecto.
- Alinear controles de cámara con panel actual, y agregar ayuda visible «Izquierdo mover · derecho mirar · rueda avanzar».
- Testear que los inputs no interfieran con pointer capture, clic derecho de contexto, órbitas, swipe y pad táctil.
- Testear escritorio, móvil, lluvia, niebla, día/noche, doce caballos simultáneos, cambio de carrera y descarte de texturas.

## Criterios para merge
1. No aumenta de manera sensible el tiempo de cuadro al pasar de día a noche en preset `balanced`.
2. Halos suaves, sin destellos quemados sobre los caballos, sin solapamiento molesto con telemetría.
3. El menú puede operarse por teclado; controles tienen labels, rangos acotados y estados coherentes.
4. Orientación de cámara con botón derecho y desplazamiento con izquierdo funcionan en Parade.
5. Tonos oficiales de cada caballo y logos se mantienen legibles bajo sol, lluvia y luces nocturnas.
6. Sin errores WebGL, filtros desproporcionados ni texturas sin liberar al desmontar.
7. Comparación de capturas y FPS respecto a la última versión desplegada.

## Estado
Componentes y ajuste de cámara preparados en rama; integración al runtime de luces, caballo y menú pendiente de validación con la versión que dejen otros agentes. No hay cambios en main ni despliegue.

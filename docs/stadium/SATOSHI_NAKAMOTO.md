# Estadio Satoshi Nakamoto
## Pista principal Eadweard Muybridge

Implementación del estadio original inspirado arquitectónicamente en tribunas históricas con torres gemelas. No es una reconstrucción oficial de Churchill Downs, ni reutiliza su marca.

### Rutas
- `/`: carrera 3D existente, 12 caballos, fixture sintético. Estadio de fondo modular.
- `/estadio/`: explorador 3D del estadio, con panorámica del óvalo y vista de recta.

### Integración
- Módulo fuente: `race-lab/source/src/churchillStadium.js`.
- Importación desde `race-lab/source/src/main.js`.
- API: `createChurchillStadium({THREE, scene, mode, quality, enableParticles, title})`.
- Métodos: `stadium.update(dt, {running})`, `stadium.setEnvironment({hour,type,wind,clouds})`, `stadium.setScoreboard({raceNumber,leader,time})`, `stadium.dispose()`.
- Modos: `race` solo agrega el edificio, luces y público; `overview` agrega óvalo estilizado de exhibición.
- Convención espacial: carrera X horizontal, Y vertical, Z hacia el observador.
- Partículas del módulo desactivadas en la carrera para evitar duplicar el sistema atmosférico existente. En `/estadio/` se usan partículas propias.
- Calidad: 192 espectadores móviles, 384 escritorio; todos instanciados.

### Lo que NO se tocó
El catálogo de 100 corredores, el modelo Quaternius CC0, sus pelajes y colores, el sistema de precios sintéticos, las 480 carreras diarias, 60 segundos por carrera, coeficientes, rankings y posiciones finales. Tampoco se habilitaron apuestas ni se conectó a precios reales.

### Prueba y despliegue
```bash
cd race-lab/source
npm ci
npm run build
cd ../..
node --check race-lab/source/src/churchillStadium.js
node --check estadio/estadio.js
node tests/stadium-integration.mjs
```
Validar visualmente en escritorio y móvil; probar vista panorámica/recta; controles día/noche/lluvia; y reproducir carrera de 60 segundos con 12 caballos. La escena usa Three.js 0.187.0 por import map en páginas estáticas y la versión npm del proyecto. El despliegue depende de la configuración GitHub-Hostinger del sitio; el merge de GitHub no prueba por sí solo el estado de producción.

### Reversión
Revertir el commit de integración o el merge correspondiente. No se mantienen copias redundantes del archivo principal: Git conserva el historial.

### Fuente y licencias
Arquitectura generada proceduralmente con primitivas originales Three.js. Sin fotografías ni modelos propietarios de Churchill Downs. El caballo de la carrera existente es Quaternius CC0. Three.js usa licencia MIT.

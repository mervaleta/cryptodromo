# Horse Atelier + Master BTC | contrato de integración (2026-11-04)

## Estado actual verificable
- Hay 100 símbolos fijos en `TOKEN_ROSTER`, persistencia PHP privada por token con borradores y publicación independiente.
- La API pública `/api/horse-profiles.php` entrega solamente perfiles publicados. Los borradores no deben afectar jamás a `/racers/`.
- El caballo anatómico actual se instancia con `createBTCHeroMaya(root, options)` desde `racers/btc-maya-master.js`. La presentación `racers/btc-atelier-preview.js` lo instancia **únicamente si `symbol==='BTC'`**. Los otros 99 siguen usando el modelo base.
- `toMasterHorseOptions()` entrega `materials` (8 colores) y `groom` (3 largos + escala), y `toCurrentMayaPreviewOptions()` traduce a las opciones soportadas hoy por Maya.
- **No confundir contrato de datos con implementación visual**. El render Maya actual interpreta color de pelaje, color de marca, pezuñas, ojos, crin, cola y los tamaños resultantes; NO tiene materiales independientes para hocico, patas y cabezada ni un `setGroom` general.
- `/admin/horses/` usa actualmente el maestro **vectorial** de 12 poses como preview. No es la anatomía Maya 2017.
- La UI y API administrativa dependen de `CRP_FIXTURE_ADMIN_USER` y `CRP_FIXTURE_ADMIN_PASSWORD_HASH` configurados en Hostinger (sin publicarlos en Git). El 503 en producción indica falta de configuración; no eliminar la seguridad para evitarlo.
- `horse-editor-contract.yml` ejecuta una prueba de PHP real para detectar errores de persistencia de revisión, además de probar el puente de 100 identidades.

## Contrato propuesto al aprobar el master
La geometría/rig/animación se consideran inmutables por versión `masterId` (no editable por token). En un adaptador puro, por `symbol`:
```js
const {profiles}=await fetchPublishedHorseProfiles();
const settings=toMasterHorseOptions(token,profiles);
// settings: {symbol,coat,accent,materials:{coat,muzzle,mane,tail,hoof,eye,legs,bridle},
//            groom:{maneScale,tailScale,maneStyle,tailStyle}}
const mayaOptions=toCurrentMayaPreviewOptions(token,profiles);
// Maya: {coatColor,brandMode,brandAccent,hoofColor,eyeColor,
//        color,tailColor,maneSize,tailSize}
// DESPUES de aprobar el master, crear una interfaz 3D por token que acepte settings.
// No quitar la condición BTC de la app pública hasta que la validación 100/100 sea exitosa.
```

## Trabajo que queda para el agente 3D
1. Congelar un único `masterId` y una API estable de creación y destrucción del caballo; ya no cambiar la API sin versionarla.
2. Permitir `symbol` cualquiera (100/100), no solo BTC. Separar un `createMasterHorse(root,settings)` de la lógica del visor y evitar ramas `symbol==='BTC'` dentro del render.
3. Compartir assets/animaciones pesados e instanciar materiales/identidad por caballo, con `dispose()` seguro; no recalcular por token la transferencia de skinning Maya a GLB si puede quedar preprocesada.
4. Resolver `muzzle`, `legs` y `bridle` como materiales/áreas coloreables reales o marcar explícitamente que esos campos todavía no se representan. Garantizar que piel, crin, cola, casco y ojo sean independientes.
5. Definir cómo tres largos `short/medium/long` cambian físicamente la geometría/groom y cómo interactúan con escalas de volumen. Hoy se convierten a multiplicadores de longitud, no a peinados aprobados.
6. Permitir preview del **borrador privado** en el editor y publicar SOLO si el usuario lo confirma; revisar vista en 4 ángulos y galope/idle antes de aplicar 100 identidades.
7. Comprobar compatibilidad con Chrome/WebGL2, rendimiento con 12 corredores simultáneos, fallbacks, memoria GPU y estabilidad del rig.
8. Publicar la API/renderer aprobados sin alterar fuente de precios, fixture, rankings ni reglas de juego; registrar la versión del master junto a la configuración publicada.

## Contratos de aprobación
- 100 perfiles únicos editables y guardables, 0 cambios al roster oficial.
- `Guardar borrador` incrementa revisión y se mantiene privado; `Publicar` incrementa revisión y `publishedRevision`; revisión antigua devuelve 409.
- El logo sólo sale en público cuando su ficha se publica.
- Tras seleccionar cualquiera de 100 caballos, su diseño se reconstruye con la misma anatomía y animación, sin filtraciones de materiales de un caballo al siguiente.
- Ningún parámetro estético puede afectar el resultado deportivo.

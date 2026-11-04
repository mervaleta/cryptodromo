# Cryptódromo · Horse Atelier (preparado para integración)

## Alcance y estado

- Hub administrativo: `/admin/` y panel privado: `/admin/horses/` (PHP en Hostinger).
- API de escritura privada: `/admin/horses/api.php`.
- API pública **solo lectura**: `/api/horse-profiles.php` y logos publicados `/api/horse-logo.php?symbol=BTC`.
- Subida privada del logo: `/admin/horses/logo-upload.php`; previsualización autenticada: `/admin/horses/logo.php?id=HASH`.
- Cada caballo **corre solo**, no existen equipos ni escuderías. El logo identifica al token/proyecto crypto, no a un equipo.
- Adaptador de presentación: `race-lab/source/src/data/horseProfileAdapter.js`.
- Fuente única de identidad de carrera: los **100 símbolos** de `stables/official-week-v1.json` y `TOKEN_ROSTER` de `race-lab/source/src/data/tokenRoster.js`. No introducir un segundo roster ni modificar pesos, tiers, precios, resultados o rankings.
- El estado se guarda **fuera del document root**, en `cryptodromo-horses-private/profiles-v1.json`, con escritura atómica y bloqueo exclusivo. Los logos se guardan fuera del directorio público en `cryptodromo-horses-private/logos/<sha256>.<ext>`. No hay archivos editables públicamente.
- Versiones y borradores por símbolo. Publicar BTC no publica a la vez un borrador de ETH.
- No se toca `racers/racers.js`, `race-lab/source/src/horse.js`, el GLB ni los experimentos de BTC, para evitar conflictos con las PR de arte (especialmente #58/#60). No fusionar ni desplegar antes de la integración coordinada.

## Uso

1. Instalar **solamente** los archivos nuevos del ZIP en la misma estructura de la raíz del repositorio del sitio `race.cryptodromo.com` (PHP habilitado). Este es un overlay modular, NO un reemplazo completo del sitio. No instalar hasta que se finalice y coordine la integración con la PR del master BTC.
2. Mantener las variables existentes `CRP_FIXTURE_ADMIN_USER` y `CRP_FIXTURE_ADMIN_PASSWORD_HASH` ya usadas por `/admin/fixture/`. No incorporar credenciales al repo. Acceso solo mediante HTTPS y la misma protección Basic Auth existente.
3. Ingresar a `/admin/horses/` y seleccionar un símbolo. Editar identidad, biografía, redes blockchain, enlaces y materiales. Los colores tienen **picker y código HEX editable** simultáneos, con formato `#RRGGBB` validado. Elegir **Corto / Medio / Largo** para crin y para cola de forma independiente, con escala de volumen opcional.
4. Para el logo, seleccionar un PNG/JPEG/WebP de hasta 2 MB y pulsar **Cargar logo**. El archivo queda privado y el formulario marca cambios pendientes. Pulsar **Guardar borrador** o **Publicar este caballo** para asociarlo al símbolo. **Quitar logo** lo desvincula de la ficha actual al guardarla. El archivo antiguo puede permanecer en almacenamiento privado (se requiere purga administrada antes de borrar blobs sin referencias).
5. Guardar crea un borrador privado. Publicar activa solo la ficha seleccionada. Restaurar elimina la personalización de ese símbolo y vuelve al catálogo base.
6. Comprobar `/api/horse-profiles.php` en el servidor PHP, donde solo aparecen entradas publicadas, sin borradores ni tokens de sesión. `/api/horse-logo.php?symbol=BTC` devuelve el logo solo si BTC tiene uno publicado; un logo en borrador no aparece públicamente.
7. El modelo 3D maestro permanece sin modificar mientras el otro agente perfecciona BTC. Una vez aprobado, importar `fetchPublishedHorseProfiles` y `toMasterHorseOptions` en el render público y pasar materiales/groom al nuevo renderer (ver el siguiente apartado).

## Contrato de datos para el caballo master

El backend devuelve `profiles: { "BTC": { name, nickname, tagline, biography, networks, links, logoId, appearance } }`, indexado por el símbolo oficial. El campo `appearance` incluye:

```
raceColor, coatColor, muzzleColor, maneColor, tailColor, hoofColor,
eyeColor, legsColor, bridleColor, appearanceMode,
maneStyle, tailStyle, maneScale, tailScale
```

`maneStyle` y `tailStyle` admiten **exactamente `short`, `medium` y `long`**. El valor predeterminado es `medium` y el volumen se almacena por separado; el modelo master aprobado debe interpretar ambos controles. `logoId` es `null` o un hash SHA-256 de un logo subido y validado. El adaptador expone `logoUrl` pública por símbolo cuando exista `logoId`. `raceColor` es la identidad de marca; `coatColor` el pelaje natural. `appearanceMode=brand_colored` respeta el aspecto legado basado en color de marca, mientras que `natural_coat` usa el pelaje definido. El adaptador arma opciones (`coat`, `accent`, `materials`, `groom`) para la futura geometría BTC. **El GLB y el esqueleto se cargan una sola vez y se clonan para los 100 competidores**, con materiales instanciados por caballo para evitar contaminación cruzada.

Ejemplo futuro, **no conectado todavía en la página pública**:

```js
import {fetchPublishedHorseProfiles,toMasterHorseOptions} from '/race-lab/source/src/data/horseProfileAdapter.js';
const {profiles} = await fetchPublishedHorseProfiles();
const settings = toMasterHorseOptions(rosterToken,profiles);
const horse = await createHorse({symbol:settings.symbol,coat:settings.coat,accent:settings.accent});
// Tras aprobación del master BTC, el nuevo renderer implementará opcionalmente:
horse.setMaterialColors?.(settings.materials);
horse.setGroom?.(settings.groom);
```

**Limitación temporal deliberada:** la vista previa del panel usa el maestro vectorial de 12 poses y permite inspeccionar sus capas de pelaje, crin, patas, pezuñas y cabezada. El maestro vectorial no distingue una capa independiente de cola y no representa visualmente los tres largos reales de pelo; se ven los colores y el logo, pero los largos se aplicarán al maestro 3D aprobado. Los controles correspondientes ya persisten, pero el visor 3D actual de `/racers/` todavía no los interpreta. No fingir que ya se replicó el BTC 3D nuevo en los otros 99 tokens.

## Seguridad / integridad

- Autenticación del admin compartida con fixture; secreto **hash**, HTTPS obligatorio en producción.
- Cookies HTTP-only y SameSite Strict, tokens CSRF, verificación de origen, `Sec-Fetch-Site`, límite de tamaño, lista blanca de 100 símbolos y de campos, validación de URL `http(s)` sin credenciales, colores hex exactos, límites de texto y de redes.
- Escritura atómica, locks y control optimista de revisión (`409` ante edición simultánea). Auditoría privada por acción/símbolo/revisión con hash SHA-256.
- Logos: el servidor no acepta SVG ni archivos mayores a 2 MB; verifica MIME real y dimensiones de imagen (16 a 4096 píxeles), guarda archivos de forma privada con nombre calculado SHA-256 y los sirve con `nosniff` como PNG, JPEG o WebP. La API de imagen pública exige una asociación con una ficha **publicada**.
- No hay endpoints públicos POST ni exposiciones de borradores. El endpoint de lectura no mezcla sesión administrativa.
- La política CSP evita scripts externos y `iframe` en el administrador.
- Para un paso posterior a MySQL, migrar `profiles-v1.json` a una tabla `horse_profiles(symbol PRIMARY KEY, draft JSON, published JSON, revision, published_revision, ... )`, manteniendo los endpoints compatibles. No sincronizar en paralelo JSON y SQL sin una migración de una sola fuente de verdad.

## Criterios de integración posteriores a BTC

1. Confirmar que el master BTC esté aprobado en cuatro ángulos y en galope; no depender de archivos experimentales de PR #58/#60.
2. Materiales separados por áreas: cuerpo/pelaje, hocico, crin, cola, pezuñas, ojos, patas, cabezada. Verificar nombres y bindings reales del GLB antes de reemplazar `setMaterialColors`.
3. Guardar la selección del modelo master y su versión en una configuración global **inmutable durante carreras**; no permitir que una edición de apariencia reemplace geometría por una ruta arbitraria.
4. Validar los 100 símbolos; validar también BTC, BNB, XRP, CAKE y POL (no sumar MATIC como corredor extra).
5. Si hay caché o CDN, invalidar perfiles publicados por `publishedRevision`; las carreras activas deben congelar su snapshot visual al largar.
6. Añadir vínculo al editor desde el hub administrativo global cuando ese hub esté consolidado.

## Pruebas

En un checkout completo del repo con PHP 8.2+ y Node 20+:

```
node --test tests/horse-editor-admin.mjs
```

Las pruebas cubren los tres largos, la validación hexadecimal, la subida PNG, el rechazo de SVG, la privacidad de borradores, publicación del logo y restauración. No ejecutan SQL, no requieren API financiera y no publican cambios en producción.

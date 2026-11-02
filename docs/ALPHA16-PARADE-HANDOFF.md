# Alpha 16 · Modo Parade + barrio vivo del Cryptódromo

**Estado:** implementación aislada en `prep/alpha16-parade-stadium-life`, sin despliegue ni cambios en `main` mientras otro agente trabaja en el estadio.

**Baseline respaldada:** `0d217ad043f8bbfbf8cbeeb410472b9af4e24111` (main Alpha 15, 2 noviembre 2026).
- Rama exacta: [backup/main-2026-11-02-alpha15](https://github.com/mervaleta/cryptodromo/tree/backup/main-2026-11-02-alpha15)
- Workflow de ZIP de código + Git bundle: [run 41523615441](https://github.com/mervaleta/cryptodromo/actions/runs/41523615441)
- Artefacto: `cryptodromo-alpha15-full-source-and-history-backup`. Incluye ZIP de fuente, bundle de historial, sumas SHA256 y README.
- Resguardo de 90 días del artefacto; rama snapshot permanece en GitHub mientras no se borre.
- **Importante:** el respaldo solo cubre lo versionado en GitHub. No contiene base de datos privada de Hostinger, variables de entorno, copias de seguridad de cuenta, DNS ni recursos no versionados. Solicitar exportación de Hostinger por separado si hace falta respaldo integral de infraestructura.

## Implementación preparada

| Ruta / módulo | Función | Integración |
| --- | --- | --- |
| `/parade/` | Panel 3D autónomo con controles y avisos | Solo rama de preparación |
| `parade/march.js` | 100 caballos, 9 tandas de hasta 12, una vuelta real por caballo | Puro, sin reloj del LIVE |
| `parade/drone.js` | Dron libre, órbita y seguimiento; flechas/WASD, Q/E, R/F, T/G, Shift, ratón y zoom | Puro, reusable |
| `parade/scenery.js` | 3 tribunas cortas separadas, paseo, 6 puestos de comida, 4 carpas, 3 camiones, insumos, visitantes y luminarias | Aislado en su propio grupo 3D |
| `parade/parade.js` | Escena Three.js, 12 rigs 3D, recorrido contemplativo, cámara, sol y entorno | Solo página Parade |
| `tests/alpha16-parade.mjs` | Invariantes de roster, trayectoria, camera/free-flight, independencia deportiva | Node.js |
| `tests/alpha16-parade-browser.mjs` | Playwright del prototipo 3D: caballo, dron, controles, capturas de tribunas/puestos | Navegador de CI |

## Diseño de parade

- No confundir con la carrera de 180 s. **Parade no modifica resultados ni consume variaciones de precio**.
- Los 100 corredores aparecen en **9 grupos** de entre 8 y 12. No se reemplaza el modelo de caballo hasta terminar la vuelta de cada uno en el grupo.
- Se clonan **máximo 12** caballos desde la misma fuente GLB comprimida. Los cambios de grupo reusan el rig y los materiales, actualizando pelaje, token, identidad y color.
- Los caballos **caminan**. El manual adjunto `Horses_Manual.pdf` documenta *Walk 55-81*, *Trot 112-132*, *Canter 174-186* y *Gallop 225-238* en el proyecto original de Maya. La versión GLB publicada puede no conservar todos los clips: el navegador elige Walk si lo encuentra; en caso contrario usa el primer clip Trot/Canter/Gallop disponible y registra advertencia, sin afirmar que ese último sea un Walk real.
- Ritmo de paseo por defecto: aproximadamente 3,2 unidades/segundo (separado de las unidades financieras), duración de una vuelta aprox. 7–8 minutos por grupo según carril. El usuario puede pausar, pasar de grupo y configurar reproducción a 0,25×–6×.
- Un grupo termina únicamente cuando **todos** completaron su vuelta de pista, no en un minuto fijo. No hay caballo vencedor.
- El dron conserva altura, giro horizontal, inclinación vertical y FOV independientes; también admite órbita alrededor de edificios, cámaras para seguir caballos y puntos de interés del estadio.

### Controles dron

| Dispositivo | Acciones |
| --- | --- |
| Flechas / WASD | Avanzar, retroceder y desplazamiento lateral |
| Q / E | Girar la orientación horizontal |
| R / F | Ascender o descender |
| T / G | Subir o bajar el ángulo de cámara |
| Shift | Multiplicar velocidad de traslación |
| Arrastrar sobre canvas | Ajustar rotación y ángulo de mirada |
| Rueda | FOV/zoom independiente de la distancia y altura |
| Pantalla táctil | Flechas, giro, ascenso y sliders |
| Panel | Altura, yaw, pitch, FOV, velocidad, distancia de órbita, lugar de interés, caballo, hora solar e iluminación |

### Zonificación sin conflictos con la pista

El óvalo nuevo está definido por `trackPoint('oval',p,lane)` del repositorio y sus barreras exteriores quedan cerca de z ±94 en las rectas. Los objetos nuevos se mantienen fuera de ese sobre:
- **Tribunas:** 3 bloques bajos en x = −210, −5, +207 y z ≈ −114…−130, total **324 unidades de frente** en vez de una platea continua de 810 unidades.
- **Paseo de comidas:** seis locales de x ≈ −270 a +260, z ≈ +154, con veredas fuera del perímetro del óvalo.
- **Carpas:** x ≈ −240 a +216, z ≈ +189.
- **Servicio/alisado:** camiones y rastra en x ≈ +355…+451, z ≈ +94…+142, fuera del ancho de pista.
- **Forraje, agua y herrajes:** depósito de fardos y sacos en x ≈ +336…+406, z ≈ +160…+180.
- **Público y personal:** asistentes instanciados en tribunas y personas que caminan lentamente por el paseo.
- **Luminarias:** 48 focos emisivos instanciados, repartidos entre gradas y recorrido de visitantes. Solo **cuatro PointLights reales sin sombras** iluminan áreas representativas para contener costo GPU.
- Se reutiliza `createLiveStadiumDistrict` para acceso, boleterías, pabellones, paddock y veterinaria. **No** se recrea una segunda tribuna gigante.

## Guía de integración después del otro agente

1. Leer primero la nueva rama `main` y comparar cambios del otro agente, especialmente `visual-lab/scene.js`, `stadiumDistrict.js`, `nightLights.js`, `race-lab/source/src/horse.js` y la página `/estadio/`.
2. Ejecutar `node --test tests/alpha16-parade.mjs` y la suite de Alpha 15; inspeccionar capturas de CI sobre *parade-alpha16-stadium.png* y *parade-alpha16-foodcourt.png*.
3. **No fusionar visualmente por acumulación:** el modo Parade usa stands cortos, mientras `scene.js` actual todavía construye una tribuna de unos 810m, por lo que no se deben montar ambos juegos de tribunas uno sobre otro.
4. Integrar la ruta `/parade/` como página independiente en el encabezado una vez verificada, sin detener LIVE; la home sigue mostrando la carrera de tres minutos.
5. Para el estadio LIVE, extraer el entorno de `parade/scenery.js` como una opción de recinto común, y retirar/segmentar la tribuna gigante de `visual-lab/scene.js` en la misma modificación, preservando `createLiveStadiumDistrict` y los accesos.
6. Ajustar nivel de detalle de proveedores de comida, tiendas, gradas y vehículos al preset `eco / balanced / cinematic`. No introducir 48 luces físicas.
7. Validar paredes, techos, posiciones y colisiones con el óvalo desde cámaras aéreas y bajas, de noche y día. Los camiones deben estar **aparcados fuera de pista**.
8. Si el otro agente introduce nuevo caballos GLB, comprobar la lista real de clips `createHorse().clips`. El manual de Maya no garantiza que Walk sobreviviera a la exportación. Preparar un clip de Walk en el GLB si solo aparece Gallop.
9. Mantener el cuidado por los resultados: **no tocar** `officialRace.js`, fixture, apuestas o reloj financiero.
10. Tras integración exitosa, desplegar con el flujo GitHub → Hostinger y ejecutar pruebas de navegador en ambas rutas `/` y `/parade/`.

## Riesgos pendientes

- **Calidad AAA:** los puestos, las carpas y camiones son geometría procedural de bajo costo. Son una base coherente, no equivalen a una biblioteca de modelos fotorrealistas. El próximo arte pass deberá sustituir los LOD cercanos por GLB/GLTF con materiales PBR y texturas verificadas.
- **Clips de animación:** Walk debe comprobarse contra el GLB efectivamente servido.
- **Móvil:** las texturas y el número de caballos deben medirse con GPU limitada. Mantener un máximo de doce esqueletos visibles, no cien a la vez.
- **Zonas de superposición:** verificar con el recinto actualizado antes de fusionar.
- **Respaldo:** archivo GitHub Actions expira a los 90 días; bajar copia local adicional si se necesita archivo permanente.

## Verificación y recuperación

Para recuperar exactamente la versión anterior en Git (después de guardar el trabajo actual):
```sh
git fetch origin backup/main-2026-11-02-alpha15
git switch -c restore-alpha15 0d217ad043f8bbfbf8cbeeb410472b9af4e24111
```

Para validar la lógica preparada:
```sh
node --test tests/alpha16-parade.mjs
node --check parade/parade.js
node --check parade/scenery.js
node --check parade/drone.js
```

La página `/parade/` de esta rama **no está publicada en Hostinger**: ejecutar mediante servidor HTTP local o la prueba de CI. No hacer merge automáticamente antes de revisar.

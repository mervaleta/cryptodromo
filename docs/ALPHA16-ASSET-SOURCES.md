# Banco de recursos gráficos · Alpha 16 / objetivo visual AAA

**Alcance:** fuentes verificadas de recursos externos para reemplazar gradualmente los placeholders procedurales de `parade/scenery.js`, **sin haber incorporado aún** assets externos pesados, y sin contaminar el código de carreras.

## Fuentes con licencias verificadas

1. **Kenney Food Kit**, 200 modelos 3D, CC0: https://kenney.nl/assets/food-kit. Comidas, ingredientes, mostradores y utilería para puesto de hamburguesas, pizzas, café y snacks. La página oficial muestra licencia CC0 y 200 archivos.
2. **Kenney City Kit (Roads)**, 90 modelos 3D, CC0: https://kenney.nl/assets/city-kit-roads. Veredas, señales y calle de servicio; NO colocarlos sobre el óvalo.
3. **Kenney City Kit (Industrial)**, 40 modelos 3D, CC0: https://kenney.nl/assets/city-kit-industrial. Almacén de forraje, zona de mantenimiento, dependencias técnicas.
4. **Kenney Car Kit**, 45 modelos 3D, CC0: https://kenney.nl/assets/car-kit. Vehículos de servicio como placeholder visual, **no** son modelos específicos de maquinaria ecuestre; para camión alisador realista habrá que desarrollar una caja de herramientas y rastra propias.
5. **Kenney City Kit (Suburban)**, 40 modelos 3D, CC0: https://kenney.nl/assets/city-kit-suburban. Pabellones, módulos de servicios y entorno exterior.
6. **Poly Haven**, https://polyhaven.com/textures y https://polyhaven.com/license, todos sus modelos y texturas PBR/HDRI publicados bajo CC0. Priorizar 1K–2K para grava, tierra, metal corrugado, lona de carpas, pavimento y maderas; la licencia oficial permite uso comercial sin atribución obligatoria, aunque agradecida.
7. **Quaternius**, https://quaternius.com, biblioteca con packs CC0. Elegir pack concreto y verificar su licencia y glTF antes de descargar. Útil para multitud baja LOD y árboles, no necesariamente para primeros planos fotorrealistas.

## Flujo editorial / técnico

- **No mezclar estilos visuales:** Kenney sirve para LOD 2/lejanía, Poly Haven para PBR de objetos cercanos, modelos personalizados para camioneta alisadora y suministros ecuestres.
- Antes de importar un asset, registrar **autor, URL oficial, fecha de descarga, licencia, versión, SHA256 y destino** en `assets/MANIFEST-EXTERNAL.md`.
- Convertir modelos a glTF/GLB, normalizar ejes Y-up, escalas, materiales y UV; comprimir geometría con meshopt/Draco y texturas con KTX2/BasisU.
- Reutilizar materiales y texturas con atlases; evitar luces dinámicas individuales por cada farol o puesto.
- Preparar tres LOD: LOD0 3D PBR hasta 35m, LOD1 simplificado de 35 a 120m, LOD2 instancias o siluetas a partir de 120m. Respetar el tope de 12 rigs de caballo simultáneos.
- No cargar paquete de 200 alimentos para un solo puesto: seleccionar 10–15 props, hornear en atlas y usar instancias.
- Una sola textura 2K por conjunto modular cercano o varias KTX2 1K; no repetir la fuente 8K en el navegador.
- Priorizar la zona que aparecerá con dron antes que la que apenas se ve en cámara de transmisión: **1. tribunas recortadas, 2. paseo de comidas, 3. caballerizas, 4. maquinaria, 5. parque exterior**.
- Verificar diferencia día/noche, accesibilidad y GPU económica antes de fusionar.

## Ejemplo de manifest que habrá que completar al incorporar cada asset

```json
{
  "name":"food-stand-props",
  "source":"https://kenney.nl/assets/food-kit",
  "license":"CC0-1.0",
  "downloadedAt":"YYYY-MM-DD",
  "fileSha256":"<real hash of downloaded ZIP, never invented>",
  "convertedTo":"public/assets/parade/food-stand-props.glb",
  "lod":"0|1|2"
}
```

**Pendiente de conversión:** los módulos `parade/scenery.js` ya permiten colocar props en el espacio y controlar la calidad, pero siguen usando geometría simple. Este documento no afirma que los packs estén descargados o incluidos en la PR.

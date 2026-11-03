# Alpha 18 · Estadio con más densidad y caballos más protagonistas

**Estado:** preparado, sin integrar en `main` ni publicar. Rama `prep/alpha18-stadium-density`. Este trabajo debe combinarse con Alpha17 y las otras ramas activas después de resolver conflictos.

## Diagnóstico a partir del código real
- `visual-lab/scene.js` crea 12 caballos GLB a `height:2.85` (el tamaño visual, no su velocidad), mientras que los portones de largada tienen techo a `y=3.02`. Subir el tamaño a 3.2 sin rediseñar portones rompería el realismo.
- La pista recta tiene barandas en `z=-20.2` y `z=20.2`. Las tres tribunas actuales están centradas en `x=-210,-5,207` y los espectadores en `z=-107` y filas más alejadas. Entre pista y tribuna queda una franja de gran anchura, visualmente vacía.
- El viejo estadio tenía una tribuna continua de 810m, retirada deliberadamente en Alpha16 para dar espacio al pueblo y las instalaciones. **No conviene restituir ese muro continuo**.
- El decorado exterior existente y el parque ya aportan edificios, árboles y cartelería, pero falta detalle de escala humana cerca de la pista: barandas, primeras filas, escalones, espectadores, jardineras y banderines.

## Material listo
`visual-lab/stadiumDensity.js` exporta `createStadiumDensity({THREE,scene,quality,softwareGPU})`:
- Agrega **dos barandas** en z=-25.5 y -87.5, fuera del circuito.
- Construye **tres frentes de tribuna modulares**, respetando los centros existentes, con graderías escalonadas, asientos y público instanciado.
- Añade balustres, banderines y jardineras para cortar los espacios visualmente vacíos.
- Mantiene instancias por material, no una malla por persona. Presets eco, balanced y high.
- Expone `root`, `stats`, `setQuality`, `dispose`; no toca datos, fixture, posiciones, velocidades, cámara, reloj ni los modelos de caballos.
- Es **opt-in**: no se importa en `scene.js` hasta hacer revisión visual en la rama actualizada.

## Proporciones de caballos
- Primera propuesta conservadora: altura **2.92** frente a 2.85 actual (+2.46%), dejando 0.10 de margen estático bajo techo de 3.02. La animación podría requerir margen mayor: comprobar galope y salto de casco.
- Recomendación de dirección de arte: **probar primero cámaras más cercanas, ópticas largas y tribunas frontalmente más próximas**. El caballo puede parecer 10-20% mayor sin alterar la geometría ni las colisiones.
- Segunda iteración, si sigue pequeño: rediseñar portones de largada con 3.5 de gálibo, validar la animación y comparar altura 3.0, 3.1 y 3.2 en planos bajos y aéreos. No hacerlo a ciegas.
- La API `safeHorseHeight` limita el escalado opcional a 2.92 mientras no se revisen los portones. La integración inicial **no debe cambiar** el `height:2.85` de producción.

## Integración cuando terminen los otros agentes
1. Actualizar la rama desde `main` sin sobrescribir `scene.js`, cámaras Alpha17 ni el sistema de escenario.
2. Agregar `import {createStadiumDensity} from './stadiumDensity.js?v=alpha18-1';` en `visual-lab/scene.js`.
3. Justo después de construir el venue y el distrito, invocar `const stadiumDensity=createStadiumDensity({THREE,scene,quality:softwareGPU||mobile?'eco':'balanced',softwareGPU});`. No agregar el decorado dos veces.
4. Vincular `stadiumDensity.setQuality(next)` a los cambios de calidad y `stadiumDensity.dispose()` al desmontar, si aplica.
5. Comparar capturas desde: cámara baja a pie de pista, railcam, gran angular, aérea y foto finish; verificar que los tres frentes no tapen las fachadas del pueblo ni las tribunas existentes. **Importante:** los escalones añadidos deben ajustarse en la revisión visual si atraviesan las graderías actuales.
6. Medir FPS y draw calls en móvil/SwiftShader y validar que los 12 caballos sigan visibles y que el overlay de cuenta regresiva no se altere.
7. Probar la altura opcional 2.92 únicamente en una rama de vista previa; no mezclar la modificación del GLB con las modificaciones de cámara hasta ver capturas.

## Criterio de aceptación
- La escena debe sentirse más poblada desde la cámara de carrera, no solo desde la vista aérea.
- Las 12 calles deben permanecer despejadas y sin postes atravesando animales.
- El estadio debe conservar tres tribunas diferenciadas y el acceso a edificios y pueblo.
- Sin nuevos renderers, cargas remotas, animación por espectador ni geometría de crowd por frame.
- Las 480 carreras diarias, los 180 segundos por slot, los resultados y los colores de los caballos deben permanecer idénticos.

# Alpha 18 · Estadio con más densidad y caballos más protagonistas

**Estado:** integrado en `main` dentro de `visual-lab/scene.js`. Esta nota queda como referencia de diseño, proporciones y criterios para futuras iteraciones; los pasos iniciales de integración ya no están pendientes.

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
- Está importado y activo en `visual-lab/scene.js`, con calidad adaptativa (`eco` en móvil o GPU por software; `balanced` en el resto) y ajuste posterior mediante `stadiumDensity.setQuality(next)`.

## Proporciones de caballos
- Primera propuesta conservadora: altura **2.92** frente a 2.85 actual (+2.46%), dejando 0.10 de margen estático bajo techo de 3.02. La animación podría requerir margen mayor: comprobar galope y salto de casco.
- Recomendación de dirección de arte: **probar primero cámaras más cercanas, ópticas largas y tribunas frontalmente más próximas**. El caballo puede parecer 10-20% mayor sin alterar la geometría ni las colisiones.
- Segunda iteración, si sigue pequeño: rediseñar portones de largada con 3.5 de gálibo, validar la animación y comparar altura 3.0, 3.1 y 3.2 en planos bajos y aéreos. No hacerlo a ciegas.
- La escena integrada conserva `height:2.85` en `visual-lab/scene.js`. La altura 2.92 queda como propuesta no aplicada hasta revisar galope y salto de casco con capturas.

## Integración aplicada

- `visual-lab/scene.js` importa `createStadiumDensity` con la versión Alpha18.
- La instancia se crea una sola vez después de construir el distrito y el venue; el decorado no se duplica.
- Los cambios de calidad del render se pasan a `stadiumDensity.setQuality(next)`.
- Se conserva `height:2.85` para los caballos y la geometría del circuito, largada, relojes y resultados.

## Criterios para futuras iteraciones visuales

Antes de cambiar escala o geometría, revisar las vistas baja a pie de pista, railcam, gran angular, aérea y foto finish; confirmar que los frentes no oculten edificios ni tribunas existentes. Medir FPS y draw calls en móvil o SwiftShader y verificar que sigan visibles los 12 caballos. El cambio de altura 2.92 sigue siendo una propuesta de exploración y no está aplicado.

## Criterio de aceptación
- La escena debe sentirse más poblada desde la cámara de carrera, no solo desde la vista aérea.
- Las 12 calles deben permanecer despejadas y sin postes atravesando animales.
- El estadio debe conservar tres tribunas diferenciadas y el acceso a edificios y pueblo.
- Sin nuevos renderers, cargas remotas, animación por espectador ni geometría de crowd por frame.
- Las 480 carreras diarias, los 180 segundos por slot, los resultados y los colores de los caballos deben permanecer idénticos.

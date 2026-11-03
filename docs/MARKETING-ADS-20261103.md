# Cryptódromo · Inventario de publicidad y marketing
Fecha: 2026-11-03. Alcance: nueva rama aislada (sin despliegue de producción).

## Diagnóstico de arquitectura
La portada activa de este repositorio es `/index.html`: estadio Three.js, `#stage`, `#raceCanvas` y paneles DOM. Las páginas `/racers/`, `/fixture/`, `/resultados/`, `/estadisticas/`, `/grandes-premios/`, `/cronicas/`, `/stables/` y `/institucional/` tienen estructura HTML separada, pero gran parte usa `/assets/crp-global-nav.js`. Otra familia de páginas informativas usa `/assets/institutional.js`.

El repo conserva rutas históricas `/cryptodromo/`, `/public/`, `/casino/`, `/soluciones/` y backups independientes. **No se intervienen** automáticamente en esta fase: podrían ser builds antiguos o sistemas de otra propiedad y requieren validación de enrutamiento y ownership antes de insertar anuncios.

## Entregado
- Landing comercial en `/marketing/`, con inventario navegable, explicación de formatos y consulta por correo electrónico.
- Catálogo central en `/marketing/inventory.json`. Los seis espacios digitales nacen con `status: available`; cambiar a `reserved` oculta ese placeholder y actualiza el catálogo mostrado en marketing.
- Contenedor y estilos en `/assets/ad-inventory.js` y `/assets/ad-inventory.css`, cargados desde navegación global e institucional legada.
- Enlace de entrada por el menú Proyecto de la navegación compartida y por el footer donde exista la grilla estándar.
- Ningún script tercero, tracker publicitario, cookie adicional ni transacción. No hay subasta programática ni promesa de inventario vendido.
- El formulario comercial utiliza `mailto:` en el dispositivo del visitante, sin recopilar datos en backend.

## Matriz de ubicaciones
| ID | Dónde | Referencia creativa | Activación |
| --- | --- | --- | --- |
| `home-top` | Entre cabecera y carrera | 970 × 90; móvil 320 × 100 | Disponible |
| `race-post` | Debajo de `#stage` | 970 × 90; móvil 320 × 100 | Disponible |
| `race-footer` | Antes del pie de la carrera | 970 × 90; móvil 320 × 100 | Disponible |
| `interior-top` | Tras cabecera en sección | 728 × 90; móvil 320 × 100 | Disponible |
| `interior-content` | Después de bloque editorial | 728 × 90; móvil 320 × 100 | Disponible si hay bloques suficientes |
| `interior-footer` | Antes del pie de sección | 970 × 90; móvil 320 × 100 | Disponible si existe pie |
| `stadium-fence` | Vallas y tribunas renderizadas | 3D a medida | Planificado, NO a la venta |
| `broadcast-title` | Placas y previa de carrera | Patrocinio de emisión | Planificado, NO a la venta |
| `grand-prix` | Naming de eventos especiales | Patrocinio | Planificado, NO a la venta |

Los tamaños son medidas creativas de referencia, no dimensiones rígidas del contenedor. El anuncio es un **placeholder**: para servir una campaña real hacen falta imágenes finales, revisión comercial, contrato/fechas y módulo de creatividades. Los anuncios no se ubican sobre el canvas, los controles, los resultados o la meta.

## Prueba de humo sugerida después de merge
1. Abrir `/marketing/`, filtrar Carrera y Secciones; elegir ubicación; revisar `?slot=race-post#contacto`.
2. Verificar en `/` cabecera, post estadio y prefooter; confirmar que `#raceCanvas` sigue animando y que la carrera no cambia.
3. Verificar al menos `/racers/`, `/fixture/`, `/estadisticas/`, `/institucional/` y una ruta informativa legada.
4. Probar anchos 360, 768, 1280 y 1920 px, teclado, zoom 200%, bloquear JS y deshabilitar carga del JSON.
5. Marcar temporalmente `race-post` como `reserved` en JSON; comprobar que el banner se oculta y el estado en marketing se actualiza.
6. Inspeccionar consola, CLS, LCP, accesibilidad, navegación y que no existan peticiones a adtech externo.

## Pendiente para venta real
- Panel de campañas/creatividades, calendario de reservas, aprobación, expiración y medición de impresiones/clics con consentimiento.
- Gestión de consentimientos, información de cookies y política de privacidad si se habilitan analytics/ad servers; reglas de edad/geografía y categorías prohibidas.
- Validación jurídica por jurisdicción si en el futuro se retoman apuestas y anuncios de gambling/finanzas.
- QA visual sobre Hostinger: el entorno publicado no pudo verificarse desde el navegador de lectura usado en esta tarea. El trabajo se basa en el repo GitHub.
- Confirmar qué rutas históricas están vivas antes de una fase 2 de cobertura universal.

## Riesgo de seguridad independiente
El repositorio público contiene un archivo llamado `.ssh_pass` y scripts de despliegue. **No se leyó ni se reprodujo su contenido**; por su nombre, corresponde verificar inmediatamente si conserva algún secreto real. Si está o estuvo operativo: revocar/rotar las credenciales y eliminar secretos del historial de Git. Nunca desplegar claves en `public_html`.

# Checklist de integración visual y navegación
**Estado:** preparado para implementación posterior. No se ha instalado en las páginas ni desplegado.

## Migración
- [ ] Releer main y comparar con los cambios de los otros agentes.
- [ ] Identificar el generador REAL de páginas Cryptódromo (el archivo build_site_ui.py en raíz declara RNGMarketDriven y no debe modificarse sin confirmar su propósito).
- [ ] Integrar header en el generador o plantilla compartida; nunca mantener copias divergentes.
- [ ] Asegurar que el logo PNG se renderiza una sola vez.
- [ ] Mantener los accesos existentes que no aparezcan en el menú propuesto, documentando su nuevo destino (por ejemplo Apuestas, laboratorios).
- [ ] Resolver el ancho: 1480px para contenedor general; columnas de lectura más angostas para artículos.
- [ ] Unificar CSS de nav, botones, foco, desplegables y footer, sin cambiar canvas ni controles del motor.
- [ ] Probar menú de accesos: click, teclado Tab, ArrowDown, Escape, click exterior y navegación táctil.
- [ ] Probar en 320, 375, 768, 1024, 1440 y 1920 px.
- [ ] Probar las rutas: /, /racers/, /fixture/, /resultados/, /estadisticas/, /cronicas/, /apuestas/, /estadio/, /parade/, /institucional/, /comunidad.html, /visual-lab/, /race-lab/source/.
- [ ] Revisar accesibilidad: contrastes, nombres accesibles, aria-current, orden de foco, menú visible sin recortes.
- [ ] Probar que la navegación no superpone los controles de carrera ni bloquea el scroll.
- [ ] Verificar el sitio publicado tras deploy, incluyendo caché de CSS.

## Criterios de aceptación
1. Misma marca, misma altura de header y misma estructura de menú en todas las rutas principales.
2. Un solo logotipo visible por encabezado, sin texto superpuesto.
3. Contenido alineado con el mismo margen exterior en desktop y móvil.
4. Menús desplegables operables con mouse, teclado y táctil.
5. Sin regresiones en carreras, modelos 3D, corredores, fixtures ni datos.

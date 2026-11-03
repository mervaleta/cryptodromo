# Auditoría de encabezados, navegación y tipografía (preintegración)
Revisión del árbol `main` en 2026-11-02. Este paquete es **staging**, no se carga automáticamente en producción.

## Inconsistencias confirmadas en código
| Ruta | Header | CSS común cargado | Anchos declarados / observaciones |
| --- | --- | --- | --- |
| / | sitebar | Sí | CSS inline todavía contiene 1800px y reglas de top/brand heredadas |
| /racers/ | sitebar | Sí | CSS de corredores independiente |
| /fixture/ | sitebar | No directamente | Menú principal independiente |
| /resultados/ | sitebar | No directamente | Menú principal independiente |
| /estadisticas/ | bar | No | Contenedor 1180px, Inter y Georgia |
| /cronicas/ | sitebar | No directamente | Encabezado editorial |
| /apuestas/ | sitebar | No directamente | Menú independiente |
| /estadio/ | sitebar | Sí | Barlow Condensed e Inter |
| /parade/ | sitebar | No directamente | Menú parade-nav, ancho 1520px |
| /institucional/ | sitebar | Sí | CSS institucional con Manrope y DM Mono, max 1180px |
| /comunidad.html | sitebar | Sí | Navegación reducida |
| /visual-lab/ | top | No | Header heredado y 1800px |
| /race-lab/source/ | sitebar | Sí | Cabecera compartida |

**Nota:** No cargar directamente una hoja no prueba ausencia total de estilos, porque algunos módulos pueden inyectarlos por JS. Revisión de código, no auditoría visual de navegador.

## Propuesta de arquitectura
1. Un solo header semántico con un solo logo SVG/PNG, altura base 76px, ancho máximo 1480px.
2. Accesos principales: Carrera, Corredores, Fixture, Resultados; accesos con ícono y desplegable para Explorar (Estadio, Parade, Visual Lab), Comunidad (Crónicas, Comunidad, Eventos), Proyecto (Institucional, Cómo funciona, Contacto).
3. Menús accesibles con botones, `aria-expanded`, `aria-controls`, Escape, clic exterior, foco visible y navegación por tabulación. No abrir solo con hover.
4. Tipografía de UI única Segoe UI/Arial; titulares editoriales pueden conservar serif como excepción documentada.
5. Unificar `--crp-max-width:1480px`; permitir áreas de lectura de 760-850px dentro de ese contenedor para textos largos.
6. Variables de colores centralizadas; mantener colores de caballos independientes de la identidad UI.
7. Unificar footer y estados activos, sin alterar componentes 3D ni datos.
8. Definir menú móvil que no tape la telemetría, con scroll horizontal o panel compacto según el ancho.

## Plan de implementación seguro
- Esperar a que terminen los otros agentes y releer HEAD de main.
- Integrar el componente en el generador de páginas (no editar masivamente HTML generado).
- Primero probar carrera, racers, fixture, resultados, estadísticas, parade y estadio.
- Migrar institucional y rutas heredadas; corregir rutas duplicadas / redirecciones.
- Verificar con navegador escritorio y móvil: header idéntico, logo único, ancho consistente, menús, foco, contraste, sin overflow y sin tapar controles de carrera.
- Solo después hacer merge y desplegar.

## Archivos listos
`design/navigation/crp-shortcuts.css`: componente visual aislado.
`design/navigation/crp-shortcuts.js`: interacción accesible sin dependencias.
Ninguno está importado en páginas existentes para evitar pisar cambios concurrentes.

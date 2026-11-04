# CRC / CRP · Manual de identidad, auditoría e integración
**Versión de trabajo:** 1.0 · 2026-11-04 · **Rama de preparación, sin deploy ni merge.**

## A. Alcance, fuente y nivel de evidencia
- **Archivo histórico primario:** `crp-webapp-hostinger-v5-completo.zip`, archivos `src/theme/customTheme.ts`, `src/components/Navbar.tsx`, `src/components/common/betButton/index.tsx`, `src/components/section/participants/components/tableHeader.tsx` y `src/components/common/ListItem/statsCoinRow.tsx`. Contraste con `crp-webapp.zip` (mismo tema bajo `crp-webapp/src/theme/`).
- **Fuente visual auxiliar:** `Cryptodromo - Problem Solution Product.pdf`, pág. 2: capturas de LIVE, Stats, Ranking y perfil histórico; evidencia cualitativa de fondo negro, datos densos y caballos multicolor. `Cryptodromo - Slides.pdf` es material de marca, **no** una medición exacta de UI.
- **Código vigente inspeccionado:** `main` SHA `47ab154cf8eddfbd55577a430f7b4c5d537c0f7b` al iniciar, árbol de 833 entradas; ejemplos de CSS `assets/site-shell.css`, `assets/stadium-hub.css`, `assets/race-site-hub.css`, `assets/institutional.css`, `assets/crp-global-nav.css`, `admin/horses/editor.css` y entradas públicas. Dado el trabajo paralelo, este SHA **no** garantiza que continúe siendo el HEAD al momento de integrar.
- **Limitación:** no hay capturas de navegador actual de Hostinger verificadas en esta entrega. La herramienta de consulta web devolvió una portada antigua de `cryptodromo.com` (registro de 2024); `race.cryptodromo.com` no pudo abrirse. No se utiliza esa página vieja para afirmar cómo está producción en 2026.
- **Definiciones:** **LEGACY** = comprobado en código fuente histórico; **CURRENT** = comprobado en `main`; **NEW** = decisión propuesta y explícitamente no atribuida al CRC.

## B. Colores históricos verificados
| Función | Token | Valor | Fuente |
|---|---|---|---|
| Marca, selección de navegación, métricas seleccionadas | `--crc-green` | `#7ACE7A` | `Navbar.tsx`, `tableHeader.tsx`, `statsCoinRow.tsx` |
| LIVE activo | `--crc-red` | `#CD0604` | `Navbar.tsx` |
| Negro | `--crc-black` | `#070707` | estilos de componentes en archivo histórico |
| Superficie oscura | `--crc-bg` | `#0E0D0D` | componentes en archivos históricos |
| Superficie base | `--crc-surface` | `#171615` | componentes en archivos históricos |
| Panel profundo | `--crc-panel` | `#221F1E` | componentes en archivos históricos |
| Texto principal | `--crc-ink` | `#FFFFFF` | componentes en archivos históricos |
| Texto secundario de tabla | `--crc-muted-legacy` | `#878787` | `tableHeader.tsx` |
| Gris de paneles | `--crc-line-legacy` | `#4A4A4A` | componentes de archivo histórico |
| CTA BET NOW histórico | `--crc-success-legacy` | `#3BB34F` | `betButton/index.tsx` |

Importante: el tema histórico también define `brand.900:#1A365D`, `brand.800:#153E75`, `brand.700:#2A69AC`; **no** se reinterpreta ese azul Chakra como acento principal de marca. Los porcentajes de variación y los colores por caballo no heredan el verde de interfaz indiscriminadamente.

### Posiciones 1 a 12 (paleta original sin reordenar)
`numberPositionsStyles` en `src/theme/customTheme.ts`: 
`1 #972A19`, `2 #FFFFFF`, `3 #245693`, `4 #FADD07`, `5 #2E9028`, `6 #383838`, `7 #B86A01`, `8 #F57BF8`, `9 #18629F`, `10 #4E1584`, `11 #5B5B5B`, `12 #7D9B15`.
El texto en posición 9 se pasa deliberadamente a blanco **solo en la muestra de componente nueva**, para mejorar contraste; el fondo y la identidad cromática permanecen sin alterar. Los demás valores originales de color de texto se conservaron en la muestra. Nunca reescribir colores de materiales 3D o silks.

### Tipografía y geometría verificadas
- `src/theme/customTheme.ts`: body, heading y mono usan `"Segoe UI", Arial, sans-serif`. El nombre `mono` del tema **no corresponde a una fuente monoespaciada real**; activar `font-variant-numeric:tabular-nums` mejora cifras sin cambiar familia. 
- `Navbar.tsx`: barra de altura 16 unidades Chakra, equivalente a **64 px** con el tema estándar; logo ancho 170 px en esa implementación. Es un dato del componente histórico, no una obligación para la barra 2026.
- `tableHeader.tsx`: encabezados de clasificación con 14 px, peso 700, fondo semitransparente oscuro y filas en grilla densa.
- `betButton/index.tsx`: fondo `#3BB34F`, radio **25 px**, texto blanco, variante de tamaño grande. En el nuevo DS, las acciones generales usan 4 px de radio, reservando red para LIVE y evitando confundir el botón de apuesta histórico con una transacción real.
- **NEW, no histórico:** escala 4/8/12/16/20/24/32/48 px, tarjetas de 6 px, marcos de 1 px, contenedor 1480 px **tomado del shell actual**, tiempos 140/220 ms, CTA mínimo 42 px y 44 px móvil. Ninguna medida de esta línea se atribuye a capturas del CRC.
- **NEW accesible:** `#F4F5F2` texto, `#B4B5AD` mutado, `#454441` separadores, `#292827` superficie elevada, `#9DE09D` hover, `#FFB2AD` error texto, `#F2D19C` aviso. Son apoyos visuales, no colores de caballos o moneda.

## C. Auditoría del diseño actual y prioridades
| Prioridad | Área | Observación comprobada | Solución preparada / dependencia |
|---|---|---|---|
| P0 | Identidad general | Se mezclan `Inter`, `Manrope`, `Georgia`, `DM Mono`, verdes `#13D69A`, `#83E1AC`, lima `#D8FB62` y acentos CRC. Fuentes: cuatro hojas compartidas | Adaptadores de tipografía, variables y acento desde `design/crc-system.css` cargado por los entrypoints; requiere QA visual |
| P0 | Datos deportivos | Lecturas históricas y actuales densas con distintas tipografías, jerarquías y columnas | Componentes `crc-table`, `crc-standing` y números tabulares; migración de tablas dinámicas a estos componentes pendiente de QA conjunto |
| P0 | LIVE/3D | Broadcast tiene controles y contrato DOM propios; el PR #79 está activo | Solo estilo de marcos y navegación compartidos. No alterar canvas, `visual-lab/`, cronómetros ni gateras |
| P0 | Taquilla/cuenta | PR #67 migra consumidor premium y conciliación de 1.440 carreras/día; taquilla Alpha18 vieja no equivale a Alpha19 | Adaptador visual nuevo disponible. **No montar taquilla anterior ni tocar billetera.** Integración real con #67 pendiente |
| P1 | Estadios | `assets/stadium-hub.css` incorpora superficie verde y estilos diferenciados | Puente cromático en clase `.hub` para portada, Satoshi y LIVE; no modifica geometría |
| P1 | Fixture / rankings / resultados | `race-site-hub.css` contiene hero Georgia, verde menta y paneles con marco de 11 px | Puente CRC de fuente, acentos y paneles; #70 cambia solo `fixture.js` |
| P1 | Institucionales | `institutional.css` usa Manrope, naranja y lima no presentes en el lenguaje de UI histórico | Bridge de `--lime` y tipografía. Sigue pendiente contrastar portada actual en navegador |
| P1 | Menú global | `crp-global-nav.css` ya retoma verde CRC con muchos `!important` del sistema preexistente | Se conserva comportamiento; import del DS para páginas que solo cargaban esta hoja. No se modifica JS del menú |
| P1 | Corredores | `racers/index.html` depende de `site-shell.css`, css propio y maestro BTC en actualización activa | Queda incluido el sistema sin cambiar rig, modelos, fondo de pistas ni JS BTC |
| P2 | Gaceta, comunidad, escuderías | Diversos frontends/hojas dedicadas y algunos flujos en PRs #40 y #37 | Gaceta enlazada; comunidad vía shell; migración de piezas propias pendiente |
| P2 | Admin fixture | `admin/fixture/index.php` tiene estilos embebidos y otro agente trabajando en seguridad y administración | **No editado** para evitar colisión con trabajos funcionales. Entregar adaptador posterior |
| P2 | Aplicaciones empaquetadas | `race-lab/index.html` carga CSS de bundle y `public/index.html` usa CSS del simulador | **No tocados**: son entrypoints de motores/legado; requiere responsable de motor para insertar el shell sin regresiones |

## D. Inventario estructural (no equivale a prueba de navegador)
- **Portada y estadios:** `index.html`, `stadiums/index.html`, `stadiums/crypto/index.html`, `stadiums/crypto/live/index.html`, `stadiums/crypto/broadcast/index.html`, `stadiums/crypto/archive/index.html`, `stadiums/fixture/index.html`, sedes `forex`, `commodities`, `merval`, `london`, `tokyo`, `wall-street`, `champions`.
- **Deporte:** `racers/index.html`, `fixture/index.html`, `resultados/index.html`, `estadisticas/index.html`, `grandes-premios/index.html`, `cronicas/index.html`, `estadio/index.html`, `parade/index.html`, `stables/index.html`, `championship/index.html`.
- **Consumidor/demo:** `apuestas/index.html`, `comunidad/index.html`, perfiles, `admin/horses/index.php`, `admin/fixture/index.php`, rutas de wallet del PR #67 (todavía no en este `main`).
- **Editorial e institucional:** `institucional/index.html`, `aboutus/`, `community/`, `contact/`, `help/`, `cryptodromo-gazette/public/`, páginas legales y prensa.
- **Legacy y laboratorio:** `race-lab/`, `visual-lab/`, `public/`, `rngmarketdriven-live-backup-20261013/`. Estos no deben confundirse con páginas estables publicadas.
- **No se declara** QA visual exhaustivo de todas esas rutas. La enumeración proviene del árbol GitHub y una inspección dirigida de entrypoints, no de navegación humana de todas las pantallas.

## E. Diseño implementado y cómo usarlo
- `design/crc-system.css`: fuentes, colores, superficies, espaciamiento, botones, tabs, tarjetas, tablas, formularios, estados, badges, tooltip, modal nativo, toast, paginación, 12 posiciones y adaptadores de markup actual.
- `design/crc-styleguide.html`: muestrario navegable, responsive e interactivo sin datos reales. No es una pantalla de producción ni una captura de la app.
- Import en **siete** hojas de entrada: `assets/site-shell.css`, `assets/stadium-hub.css`, `assets/race-site-hub.css`, `assets/institutional.css`, `assets/crp-global-nav.css`, `admin/horses/editor.css`, `cryptodromo-gazette/public/assets/style.css`.
- Cada entrada usa un único `@import url("/design/crc-system.css?v=crc-1")` al inicio. La importación se debe resolver en el mismo origen del sitio, también en Hostinger. **No** hay CDN ni fuente externa nueva, y el CSS se cachea.
- Para adaptar componentes nuevos, envolverlos en `.crc-ui` y aplicar clases `.crc-button--primary`, `.crc-panel`, `.crc-table`, etc. Las clases no cambian comportamiento: eventos y datos siguen controlados por los componentes actuales.

Ejemplo:
```html
<section class="crc-ui" aria-label="Clasificación">
  <div class="crc-panel">
    <header class="crc-panel-head"><h2>Resultados</h2></header>
    <div class="crc-scroll"><table class="crc-table">
      <thead><tr><th scope="col">Corredor</th><th scope="col" data-numeric>Var.</th></tr></thead>
      <tbody><tr><td>BTC</td><td data-numeric class="crc-price-up">+1,34 %</td></tr></tbody>
    </table></div>
  </div>
</section>
```
El verde financiero se usa **solo** cuando la cifra significa aumento; no codificar resultados únicamente por color: conservar signo, posición o texto. No forzar rojo LIVE para todas las pérdidas. Mantener texto alternativo para logos, estados `aria-live` prudentes y foco visible. Respetar `prefers-reduced-motion`.

## F. Reglas para UI AAA sin invadir la carrera
1. El escenario 3D, la física del caballo, su color, sus texturas, sus rigs y las cámaras no reciben nuevas reglas CSS.
2. La información de carrera prioriza nombre, posición, estado temporal, variación y hora. Acentos limitados a un dato destacado por panel.
3. Resultados y precios usan números tabulares, signos visibles, columnas alineadas y formatos de moneda contextualizados.
4. La malla de tarjetas se degrada a dos columnas y luego una; tablas largas mantienen desplazamiento horizontal con etiquetas accesibles. No se ocultan datos financieros para "entrar" en móvil.
5. Los componentes de acción mínima miden 42 px (44 px móvil). Hover y focus son diferentes: hover sutil, focus contorno verde de 2 px.
6. Evitar brillos y gradientes de casino; preferir bordes finos, títulos claros, paneles oscuros y ritmo compacto.

## G. Dependencias e integración diferida
**PRs existentes observados al investigar:** #79 (broadcast y LIVE), #72 (logos de gateras), #70 (reloj fixture), #67 (consumidor premium/caja), #64 (maestro BTC), #55 (marketing) y #35 (navegación estática) entre otros. No modificar sus scripts ni interfaces en reconstrucción. No integrar ramas derivadas de un `main` antiguo sin comparación.

**Antes del merge:** verificar SHA actual de `main` y estado de PRs; revisar diffs contra los siete imports compartidos; resolver cualquier conflicto de encabezados `@import`; analizar si la taquilla nueva adopta `.crc-ui` sin cambiar eventos; ejecutar tests; inspeccionar 1440x900 y 390x844 en portada, LIVE, BTC, fixture, resultados, estadios, cuenta y taquilla; verificar estados loading/error/empty, teclado y lector; confirmar invariantes deportivos y ninguna variación en red de datos. No habilitar CI de despliegue a producción mediante este PR.

**Rollback:** eliminar exclusivamente la primera línea `@import` de cada CSS enlistado, y borrar `design/crc-system.css`/muestrario. No hay migraciones ni cambios de estado persistente.

## H. Checklist de aprobación (sin afirmaciones de QA no realizadas)
- [x] Se inspeccionaron fuentes de colores, tipografía y patrones del CRP original.
- [x] Se inventariaron las familias principales de rutas y los frontends presentes.
- [x] Se construyó sistema de estilos reutilizable y se enlazó a hojas compartidas.
- [x] No se editó código de economía, auth, fixture, apuestas, motor o geometría 3D.
- [ ] Test de CI de la rama nueva aprobado.
- [ ] Capturas reales de los entrypoints de 2026, antes/después, desktop y móvil.
- [ ] Compatibilidad visual de PR #67 y #79 ya incorporados, comprobada en navegador.
- [ ] Verificación de admin fixture y bundles de motor con los responsables.
- [ ] Comparación con el `main` de integración y resolución de conflictos.
- [ ] Prueba manual de interacción, accesibilidad y performance con carreras completas.
- [ ] Aprobación explícita del PR por responsable, sin merge automático.

## I. Navegación y ancho uniforme · ampliación solicitada
**Decisión de arquitectura:** una única navegación global reutiliza `assets/crp-global-nav.js` y `assets/crp-global-nav.css`, en vez de copiar enlaces y handlers en cada pantalla. Se evitó editar el JavaScript canónico porque el PR #55 también lo modifica; así el cambio se fusiona con una sola fuente de verdad. Los menús locales de una sección pueden existir como navegación secundaria, pero nunca sustituir el menú global.

**Geometría compartida:** `--crc-shell-max:1480px`, `--crc-shell-gutter:clamp(16px,2vw,24px)`, `--crc-shell-width:min(1480px,100% - 2×gutter)`. El 1480 surge del `site-shell.css` actual: es una dimensión vigente de Cryptódromo, **no se atribuye al CRC 2024**. Nav y página son hermanos geométricos: mismos límites laterales; el pie usa la misma alineación. En pantallas anchas ningún contenedor exterior supera 1480 px. En móviles se conservan 16 px por lado. Las páginas editoriales pueden conservar un ancho interno legible de 850 px.

**Páginas antes separadas y ahora vinculadas al menú global:**
- `index.html` portada 2026.
- `stadiums/crypto/index.html` entrada Satoshi.
- `stadiums/crypto/archive/index.html` archivo de carreras.

Cada una carga el CSS y JS canónico y expone su `header.hub-head` también como `header.sitebar` para que el script existente lo reemplace. La mejora está limitada a presentación, no a fixture ni reloj. Los demás entrypoints que ya usan `crp-global-nav.js` conservan ese único menú, con nueva alineación CSS en `site-shell.css`, `stadium-hub.css`, `race-site-hub.css` y `crp-global-nav.css`.

**Dependencias explícitas, no se declaran terminadas:**
- `stadiums/crypto/live/index.html`: PR #79 lo modifica. Integrar las mismas dos referencias `/assets/crp-global-nav.css`, `/assets/crp-global-nav.js` y la clase `sitebar` en su header después de aceptar #79; no editarlo en paralelo por ser un HTML compacto, con alto riesgo de conflicto.
- `demo-caja/index.html`, `addons/premium-consumer/`: nacerán del PR #67; agregar el JS y la clase de header a las nuevas páginas tras la integración. No se modifica el flujo de cuenta ni saldos.
- `cryptodromo-gazette/public/`: publicación estática generada por `collector.py`. El CSS general está enlazado, pero la navegación editorial todavía es específica; requiere modificar el generador, no parchear manualmente 38 artículos que se regeneran.
- `admin/fixture/index.php`: protegido por autenticación y con panel administrativo en evolución; incluir barra y ancho después de coordinación para no interferir con controles, accesibilidad y la seguridad.
- `race-lab/`, `visual-lab/`, `public/`: módulos de visualización/legacy. Verificar caso a caso antes de introducir una barra que reste altura al viewport WebGL.
- Páginas institucionales heredadas: PR #35 modifica masivamente sus rutas. Esperar ese merge para hacer el barrido y no solapar diffs.
- Otros cambios en `assets/crp-global-nav.js` (PR #55): revisar orden, enlaces nuevos y dropdowns antes de cerrar este PR. Evitar fork del código de navegación.

**QA exigido:** `tests/crc-browser-snapshots.mjs` comprueba la existencia del header canónico y compara `left` de navegación y contenido (tolerancia 8 px) en 1440×900 y 390×844, guardando capturas **antes y después** en `artifacts/crc/`; workflow `crc-design-system.yml` sirve un baseline histórico de `main` y la rama mediante servidores locales sin despliegue. Dado que aún no existe un resultado de workflow confirmado, las capturas y sus conclusiones siguen **pendientes**. La ausencia de screenshots verificados prohíbe aprobar merge.

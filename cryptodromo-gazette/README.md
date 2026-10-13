# La Gaceta del Cryptódromo — entrega local, no desplegada

Periódico estático original, Python de biblioteca estándar y SQLite privado. Plantillas sin LLM, sin llamadas de pago, sin JavaScript, sin fuentes/imagen/CDN externos. El contenido factual y el humor tienen secciones y etiquetas distintas. El directorio ajeno `market-fixture-v1` y los dos sitios remotos no se han modificado.

## Ejecutar

Desde `/data/workspace/cryptodromo-gazette`:

```sh
# Captura explícita: máximo UN intento de red por día UTC, aun si falla.
python3 collector.py --state private/state.sqlite --output public --capture
# Estas ejecuciones trabajan solo con SQLite local; cero red.
python3 collector.py --state private/state.sqlite --output public
python3 -m unittest discover -s tests -v
python3 verify_site.py
```

La publicación por defecto es `--mode snapshot`: instantánea observada, nunca un supuesto directo. La portada contiene cuatro destacados por sección; las restantes notas están en una hemeroteca paginada de 24 entradas. RSS limitado a 40 piezas recientes. Cada nota factual conserva `source_url`, `observed_at` UTC y `published_at` UTC de su primera publicación. Las notas educativas/ficticias identifican autoría automática original; no atribuyen a Cryptodromo su contenido inventado.

`GAZETTE_SITE_URL` controla los enlaces absolutos de RSS; el valor por defecto apunta únicamente al sitio temporal autorizado `https://mediumvioletred-shrew-934553.hostingersite.com`. Esa configuración NO acredita que se haya desplegado.

## Modo replay y recursos

```sh
# Misma captura diaria, pero los eventos no se emiten hasta el día siguiente.
python3 collector.py --state private/replay.sqlite --output replay-public --capture --mode replay --replay-days 1
# Cron cada 5 o 15 minutos: SIN --capture, solo lee caché segura local.
python3 collector.py --state private/replay.sqlite --output replay-public --mode replay --replay-days 1
```

Un evento observado a las 06:10 UTC queda elegible al día siguiente a las 06:10 UTC. Se publica en la primera ejecución posterior; `published_at` registra esa emisión real, no una fecha futura. La nota presenta **«Replay / simulación — datos de [fecha de origen], emitidos [fecha de publicación]»**, además de las dos marcas horarias separadas. Nunca se etiqueta como carrera actual. Los 21 registros de una sola instantánea se repiten en el mismo instante elegible, NO se reparten artificialmente por toda una jornada. Se recomienda una base separada para cambiar de modalidad sin mezclar ediciones históricas ya publicadas.

**Una petición a medianoche no devuelve automáticamente un día completo de historia.** Para cobertura histórica completa con un único lote diario hace falta un archivo público oficial que entregue carreras finalizadas y un estado inequívoco de confirmación. Este artefacto no inventa ni obtiene ese archivo. Mientras falta, la cobertura consiste en las capturas realmente observadas y explicaciones editoriales honestas. El replay no produce resultados nuevos.

Ver `cron.example`: dos trabajos con `flock`, una captura diaria y un render local cada cinco minutos. Cron no está instalado. `--rollover-hour H` impide captura antes de esa hora UTC. Tras una avería de red se conserva la edición anterior y se muestra advertencia; no hay reintentos ese día. Cuando una captura tiene más de un día, su fecha queda siempre visible; no se anuncia frescura inexistente. Los contenidos idénticos no reescriben archivos. No hay seguimiento, usuarios, anuncios comerciales ni descargas periódicas de imágenes.

## Contrato de confidencialidad: lista blanca exhaustiva

La respuesta HTML y su JSON solo viven en memoria. No se guardan respuestas HTTP, fixtures reales crudos ni volcados de JSON. Se accede exclusivamente a las entradas `props.pageProps.currentRace` y `props.pageProps.nextRace`. Cada registro persistido contiene solo:

- `id`: identificador público de carrera como texto.
- `name`: nombre público de carrera (longitud limitada).
- `start`, `end`: horas anunciadas, normalizadas a UTC.
- `status`: ventana editorial `upcoming`, `live` o `unconfirmed`; los dos primeros solo describen el momento de captura y **no son un estado oficial de resultado**.
- `participants`: objetos con `name`, `label`, procedentes del nombre/símbolo público del activo del participante.
- `standings`: lista vacía en este adaptador; no hay acta confirmada validada.

Las posiciones de participantes, aun presentes, se descartan. No se conservan datos internos, trayectorias, implementación ni contenido que no pertenezca a esta lista. SQLite permanece fuera de la raíz pública y con modo 0600; la CLI rechaza una ruta de estado bajo la raíz de salida. El error de upstream no se imprime ni se guarda: solo una advertencia fija. La identidad determinista deduplica por carrera/ventana editorial/modalidad; el parte diario tiene identidad por fecha/modalidad. Las notas authored usan identidad fija por título.

## Hallazgo sobre resultados y fuentes

Inspección de lectura del 13 de octubre de 2026 UTC:

- `https://cryptodromo.com/live`: metadata pública de carrera actual y una lista de próximas; la captura productiva guardada contiene 21 carreras observables. No se encontró una señal explícita y fiable que confirme resultados finales en el contrato validado.
- `https://cryptodromo.com/fixture` y `https://cryptodromo.com/bets` respondieron HTTP 200. En la carga inicial examinada, ambas expusieron metadata de 20 carreras anunciadas futuras, no una historia confirmada del día. No se encontró un enlace directo a resultados históricos en esa página; esto no demuestra que un archivo oficial no exista detrás de otra interacción o API.
- La consulta inicial no suministró una fuente pública de apuestas anónimas autorizada. No se narran jugadores reales, «casi ganadores», apuestas, cuotas o volúmenes.

El adaptador es deliberadamente **fail-closed**: incluso un campo no validado que diga `confirmed` es insuficiente y no habilita crónicas. No se infiere un ganador por el reloj, una posición, una simulación futura ni un número interno. No están implementadas crónicas de llegada, segundo puesto, photo finish o remontada porque falta evidencia validada. Un futuro adaptador deberá verificar estado final público, orden final consistente y que inicio/fin no estén en el futuro. Las diferencias finales o movimientos solo se narrarán con evidencia pública específica; remontadas necesitan al menos dos instantáneas públicas comparables. No se agregan textos ficticios a esas notas.

## Primera edición y arte

Cinco secciones: Actualidad / Previas, Archivo / Replay, Escuela del Turf Virtual, Stud del Humor y Vidriera ficticia. Las últimas cuatro tienen cuatro notas originales cada una; la primera usa exclusivamente los registros reales capturados más un parte limitado. `private/category-counts.json` y `private/verification.json` documentan los recuentos obtenidos por código, no estimaciones.

Cada entrevista ficticia ostenta **«Ficción / sátira — personajes inventados»**. Cada anuncio suma **«Publicidad ficticia — no es una oferta comercial»**. Los personajes y productos no existen; no hay enlaces de pago, marcas patrocinadoras reales ni una entrevista real insinuada. Estas mismas etiquetas figuran en RSS. No se copió una cabecera, logo o texto de otro medio.

Se eligió la alternativa de **cuatro ilustraciones SVG originales locales**, no fotos ajenas con licencia incierta. El manifiesto `public/assets/manifest.json` declara título, autoría original, procedencia, CC0-1.0, enlace a licencia, dimensiones y uso ilustrativo. Cada imagen tiene leyenda «Ilustración original · no representa personas ni carreras reales», lazy loading y dimensiones 800×420. Todas pesan mucho menos de 200 KB; no hay hotlinks, retratos reales ni búsquedas de imágenes durante cron. No se afirma haber obtenido fotos de Google o Commons.

## Publicación segura para el agente padre

No se ha desplegado, configurado DNS, instalado cron ni hecho commits. Solo el padre debe desplegar en el nuevo sitio temporal autorizado; **NO tocar el blog financiero existente `mediumseagreen-squirrel-854565.hostingersite.com` ni la raíz del producto Cryptodromo**.

1. Verificar Python >=3.9, `flock`, rutas del sitio temporal y permisos. Si Python no está disponible en hosting, programar captura/render en un host autorizado con Python y transferir SOLO estáticos al nuevo sitio.
2. Conservar aplicación, SQLite, logs y bloqueo FUERA de `public_html`. Transferir exclusivamente `public/` al sitio nuevo; nunca copiar este directorio de aplicación entero.
3. Para publicación local, cada archivo se escribe temporalmente, se sincroniza y se reemplaza atómicamente; dependencias/artículos preceden a `index.html`. Archivos sin cambios no se escriben. No es una transacción global entre todos los archivos: para cambio global indivisible en servidor, montar un directorio de release nuevo y cambiar un symlink de document root si el hosting lo permite. Alternativa estática segura: subir activos/artículos/archivo/RSS primero y portada mediante rename remoto al final. No borrar páginas anteriores durante ese paso.
4. Si hay error de captura, no reemplazar con una supuesta carrera: el colector guarda notas anteriores y publica un aviso. Verificar `index.html`, notas, páginas de archivo, RSS y recursos por HTTP real tras el despliegue; conservar release anterior como rollback.
5. Comprobar condiciones del proveedor y jurisdicción antes de vincular un producto de apuestas/cripto. Esta gaceta no presta servicio de apuestas y no solicita dinero.

Pruebas ejercitadas: whitelist, futuros/resultados no validados, dedupe, escape HTML, estado privado, error de red, límite diario, embargo replay, timestamps de emisión, cinco categorías, etiquetas individuales y de RSS, manifiesto visual, enlaces y entrega HTTP loopback. No se realizó inspección visual en navegador porque no estaba disponible.

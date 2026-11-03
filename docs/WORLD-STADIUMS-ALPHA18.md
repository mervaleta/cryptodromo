# Cryptódromo World · integración Alpha18 (3 noviembre 2026)

## Revisión de base
- Repo mervaleta/cryptodromo, base main b7b04dccf2170ebfffb75fb5c02a6bfb24bff15f.
- El sitio actual es HTML/CSS/JavaScript estático: NO se copia el módulo Next.js del ZIP anterior.
- Fixture cripto oficial: race-lab/source/src/data/raceFixture.js, 100 tokens, 12 participantes, 480 carreras diarias, 7 días.
- Clasificación oficial: race-lab/source/src/data/officialRace.js.
- No se editan escuderías, XP, Grand Prix 3D, cámaras, clima, caballos ni clasificación.

## Entrega
- /stadiums/: landing de 8 estadios, 13 pistas.
- /stadiums/{slug}/: ocho fichas individuales, incluyendo crypto.
- /stadiums/fixture/: calendario global con filtros por fecha local, sede, ticker y paginación.
- assets/stadium-network-engine.mjs: motor de programación determinista, conversión de zonas horarias, cierres y selección ponderada de corredores. No es motor de resultados.
- assets/stadium-network-ui.mjs y assets/stadium-network.css: vistas y estilo independientes.
- assets/crp-global-nav.js: dos enlaces dentro de Explorar sin sobrescribir el menú Alpha18.
- Tests y GitHub Actions CI.

## Fixture congelado
Ventana 2026-11-04 a 2026-12-01, fechas locales de cada mercado.
MERVAL 2.516, Wall Street 2.372, Tokio 2.014, Londres 3.360, commodities 432, forex 5.660, champions 12. Total 16.366.
Corredores editoriales: MERVAL 24, Wall Street 60, Tokio 32, Londres 32, commodities 12, forex 16; Champions 8 plazas, total 184. Crypto original sin duplicar.
Los pesos de participación de estrellas NO afectan resultados ni anticipan ganadores.
Fechas de revisión cerradas hasta confirmar sesiones: MERVAL 9/11 y 10/11; Commodities 26/11 y 27/11. Mercado cerrado: MERVAL 23/11, NYSE 26/11 y Tokio 23/11. NYSE 27/11 cierra 13:00 ET.
Tokyo mantiene pausa 11:30–12:30 JST. Intl.DateTimeFormat aplica el huso de cada mercado.
La franja commodities 11–13:30 ET es editorial y NO corresponde al horario oficial de todos los contratos. FX depende de feed/proveedor.
NO extender la agenda fuera de este rango sin revisar horarios y feriados.

## Seguridad y limitaciones
Todos los eventos nuevos indican DEMO y NOT_CONNECTED; sin feeds de cotizaciones, resultados, apuestas, ingresos, retiros ni XP. La aplicación original sigue recibiendo exclusivamente su fixture Alpha18.
En Champions los campos WINNER: y WILDCARD: son plazas pendientes de clasificación. No hay resultados falsificados. Una futura competencia entre mercados requiere normalización transparente de las variaciones.
La nueva red no requiere PHP, base de datos, secretos, permisos ni APIs.
Para activar carreras nuevas con precios: identificar instrumentos por proveedor, validar licencias de market data, sesiones y feriados por activo, comprobar frescura, implementar replay y clasificación verificables y pruebas cruzadas. Apuestas reales fuera de alcance.
Desplegar sólo tras probar escritorio y móvil y verificar integración en Hostinger; el acceso al hosting no se comprobó aquí.

## Pruebas
node --check assets/stadium-network-engine.mjs
node --check assets/stadium-network-ui.mjs
node tests/world-stadium-network.mjs
Después revisar /stadiums/, /stadiums/merval/, /stadiums/fixture/ y las rutas existentes /fixture/, /estadio/, /stables/, /grandes-premios/.
En el futuro, revalidar el menú al fusionar PR de caja demo, temporadas y Fixture Admin que aún estén abiertas.

# JANCH World | Contrato de programación por tres pistas (04-11-2026)

**Estado:** decisión de producto aprobada; especificación para implementación y pruebas. **No cambia el fixture de producción ni el motor de resultados.**

## Principios
1. El Estadio Satoshi Nakamoto es el estadio maestro. Primero completar y optimizar sus tres pistas y su ciclo; después clonar la arquitectura para las otras siete sedes, adaptando arquitectura, mercado, superficie y deporte. No sobrescribir trabajo de otros agentes sobre estadio, caballos, cámaras o fixture.
2. Cada sede tendrá **al menos tres pistas independientes** (A/B/C). No basta con renombrar un único óvalo; el diseño físico y la escena deben permitir tres competiciones.
3. Cada pista reserva un **ciclo de 180 segundos** para presentación, carrera, resultados y transición. Las fases internas pueden variar sin romper el ciclo.
4. Hay **una largada global por minuto y por estadio** durante la sesión elegible, alternando A, B, C. Una misma pista inicia un ciclo nuevo cada tres minutos; no se solapan ciclos en esa pista. Entre pistas sí hay ciclos simultáneos.
5. Ejemplo de inicio de ciclos en una sesión a las 09:30: A 09:30, B 09:31, C 09:32, A 09:33, etc. Definir por separado el instante exacto de la **largada deportiva** dentro del ciclo (presentación puede precederla); nunca confundir inicio del ciclo con largada al publicar el calendario.
6. Para mercados con cierre, la **última largada elegible** corresponde al último minuto negociable de la sesión: por ejemplo, cierre a las 16:00 => minuto 15:59. No se truncan ciclos iniciados válidamente; la transmisión y resultados pueden terminar después del cierre. Para cierre a las 16:30 => minuto 16:29. Las sesiones partidas (Tokio) aplican la misma regla al corte y al cierre.
7. El dato final para la última carrera se determina con el **último dato válido de sesión** según contrato del proveedor, que puede ser la vela 1m del último minuto o el precio oficial de subasta/cierre si la regla del instrumento lo exige. No asumir que ambos son idénticos. Normalizar etiqueta temporal, zona horaria, cierre anticipado, feriados y demora de publicación.
8. **Integridad temporal:** ninguna animación, ranking ni resultado puede consumir anticipadamente datos de cierre no publicados. Si el dato final no llega o es inválido, marcar PENDING/DATA_UNAVAILABLE y resolver al recibir dato verificable, sin inventar resultados.
9. En la demo, conservar explícitamente DEMO / NOT_CONNECTED, resultados sintéticos y ausencia de apuestas reales. La transición a datos reales requiere licencias, validación por instrumento, replay y auditoría.
10. Champions conserva su calendario de finales como excepción editorial pendiente de definir; si se ejecuta en modo continuo, usar también tres pistas y ciclos de 180s.

## Estado actual y cambios futuros
- `assets/stadium-network-engine.js`: actualmente genera intervalos editoriales 3/5/6/10 minutos y un solo evento de 60s; **no cumple** este contrato. Cambiarlo en una PR de implementación coordinada, con tests.
- `race-lab/source/src/data/raceFixture.js` y `visual-lab/tripleLiveSchedule.js`: revisar la semántica real de inicio de ciclo/largada antes de copiarla; preservar el sistema Satoshi existente.
- Sedes nuevas: ampliar de 1 o 2 a >=3 pistas; diseñar geometrías y recursos propios después de optimizar Satoshi.
- El calendario mundial editorial no equivale todavía a simulaciones 3D conectadas. No alterar el cálculo oficial ni clasificaciones hasta contar con una integración verificada.

## Pruebas de aceptación
- 180 segundos entre inicios sucesivos de una misma pista; 60 segundos entre largadas globales del estadio, salvo cierres/pausas.
- Ninguna pista recibe dos ciclos simultáneos; tres pistas mantienen el flujo continuo.
- Inicio, corte, reapertura, cierre normal y anticipado en zona horaria del mercado, incluidos cambios DST.
- Última largada antes del cierre; vela etiquetada 15:59 cubre [15:59,16:00) cuando el proveedor usa timestamps de apertura. Validar explícitamente otros esquemas.
- No hay adelanto de información; faltantes quedan pendientes; reproducibilidad de demo.
- La UI distingue reloj de ciclo, largada, cierre de mercado y publicación de resultados.
- Fixture, carrera 3D, resultados y estadísticas se mantienen sincronizados sin duplicar eventos.

## Regla operativa para la implementación
No fusionar cambios en producción hasta comparar con el main más reciente, coordinar los PR activos de fixture y estadios, pasar CI y validar en navegador Hostinger. Esta especificación no autoriza por sí sola el despliegue.

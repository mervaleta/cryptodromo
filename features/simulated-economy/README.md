# Cryptódromo · MVP de dinero y apuestas simuladas

**Rama:** `feat/simulated-economy-mvp-20261102` · **No fusionado ni publicado**.
Ruta de prueba propuesta: `/demo-caja/`.
Objetivo: demostrar un flujo completo sin utilizar tarjetas, wallets externas, pasarelas, criptomonedas reales ni dinero real.

## Qué implementa

- Hasta seis **identidades ficticias locales**, con alias y selector. No es registro auténtico.
- Caja virtual en **centavos de USD demo**, saldo inicial de USD demo 100.
- Paquetes de **USD demo 5, 10, 25, 50 o 100** sin transacción de pago.
- **Canje bidireccional**: 100 CR por 1 USD demo, sin comisión. Esto NO es conversión de tokens on-chain. CR son puntos internos de simulación.
- Billetera CR, historial de movimientos con IDs y dos apuntes enlazados por ID de transferencia al canjear.
- Selección de las próximas cuatro carreras reales del fixture sintético de 480 carreras/día y doce corredores/carrera.
- Tres mercados ficticios: ganador (1.º), puesto (1.º/2.º), podio (1.º/2.º/3.º). Cuotas FIJAS de exhibición: 8×, 4× y 2,5×.
- Comprobante de ticket, premio bruto posible, descuento de CR, cierre cinco segundos antes de la largada y liquidación desde `createOfficialRace` + `officialRanking` al pasar sesenta segundos.
- Idempotencia local de liquidación, bloqueo de duplicado activo y rankings **solo entre perfiles locales** del dispositivo.
- Historial de tickets y movimientos y enlaces al fixture, resultados, comunidad, analistas y juego responsable.

**Importante:** el proyecto histórico menciona distribución de 50% del pool para ganadores, paquetes en USD y futuros premios para otros puestos. El MVP **no implementa pozo parimutuel**: usa cuotas fijas de exhibición sin respaldo de una casa real. Las cuotas y premios NO deben anunciarse como condiciones finales de apuestas por dinero.

## Dependencias reales

Esta rama **no modifica** el estadio, `/apuestas/` ni `/comunidad/` existentes. Para probar: desplegar esta rama como preview estático, o abrir el proyecto mediante un servidor HTTP que sirva la raíz del repositorio. El navegador debe soportar módulos ES, JavaScript y localStorage. La nueva página utiliza:

- `/assets/site-shell.css`
- `/race-lab/source/src/data/raceFixture.js`
- `/race-lab/source/src/data/officialRace.js`
- `/visual-lab/liveSchedule.js`
- `/features/simulated-economy/ledger.js`

Estos caminos se verificaron en el repositorio Alpha18 del que partió la rama. Antes de fusionar, actualizar con `main` si los agentes siguen modificándolo.

## Pruebas

`node --test features/simulated-economy/ledger.test.mjs` desde una copia del repositorio, usando Node compatible con módulos ES. Si el repositorio no declara `type: module`, usar una configuración ESM del proyecto o cambiar la extensión a `.mjs` de ambos archivos y corregir la importación del módulo de tests. La suite cubre ingresos, canjes, límites, tickets duplicados, cierre temporal, victorias, derrotas e idempotencia. **Las pruebas están escritas; su ejecución automatizada aún no está verificada.**

Checklist manual: abrir `/demo-caja/`, crear jugador, cargar USD demo 5, convertir 5 a 500 CR, emitir ticket de 100 CR, verificar débito, esperar más de 60 segundos desde la largada de la carrera escogida, verificar resultado y que actualizar la página no repita el premio, convertir los créditos restantes a USD demo, cambiar de jugador y comprobar aislamiento local. Abrir en teléfono y comprobar menú y formularios.

## Límites y seguridad que NO resuelve este MVP

1. **El navegador controla los saldos**. localStorage es editable, no resiste fraude, cambios de hora, modificación de cuotas ni condiciones de carrera. No habilitar pagos o canjes reales.
2. Los precios y resultados del fixture sintético pueden calcularse **antes de la largada en el cliente**. La demo ilustra el flujo, no es un mercado de apuestas justo ni secreto.
3. El estado entre pestañas puede desincronizarse; no existe transacción ACID, consenso multiusuario ni liquidación autoritativa.
4. No hay login, credenciales, KYC, verificación de edad, georrestricciones, límites de exposición, antifraude o fiscalización. No integrar con `/api/auth.php`: su login por email aportado por el cliente no verifica identidad.
5. No hay pagos, retiros, tokens blockchain, ni conversiones reales. Los botones nunca deben conducir a una pasarela de pago en este código.
6. Resultados de apuesta sintéticos y no probabilísticos. El modelo de cuotas / márgenes / pool real es materia de diseño económico y revisión legal.

## Contratos para sustituir servicios

- `AuthProvider`: alta, login verificado, sesión HTTP-only/CSRF, recuperación, verificación edad y jurisdicción.
- `WalletLedger`: saldo entero en unidades mínimas; cada transferencia es atómica e idempotente y genera asientos inmutables; dos billeteras diferenciadas por moneda y reglas de conversión.
- `PaymentProvider`: inicialización de pago y webhook verificado por firma; **nunca acreditar al recibir un callback desde el frontend**.
- `OddsProvider`: cuotas firmadas y versionadas con expiración, carreras publicadas, mercados y límites; cuotas bloqueadas al confirmar ticket.
- `BettingService`: colocar ticket en transacción de base de datos (control de saldo, cupo, cutoff y misma ID idempotente); no confiar en el reloj del cliente.
- `RaceResultProvider`: datos fuente auditables, publicación definitiva y resolución con estado; nunca aceptar un ganador entregado por el apostador.
- `SettlementService`: liquidación exactamente una vez e historial de conciliación, reversiones controladas y auditoría.
- `CommunityService`: perfil opt-in, logros otorgados en servidor, rankings con filtros de privacidad y clubes moderados.

El despliegue con dinero real exige revisión legal/regulatoria por jurisdicción, controles de juego responsable y auditoría de resultados, además de infraestructura segura. **No se alcanza ese objetivo simplemente conectando una pasarela de pagos.**

## Criterios de entrega y siguiente integración

- No modificar ni sobrescribir el motor 3D.
- Vincular navegación de /apuestas/ y /comunidad/ cuando se apruebe la fusión.
- Conectar un backend sandbox antes de abrir cuentas compartidas o rankings públicos; mantener siempre modo demo separado y claramente identificado.
- Ejecutar pruebas automatizadas y una prueba visual en servidor real antes de publicar.

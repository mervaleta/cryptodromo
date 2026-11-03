# Cryptódromo · MVP de dinero y apuestas simuladas

**Rama:** `feat/simulated-economy-mvp-20261102` · **No fusionado ni publicado**.
Ruta de prueba propuesta: `/demo-caja/`.
Objetivo: demostrar un flujo completo sin utilizar tarjetas, wallets externas, pasarelas, criptomonedas reales ni dinero real.

## Qué implementa

- Hasta seis **identidades ficticias locales**, con alias y selector. No es registro auténtico.
- Caja virtual en **centavos de USD demo**, saldo inicial de USD demo 100.
- Depósitos hardcodeados de **USD demo 5, 10, 25, 50 o 100**, por tarjeta ficticia, transferencia ficticia, BTC, ETH, USDT o SOL de demostración.\n- Cotizaciones de cripto **fijas, no de mercado**: BTC 70.000, ETH 3.500, USDT 1, SOL 150 USD demo por unidad. Sin red, QR ni dirección real.\n- Solicitud de depósito pendiente, confirmación simulada o cancelación; acreditación del saldo **solamente al confirmar**, con comprobante local e idempotencia por ID.
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
- `/features/simulated-economy/ledger.js`\n- `/features/simulated-economy/deposits.js` (interfaz de proveedor mock, extensible)

Estos caminos se verificaron en el repositorio Alpha18 del que partió la rama. Antes de fusionar, actualizar con `main` si los agentes siguen modificándolo.

## Pruebas

`cd features/simulated-economy && npm test` desde una copia del repositorio con Node compatible con módulos ES. Hay un `package.json` propio que declara `type: module`. Las suites cubren depósitos fiat y cripto, cancelaciones, doble confirmación, aislamiento de cuentas, ingresos, canjes, límites, tickets, cierre, victorias, derrotas e idempotencia. **Las pruebas están escritas; su ejecución automatizada aún no está verificada.**

Checklist manual: abrir `/demo-caja/`, crear jugador, elegir ingreso fiat, solicitar USD demo 5, confirmar acreditación, repetir con BTC o USDT ficticios, verificar el comprobante, convertir 5 a 500 CR, emitir ticket de 100 CR, verificar débito, esperar más de 60 segundos desde la largada de la carrera escogida, verificar resultado y que actualizar la página no repita el premio, convertir los créditos restantes a USD demo, cambiar de jugador y comprobar aislamiento local. Abrir en teléfono y comprobar menú y formularios.

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

## Interfaz para un proveedor futuro de ingreso fiat/crypto

La implementación conserva tres operaciones separadas: `quoteDeposit({channel,method,packageUsd})` cotiza; `createDepositIntent(state,request)` genera una solicitud pendiente; `resolveDepositIntent(state,id,decision)` simula el callback que confirma o cancela. Un proveedor real reemplazará estas operaciones **solo en servidor**, con firma del webhook, importe confirmado, tipo de moneda/red, caducidad, protección de replays, límites, control antifraude y conciliación. Nunca confiar en ID de pago, cantidad, estado ni tasa enviada desde navegador. Para cripto se deberá verificar red, confirmaciones y montos recibidos y gestionar pagos incompletos; para fiat, cancelaciones, reembolsos y contracargos.

Las tasas de pantalla son un **fixture didáctico, no cotizaciones fiables ni negociación financiera**. Los USD demo no tienen respaldo, no hay token en la cadena y las equivalencias no implican promesa de convertibilidad externa.

## Actualización de integración frente a Main del 3/11

- **Escuderías ya están integradas:** `/stables/`, `/championship/` y `/api/stables.php`. Manejan créditos de escudería en SQLite con identidad de invitado por sesión PHP y XP oficial. **No usar estos saldos como USD demo o créditos CR de apuestas**: son productos distintos. No agregar una segunda acreditación al servicio de escuderías ni mezclar sus ledgers sin contrato explícito.
- **Navegación universal:** `assets/crp-global-nav.js` y su CSS controlan el menú. Nuestra página aislada no debe sobrescribir esos archivos. Tras la fusión, enlazar `/demo-caja/` en el menú de la taquilla mediante el mecanismo compartido, no reescribir cada cabecera.
- **Fase III de clubes/temporadas:** PR deportivo en borrador, no tocar sus páginas ni editar `/clubes/`.
- **Cambio de rama:** `main` avanzó; revalidar antes de fusionar y ejecutar QA en preview.

## Retiros simulados y comisiones (añadidos)

`withdrawals.js` conserva una máquina de estados: `pending → approved → processing → completed`, con `rejected` o `cancelled` desde pending/approved, y `failed` desde processing. Al crear la solicitud se reserva el importe entero (incluye comisión). En completado se registran importe neto y comisión, sin alterar otra vez el saldo. En rechazo, cancelación o fallo se reintegra **una sola vez** el importe reservado.

Tarifas de prueba, editables en `WITHDRAWAL_METHODS`, con **porcentaje en puntos básicos + fijo, redondeando la parte variable hacia arriba**:

| Destino ficticio | Fijo USD demo | Variable | Mínimo USD demo |
|---|---:|---:|---:|
| Transferencia bancaria | 0,25 | 1,00% | 5 |
| USDT de demostración | 0,50 | 0,50% | 10 |
| BTC de demostración | 1,00 | 0,75% | 15 |

Estas comisiones **no representan tarifas reales** de proveedores ni permiten transferencias externas. Todas las operaciones se ejecutan en el navegador, por lo que no resisten manipulación del usuario, cambios de reloj ni concurrencia. Para el producto real, llevar solicitudes/estados al backend, bloquear fondos transaccionalmente, aplicar idempotencia por evento verificable y reconciliar con proveedor de payouts autorizado.

Pruebas nuevas en `withdrawals.test.mjs`. Ejecutar `cd features/simulated-economy && npm test` en un checkout de la rama. En este entorno no pude acceder al repositorio vía red desde el contenedor de ejecución, por lo que los tests siguen sin verificarse por ejecución local.

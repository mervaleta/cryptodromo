# Cryptódromo · Contrato de economía unificada (decisión de integración)
Estado: propuesta técnica vinculante para la revisión del PR #26. **NO fusionar el frontend local de la caja** hasta implementar este contrato. Punto de partida: `main` con escuderías (PR #38, sesiones invitadas /api/stables.php).

## Problema confirmado
- `api/stables.php` crea sesión `crp_stables_demo`, `stable_guest`, CSRF y propietario en `demo_owners`; guarda `credits=5000` y registra débitos de licencias y upgrades en `demo_wallet_ops` con SQLite, BEGIN IMMEDIATE e idempotencia.
- La rama #26 guarda seis jugadores, USD simulados, CR, depósitos, apuestas y retiros en `localStorage`. Son identidades/saldos falsamente separados y **no deben coexistir** como economías distintas.
- Las funciones puras de cotización, reglas y transición de retiro sí son aprovechables; los saldos locales y las mutaciones locales deben eliminarse de la app final.

## Decisión: una identidad + una billetera contable + módulos de dominio

1. **Identidad:** reutilizar sesión invitada existente como `owner_id`; `GET /api/demo/bootstrap` devuelve perfil, CSRF, saldos y permisos. No crear seis cuentas del cliente en producción. Para QA multiusuario utilizar navegadores/perfiles aislados o cuentas seed **del servidor**, no editar ownerId.
2. **Una caja del usuario:** compartida por compra de escuderías, apuestas y premios. Dos unidades contables **sin valor real**: `USD_DEMO_CENTS` para fondos cargados y retiro simulado; `CR` para licencias de escudería y tickets. `XP` nunca es moneda y no forma parte de la billetera. El balance `credits` actual no es una tercera divisa.
3. **Una única API transaccional:** `/api/demo/wallet.php` (o router consolidado) como autoridad de saldos. Deposits, withdrawals, conversiones, bets y compras de licencias llaman al mismo `WalletService`. Escuderías puede conservar sus endpoints y UI, pero su función `debit` delega al mismo servicio; no mantener dos caminos para restar créditos.
4. **Fiat/crypto como canales de ingreso, no como cuentas por activo:** en demo BTC/ETH/SOL/USDT se convierten por una cotización hardcodeada en `USD_DEMO_CENTS`. La tasa es un snapshot verificable asociado al depósito, no una posición real en cripto. La posterior conversión `USD_DEMO_CENTS ↔ CR` es un asiento distinto.
5. **Un registro de operaciones:** depósitos, reservas, cancelaciones, cambios, licencias, tickets, premios y retiros generan movimientos con referencia de negocio, actor, motivo y clave idempotente. Crédito y débito son apuntes correlacionados, no valores inventados en múltiples tablas.
6. **Retiros:** `pending → approved → processing → completed`, reversión por cancelación/rechazo/fallo. Reservar al solicitar. Idempotencia e integridad de saldo garantizadas por transacciones de SQLite en servidor, no por JavaScript.
7. **Apuestas:** orden asociada a `owner_id`, `absolute_race_instance` (fecha/semana absoluta, no solo índice 0–3359), `fixture_version`, símbolo, mercado, stake, cuota confirmada y límite horario autoritativo. Al cerrarse liquidar **una sola vez**, contra el resultado oficial; nunca aceptar estado/ganador/calendario desde cliente.
8. **UI compartida:** una cabecera universal, una pantalla **Mi cuenta**, una **Billetera** y un **Historial**. Las secciones Escudería, Apuestas y Comunidad son vistas y consumidores de la misma cuenta, no identidades independientes. Un único contador de CR reaparece consistente en toda la web.

## Migración sin duplicar saldos

1. Congelar incorporación del PR #26 como está.
2. Migración SQLite aditiva: crear `demo_wallet_accounts` y `demo_wallet_entries` (o extensión de `demo_owners` + `demo_wallet_ops`, pero elegir una sola fuente de verdad); claves únicas por `owner_id`, unidad monetaria y `operation_key`. Agregar tablas de deposit intents, withdrawal intents y tickets vinculadas al propietario existente.
3. **Semilla única:** conservar exactamente los `5000 CR` ya asignados a cada propietario de escuderías como su saldo inicial. Crear asiento de apertura que refleje saldo disponible actual, no acreditar 5000 nuevos. Asignar `USD_DEMO_CENTS=0` para usuarios existentes salvo operaciones documentadas. No importar balances modificables de `localStorage` como si fueran fondos confiables.
4. Marcar `demo_owners.credits` como columna legado/compatibilidad. Durante una transición, escribirla en **la misma transacción** que el ledger o exponerla como vista proyectada; luego eliminar la ruta de actualización directa. Verificar que `demo_wallet_ops` históricos se preserven sin repetir débitos.
5. Reemplazar `makeAccount`, `topUp`, `buyCredits`, `sellCredits`, `placeTicket`, `settleTickets` y `advanceWithdrawal` del cliente por solicitudes a API y refresco de estado. Conservar funciones puras de cotización visual sin autoridad contable.
6. Añadir enlaces al menú universal modificando **solo** `assets/crp-global-nav.js` cuando esté estable. El PR no debe tocar manualmente encabezados de cada página.
7. Migrar la UI de escuderías para mostrar saldo compartido y gastos sin perder XP, roster o resultados deportivos.

## Contrato API mínimo propuesto

| Recurso | Acción |
|---|---|
| `GET /api/demo/bootstrap` | identidad de sesión, saldos (available/reserved), CSRF, operaciones recientes |
| `POST /api/demo/deposits/quote` | paquete fiat o cripto a cotización fija, expiración y comisión |
| `POST /api/demo/deposits` | registrar intención pendiente; confirmación mock **solo por API demo** |
| `POST /api/demo/exchange` | cambiar USD_DEMO_CENTS/CR con idempotencyKey |
| `POST /api/demo/withdrawals` | reservar fondos, destino y tarifa |
| `POST /api/demo/withdrawals/{id}/action` | transición demo permitida por la sesión (en producción, acciones administrativas separadas) |
| `POST /api/demo/bets/quote` | cuota y cierre por reloj del servidor |
| `POST /api/demo/bets` | validar cuota, carrera, tiempo y saldo en transacción |
| `GET /api/demo/transactions` | historial paginado de depósitos, licencias, tickets, premios, cambios y retiros |

Todos los POST requieren CSRF, validación origen, saldo en enteros, `idempotencyKey` único y autoría derivada de sesión. **Nunca aceptar ownerId, saldo, comisión final ni resultado como autoridad desde navegador.**

## Contratos de consistencia que no se pueden romper

- Al crear escudería de 2 caballos: CR inicial 5000 → 4900 y un único movimiento de -100. El saldo en caja y escuderías coincide tras recargar.
- Depósito fiat USD demo 5: USD 0 → 500 centavos; CR queda 4900. No se acredita dos veces al confirmar repetidamente.
- Cambio de USD demo 5 a CR: USD 500 → 0; CR 4900 → 5400; ningún saldo desaparece sin contrapartida.
- Ticket CR 100: disponible CR 5400 → 5300, débito o reserva auditada; un resultado ganador paga una sola vez según cuota fijada.
- Retiro USD demo 5: disponible -500, reservado +500; al completar no se reintegra; al fallar se libera íntegro una sola vez.
- Si hay dos pestañas y operaciones simultáneas, ambas pasan por el mismo bloqueo/transacción.
- Repetición semanal del fixture no puede causar colisión de tickets ni liquidaciones. Identificar fecha absoluta y versión del fixture.
- XP de escudería y rangos de comunidad se actualizan por eventos verificables, sin conversiones directas a dinero.

## QA y despliegue

Antes de merge: ejecutar `node --test` de funciones puras; test integración `php -S` + PDO SQLite en directorio de prueba privado; pruebas de concurrencia, CSRF, doble-confirmación, migración 5000 CR, falla del servidor a mitad de transferencia y repetición semanal. Probar flujo transversal en **una misma sesión**: Escuderías → Caja → Cambio → Apuesta → Premio → Retiro → Historial, siempre con un único saldo. Verificar Hostinger PHP y SQLite, sin exponer DB por docroot.

**Política de producto:** ninguno de estos saldos representa dinero o tokens reales. Pagos reales requerirán proveedor autorizado, cumplimiento normativo, auditorías y arquitectura antifraude. Una pasarela conectada al frontend no transforma esta demo en operación monetaria segura.

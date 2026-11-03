# Cryptódromo · Caja y billetera únicas de demostración

## Estado
Rama preparada sobre `main` en SHA `b7b04dcc`. **No activar dinero real**. Ruta prevista: `/demo-caja/` (no desplegada mientras PR no esté fusionado).

## Integración real
La fuente de verdad del CR existente permanece en `demo_owners.credits`, para que `/api/stables.php` y `/api/demo-wallet.php` vean el mismo valor. Las compras de licencias llaman a `dw_stables_debit` en la transacción existente y preservan `demo_wallet_ops` para idempotencia heredada.

Las nuevas tablas `demo_cash`, `demo_money_ops`, `demo_money_entries`, `demo_money_intents` y `demo_bet_tickets` son **aditivas**. No se eliminan escuderías, posiciones, XP o sesiones. Una operación de apertura registra los créditos *existentes* en el journal, sin acreditar nuevos 5.000 CR ni importar saldos manipulables de localStorage. El registro previo de gastos de escuderías queda preservado en su tabla histórica.

- Identidad única: sesión `crp_stables_demo`, `stable_guest`, 30 días, cookie HttpOnly + SameSite Lax y CSRF.
- Saldo único CR: creación/ampliación de escuderías, tickets y premios.
- Caja USD demo: saldo disponible y reservado, sin valor real.
- Ingresos hardcodeados USD 5/10/25/50/100 mediante fiat ficticio o BTC/ETH/USDT/SOL con tasa fija ilustrativa.
- Cambio bidireccional USD_CENTS ↔ CR (1 centavo demo = 1 CR).
- Retiros simulados con comisión y reserva, estados pendiente/aprobado/proceso/finalizado o cancelado/rechazado/fallido. La reversión libera exactamente el total una sola vez.
- Tickets de hasta 10.000 CR, ganador (8×), dos primeros (4×), podio (2,5×), cerrados cinco segundos antes de largar. Se identifica **absolute_round**, no solo `day/slot`. El resultado sintético se toma de `stables/official-week-v1.json` (paridad previa con `officialRace`) después del segundo 60.
- Journal de todas las operaciones nuevas, incluídos los débitos de escuderías, en la **misma SQLite**. Operaciones bajo `BEGIN IMMEDIATE`, claves idempotentes, saldos enteros y sin rutas de edición directa de saldo.
- Navegación global: se agrega *Caja y apuestas · demo* al menú comunitario existente; no modificar otras cabeceras.

## Endpoint
`GET /api/demo-wallet.php?action=bootstrap` devuelve alias, saldos, CSRF, solicitudes, tickets, historial y ronda absoluta.

Todos los POST llevan `{csrf,key,...}` y usan sesión y transacción:
`deposit_create`, `deposit_confirm`, `deposit_cancel`, `exchange_buy`, `exchange_sell`, `withdraw_create`, `withdraw_action`, `bet_place`.
La cotización, la tarifa, la clasificación y el saldo se determinan **en el servidor**. Los botones de confirmación/cancelación de depósito y retiro sirven exclusivamente al sandbox. Nunca apuntar estos endpoints a proveedores reales.

## Pruebas
GitHub Actions: `.github/workflows/unified-demo-wallet.yml`. Requiere PHP con PDO SQLite y Node. Prueba `tests/unified-wallet-api.mjs`: misma cookie, debitar escudería, crear depósito, doble confirmación, canjear a CR, ticket, resultado y liquidación idempotente, retiro fallido con reversión, y coherencia de saldos entre endpoints. Conserva también la suite histórica de escuderías.

En entorno con checkout del repositorio:
```
php -l api/demo-wallet-core.php
php -l api/demo-wallet.php
php -l api/stables.php
node --test tests/unified-wallet-api.mjs
node --test tests/stables-api.mjs
```

## Advertencias y gates
1. Revisar y ejecutar los tests antes de fusionar; no se han verificado en navegador Hostinger.
2. Confirmar PHP 8.1+ con SQLite, ruta privada escribible **fuera de document root**, sesión en mismo origen y persistencia de cookies.
3. **No fusionar PR #26** como economía paralela: su `localStorage` es solo prototipo desechable. Este PR la reemplaza.
4. El fixture sintetizado de 7 días es **público y predecible**, por lo que no garantiza imprevisibilidad ni equidad comercial de apuestas. Las cuotas son ilustrativas y no están basadas en probabilidades auditadas.
5. No hay KYC, cuentas verificadas, proveedores financieros, pagos, blockchain real, límites legales ni monitoreo antifraude. Para producción monetaria se necesitará otra arquitectura, auditoría y revisión regulatoria; no alcanza con conectar una pasarela.
6. La liquidación se ejecuta oportunistamente en el `GET bootstrap` y procesa hasta 100 tickets pendientes por consulta. Para gran escala moverla a un trabajador del servidor y auditar colas.
7. Operaciones de un mismo propietario están serializadas por SQLite, pero el frontend no implementa reenvío persistente de idempotency key tras pérdida de red. Requisito antes de piloto externo.

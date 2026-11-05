# Cryptódromo · Sistema financiero en modo simulación

## Objetivo
Implementar el flujo operativo completo de una billetera con créditos CR y activos múltiples sin conexiones a dinero real. El código inicial `finance/sim-core.mjs` es un **motor determinista de dominio**, no un servicio de producción ni una base de datos persistente.

## Contrato de producto
- Monedas: CR, USD, EUR, ARS, USDT, USDC, DAI, BTC, ETH, SOL, BNB, XRP, ADA, DOGE, LTC, TRX, AVAX, DOT, LINK, XLM y BCH.
- Cada usuario tiene cuentas separadas por activo, disponibles, reservadas y pendientes.
- La tesorería registra por separado spread, comisión explícita, liquidez, costos de red, reversos y resultado neto.
- La cotización expira, congela tasa, política y estimación de costo. Nunca se recalcula silenciosamente después de aceptada.
- Los retiros simulan: destino, red, confirmación, screening, reserva, cola, ejecución, hash ficticio, confirmaciones, fallo y reembolso.
- Los depósitos simulan: solicitud, dirección o cuenta ficticia, detección, confirmaciones, acreditación y reversión.
- Toda transición debe ser idempotente y auditable; ninguna UI escribe balances directamente.

## Secuencia de desarrollo necesaria antes de publicar
1. Integrar con las identidades de PR #118 y el ledger de pronósticos de PR #119 sin duplicar usuarios ni saldos.
2. Persistir en MariaDB: `wallet_accounts`, `ledger_transactions`, `ledger_entries`, `conversion_quotes`, `conversion_orders`, `withdrawal_requests`, `deposit_requests`, `treasury_positions`, `fee_policies`, `sim_provider_events`, `audit_events`. Atomicidad transaccional y restricciones de unicidad para idempotencia.
3. Crear adaptador `SimulatedSettlementProvider` con estados y latencias configurables, jamás una clave real. Inyectar proveedor a servicios, no a controladores.
4. API autenticada con validación CSRF, límites de monto, límites por usuario, bloqueo por insuficiencia, prevención de doble ejecución, historial y exportación.
5. Interfaz: cartera, convertir, depositar, retirar, historial, comprobantes y consola de tesorería con control de acceso.
6. Pruebas: 100+ usuarios concurrentes, doble clic, caída entre reserva y confirmación, tasa vencida, fallos de red simulados, cancelaciones, reversos, sumas por moneda y reconciliación de tesorería.

## Reglas contables
Los apuntes de cada operación deben sumar cero **por moneda**. El spread y la comisión son ingresos brutos de plataforma, no ganancia neta. Los gastos operativos y el costo real de liquidez deben descontarse para obtener margen neto. El motor usa enteros por unidad mínima, nunca floats para dinero. Las cuentas de compensación pueden ser negativas; las de usuarios no.

## Precauciones del prototipo actual
El motor JS no ofrece persistencia, aislamiento entre procesos, autorización ni bloqueo transaccional. Los precios del ejemplo son exclusivamente ficticios. No publicar como billetera operativa hasta completar la integración. Si en el futuro se habilitan activos rescatables, evaluar normativa aplicable, KYC/AML, custodia, controles de retiro y términos con asesoría especializada.

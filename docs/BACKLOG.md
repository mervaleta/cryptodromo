# Backlog Oficial: Casino de Entropía Bursátil

## Taxonomía de Salones y Juegos Principales

### 1. Crypto Rocket Crash (Salón 1 - Crypto Rush)
- **Concepto:** Juego de multiplicador exponencial estilo Crash donde el cohete despega y crashea según una función de entropía determinista alimentada por velas de 1 segundo de BTC y ETH.
- **Fuentes de datos:**
  - WebSocket Binance: `wss://stream.binance.com:9443/ws/btcusdt@kline_1s`
  - WebSocket Binance: `wss://stream.binance.com:9443/ws/ethusdt@kline_1s`
- **Provably Fair:**
  - `Crash_Hash = SHA256(BTC_close_1s | ETH_close_1s | Timestamp_ms | Server_Salt)`
- **Criterios de Aceptación:**
  - El usuario puede apostar antes del despegue.
  - El multiplicador sube suavemente en UI vía interpolación local mientras escucha el crash point calculado.
  - Cash-out en tiempo real antes de que se dispare el evento crash.

---

### 2. Wall Street Slot Machine (Salón 2 - Wall Street Floor)
- **Concepto:** Tragamonedas de 3 carretes basada en activos financieros globales y locales ($NVDA, $BTC, $YPF).
- **Mecánica:**
  - Los carretes giran y se detienen en símbolos representativos de activos.
  - La tabla de pagos recompensa combinaciones clásicas (3 iguales), pero añade un **Multiplicador de Rueda Bursátil**: si los activos del carrete tienen variación diaria positiva en tiempo real, el pago se multiplica.
  - Jackpot "SuperBull": 3 símbolos verdes en simultáneo durante rally de mercado.
- **Fuentes de datos:**
  - $BTC: Binance Spot REST / WS.
  - $NVDA: Yahoo Finance 1m chart.
  - $YPF: Yahoo Finance / BYMA proxy.
- **Criterios de Aceptación:**
  - Giros reproducibles con semilla de auditoría.
  - Verificación matemática de pagos y balance en ledger SQLite.

---

### 3. CryptoMochi Arcade (Ecosistema B2C)
- **Concepto:** Mascotas virtuales ("Mochis") asociadas a un activo financiero que compiten en carreras y batallas 1v1.
- **Mapeo de Estadísticas:**
  - **Mochi-BTC (GigaBull):** Potencia base alta, aceleración atada a la variación de BTC en 1m.
  - **Mochi-NVDA (SiliconBeast):** Velocidad punta dependiente del volumen relativo de NVDA.
  - **Mochi-ETH (EtherGhost):** Evasión y resistencia dependiente del gas o ratio ETH/BTC.
- **Criterios de Aceptación:**
  - Generador de fichas de estadísticas en tiempo real por ticker.
  - Simulación de carrera determinista sin fórmulas cerradas expuestas en cliente.

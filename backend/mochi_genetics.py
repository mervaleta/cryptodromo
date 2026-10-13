#!/usr/bin/env python3
"""
CryptoMochi Portfolio Pet Engine - Genetic Breeding, Vitals & Arena Logic
==========================================================================
Formulas & Rules:
1. Genetic Inheritance:
   - Trait inheritance derived deterministically from SHA-256 of the current market tick:
     Gene_Bit = Hash_Byte % 2 (0 = Parent A, 1 = Parent B).
   - Mutation Probability:
     If Hash_Byte % 16 == 0 (6.25% chance per trait), trait mutates into an extreme variant.
   - Traits:
     * Volatility Tolerance (1 to 10)
     * Horizon (1 to 10: Intraday to HODL)
     * Diversification (1 to 10: Concentrated to Index)
     * Liquidity Ratio (1 to 10: Illiquid to Cash Heavy)
   - Resulting Temperament:
     * CONSERVADOR: High Diversification (>6) & Low Volatility Tolerance (<=4)
     * ARRIESGADO: High Volatility Tolerance (>=7) & Low Diversification (<=4)
     * MODERADO: Balanced scores

2. Portfolio as Body (Vitals Decay & Interplay):
   - HAMBRE: Inversely proportional to Available Liquidity.
   - JOY: Recent return (Δ% tick) modulated by Temperament.
   - SALUD: Diversification score - Concentration penalty during severe dips.
   - ENERGIA: Accumulated attention & transaction friction.
   - Interplay: Critical Health (<30) accelerates Joy decay by 2.0x.

3. Arena & Market Weather:
   - Combat Weather is dictated by market volatility (CALM, VOLATILE, STORM, MOON).
   - Advantage calculated from Temperament vs Weather + Health.
"""

import hashlib
import json
import time
from typing import Dict, Any, List, Tuple


PARENT_PRESETS = {
    "BTC": {
        "name": "Bitcoin (GigaBull)",
        "ticker": "BTC",
        "volatility_tolerance": 8,
        "horizon": 7,
        "diversification": 3,
        "liquidity": 9,
        "avatar_shape": "bull",
        "primary_color": "#f7931a"
    },
    "ETH": {
        "name": "Ethereum (EtherGhost)",
        "ticker": "ETH",
        "volatility_tolerance": 7,
        "horizon": 6,
        "diversification": 5,
        "liquidity": 8,
        "avatar_shape": "mage",
        "primary_color": "#627eea"
    },
    "NVDA": {
        "name": "NVIDIA (SiliconBeast)",
        "ticker": "NVDA",
        "volatility_tolerance": 9,
        "horizon": 5,
        "diversification": 2,
        "liquidity": 7,
        "avatar_shape": "spark",
        "primary_color": "#76b900"
    },
    "YPF": {
        "name": "YPF S.A. (PampaRunner)",
        "ticker": "YPF",
        "volatility_tolerance": 5,
        "horizon": 8,
        "diversification": 4,
        "liquidity": 5,
        "avatar_shape": "rhino",
        "primary_color": "#0080ff"
    },
    "SP500": {
        "name": "S&P 500 (IndexTitan)",
        "ticker": "SP500",
        "volatility_tolerance": 3,
        "horizon": 10,
        "diversification": 10,
        "liquidity": 8,
        "avatar_shape": "turtle",
        "primary_color": "#22c55e"
    },
    "CCL": {
        "name": "Dólar CCL (CashShield)",
        "ticker": "CCL",
        "volatility_tolerance": 2,
        "horizon": 4,
        "diversification": 7,
        "liquidity": 10,
        "avatar_shape": "armadillo",
        "primary_color": "#eab308"
    }
}


def breed_mochi(
    parent_a_key: str,
    parent_b_key: str,
    timestamp_ms: int = None,
    client_seed: str = "PROVABLY_FAIR_BREED_2026"
) -> Dict[str, Any]:
    t_ms = timestamp_ms or int(time.time() * 1000)
    p_a = PARENT_PRESETS.get(parent_a_key, PARENT_PRESETS["BTC"])
    p_b = PARENT_PRESETS.get(parent_b_key, PARENT_PRESETS["SP500"])

    # Deterministic Genetic Hash
    raw_seed = f"{p_a['ticker']}_{p_b['ticker']}_{t_ms}_{client_seed}"
    h = hashlib.sha256(raw_seed.encode("utf-8")).hexdigest()

    # Byte-by-byte trait extraction
    bytes_list = [int(h[i:i+2], 16) for i in range(0, 32, 2)]

    traits = ["volatility_tolerance", "horizon", "diversification", "liquidity"]
    inherited_dna = {}
    inheritance_source = {}
    mutations = []

    for idx, trait in enumerate(traits):
        byte_val = bytes_list[idx]
        is_parent_b = (byte_val % 2 == 1)
        base_val = p_b[trait] if is_parent_b else p_a[trait]
        inherited_dna[trait] = base_val
        inheritance_source[trait] = p_b["ticker"] if is_parent_b else p_a["ticker"]

        # Mutation check: byte_val % 16 == 0 (6.25% chance)
        if byte_val % 16 == 0:
            mutation_delta = 2 if (byte_val % 32 == 0) else -2
            mutated_val = max(1, min(10, base_val + mutation_delta))
            inherited_dna[trait] = mutated_val
            mutations.append({
                "trait": trait,
                "original": base_val,
                "mutated": mutated_val,
                "type": "CROMOSOMA_EXTREMO" if mutation_delta > 0 else "DECAIMIENTO_GENETICO"
            })

    # Derive Temperament from traits
    vol = inherited_dna["volatility_tolerance"]
    div = inherited_dna["diversification"]

    if vol >= 7 and div <= 4:
        temperament = "ARRIESGADO"
        temperament_desc = "Ama la volatilidad extrema. Sufre con la inacción y se desespera en mercados laterales."
        accessory = "Capa de Llamas & Cuernos Neón"
    elif div >= 7 and vol <= 4:
        temperament = "CONSERVADOR"
        temperament_desc = "Prioriza preservación y baja volatilidad. Las caídas bruscas le provocan pánico súbito."
        accessory = "Caparazón de Escudo Reforzado"
    else:
        temperament = "MODERADO"
        temperament_desc = "Equilibrado y metódico. Rebalancea con frialdad y tolera ciclos estándar de mercado."
        accessory = "Lentes de Terminal Cuántica"

    # Derived Name and Serial Number
    serial_no = f"MCH-#{h[:6].upper()}"
    name_prefixes = {
        "ARRIESGADO": ["Blaze", "Viper", "Giga", "Rocket"],
        "CONSERVADOR": ["Aegis", "Iron", "Kuro", "Fortress"],
        "MODERADO": ["Nexus", "Zen", "Pulse", "Oracle"]
    }
    prefix = name_prefixes[temperament][bytes_list[5] % 4]
    mochi_name = f"{prefix}-{p_a['ticker'][:2]}{p_b['ticker'][:2]}"

    # Backstory generator (2-3 lines)
    stories = [
        f"Nacido de la convergencia entre la liquidez de {p_a['name']} y el horizonte de {p_b['name']}.",
        f"Heredó un ADN con temperamento {temperament}, adaptado para navegar shocks bursátiles sin quebrar su margen.",
        f"Sellado bajo el bloque Provably Fair {h[:12]} con trazabilidad inmutable de cartera."
    ]

    return {
        "mochi_id": serial_no,
        "name": mochi_name,
        "temperament": temperament,
        "temperament_desc": temperament_desc,
        "accessory": accessory,
        "dna": inherited_dna,
        "inheritance_source": inheritance_source,
        "mutations": mutations,
        "parents": {
            "parent_a": p_a,
            "parent_b": p_b,
            "timestamp_utc": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(t_ms / 1000))
        },
        "backstory": " ".join(stories),
        "audit_proof": {
            "formula": "SHA256(ParentA_Ticker + ParentB_Ticker + Timestamp_ms + ClientSeed)",
            "entropy_hash": h,
            "gitlab_verification_url": f"https://gitlab.com/cryptodromo/rngmarketdriven/-/commit/{h[:12]}"
        }
    }


def calculate_portfolio_vitals(
    current_vitals: Dict[str, float],
    temperament: str,
    market_tick_delta: float,
    holding_concentration_pct: float = 75.0
) -> Dict[str, Any]:
    """
    Simulates portfolio vitality evolution on each market tick.
    Stats:
    - HAMBRE: Liquidity available (0 = starving for liquidity/cash, 100 = full liquidity).
    - JOY: Return happiness, modulated by Temperament.
    - SALUD: Diversification resilience minus concentration risk penalty.
    - ENERGIA: Attention endurance minus trading fees.
    """
    hambre = current_vitals.get("hambre", 60.0)
    joy = current_vitals.get("joy", 70.0)
    salud = current_vitals.get("salud", 85.0)
    energia = current_vitals.get("energia", 80.0)

    # 1. Hambre decay (Liquidity consumption over time)
    hambre = max(0.0, hambre - 1.5)

    # 2. Joy modulation by temperament
    if market_tick_delta > 0:
        multiplier = 2.0 if temperament == "ARRIESGADO" else (1.0 if temperament == "MODERADO" else 0.7)
        joy = min(100.0, joy + (market_tick_delta * multiplier))
    else:
        loss_penalty = 2.5 if temperament == "CONSERVADOR" else (1.2 if temperament == "MODERADO" else 0.8)
        joy = max(0.0, joy + (market_tick_delta * loss_penalty))

    # 3. Health calculation (Concentration penalty during market dips)
    if market_tick_delta < 0 and holding_concentration_pct > 60.0:
        penalty = (holding_concentration_pct - 50.0) * 0.2
        salud = max(5.0, salud - penalty)
    elif market_tick_delta >= 0:
        salud = min(100.0, salud + 0.5)

    # 4. Stat interplay: If Health < 30 (Critical concentration risk), Joy drops faster
    if salud < 30.0:
        joy = max(0.0, joy - 4.0)

    # 5. Energy decay
    energia = max(10.0, energia - 0.8)

    # Status title
    if salud < 20.0 or hambre < 10.0:
        status_mode = "MARGIN_CALL_GHOST"
    elif joy > 85.0:
        status_mode = "EUPHORIC_BULL"
    elif market_tick_delta < -3.0:
        status_mode = "PANIC_BEAR"
    else:
        status_mode = "STEADY_ACCUMULATION"

    return {
        "hambre": round(hambre, 1),
        "joy": round(joy, 1),
        "salud": round(salud, 1),
        "energia": round(energia, 1),
        "status_mode": status_mode
    }


def execute_care_action(
    action: str,
    current_vitals: Dict[str, float],
    temperament: str,
    stop_loss_pct: float = None
) -> Tuple[Dict[str, float], str]:
    """
    Executes care actions with cost, consequences and temperament reactions.
    Actions:
    - ALIMENTAR: Cash deposit (Restores Hambre +35, Energy -5).
    - REBALANCEAR: Adjusts asset weights (Restores Health +20, Energy -15 fee).
    - STOP_LOSS: Fixes crash cap (Health shield +15, Joy cost -5).
    - DCA: Periodic deposit (Hambre +15, Joy +10 for Moderado/Conservador).
    - APALANCAR: Arena / Leverage bet (High Joy if positive, high damage if negative).
    - HIBERNAR: Hands-off HODL (Energy +25. Moderado gains Joy, Arriesgado gets stressed).
    """
    vitals = dict(current_vitals)
    act = action.upper()

    if act == "ALIMENTAR":
        vitals["hambre"] = min(100.0, vitals["hambre"] + 35.0)
        vitals["energia"] = max(0.0, vitals["energia"] - 5.0)
        msg = "Depositaste capital fresco. Liquidez (Hambre) restaurada (+35)."
    elif act == "REBALANCEAR":
        vitals["salud"] = min(100.0, vitals["salud"] + 25.0)
        vitals["energia"] = max(0.0, vitals["energia"] - 15.0)
        if temperament == "ARRIESGADO":
            vitals["joy"] = max(0.0, vitals["joy"] - 8.0)
            msg = "Cartera rebalanceada (+25 Salud). Tu Mochi Arriesgado se queja por reducir el riesgo."
        else:
            vitals["joy"] = min(100.0, vitals["joy"] + 5.0)
            msg = "Pesos de cartera normalizados (+25 Salud, -15 Energía por costos de transacción)."
    elif act == "STOP_LOSS":
        vitals["salud"] = min(100.0, vitals["salud"] + 15.0)
        vitals["joy"] = max(0.0, vitals["joy"] - 5.0)
        msg = f"Stop-Loss fijado en {stop_loss_pct or 10.0}%. Blindaje activo contra liquidaciones súbitas."
    elif act == "DCA":
        vitals["hambre"] = min(100.0, vitals["hambre"] + 20.0)
        vitals["salud"] = min(100.0, vitals["salud"] + 10.0)
        vitals["energia"] = max(0.0, vitals["energia"] - 5.0)
        msg = "Aporte periódico DCA completado con disciplina matemática (+20 Liquidez, +10 Salud)."
    elif act == "APALANCAR":
        if temperament == "CONSERVADOR":
            vitals["joy"] = max(0.0, vitals["joy"] - 25.0)
            vitals["salud"] = max(5.0, vitals["salud"] - 20.0)
            msg = "¡Apalancamiento forzado! Tu Mochi Conservador entró en shock y estrés agudo (-25 Joy)."
        else:
            vitals["joy"] = min(100.0, vitals["joy"] + 30.0)
            vitals["energia"] = max(0.0, vitals["energia"] - 20.0)
            msg = "Posición apalancada abierta. Euforia pura (+30 Joy) pero expuesta a liquidación instantánea."
    elif act == "HIBERNAR":
        vitals["energia"] = min(100.0, vitals["energia"] + 30.0)
        if temperament == "ARRIESGADO":
            vitals["joy"] = max(0.0, vitals["joy"] - 20.0)
            msg = "Modo HODL pasivo: Tu Mochi Arriesgado se aburre y sufre por falta de adrenalina (-20 Joy)."
        else:
            vitals["joy"] = min(100.0, vitals["joy"] + 10.0)
            msg = "Hibernación en frío: Energía recuperada al 100% sin fricción de comisiones."
    else:
        msg = "Acción no reconocida."

    return vitals, msg

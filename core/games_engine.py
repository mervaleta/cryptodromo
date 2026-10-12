#!/usr/bin/env python3
"""
Games Engine - Core logic for:
1. Crypto Rocket Crash (Crash Multiplier)
2. Wall Street Slot Machine (Slots based on $BTC, $NVDA, $YPF)
3. CryptoMochi Arcade (Virtual Pet Races based on market metrics)
Uses MockMarketDay for deterministic local offline MVP simulation.
"""

import hashlib
import random
from typing import Dict, Any, List
from core.mock_market_data import MockMarketDay


class CryptoMochiPet:
    def __init__(self, name: str, ticker: str = "BTC"):
        self.name = name
        self.ticker = ticker.upper()
        self.level = 1
        self.energy = 80
        self.hunger = 20
        self.happiness = 75
        self.mood = "Neutral"

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "ticker": self.ticker,
            "level": self.level,
            "energy": self.energy,
            "hunger": self.hunger,
            "happiness": self.happiness,
            "mood": self.mood
        }


class GamesEngine:
    def __init__(self, data_file: str = "data/mock_market_day.json"):
        self.mock_data = MockMarketDay(data_file).load_dataset()
        self.snapshots = self.mock_data.get("hourly_snapshots", [])

    def _get_snapshot(self, hour: int) -> Dict[str, Any]:
        idx = hour % len(self.snapshots)
        return self.snapshots[idx]

    def play_rocket_crash(self, hour: int = 0, cashout_target: float = 2.0, wager_amount: float = 10.0) -> Dict[str, Any]:
        snap = self._get_snapshot(hour)
        # Seed derived from BTC close and ETH 1h delta
        seed_str = f"{snap['btc']['close']}_{snap['eth']['pct_change_1h']}_{snap['timestamp_ms']}"
        h = hashlib.sha256(seed_str.encode("utf-8")).hexdigest()
        seed_int = int(h[:8], 16)

        # Scale multiplier: 1.05x to 15.00x based on mock market volatility
        mod = seed_int % 1000
        crash_point = round(1.05 + (mod / 85.0), 2)

        won = cashout_target <= crash_point
        payout = round(wager_amount * cashout_target, 2) if won else 0.0

        return {
            "game": "Crypto Rocket Crash",
            "hour": snap["hour"],
            "seed_hash": h,
            "btc_price": snap["btc"]["close"],
            "crash_multiplier": crash_point,
            "cashout_target": cashout_target,
            "wager_amount": wager_amount,
            "payout": payout,
            "status": "CASHED_OUT" if won else "CRASHED"
        }

    def spin_wall_street_slots(self, hour: int = 0, wager_amount: float = 10.0) -> Dict[str, Any]:
        snap = self._get_snapshot(hour)
        symbols = ["$BTC", "$NVDA", "$YPF", "$ETH", "$BULL", "$BEAR"]

        # Deterministic pseudo-randomness based on hour & market deltas
        seed_str = f"SLOTS_{snap['hour']}_{snap['ypf']['delta_pct']}_{snap['nvda']['price']}"
        h = hashlib.sha256(seed_str.encode("utf-8")).hexdigest()
        
        idx1 = int(h[0:4], 16) % len(symbols)
        idx2 = int(h[4:8], 16) % len(symbols)
        idx3 = int(h[8:12], 16) % len(symbols)
        reels = [symbols[idx1], symbols[idx2], symbols[idx3]]

        # Paytable
        is_win = False
        multiplier = 0.0
        if reels[0] == reels[1] == reels[2]:
            is_win = True
            multiplier = 10.0 if reels[0] == "$BULL" else 5.0
        elif reels[0] == reels[1] or reels[1] == reels[2] or reels[0] == reels[2]:
            is_win = True
            multiplier = 1.5

        # Market bonus if YPF delta was positive
        if is_win and snap["ypf"]["delta_pct"] > 0:
            multiplier = round(multiplier * 1.25, 2)

        payout = round(wager_amount * multiplier, 2)

        return {
            "game": "Wall Street Slot Machine",
            "hour": snap["hour"],
            "reels": reels,
            "is_win": is_win,
            "multiplier": multiplier,
            "wager_amount": wager_amount,
            "payout": payout,
            "market_bonus_applied": snap["ypf"]["delta_pct"] > 0
        }

    def simulate_mochi_race(self, hour: int = 0) -> Dict[str, Any]:
        snap = self._get_snapshot(hour)

        # 3 Mochis mapped to tickers
        mochis = [
            {"name": "GigaBull", "ticker": "$BTC", "speed": round(50 + (snap["btc"]["close"] % 50), 1)},
            {"name": "SiliconBeast", "ticker": "$NVDA", "speed": round(45 + (snap["nvda"]["price"] % 50), 1)},
            {"name": "PampaRunner", "ticker": "$YPF", "speed": round(40 + (abs(snap["ypf"]["delta_pct"]) * 8), 1)}
        ]

        # Calculate race time over 100m track (time = dist / speed * factor)
        times = {}
        for m in mochis:
            race_time = round(100.0 / (m["speed"] / 3.6), 2)
            times[m["name"]] = race_time

        winner = min(times, key=times.get)

        return {
            "game": "CryptoMochi Arcade",
            "hour": snap["hour"],
            "participants": mochis,
            "final_times": times,
            "winner": winner
        }

    def create_cryptomochi(self, name: str, ticker: str = "BTC") -> CryptoMochiPet:
        pet = CryptoMochiPet(name=name, ticker=ticker)
        self.update_mochi_state(name=name, ticker=ticker, hour=0, pet=pet)
        return pet

    def get_ticker_behavior_profile(self, ticker: str) -> Dict[str, Any]:
        t = ticker.upper()
        profiles = {
            "BTC": {
                "ticker": "BTC",
                "dominant_trait": "Volatilidad Cuántica",
                "description": "Humor hiperreactivo a velas de 1m. Pasa de la euforia al pánico súbito.",
                "affected_attributes": ["Humor", "Apetito por Riesgo", "Hiperactividad"]
            },
            "NVDA": {
                "ticker": "NVDA",
                "dominant_trait": "Aceleración Neuronal",
                "description": "Energía infinita atada al volumen de GPUs. Rápido, insomne e hiper productivo.",
                "affected_attributes": ["Velocidad de Procesamiento", "Energía", "Resistencia"]
            },
            "ETH": {
                "ticker": "ETH",
                "dominant_trait": "Complejidad Lógica",
                "description": "Regulado por gas y consensos. Desarrolla magia algorítmica y astucia.",
                "affected_attributes": ["Inteligencia", "Concentración", "Vitalidad Espiritual"]
            },
            "YPF": {
                "ticker": "YPF",
                "dominant_trait": "Resiliencia de Recursos",
                "description": "Fuerza telúrica basada en hidrocarburos. Fuerte, pesado, resistente al oso.",
                "affected_attributes": ["Fuerza Bruta", "Apego Territorial", "Estabilidad Emocional"]
            }
        }
        return profiles.get(t, {
            "ticker": t,
            "dominant_trait": "Comportamiento Estándar",
            "description": "Mascota equilibrada sin sesgo de activo extremo.",
            "affected_attributes": ["Equilibrio"]
        })

    def update_mochi_state(self, name: str, ticker: str, hour: int = 0, pet: CryptoMochiPet = None) -> Dict[str, Any]:
        if pet is None:
            pet = CryptoMochiPet(name=name, ticker=ticker)

        snap = self._get_snapshot(hour)
        t = ticker.upper()

        if t == "BTC":
            delta = (snap["btc"]["close"] - snap["btc"]["open"]) / snap["btc"]["open"]
            if delta > 0.01:
                pet.mood = "Eufórico"
                pet.happiness = min(100, pet.happiness + 15)
                pet.energy = min(100, pet.energy + 10)
            elif delta < -0.01:
                pet.mood = "Pánico"
                pet.happiness = max(10, pet.happiness - 20)
                pet.hunger = min(100, pet.hunger + 15)
            else:
                pet.mood = "Neutral"
        elif t == "NVDA":
            vol = snap["nvda"]["volume_1m_sample"]
            if vol > 50000000:
                pet.mood = "Eufórico"
                pet.energy = 95
            else:
                pet.mood = "Alcista"
                pet.energy = 80
        elif t == "ETH":
            pct = snap["eth"]["pct_change_1h"]
            if pct > 1.0:
                pet.mood = "Alcista"
                pet.happiness = min(100, pet.happiness + 10)
            elif pct < -1.0:
                pet.mood = "Bajista"
                pet.happiness = max(15, pet.happiness - 10)
            else:
                pet.mood = "Neutral"
        elif t == "YPF":
            d_pct = snap["ypf"]["delta_pct"]
            if d_pct > 2.0:
                pet.mood = "Alcista"
                pet.energy = 85
            elif d_pct < -2.0:
                pet.mood = "Bajista"
                pet.energy = 50
            else:
                pet.mood = "Neutral"

        return pet.get_status()


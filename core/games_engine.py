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

    def get_daily_market_matrix(self) -> Dict[str, Any]:
        """Provides the full 24h market variation matrix of all participants for all games."""
        tickers = self.mock_data.get("meta", {}).get("tickers", ["BTC", "ETH", "NVDA", "YPF", "AAPL", "TSLA"])
        series = []
        for snap in self.snapshots:
            hour_entry = {
                "hour": snap["hour"],
                "timestamp_ms": snap["timestamp_ms"],
                "variations": {
                    "BTC": snap.get("btc", {}).get("delta_pct", 0.0),
                    "ETH": snap.get("eth", {}).get("delta_pct", snap.get("eth", {}).get("pct_change_1h", 0.0)),
                    "NVDA": snap.get("nvda", {}).get("delta_pct", 0.0),
                    "YPF": snap.get("ypf", {}).get("delta_pct", 0.0),
                    "AAPL": snap.get("aapl", {}).get("delta_pct", 0.0),
                    "TSLA": snap.get("tsla", {}).get("delta_pct", 0.0)
                },
                "prices": {
                    "BTC": snap.get("btc", {}).get("close", 0.0),
                    "ETH": snap.get("eth", {}).get("close", 0.0),
                    "NVDA": snap.get("nvda", {}).get("price", 0.0),
                    "YPF": snap.get("ypf", {}).get("price", 0.0),
                    "AAPL": snap.get("aapl", {}).get("price", 0.0),
                    "TSLA": snap.get("tsla", {}).get("price", 0.0)
                }
            }
            series.append(hour_entry)
        return {
            "tickers": tickers,
            "total_hours": len(series),
            "hourly_series": series
        }

    def spin_wall_street_slots_5reels(self, hour: int = 0, bet_per_line: float = 1.0, lines: int = 5) -> Dict[str, Any]:
        """5-Reel Wall Street Slot Machine with animated paylines, custom wagering, and market multipliers."""
        snap = self._get_snapshot(hour)
        symbols = ["$BTC", "$NVDA", "$YPF", "$ETH", "$AAPL", "$TSLA", "$BULL", "$BEAR"]
        lines = max(1, min(lines, 5))
        total_bet = round(bet_per_line * lines, 2)

        # Seed from full market snapshot of the hour
        seed_str = f"5REELS_{snap['hour']}_{snap.get('btc',{}).get('close')}_{snap.get('nvda',{}).get('price')}_{snap.get('ypf',{}).get('delta_pct')}_{snap.get('aapl',{}).get('price')}_{snap.get('tsla',{}).get('price')}"
        h = hashlib.sha256(seed_str.encode("utf-8")).hexdigest()

        # 5 reels x 3 rows grid
        grid = []
        for col in range(5):
            col_symbols = []
            for row in range(3):
                offset = (col * 3 + row) * 2
                idx = int(h[offset:offset+2], 16) % len(symbols)
                col_symbols.append(symbols[idx])
            grid.append(col_symbols)

        # Central payline (reel symbols at row 1)
        reels_center = [grid[c][1] for c in range(5)]

        # Count symbol frequencies in center line
        counts = {}
        for s in reels_center:
            counts[s] = counts.get(s, 0) + 1

        max_match_symbol = max(counts, key=counts.get)
        max_matches = counts[max_match_symbol]

        multiplier = 0.0
        winning_lines = []
        if max_matches == 5:
            multiplier = 100.0 if max_match_symbol == "$BULL" else 50.0
            winning_lines.append(f"5x {max_match_symbol} JACKPOT SUPREMO")
        elif max_matches == 4:
            multiplier = 20.0
            winning_lines.append(f"4x {max_match_symbol} MEGA COMBO")
        elif max_matches == 3:
            multiplier = 4.0
            winning_lines.append(f"3x {max_match_symbol} LINEA GANADORA")
        elif max_matches == 2:
            multiplier = 1.2
            winning_lines.append(f"2x {max_match_symbol} MINI PAR")

        # Market volatility bonus: if market was strongly bull, boost multiplier
        avg_delta = (snap.get('btc',{}).get('delta_pct',0) + snap.get('nvda',{}).get('delta_pct',0) + snap.get('ypf',{}).get('delta_pct',0)) / 3.0
        if multiplier > 0 and avg_delta > 0:
            multiplier = round(multiplier * (1.0 + (avg_delta / 10.0)), 2)

        payout = round(bet_per_line * multiplier * lines, 2)

        return {
            "game": "Wall Street Slots 5-Reels",
            "hour": snap["hour"],
            "seed_hash": h,
            "reels": reels_center,
            "full_grid": grid,
            "lines": lines,
            "bet_per_line": bet_per_line,
            "total_bet": total_bet,
            "is_win": multiplier > 0,
            "symbol_matches": max_matches,
            "dominant_symbol": max_match_symbol,
            "multiplier": multiplier,
            "payout": payout,
            "winning_lines": winning_lines,
            "market_avg_delta": round(avg_delta, 2)
        }

    def create_custom_mapped_mochi(self, name: str, mapping: Dict[str, str], hour: int = 0) -> Dict[str, Any]:
        """Allows custom assignment of attributes to different market tickers with real hourly deltas."""
        snap = self._get_snapshot(hour)
        price_dict = {
            "BTC": {"delta": snap.get("btc", {}).get("delta_pct", 0.0), "val": snap.get("btc", {}).get("close", 0.0)},
            "ETH": {"delta": snap.get("eth", {}).get("delta_pct", 0.0), "val": snap.get("eth", {}).get("close", 0.0)},
            "NVDA": {"delta": snap.get("nvda", {}).get("delta_pct", 0.0), "val": snap.get("nvda", {}).get("price", 0.0)},
            "YPF": {"delta": snap.get("ypf", {}).get("delta_pct", 0.0), "val": snap.get("ypf", {}).get("price", 0.0)},
            "AAPL": {"delta": snap.get("aapl", {}).get("delta_pct", 0.0), "val": snap.get("aapl", {}).get("price", 0.0)},
            "TSLA": {"delta": snap.get("tsla", {}).get("delta_pct", 0.0), "val": snap.get("tsla", {}).get("price", 0.0)}
        }

        attributes = {}
        for attr, ticker in mapping.items():
            t = ticker.upper()
            t_data = price_dict.get(t, {"delta": 0.0, "val": 100.0})
            delta = t_data["delta"]
            
            # Compute dynamic stat (0-100) based on delta
            base_score = 50.0 + (delta * 6.0)
            score = round(max(10.0, min(100.0, base_score)), 1)
            
            attributes[attr] = {
                "source_ticker": t,
                "score": score,
                "market_delta_pct": delta,
                "status": "Overcharged" if delta > 1.5 else ("Weakened" if delta < -1.5 else "Stable")
            }

        # Overall mood and vitality
        vitality_score = attributes.get("vitality", {}).get("score", 75.0)
        speed_score = attributes.get("speed", {}).get("score", 70.0)
        
        return {
            "name": name,
            "hour": snap["hour"],
            "attributes": attributes,
            "overall_power": round((vitality_score + speed_score) / 2.0, 1),
            "custom_mapping": mapping
        }



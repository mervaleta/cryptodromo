#!/usr/bin/env python3
"""
Market Feeds & Real-time WebSockets Connector Helper
Handles feed subscription URLs, message parsing, and game calculations.
"""

from dataclasses import dataclass
from typing import Dict, Any, List
import hashlib


@dataclass
class MarketTick:
    symbol: str
    price: float
    volume: float
    timestamp_ms: int
    is_closed: bool


class MarketFeedHub:
    """Hub for parsing and orchestrating WebSocket feeds for games."""

    BINANCE_WS_BASE = "wss://stream.binance.com:9443/ws"
    BINANCE_COMBINED_BASE = "wss://stream.binance.com:9443/stream?streams="

    def get_binance_stream_urls(self, symbols: List[str], interval: str = "1s") -> Dict[str, Any]:
        """Builds individual and multiplexed stream URLs for Binance WebSockets."""
        streams = [f"{s.lower()}@kline_{interval}" for s in symbols]
        combined = f"{self.BINANCE_COMBINED_BASE}{'/'.join(streams)}"
        return {
            "individual_streams": streams,
            "combined_url": combined
        }

    def parse_binance_kline(self, data: Dict[str, Any]) -> MarketTick:
        """Parses a Binance 1s kline WebSocket payload into a clean MarketTick."""
        k = data.get("k", {})
        return MarketTick(
            symbol=data.get("s", k.get("s", "")),
            price=float(k.get("c", 0.0)),
            volume=float(k.get("v", 0.0)),
            timestamp_ms=int(data.get("E", 0)),
            is_closed=bool(k.get("x", False))
        )

    def calculate_crash_multiplier(self, entropy_hash: str) -> float:
        """
        Derives crash multiplier deterministically from entropy hash.
        Ranges from 1.01x up to 500.00x with exponential decay distribution.
        """
        # Ensure valid hex digest
        try:
            seed_int = int(entropy_hash[:12], 16)
        except ValueError:
            h = hashlib.sha256(entropy_hash.encode("utf-8")).hexdigest()
            seed_int = int(h[:12], 16)

        # Provably fair fractional formula
        mod = seed_int % 10000
        if mod < 300:  # 3% instant crash
            return 1.01
        
        # Power curve for payout scale
        scale = (10000 - mod) / 10000.0
        multiplier = 0.99 / (scale + 0.001)
        return round(min(max(multiplier, 1.01), 500.0), 2)

    def map_mochi_stats(self, ticker: str, price_delta_pct: float, volume_momentum: float) -> Dict[str, float]:
        """
        Maps live financial metrics into CryptoMochi virtual pet battle stats.
        """
        base_speed = 50.0 + (price_delta_pct * 5.0)
        base_power = 60.0 + (volume_momentum * 10.0)
        return {
            "ticker": ticker,
            "speed": round(max(10.0, min(base_speed, 100.0)), 1),
            "power": round(max(10.0, min(base_power, 100.0)), 1),
            "vitality": 85.0
        }

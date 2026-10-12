#!/usr/bin/env python3
"""
Mock Market Data Generator - Generates a full 24h deterministic dataset
for BTC, ETH, NVDA, and YPF to run the Casino games offline/locally.
"""

import json
import os
import time
from typing import Dict, Any, List


class MockMarketDay:
    def __init__(self, data_file: str = "data/mock_market_day.json"):
        self.data_file = data_file
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)

    def generate_full_day_dataset(self) -> Dict[str, Any]:
        """Generates 24 simulated hours of trading candles and tick events."""
        base_timestamp = 1791800000000  # Unix timestamp base
        hours = 24
        
        # Predefined market trends simulating a volatile trading day
        btc_trend = [68200, 68450, 68100, 67900, 68300, 68900, 69400, 69200, 68800, 68600, 68950, 69300,
                     69800, 70100, 69950, 69700, 69400, 69100, 68900, 69200, 69500, 69850, 70200, 70050]
        eth_trend = [3450, 3470, 3430, 3410, 3440, 3490, 3520, 3505, 3480, 3460, 3485, 3510,
                     3550, 3580, 3565, 3540, 3520, 3500, 3490, 3515, 3540, 3570, 3600, 3590]
        nvda_trend = [128.5, 129.2, 128.0, 127.8, 128.4, 129.9, 131.2, 130.8, 130.1, 129.5, 130.2, 131.0,
                      132.5, 133.4, 132.9, 132.0, 131.2, 130.5, 130.0, 131.1, 132.0, 133.1, 134.0, 133.7]
        ypf_trend = [28.2, 28.5, 28.1, 27.9, 28.3, 28.7, 29.1, 28.9, 28.6, 28.4, 28.7, 29.0,
                     29.4, 29.8, 29.6, 29.3, 29.0, 28.8, 28.7, 29.1, 29.3, 29.6, 30.0, 29.8]

        candles = []
        for h in range(hours):
            t_ms = base_timestamp + (h * 3600 * 1000)
            candles.append({
                "hour": h,
                "timestamp_ms": t_ms,
                "btc": {
                    "open": btc_trend[h],
                    "close": btc_trend[(h + 1) % hours],
                    "high": max(btc_trend[h], btc_trend[(h + 1) % hours]) + 150.0,
                    "low": min(btc_trend[h], btc_trend[(h + 1) % hours]) - 120.0,
                    "volume_1h": 1450.5 + (h * 35.0)
                },
                "eth": {
                    "open": eth_trend[h],
                    "close": eth_trend[(h + 1) % hours],
                    "pct_change_1h": round(((eth_trend[(h + 1) % hours] - eth_trend[h]) / eth_trend[h]) * 100.0, 2)
                },
                "nvda": {
                    "price": nvda_trend[h],
                    "volume_1m_sample": 45200000 + (h * 850000)
                },
                "ypf": {
                    "price": ypf_trend[h],
                    "delta_pct": round(((ypf_trend[h] - 28.2) / 28.2) * 100.0, 2)
                }
            })

        dataset = {
            "meta": {
                "generated_at": int(time.time()),
                "total_hours": hours,
                "simulated_day": "2026-10-12",
                "tickers": ["BTC", "ETH", "NVDA", "YPF"]
            },
            "hourly_snapshots": candles
        }

        with open(self.data_file, "w", encoding="utf-8") as f:
            f.write(json.dumps(dataset, indent=2, ensure_ascii=False))

        return dataset

    def load_dataset(self) -> Dict[str, Any]:
        if not os.path.exists(self.data_file):
            return self.generate_full_day_dataset()
        with open(self.data_file, "r", encoding="utf-8") as f:
            return json.load(f)


if __name__ == "__main__":
    mock = MockMarketDay()
    res = mock.generate_full_day_dataset()
    print(f"Mock day dataset generated with {len(res['hourly_snapshots'])} hours of data.")

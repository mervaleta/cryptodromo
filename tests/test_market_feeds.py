#!/usr/bin/env python3
"""
Unit tests for Market Feeds & WebSocket helpers.
"""

import unittest
from core.market_feeds import MarketFeedHub, MarketTick


class MarketFeedTests(unittest.TestCase):
    def setUp(self):
        self.hub = MarketFeedHub()

    def test_parse_binance_kline_payload(self):
        raw_msg = {
            "e": "kline",
            "E": 1672531199000,
            "s": "BTCUSDT",
            "k": {
                "t": 1672531140000,
                "T": 1672531199999,
                "s": "BTCUSDT",
                "i": "1s",
                "o": "16500.00",
                "c": "16520.50",
                "h": "16525.00",
                "l": "16495.00",
                "v": "12.450",
                "x": True
            }
        }
        tick = self.hub.parse_binance_kline(raw_msg)
        self.assertIsInstance(tick, MarketTick)
        self.assertEqual(tick.symbol, "BTCUSDT")
        self.assertEqual(tick.price, 16520.50)
        self.assertEqual(tick.volume, 12.450)

    def test_format_websocket_urls(self):
        urls = self.hub.get_binance_stream_urls(["BTCUSDT", "ETHUSDT"], interval="1s")
        self.assertIn("btcusdt@kline_1s", urls["combined_url"])
        self.assertIn("ethusdt@kline_1s", urls["combined_url"])

    def test_calculate_crash_point_deterministic(self):
        point = self.hub.calculate_crash_multiplier("test_hash_sample_001")
        self.assertGreaterEqual(point, 1.01)
        self.assertLessEqual(point, 500.0)

    def test_map_cryptomochi_stats(self):
        stats = self.hub.map_mochi_stats(
            ticker="NVDA",
            price_delta_pct=3.5,
            volume_momentum=1.8
        )
        self.assertIn("speed", stats)
        self.assertIn("power", stats)
        self.assertGreater(stats["speed"], 0)


if __name__ == "__main__":
    unittest.main()

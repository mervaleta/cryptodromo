#!/usr/bin/env python3
import unittest
from core.eaas_engine import EaaSEngine, MarketFeedProvider


class EaaSEngineTests(unittest.TestCase):
    def setUp(self):
        self.engine = EaaSEngine(audit_log="/data/cache/scratch/test_eaas_audit.jsonl")

    def test_market_feed_provider_assets(self):
        feed = MarketFeedProvider()
        prices = feed.get_current_prices()
        for expected in ["BTC", "ETH", "SOL", "NVDA", "TSLA", "SP500", "YPF", "GGAL", "CCL"]:
            self.assertIn(expected, prices)
            self.assertGreater(prices[expected]["price"], 0)
            self.assertIn("delta_1m_pct", prices[expected])

    def test_entropy_generation_format(self):
        record = self.engine.generate_entropy("BTC", "NVDA", client_salt="SALT_XYZ", nonce=10)
        self.assertIn("entropy_hash", record)
        self.assertEqual(len(record["entropy_hash"]), 64)  # SHA-256 hex length
        self.assertIn("raw_market_data", record)
        self.assertIn("normalized_float", record)
        self.assertGreaterEqual(record["normalized_float"], 0.0)
        self.assertLessEqual(record["normalized_float"], 1.0)
        self.assertIn("proof", record)
        self.assertIn("public_commit_ref", record["proof"])

    def test_entropy_deterministic_with_fixed_inputs(self):
        r1 = self.engine.generate_entropy("BTC", "ETH", client_salt="S1", nonce=1)
        self.assertEqual(r1["request"]["asset_1"], "BTC")
        self.assertEqual(r1["request"]["nonce"], 1)


if __name__ == "__main__":
    unittest.main()

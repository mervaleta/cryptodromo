#!/usr/bin/env python3
import unittest
from backend.mochi_engine import CryptoMochiService, get_market_delta


class MochiEngineTests(unittest.TestCase):
    def setUp(self):
        self.service = CryptoMochiService(db_path="/data/cache/scratch/test_mochi.db")

    def test_adopt_mochi(self):
        pet = self.service.adopt_mochi("trader_1", "SatoshiPet", "BTC")
        self.assertEqual(pet["name"], "SatoshiPet")
        self.assertEqual(pet["ticker_assigned"], "BTC")
        self.assertIn("mochi_id", pet)
        self.assertEqual(pet["evolution_stage"], 1)

    def test_feed_mochi_restores_health_reduces_hunger(self):
        pet = self.service.adopt_mochi("trader_2", "GigaMochi", "NVDA")
        mochi_id = pet["mochi_id"]
        res = self.service.feed_mochi(mochi_id, food_tokens=15)
        self.assertLessEqual(res["hunger"], pet["hunger"])
        self.assertIn("action_result", res)

    def test_switch_ticker(self):
        pet = self.service.adopt_mochi("trader_3", "Mervalito", "YPF")
        mochi_id = pet["mochi_id"]
        updated = self.service.switch_ticker(mochi_id, "GGAL")
        self.assertEqual(updated["ticker_assigned"], "GGAL")

    def test_market_delta_proof(self):
        m = get_market_delta("BTC")
        self.assertEqual(len(m["entropy_hash"]), 64)
        self.assertIn("delta_pct", m)


if __name__ == "__main__":
    unittest.main()

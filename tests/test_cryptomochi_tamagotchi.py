#!/usr/bin/env python3
"""
Unit tests for CryptoMochi Tamagotchi with dynamic ticker mapping.
"""

import unittest
from core.games_engine import CryptoMochiPet, GamesEngine


class CryptoMochiTamagotchiTests(unittest.TestCase):
    def setUp(self):
        self.engine = GamesEngine()

    def test_create_mochi_with_selected_ticker(self):
        pet = self.engine.create_cryptomochi(name="Kuro", ticker="BTC")
        self.assertEqual(pet.name, "Kuro")
        self.assertEqual(pet.ticker, "BTC")
        self.assertIn("mood", pet.get_status())
        self.assertIn("energy", pet.get_status())

    def test_mochi_stats_evolve_with_market_ticker(self):
        # Hour 0 to Hour 6 evolution
        status_h0 = self.engine.update_mochi_state(name="Kuro", ticker="NVDA", hour=0)
        status_h6 = self.engine.update_mochi_state(name="Kuro", ticker="NVDA", hour=6)
        
        self.assertIn(status_h6["mood"], ["Eufórico", "Alcista", "Neutral", "Bajista", "Pánico"])
        self.assertGreaterEqual(status_h6["energy"], 0)
        self.assertLessEqual(status_h6["energy"], 100)

    def test_switch_ticker_updates_behavior_profile(self):
        btc_profile = self.engine.get_ticker_behavior_profile("BTC")
        ypf_profile = self.engine.get_ticker_behavior_profile("YPF")
        
        self.assertEqual(btc_profile["dominant_trait"], "Volatilidad Cuántica")
        self.assertEqual(ypf_profile["dominant_trait"], "Resiliencia de Recursos")


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""
Unit tests for GamesEngine:
- 5-reel Wall Street Slots with custom bets
- Unified 24h market variation matrix for all games
- CryptoMochi custom multi-ticker parameter mapping
"""

import unittest
from core.games_engine import GamesEngine


class GamesEngineEnhancedTests(unittest.TestCase):
    def setUp(self):
        self.engine = GamesEngine()

    def test_daily_market_matrix_available_for_all_games(self):
        matrix = self.engine.get_daily_market_matrix()
        self.assertIn("tickers", matrix)
        self.assertIn("BTC", matrix["tickers"])
        self.assertIn("NVDA", matrix["tickers"])
        self.assertIn("YPF", matrix["tickers"])
        self.assertIn("hourly_series", matrix)
        self.assertEqual(len(matrix["hourly_series"]), 24)

    def test_wall_street_slots_5_reels_and_bet_options(self):
        # Test 5 reels with wager and 5 paylines
        result = self.engine.spin_wall_street_slots_5reels(hour=7, bet_per_line=5.0, lines=5)
        self.assertEqual(len(result["reels"]), 5)
        self.assertEqual(result["total_bet"], 25.0)
        self.assertIn("payout", result)
        self.assertIn("winning_lines", result)
        self.assertIn("symbol_matches", result)

    def test_custom_mochi_parameter_ticker_mapping(self):
        # User maps custom attributes to different market tickers
        custom_mapping = {
            "speed": "NVDA",
            "vitality": "BTC",
            "mood": "ETH",
            "defense": "YPF"
        }
        pet_state = self.engine.create_custom_mapped_mochi(name="Kuro-Pro", mapping=custom_mapping, hour=10)
        self.assertIn("attributes", pet_state)
        self.assertIn("speed", pet_state["attributes"])
        self.assertIn("vitality", pet_state["attributes"])
        self.assertEqual(pet_state["attributes"]["speed"]["source_ticker"], "NVDA")
        self.assertEqual(pet_state["attributes"]["defense"]["source_ticker"], "YPF")


if __name__ == "__main__":
    unittest.main()

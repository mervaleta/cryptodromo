#!/usr/bin/env python3
"""
Unit tests for GamesEngine (Crypto Rocket Crash, Wall Street Slots, CryptoMochi Arcade).
"""

import unittest
from core.games_engine import GamesEngine


class GamesEngineTests(unittest.TestCase):
    def setUp(self):
        self.engine = GamesEngine()

    def test_play_rocket_crash_cashout_success(self):
        result = self.engine.play_rocket_crash(hour=5, cashout_target=1.85, wager_amount=10.0)
        self.assertIn("crash_multiplier", result)
        self.assertIn("status", result)
        self.assertIn("payout", result)
        self.assertGreater(result["crash_multiplier"], 1.0)

    def test_play_wall_street_slots_spin(self):
        result = self.engine.spin_wall_street_slots(hour=12, wager_amount=20.0)
        self.assertEqual(len(result["reels"]), 3)
        self.assertIn("payout", result)
        self.assertIn("is_win", result)

    def test_simulate_mochi_race(self):
        race = self.engine.simulate_mochi_race(hour=14)
        self.assertEqual(len(race["participants"]), 3)
        self.assertIn("winner", race)
        self.assertIn("final_times", race)


if __name__ == "__main__":
    unittest.main()

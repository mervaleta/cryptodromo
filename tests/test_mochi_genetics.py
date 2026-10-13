#!/usr/bin/env python3
import unittest
from backend.mochi_genetics import (
    breed_mochi,
    calculate_portfolio_vitals,
    execute_care_action,
    PARENT_PRESETS
)


class MochiGeneticsTests(unittest.TestCase):
    def test_breed_mochi_deterministic(self):
        m1 = breed_mochi("BTC", "SP500", timestamp_ms=1728000000000, client_seed="FIXED_SEED")
        m2 = breed_mochi("BTC", "SP500", timestamp_ms=1728000000000, client_seed="FIXED_SEED")
        self.assertEqual(m1["audit_proof"]["entropy_hash"], m2["audit_proof"]["entropy_hash"])
        self.assertEqual(m1["name"], m2["name"])
        self.assertIn(m1["temperament"], ["ARRIESGADO", "CONSERVADOR", "MODERADO"])

    def test_portfolio_vitals_decay(self):
        vitals = {"hambre": 50.0, "joy": 50.0, "salud": 50.0, "energia": 50.0}
        # In a drop with high concentration, health must drop
        res = calculate_portfolio_vitals(vitals, temperament="CONSERVADOR", market_tick_delta=-2.5, holding_concentration_pct=80.0)
        self.assertLess(res["salud"], 50.0)
        self.assertLess(res["joy"], 50.0)

    def test_care_actions(self):
        v = {"hambre": 20.0, "joy": 50.0, "salud": 50.0, "energia": 50.0}
        v_fed, _ = execute_care_action("ALIMENTAR", v, "MODERADO")
        self.assertEqual(v_fed["hambre"], 55.0)

        v_reb, msg = execute_care_action("REBALANCEAR", v, "ARRIESGADO")
        self.assertIn("queja", msg)


if __name__ == "__main__":
    unittest.main()

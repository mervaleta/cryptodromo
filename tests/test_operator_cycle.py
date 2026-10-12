#!/usr/bin/env python3
"""Smoke tests for the master operator cycle."""

import os
import subprocess
import tempfile
import unittest

from me_operator import MarketEntropyOperator


class OperatorCycleTests(unittest.TestCase):
    def test_run_cycle_returns_ledger_summary(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            operator = MarketEntropyOperator(workspace_root=tmpdir)
            self.assertTrue(hasattr(operator, "ledger"), "operator should expose a crypto ledger")

            operator.ledger.record_deposit(
                tx_hash="0xdeposit",
                user_id="user_main",
                amount=100.0,
                asset="USDC",
            )
            record = {
                "timestamp_ms": 1791833038353,
                "iso_time": "2026-10-12T19:23:58Z",
                "raw_inputs": {
                    "btc_price_1s": 68578.65,
                    "nvda_volume_1m": 49754545.0,
                    "eth_variation_1h": 5.05,
                    "timestamp_ms": 1791833038353,
                    "salt": "TEST_SALT",
                },
                "formula": "SHA256(test)",
                "entropy_hash": "abc123",
                "outcomes": {"roulette_number": 4, "multiplier": 24.58},
            }
            operator.engine.generate_entropy = lambda: ("abc123", record)

            result = operator.run_cycle(edition_title="TEST")

            self.assertIn("ledger", result)
            self.assertEqual(result["ledger"]["user_id"], "user_main")
            self.assertEqual(result["ledger"]["balance_credits"], 100.0)
            self.assertTrue(os.path.exists(result["edition_file"]))

    def test_publish_to_git_commits_publication(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            operator = MarketEntropyOperator(workspace_root=tmpdir)
            record = {
                "timestamp_ms": 1791833038353,
                "iso_time": "2026-10-12T19:23:58Z",
                "raw_inputs": {
                    "btc_price_1s": 68578.65,
                    "nvda_volume_1m": 49754545.0,
                    "eth_variation_1h": 5.05,
                    "timestamp_ms": 1791833038353,
                    "salt": "TEST_SALT",
                },
                "formula": "SHA256(test)",
                "entropy_hash": "def456",
                "outcomes": {"roulette_number": 4, "multiplier": 24.58},
            }
            operator.engine.generate_entropy = lambda: ("def456", record)
            operator.run_cycle(edition_title="TEST")

            result = operator.publish_to_git(push=False)

            self.assertEqual(result["status"], "committed")
            log = subprocess.check_output(
                ["git", "log", "-1", "--pretty=%s"],
                cwd=tmpdir,
                text=True,
            )
            self.assertIn("Auto-Publish", log)


if __name__ == "__main__":
    unittest.main()

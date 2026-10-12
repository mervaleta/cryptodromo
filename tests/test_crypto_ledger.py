#!/usr/bin/env python3
"""Smoke tests for the casino ledger wager flow."""

import os
import tempfile
import unittest

from core.crypto_ledger import CryptoLedger


class CryptoLedgerWagerTests(unittest.TestCase):
    def test_place_wager_debits_balance_and_records_transaction(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            ledger = CryptoLedger(db_path=os.path.join(tmpdir, "ledger.db"))
            ledger.record_deposit(
                tx_hash="0xdeposit",
                user_id="user_main",
                amount=100.0,
                asset="USDC",
            )

            result = ledger.place_wager(
                wager_id="wager-001",
                user_id="user_main",
                amount=25.0,
                game="roulette",
                entropy_hash="abc123",
            )

            self.assertEqual(result["status"], "accepted")
            self.assertEqual(result["new_balance_credits"], 75.0)

            summary = ledger.get_user_summary("user_main")
            wager_txs = [tx for tx in summary["transactions"] if tx["tx_type"] == "WAGER"]
            self.assertEqual(len(wager_txs), 1)
            self.assertEqual(wager_txs[0]["tx_hash"], "wager-001")
            self.assertEqual(wager_txs[0]["amount"], -25.0)

    def test_settle_win_credits_winnings_and_records_transaction(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            ledger = CryptoLedger(db_path=os.path.join(tmpdir, "ledger.db"))
            ledger.record_deposit(
                tx_hash="0xdeposit",
                user_id="user_main",
                amount=100.0,
                asset="USDC",
            )
            ledger.place_wager(
                wager_id="wager-001",
                user_id="user_main",
                amount=25.0,
                game="roulette",
                entropy_hash="abc123",
            )

            result = ledger.settle_win(
                payout_id="win-001",
                user_id="user_main",
                wager_id="wager-001",
                amount=50.0,
                game="roulette",
                entropy_hash="abc123",
            )

            self.assertEqual(result["status"], "paid")
            self.assertEqual(result["new_balance_credits"], 125.0)

            summary = ledger.get_user_summary("user_main")
            win_txs = [tx for tx in summary["transactions"] if tx["tx_type"] == "WIN"]
            self.assertEqual(len(win_txs), 1)
            self.assertEqual(win_txs[0]["tx_hash"], "win-001")
            self.assertEqual(win_txs[0]["amount"], 50.0)

    def test_request_payout_debits_balance_and_records_intent(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            ledger = CryptoLedger(db_path=os.path.join(tmpdir, "ledger.db"))
            ledger.record_deposit(
                tx_hash="0xdeposit",
                user_id="user_main",
                amount=100.0,
                asset="USDC",
            )

            result = ledger.request_payout(
                payout_id="payout-001",
                user_id="user_main",
                amount=40.0,
                asset="USDC",
                destination_address="0xabc123",
            )

            self.assertEqual(result["status"], "queued")
            self.assertEqual(result["new_balance_credits"], 60.0)

            summary = ledger.get_user_summary("user_main")
            payout_txs = [tx for tx in summary["transactions"] if tx["tx_type"] == "PAYOUT"]
            self.assertEqual(len(payout_txs), 1)
            self.assertEqual(payout_txs[0]["tx_hash"], "payout-001")
            self.assertEqual(payout_txs[0]["amount"], -40.0)

            payout_log = os.path.join(tmpdir, "payout_intents.jsonl")
            self.assertTrue(os.path.exists(payout_log))
            with open(payout_log, "r", encoding="utf-8") as fh:
                self.assertIn("payout-001", fh.read())


if __name__ == "__main__":
    unittest.main()

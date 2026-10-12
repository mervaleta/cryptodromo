#!/usr/bin/env python3
"""
MarketEntropy Operator - Crypto Ledger & Deposit Monitor
Manages USDC/USDT deposit webhooks, player balances, and payout processing.
"""

import json
import os
import sqlite3
import time
from typing import Dict, Any, List, Optional


class CryptoLedger:
    def __init__(self, db_path: str = "data/casino_ledger.db", payout_log_path: Optional[str] = None):
        self.db_path = db_path
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        self.payout_log_path = payout_log_path or os.path.join(db_dir or ".", "payout_intents.jsonl")
        payout_dir = os.path.dirname(self.payout_log_path)
        if payout_dir:
            os.makedirs(payout_dir, exist_ok=True)
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    balance_credits REAL DEFAULT 0.0,
                    created_at INTEGER
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    tx_hash TEXT PRIMARY KEY,
                    user_id TEXT,
                    tx_type TEXT, -- DEPOSIT, PAYOUT, WAGER, WIN
                    amount REAL,
                    asset TEXT, -- USDC, USDT, CREDITS
                    status TEXT, -- PENDING, CONFIRMED, COMPLETED
                    timestamp INTEGER,
                    FOREIGN KEY(user_id) REFERENCES users(user_id)
                )
            """)
            conn.commit()

    def ensure_user(self, user_id: str) -> float:
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT balance_credits FROM users WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            if not row:
                cur.execute("INSERT INTO users (user_id, balance_credits, created_at) VALUES (?, 0.0, ?)",
                            (user_id, int(time.time())))
                conn.commit()
                return 0.0
            return float(row["balance_credits"])

    def record_deposit(self, tx_hash: str, user_id: str, amount: float, asset: str = "USDC") -> Dict[str, Any]:
        """Registers an incoming crypto deposit and credits the user's casino account 1:1."""
        self.ensure_user(user_id)
        now = int(time.time())

        with self._get_conn() as conn:
            cur = conn.cursor()

            # Check duplicate TX
            cur.execute("SELECT tx_hash FROM transactions WHERE tx_hash = ?", (tx_hash,))
            if cur.fetchone():
                return {"status": "duplicate", "message": f"Transaction {tx_hash} already processed."}

            # Insert TX & update balance
            cur.execute("""
                INSERT INTO transactions (tx_hash, user_id, tx_type, amount, asset, status, timestamp)
                VALUES (?, ?, 'DEPOSIT', ?, ?, 'CONFIRMED', ?)
            """, (tx_hash, user_id, amount, asset, now))

            cur.execute("""
                UPDATE users SET balance_credits = balance_credits + ? WHERE user_id = ?
            """, (amount, user_id))

            conn.commit()

            cur.execute("SELECT balance_credits FROM users WHERE user_id = ?", (user_id,))
            new_bal = cur.fetchone()["balance_credits"]

        return {
            "status": "confirmed",
            "user_id": user_id,
            "tx_hash": tx_hash,
            "credited_amount": amount,
            "asset": asset,
            "new_balance_credits": new_bal
        }

    def place_wager(self, wager_id: str, user_id: str, amount: float, game: str, entropy_hash: str) -> Dict[str, Any]:
        """Debits credits for a wager and records it in the immutable ledger."""
        if amount <= 0:
            raise ValueError("Wager amount must be positive")

        balance = self.ensure_user(user_id)
        if balance < amount:
            return {
                "status": "rejected",
                "reason": "insufficient_funds",
                "user_id": user_id,
                "balance_credits": balance,
            }

        now = int(time.time())
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT tx_hash FROM transactions WHERE tx_hash = ?", (wager_id,))
            if cur.fetchone():
                return {"status": "duplicate", "message": f"Wager {wager_id} already processed."}

            cur.execute("""
                INSERT INTO transactions (tx_hash, user_id, tx_type, amount, asset, status, timestamp)
                VALUES (?, ?, 'WAGER', ?, 'CREDITS', 'COMPLETED', ?)
            """, (wager_id, user_id, -amount, now))
            cur.execute("""
                UPDATE users SET balance_credits = balance_credits - ? WHERE user_id = ?
            """, (amount, user_id))
            conn.commit()

            cur.execute("SELECT balance_credits FROM users WHERE user_id = ?", (user_id,))
            new_bal = cur.fetchone()["balance_credits"]

        return {
            "status": "accepted",
            "user_id": user_id,
            "wager_id": wager_id,
            "game": game,
            "entropy_hash": entropy_hash,
            "amount": amount,
            "new_balance_credits": new_bal,
        }

    def settle_win(self, payout_id: str, user_id: str, wager_id: str, amount: float, game: str, entropy_hash: str) -> Dict[str, Any]:
        """Credits winnings for a settled provably-fair round."""
        if amount <= 0:
            raise ValueError("Win amount must be positive")

        self.ensure_user(user_id)
        now = int(time.time())
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT tx_hash FROM transactions WHERE tx_hash = ?", (payout_id,))
            if cur.fetchone():
                return {"status": "duplicate", "message": f"Payout {payout_id} already processed."}

            cur.execute("""
                INSERT INTO transactions (tx_hash, user_id, tx_type, amount, asset, status, timestamp)
                VALUES (?, ?, 'WIN', ?, 'CREDITS', 'COMPLETED', ?)
            """, (payout_id, user_id, amount, now))
            cur.execute("""
                UPDATE users SET balance_credits = balance_credits + ? WHERE user_id = ?
            """, (amount, user_id))
            conn.commit()

            cur.execute("SELECT balance_credits FROM users WHERE user_id = ?", (user_id,))
            new_bal = cur.fetchone()["balance_credits"]

        return {
            "status": "paid",
            "user_id": user_id,
            "payout_id": payout_id,
            "wager_id": wager_id,
            "game": game,
            "entropy_hash": entropy_hash,
            "amount": amount,
            "new_balance_credits": new_bal,
        }

    def request_payout(self, payout_id: str, user_id: str, amount: float, asset: str, destination_address: str) -> Dict[str, Any]:
        """Debits credits and queues a crypto payout intent for external settlement."""
        if amount <= 0:
            raise ValueError("Payout amount must be positive")
        if not destination_address:
            raise ValueError("destination_address is required")

        balance = self.ensure_user(user_id)
        if balance < amount:
            return {
                "status": "rejected",
                "reason": "insufficient_funds",
                "user_id": user_id,
                "balance_credits": balance,
            }

        now = int(time.time())
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT tx_hash FROM transactions WHERE tx_hash = ?", (payout_id,))
            if cur.fetchone():
                return {"status": "duplicate", "message": f"Payout {payout_id} already processed."}

            cur.execute("""
                INSERT INTO transactions (tx_hash, user_id, tx_type, amount, asset, status, timestamp)
                VALUES (?, ?, 'PAYOUT', ?, ?, 'PENDING', ?)
            """, (payout_id, user_id, -amount, asset, now))
            cur.execute("""
                UPDATE users SET balance_credits = balance_credits - ? WHERE user_id = ?
            """, (amount, user_id))
            conn.commit()

            cur.execute("SELECT balance_credits FROM users WHERE user_id = ?", (user_id,))
            new_bal = cur.fetchone()["balance_credits"]

        intent = {
            "payout_id": payout_id,
            "user_id": user_id,
            "amount": amount,
            "asset": asset,
            "destination_address": destination_address,
            "status": "PENDING",
            "timestamp": now,
        }
        with open(self.payout_log_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(intent, ensure_ascii=False) + "\n")

        return {
            "status": "queued",
            "user_id": user_id,
            "payout_id": payout_id,
            "amount": amount,
            "asset": asset,
            "destination_address": destination_address,
            "new_balance_credits": new_bal,
        }

    def get_user_summary(self, user_id: str) -> Dict[str, Any]:
        bal = self.ensure_user(user_id)
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT tx_hash, tx_type, amount, asset, status, timestamp
                FROM transactions WHERE user_id = ? ORDER BY timestamp DESC
            """, (user_id,))
            txs = [dict(row) for row in cur.fetchall()]

        return {
            "user_id": user_id,
            "balance_credits": bal,
            "transactions": txs
        }


if __name__ == "__main__":
    ledger = CryptoLedger()
    # Demo seed deposit for primary user
    res = ledger.record_deposit(
        tx_hash="0x7f9a8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
        user_id="user_main",
        amount=100.0,
        asset="USDC"
    )
    print("Deposit Result:", res)
    print("Summary:", ledger.get_user_summary("user_main"))

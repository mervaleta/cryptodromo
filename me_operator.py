#!/usr/bin/env python3
"""
MarketEntropy Operator - Master Autonomous Pipeline
Orchestrates:
1. Market data harvesting & Provably Fair entropy generation.
2. Asset verification & generation.
3. Journalistic synthesis of 'The Market Entropy Chronicle'.
4. Git audit commit & publication status.
"""

import os
import sys
import time
import subprocess
from typing import Any, Dict
from core.entropy_engine import MarketEntropyEngine
from assets.asset_manager import AssetManager
from chronicle.chronicle_generator import ChronicleGenerator
from core.crypto_ledger import CryptoLedger


class MarketEntropyOperator:
    def __init__(self, workspace_root: str = "/data/workspace"):
        self.workspace_root = workspace_root
        self.engine = MarketEntropyEngine(audit_file=os.path.join(workspace_root, "data/audit_entropy.jsonl"))
        self.asset_mgr = AssetManager(output_dir=os.path.join(workspace_root, "public/assets"))
        self.chronicle_gen = ChronicleGenerator(output_dir=os.path.join(workspace_root, "public"))
        self.ledger = CryptoLedger(db_path=os.path.join(workspace_root, "data/casino_ledger.db"))

    def run_cycle(self, edition_title: str = "VOLATILIDAD SOBERANA"):
        print("[Operator] >>> Iniciando Ciclo de Operación de Entropía Bursátil...")

        # 1. Extraer entropía y calcular Provably Fair
        entropy_hash, record = self.engine.generate_entropy()
        print(f"[Operator] [+] Entropía Generada con éxito.")
        print(f"           Hash SHA-256: {entropy_hash}")
        print(f"           Insumos: BTC=${record['raw_inputs']['btc_price_1s']:,.2f} | "
              f"NVDA_Vol={record['raw_inputs']['nvda_volume_1m']:,.0f} | "
              f"ETH_1h={record['raw_inputs']['eth_variation_1h']:+.2f}%")
        print(f"           Resultados: Ruleta={record['outcomes']['roulette_number']} | Crash={record['outcomes']['multiplier']}x")

        # 2. Generar banner y assets
        banner_path = self.asset_mgr.generate_cyberpunk_banner(
            edition_title=edition_title,
            entropy_hash=entropy_hash,
            filename="banner.svg"
        )
        print(f"[Operator] [+] Asset visual generado: {banner_path}")

        # 3. Compilar edición de 'The Market Entropy Chronicle'
        edition_file = self.chronicle_gen.generate_edition(record)
        print(f"[Operator] [+] Edición publicada localmente: {edition_file}")

        # 4. Estado de créditos del jugador principal
        ledger_summary = self.ledger.get_user_summary("user_main")
        print(f"[Operator] [+] Créditos user_main: {ledger_summary['balance_credits']:.2f}")

        self.last_cycle = {
            "status": "success",
            "hash": entropy_hash,
            "record": record,
            "edition_file": edition_file,
            "ledger": ledger_summary,
        }
        return self.last_cycle

    def _git(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git", *args],
            cwd=self.workspace_root,
            text=True,
            capture_output=True,
            check=False,
        )

    def deploy_to_hostinger(self, deploy_url: str = "https://rngmarketdriven.com/deploy.php?token=RNG_DEPLOY_SECRET_2026") -> Dict[str, Any]:
        """Pushes to GitHub and triggers Hostinger webhook to deploy in seconds."""
        push_res = self._git("push", "origin", "main")
        if push_res.returncode != 0:
            return {"status": "error", "stage": "git_push", "stderr": push_res.stderr.strip()}

        import urllib.request
        try:
            req = urllib.request.Request(deploy_url, headers={"User-Agent": "MarketEntropyOperator/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return {"status": "deployed", "hostinger_response": data}
        except Exception as e:
            return {"status": "error", "stage": "webhook", "error": str(e)}

    def publish_to_git(self, push: bool = False, commit_message: str = None) -> Dict[str, Any]:
        """Initializes the repo if needed, commits generated artifacts, and optionally pushes."""
        init = self._git("init")
        if init.returncode != 0:
            return {"status": "error", "stage": "init", "stderr": init.stderr.strip()}

        self._git("config", "user.name", "MarketEntropy Operator")
        self._git("config", "user.email", "operator@marketentropy.local")
        self._git("checkout", "-B", "main")
        self._git("add", ".")

        status = self._git("status", "--porcelain")
        if status.returncode != 0:
            return {"status": "error", "stage": "status", "stderr": status.stderr.strip()}
        if not status.stdout.strip():
            return {"status": "no_changes"}

        short_hash = "nohash"
        if getattr(self, "last_cycle", None):
            short_hash = self.last_cycle.get("hash", "nohash")[:12]
        message = commit_message or f"Auto-Publish: Diario del Casino - {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())} [{short_hash}]"
        commit = self._git("commit", "-m", message)
        if commit.returncode != 0:
            return {"status": "error", "stage": "commit", "stderr": commit.stderr.strip()}

        result: Dict[str, Any] = {
            "status": "committed",
            "commit_message": message,
            "commit_stdout": commit.stdout.strip(),
            "push": "not_requested",
        }

        if push:
            remote = self._git("remote", "get-url", "origin")
            if remote.returncode != 0 or not remote.stdout.strip():
                result["push"] = "skipped_no_origin_remote"
            else:
                pushed = self._git("push", "origin", "HEAD:main")
                result["push"] = "pushed" if pushed.returncode == 0 else "push_failed"
                result["push_stdout"] = pushed.stdout.strip()
                result["push_stderr"] = pushed.stderr.strip()

        return result


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="MarketEntropy Operator")
    parser.add_argument("--balance", action="store_true", help="Solo muestra el balance de user_main")
    parser.add_argument("--publish", action="store_true", help="Commitea artefactos generados en Git local")
    parser.add_argument("--push", action="store_true", help="Intenta pushear a origin/main si existe remote")
    args = parser.parse_args()

    operator = MarketEntropyOperator()
    if args.balance:
        print(json.dumps(operator.ledger.get_user_summary("user_main"), indent=2, ensure_ascii=False))
    else:
        result = operator.run_cycle()
        if args.publish:
            print(json.dumps(operator.publish_to_git(push=args.push), indent=2, ensure_ascii=False))

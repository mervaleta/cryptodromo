# MarketEntropy Operator

Pipeline autónomo para el ecosistema **Casino de Entropía Bursátil** y el medio **The Market Entropy Chronicle**.

## Qué hace

- Genera entropía *provably fair* con la fórmula:
  `SHA256(Precio_BTC_1s | Volumen_NVDA_1m | Variacion_ETH_1h | Timestamp_ms | Salt)`
- Registra auditoría append-only en `data/audit_entropy.jsonl`.
- Genera assets SVG en `public/assets/`.
- Publica la edición web en `public/index.html`.
- Lleva créditos de jugadores en SQLite (`data/casino_ledger.db`, ignorado por Git).
- Encola payouts en `data/payout_intents.jsonl` para liquidación externa.

## Estructura

```text
core/entropy_engine.py       # Market data + SHA256 entropy
core/crypto_ledger.py        # Depósitos, créditos, wagers, wins, payout intents
assets/asset_manager.py      # Banner SVG cyberpunk
chronicle/chronicle_generator.py
me_operator.py               # Orquestador principal
tests/                       # Smoke tests con unittest
public/                      # Salida publicable (GitLab Pages/Nginx)
```

## Uso

```bash
cd /data/workspace

# Ejecutar ciclo completo: entropía + banner + edición + balance
python3 me_operator.py

# Ver créditos del usuario principal
python3 - <<'PY'
from core.crypto_ledger import CryptoLedger
print(CryptoLedger('data/casino_ledger.db').get_user_summary('user_main'))
PY

# Tests
python3 -m unittest discover -s tests -v
```

## Publicación GitLab

- `.gitlab-ci.yml` corre tests y publica `public/` con GitLab Pages.
- Para commit local automatizado desde Python:

```python
from me_operator import MarketEntropyOperator
op = MarketEntropyOperator('/data/workspace')
op.run_cycle()
print(op.publish_to_git(push=False))  # push=True si existe remote origin
```

## Nota operativa

Las claves API y secretos van en `.env` y **no** se commitean. Los payouts reales requieren un signer/RPC externo; este repo registra intents auditables y saldos internos.

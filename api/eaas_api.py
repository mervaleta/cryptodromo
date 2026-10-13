#!/usr/bin/env python3
"""
FastAPI Backend for Entropy-as-a-Service (EaaS)
Endpoints:
- GET /v1/entropy/generate (REST)
- POST /v1/entropy/generate (REST)
- GET /v1/entropy/prices (Live multi-asset snapshots)
- WS /v1/entropy/stream (WebSocket continuous entropy streaming)
- GET /v1/entropy/audit (Audit verification)
"""

import asyncio
import json
import time
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.eaas_engine import EaaSEngine, MarketFeedProvider

app = FastAPI(
    title="RNGMarketDriven - Entropy-as-a-Service (EaaS) API",
    version="1.0.0",
    description="Provably Fair financial randomness API derived from Binance, NYSE, NASDAQ and BYMA/Merval."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = EaaSEngine()
feed_provider = MarketFeedProvider()


class EntropyRequest(BaseModel):
    asset_1: str = Field(default="BTC", description="Primary financial asset ($BTC, $ETH, $NVDA, etc.)")
    asset_2: str = Field(default="NVDA", description="Secondary financial asset for cross-entropy ($YPF, $GGAL, etc.)")
    client_salt: str = Field(default="CLIENT_RANDOM_SALT_2026", description="Client verifiable seed")
    nonce: int = Field(default=1, description="Sequential transaction count")


@app.get("/")
def root():
    return {
        "service": "RNGMarketDriven EaaS (Entropy-as-a-Service)",
        "status": "online",
        "version": "1.0.0",
        "endpoints": [
            "/v1/entropy/generate",
            "/v1/entropy/prices",
            "/v1/entropy/stream (WebSocket)",
            "/v1/entropy/audit"
        ]
    }


@app.get("/v1/entropy/prices")
def get_live_prices():
    """Returns current live financial asset snapshots (Binance, NYSE, BYMA)."""
    return {
        "timestamp_ms": int(time.time() * 1000),
        "assets": feed_provider.get_current_prices()
    }


@app.get("/v1/entropy/generate")
def generate_entropy_get(
    asset_1: str = Query("BTC"),
    asset_2: str = Query("NVDA"),
    client_salt: str = Query("CLIENT_SALT_2026"),
    nonce: int = Query(1)
):
    """Generates traceable financial randomness via GET."""
    return engine.generate_entropy(
        asset_1=asset_1,
        asset_2=asset_2,
        client_salt=client_salt,
        nonce=nonce
    )


@app.post("/v1/entropy/generate")
def generate_entropy_post(req: EntropyRequest):
    """Generates traceable financial randomness via POST."""
    return engine.generate_entropy(
        asset_1=req.asset_1,
        asset_2=req.asset_2,
        client_salt=req.client_salt,
        nonce=req.nonce
    )


@app.get("/v1/entropy/audit")
def verify_audit(hash: str = Query(..., description="The SHA-256 hash to verify")):
    """Verifies that an entropy hash was produced by deterministic raw market inputs."""
    if not os.path.exists(engine.audit_log):
        raise HTTPException(status_code=404, detail="No audit records registered yet")
    
    with open(engine.audit_log, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            if data.get("entropy_hash") == hash:
                return {"status": "verified", "record": data}
                
    return {"status": "not_found", "hash": hash, "detail": "Hash not found in current local ledger block"}


@app.websocket("/v1/entropy/stream")
async def websocket_entropy_stream(websocket: WebSocket):
    """
    Continuous real-time entropy streaming via WebSocket.
    Pushes 1-second ticks of market delta and derived Provably Fair seeds.
    """
    await websocket.accept()
    nonce = 1
    try:
        while True:
            # Generate entropy tick
            entropy_data = engine.generate_entropy(
                asset_1="BTC",
                asset_2="ETH",
                client_salt="WS_STREAM_SALT",
                nonce=nonce
            )
            nonce += 1
            await websocket.send_text(json.dumps(entropy_data))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.eaas_api:app", host="0.0.0.0", port=8000, reload=False)

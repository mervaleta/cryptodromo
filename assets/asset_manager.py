#!/usr/bin/env python3
"""
MarketEntropy Operator - Asset & Image Manager
Handles fetching external logos, crypto/stock assets, and generating rich SVG banners.
"""

import os
import urllib.request
from typing import Optional


class AssetManager:
    def __init__(self, output_dir: str = "public/assets"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def download_image(self, url: str, filename: str) -> Optional[str]:
        target_path = os.path.join(self.output_dir, filename)
        if os.path.exists(target_path):
            return target_path
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "MarketEntropyOperator/1.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp, open(target_path, "wb") as f:
                f.write(resp.read())
            return target_path
        except Exception as e:
            print(f"[AssetManager] Error downloading {url}: {e}")
            return None

    def generate_cyberpunk_banner(self, edition_title: str, entropy_hash: str, filename: str = "banner.svg") -> str:
        """Generates a high-tech SVG cover banner for The Market Entropy Chronicle."""
        target_path = os.path.join(self.output_dir, filename)
        short_hash = f"{entropy_hash[:12]}...{entropy_hash[-8:]}"

        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0b10" />
      <stop offset="50%" stop-color="#121324" />
      <stop offset="100%" stop-color="#050508" />
    </linearGradient>
    <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00ff87" />
      <stop offset="100%" stop-color="#60efff" />
    </linearGradient>
    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff007f" />
      <stop offset="100%" stop-color="#7928ca" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="480" fill="url(#bgGrad)" />

  <!-- Grid overlay -->
  <g opacity="0.15" stroke="#00ff87" stroke-width="1">
    {''.join(f'<line x1="{x}" y1="0" x2="{x}" y2="480" />' for x in range(0, 1200, 60))}
    {''.join(f'<line x1="0" y1="{y}" x2="1200" y2="{y}" />' for y in range(0, 480, 40))}
  </g>

  <!-- Accent glow lines -->
  <line x1="100" y1="90" x2="1100" y2="90" stroke="url(#neonPink)" stroke-width="2" opacity="0.8" />
  <line x1="100" y1="410" x2="1100" y2="410" stroke="url(#neonGreen)" stroke-width="2" opacity="0.8" />

  <!-- Title Badge -->
  <rect x="100" y="55" width="260" height="26" rx="4" fill="#ff007f" opacity="0.2" />
  <text x="110" y="73" fill="#ff007f" font-family="'Courier New', monospace" font-size="13" font-weight="bold" letter-spacing="2">CASINO DE ENTROPÍA BURSÁTIL</text>

  <!-- Main Headline -->
  <text x="100" y="170" fill="#ffffff" font-family="'Trebuchet MS', -apple-system, sans-serif" font-size="52" font-weight="900" letter-spacing="-1">THE MARKET ENTROPY CHRONICLE</text>
  <text x="100" y="225" fill="url(#neonGreen)" font-family="'Trebuchet MS', -apple-system, sans-serif" font-size="28" font-weight="600">{edition_title}</text>

  <!-- Entropy Proof Box -->
  <rect x="100" y="275" width="1000" height="95" rx="8" fill="#161829" stroke="#2a2d4a" stroke-width="1.5" />
  <text x="130" y="312" fill="#8e92bc" font-family="'Courier New', monospace" font-size="14">PROVABLY FAIR VERIFIED SEED</text>
  <text x="130" y="345" fill="#00ff87" font-family="'Courier New', monospace" font-size="20" font-weight="bold">HASH: {short_hash}</text>
  <text x="860" y="345" fill="#60efff" font-family="'Courier New', monospace" font-size="14">STATUS: IMMUTABLE</text>
</svg>"""

        with open(target_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        return target_path


if __name__ == "__main__":
    mgr = AssetManager()
    path = mgr.generate_cyberpunk_banner("EDICIÓN DE GALA: APERTURA CUÁNTICA", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
    print(f"Generated banner at {path}")

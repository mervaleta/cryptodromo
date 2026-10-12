#!/usr/bin/env python3
"""
The Market Entropy Chronicle - Autonomous Publishing Engine
Generates journalistic, satirical, and financial analysis issues of the daily newspaper.
Outputs both Markdown and responsive dark-theme HTML ready for GitLab Pages / web deployment.
"""

import os
import time
from typing import Dict, Any


class ChronicleGenerator:
    def __init__(self, output_dir: str = "public"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_edition(self, entropy_record: Dict[str, Any], edition_num: int = 1) -> str:
        date_str = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())
        entropy_hash = entropy_record["entropy_hash"]
        inputs = entropy_record["raw_inputs"]
        outcomes = entropy_record["outcomes"]

        html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Market Entropy Chronicle - Edición #{edition_num}</title>
  <style>
    :root {{
      --bg: #0b0c10;
      --card-bg: #151722;
      --card-border: #232738;
      --text: #e2e8f0;
      --muted: #8e95aa;
      --accent-green: #00ff87;
      --accent-blue: #60efff;
      --accent-pink: #ff007f;
      --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 2rem 1rem;
    }}
    .container {{
      max-width: 1040px;
      margin: 0 auto;
    }}
    header {{
      text-align: center;
      border-bottom: 2px solid var(--accent-pink);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }}
    .newspaper-sub {{
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--muted);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }}
    .banner-img {{
      width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      margin-bottom: 2rem;
    }}
    .grid {{
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }}
    @media (max-width: 768px) {{
      .grid {{ grid-template-columns: 1fr; }}
    }}
    .article-main {{
      background: var(--card-bg);
      padding: 1.8rem;
      border-radius: 8px;
      border: 1px solid var(--card-border);
    }}
    .article-main h2 {{
      color: var(--accent-blue);
      font-size: 1.8rem;
      margin-bottom: 1rem;
      line-height: 1.25;
    }}
    .article-main p {{
      margin-bottom: 1.2rem;
      color: #cbd5e1;
    }}
    .sidebar {{
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }}
    .widget {{
      background: var(--card-bg);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--card-border);
    }}
    .widget h3 {{
      font-family: var(--font-mono);
      font-size: 0.95rem;
      color: var(--accent-green);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .hash-box {{
      background: #0d0e15;
      padding: 0.75rem;
      border-radius: 4px;
      border: 1px dashed var(--accent-green);
      font-family: var(--font-mono);
      font-size: 0.78rem;
      word-break: break-all;
      color: var(--accent-green);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }}
    th, td {{
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--card-border);
      text-align: left;
    }}
    th {{ color: var(--muted); font-size: 0.8rem; }}
    td.val {{ text-align: right; font-family: var(--font-mono); font-weight: bold; color: var(--accent-blue); }}
    footer {{
      margin-top: 3rem;
      text-align: center;
      border-top: 1px solid var(--card-border);
      padding-top: 1.5rem;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--muted);
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="newspaper-sub">Órgano Oficial de Liquidación & Arbitraje Cuántico | Edición #{edition_num}</div>
      <img src="assets/banner.svg" alt="The Market Entropy Chronicle" class="banner-img" />
    </header>

    <div class="grid">
      <main class="article-main">
        <h2>La Entropía No Duerme: Wall Street alimenta los Rodillos de la Ruleta</h2>
        <p><strong>ZÚRICH / CIBERESPACIO.</strong> Mientras los analistas tradicionales discuten si las tasas de interés bajarán 25 puntos básicos, los algoritmos del <em>Casino de Entropía Bursátil</em> continúan devorando los pulsos cardíacos del mercado global para alimentar el generador aleatorio más implacable de la historia.</p>
        
        <p>El precio instantáneo de Bitcoin se congeló en <strong>${inputs['btc_price_1s']:,.2f}</strong> justo en la ventana de muestreo, mientras el coloso de la inteligencia artificial, <strong>NVIDIA ($NVDA)</strong>, reportaba un volumen de trading de <strong>{inputs['nvda_volume_1m']:,.0f} contratos</strong>. Esta masa de ruido financiero fue sintetizada en un cóctel criptográfico que arrojó el número de la suerte <strong>#{outcomes['roulette_number']}</strong> y un multiplicador de mesa de <strong>{outcomes['multiplier']}x</strong>.</p>
        
        <p><em>"El mercado cree que descubre precios; en realidad, solo genera entropía para nuestros jugadores"</em>, declaró la operadora autónoma del sistema al certificar el bloque de datos.</p>
      </main>

      <aside class="sidebar">
        <div class="widget">
          <h3>// Auditoría Provably Fair</h3>
          <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">Seed SHA-256 registrada e inmutable:</p>
          <div class="hash-box">{entropy_hash}</div>
        </div>

        <div class="widget">
          <h3>// Telemetría de Insumos</h3>
          <table>
            <tr>
              <td>BTC Spot (1s)</td>
              <td class="val">${inputs['btc_price_1s']:,.2f}</td>
            </tr>
            <tr>
              <td>NVDA Volume (1m)</td>
              <td class="val">{inputs['nvda_volume_1m']:,.0f}</td>
            </tr>
            <tr>
              <td>ETH Var (1h)</td>
              <td class="val">{inputs['eth_variation_1h']:+.2f}%</td>
            </tr>
            <tr>
              <td>Timestamp (ms)</td>
              <td class="val">{inputs['timestamp_ms']}</td>
            </tr>
          </table>
        </div>

        <div class="widget">
          <h3>// Resultados de Mesa</h3>
          <table>
            <tr>
              <td>Ruleta Entrópica</td>
              <td class="val" style="color: var(--accent-pink);">N° {outcomes['roulette_number']}</td>
            </tr>
            <tr>
              <td>Multiplicador Crash</td>
              <td class="val" style="color: var(--accent-green);">{outcomes['multiplier']}x</td>
            </tr>
          </table>
        </div>
      </aside>
    </div>

    <footer>
      MarketEntropy Operator &bull; Sistema Autónomo Provably Fair &bull; Publicado el {date_str}
    </footer>
  </div>
</body>
</html>"""

        index_file = os.path.join(self.output_dir, "index.html")
        with open(index_file, "w", encoding="utf-8") as f:
            f.write(html_content)

        return index_file


if __name__ == "__main__":
    from core.entropy_engine import MarketEntropyEngine
    from assets.asset_manager import AssetManager

    engine = MarketEntropyEngine()
    h, rec = engine.generate_entropy()
    
    am = AssetManager()
    am.generate_cyberpunk_banner("EDICIÓN #1: EL RUIDO DEL DINERO", h)

    gen = ChronicleGenerator()
    out = gen.generate_edition(rec, edition_num=1)
    print(f"Generated Chronicle Edition at {out}")

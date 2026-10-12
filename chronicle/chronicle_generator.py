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
      <nav class="casino-nav" style="display:flex; justify-content:center; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;">
        <a href="#rocket-crash" style="color:var(--accent-green); text-decoration:none; font-family:var(--font-mono); font-size:0.85rem; padding:0.4rem 0.8rem; border:1px solid var(--card-border); border-radius:4px; background:#121420;">🚀 Rocket Crash</a>
        <a href="#wall-street-slots" style="color:var(--accent-blue); text-decoration:none; font-family:var(--font-mono); font-size:0.85rem; padding:0.4rem 0.8rem; border:1px solid var(--card-border); border-radius:4px; background:#121420;">🎰 Wall Street Slots</a>
        <a href="#cryptomochi-arcade" style="color:var(--accent-pink); text-decoration:none; font-family:var(--font-mono); font-size:0.85rem; padding:0.4rem 0.8rem; border:1px solid var(--card-border); border-radius:4px; background:#121420;">👾 CryptoMochi Arcade</a>
      </nav>
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

    <!-- Salones de Juego Interactivos -->
    <section style="margin-top: 3rem;">
      <h3 style="font-family: var(--font-mono); color: var(--accent-green); margin-bottom: 1rem; letter-spacing: 2px;">// SALONES ACTIVOS DEL CASINO (MODO SIMULADOR MVP)</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        
        <!-- Salón 1: Rocket Crash -->
        <div id="rocket-crash" class="widget">
          <h4 style="color: var(--accent-green); margin-bottom: 0.5rem;">🚀 Crypto Rocket Crash</h4>
          <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.8rem;">Multiplicador simulado sobre velas de 1s de BTC/ETH.</p>
          <div style="background:#090a10; padding:1rem; border-radius:6px; text-align:center; margin-bottom:0.8rem;">
            <div id="crash-display" style="font-size:2rem; font-family:var(--font-mono); font-weight:bold; color:var(--accent-green);">1.00x</div>
            <div id="crash-status" style="font-size:0.75rem; color:var(--muted); margin-top:4px;">LISTO PARA DESPEGUE</div>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <input type="number" id="crash-cashout" value="2.00" step="0.1" min="1.1" style="width:70px; background:#1e2235; border:1px solid var(--card-border); color:#fff; padding:0.4rem; border-radius:4px; font-family:var(--font-mono);">
            <button onclick="launchRocketCrash()" style="flex:1; background:var(--accent-green); color:#050508; border:none; padding:0.5rem; border-radius:4px; font-weight:bold; cursor:pointer;">DESPEGAR</button>
          </div>
        </div>

        <!-- Salón 2: Wall Street Slots -->
        <div id="wall-street-slots" class="widget">
          <h4 style="color: var(--accent-blue); margin-bottom: 0.5rem;">🎰 Wall Street Slots</h4>
          <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.8rem;">Carretes bursátiles: $NVDA, $BTC, $YPF, $ETH, $BULL.</p>
          <div style="background:#090a10; padding:1rem; border-radius:6px; display:flex; justify-content:space-around; font-size:1.5rem; font-family:var(--font-mono); font-weight:bold; margin-bottom:0.8rem; color:var(--accent-blue);">
            <span id="slot-r1">$BTC</span>
            <span id="slot-r2">$NVDA</span>
            <span id="slot-r3">$YPF</span>
          </div>
          <button onclick="spinSlots()" style="width:100%; background:var(--accent-blue); color:#050508; border:none; padding:0.5rem; border-radius:4px; font-weight:bold; cursor:pointer;">TIRAR PALANCA</button>
          <div id="slot-result" style="font-size:0.75rem; text-align:center; color:var(--muted); margin-top:6px;">Esperando giro...</div>
        </div>

        <!-- Salón 3: CryptoMochi Tamagotchi & Arcade -->
        <div id="cryptomochi-arcade" class="widget">
          <h4 style="color: var(--accent-pink); margin-bottom: 0.5rem;">👾 CryptoMochi Tamagotchi</h4>
          <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.8rem;">Mascota evolutiva. Seleccioná el ticker para modular su comportamiento:</p>
          
          <div style="margin-bottom:0.8rem;">
            <label style="font-size:0.75rem; color:var(--muted); font-family:var(--font-mono);">VINCULAR A TICKER:</label>
            <select id="mochi-ticker-select" onchange="changeMochiTicker()" style="width:100%; margin-top:4px; background:#1e2235; color:#fff; border:1px solid var(--card-border); padding:0.4rem; border-radius:4px; font-family:var(--font-mono);">
              <option value="BTC">$BTC - Volatilidad Cuántica (Euforia / Pánico)</option>
              <option value="NVDA">$NVDA - Aceleración Neuronal (Hiperactividad GPU)</option>
              <option value="ETH">$ETH - Complejidad Lógica (Gas & Astucia)</option>
              <option value="YPF">$YPF - Resiliencia de Recursos (Fuerza Telúrica)</option>
            </select>
          </div>

          <div style="background:#090a10; padding:0.8rem; border-radius:6px; font-size:0.8rem; font-family:var(--font-mono); margin-bottom:0.8rem; line-height:1.6;">
            <div style="text-align:center; font-size:2rem; margin-bottom:0.3rem;" id="mochi-avatar">🐱‍👤</div>
            <div style="color:var(--accent-pink); font-weight:bold; text-align:center; margin-bottom:0.4rem;" id="mochi-name-display">Kuro [Vinculado a $BTC]</div>
            <div>Humor: <span id="mochi-mood-val" style="color:var(--accent-green); font-weight:bold;">Alcista</span></div>
            <div>Rasgo Dominante: <span id="mochi-trait-val" style="color:var(--accent-blue);">Volatilidad Cuántica</span></div>
            <div>Energía: <span id="mochi-energy-val" style="color:#ffcc00;">85%</span></div>
            <div>Apetito: <span id="mochi-hunger-val" style="color:var(--muted);">Bajo (20%)</span></div>
          </div>
          
          <div style="display:flex; gap:0.5rem;">
            <button onclick="feedMochi()" style="flex:1; background:#222538; color:var(--accent-green); border:1px solid var(--card-border); padding:0.4rem; border-radius:4px; font-weight:bold; cursor:pointer;">ALIMENTAR</button>
            <button onclick="runMochiRace()" style="flex:1; background:var(--accent-pink); color:#fff; border:none; padding:0.4rem; border-radius:4px; font-weight:bold; cursor:pointer;">CORRER PISTA</button>
          </div>
          <div id="mochi-winner" style="font-size:0.75rem; text-align:center; color:var(--muted); margin-top:6px;">Mascota en reposo</div>
        </div>

      </div>
    </section>

    <script>
      // 1. Logica Simulada Rocket Crash
      function launchRocketCrash() {{
        const target = parseFloat(document.getElementById('crash-cashout').value) || 2.0;
        const display = document.getElementById('crash-display');
        const status = document.getElementById('crash-status');
        display.style.color = 'var(--accent-green)';
        status.innerText = 'VOLANDO...';
        
        let current = 1.0;
        const crashAt = +(1.1 + Math.random() * 4.5).toFixed(2);
        const timer = setInterval(() => {{
          current = +(current + 0.05).toFixed(2);
          display.innerText = current.toFixed(2) + 'x';
          if (current >= target && current <= crashAt) {{
            clearInterval(timer);
            status.innerText = '✅ CASHOUT EXITOSO A ' + target.toFixed(2) + 'x';
            display.style.color = '#00ff87';
          }} else if (current >= crashAt) {{
            clearInterval(timer);
            status.innerText = '💥 CRASHED A ' + crashAt.toFixed(2) + 'x';
            display.style.color = 'var(--accent-pink)';
          }}
        }}, 50);
      }}

      // 2. Logica Simulada Slots
      function spinSlots() {{
        const symbols = ['$BTC', '$NVDA', '$YPF', '$ETH', '$BULL', '$BEAR'];
        const r1 = symbols[Math.floor(Math.random() * symbols.length)];
        const r2 = symbols[Math.floor(Math.random() * symbols.length)];
        const r3 = symbols[Math.floor(Math.random() * symbols.length)];
        
        document.getElementById('slot-r1').innerText = r1;
        document.getElementById('slot-r2').innerText = r2;
        document.getElementById('slot-r3').innerText = r3;
        
        const res = document.getElementById('slot-result');
        if (r1 === r2 && r2 === r3) {{
          res.innerText = '🎉 JACKPOT TRIPLE ' + r1 + '! Pago 10x';
          res.style.color = 'var(--accent-green)';
        }} else if (r1 === r2 || r2 === r3 || r1 === r3) {{
          res.innerText = '✨ Par encontrado! Pago 1.5x';
          res.style.color = 'var(--accent-blue)';
        }} else {{
          res.innerText = 'Intenta de nuevo en la siguiente rueda';
          res.style.color = 'var(--muted)';
        }}
      }}

      // 3. Logica Simulada CryptoMochi Tamagotchi
      const tickerProfiles = {{
        BTC: {{ trait: 'Volatilidad Cuántica', mood: 'Euforia / Pánico', avatar: '🐂', energy: '90%', hunger: 'Alta (75%)' }},
        NVDA: {{ trait: 'Aceleración Neuronal', mood: 'Hiperactivo GPU', avatar: '⚡', energy: '98%', hunger: 'Media (40%)' }},
        ETH: {{ trait: 'Complejidad Lógica', mood: 'Foco Algorítmico', avatar: '🧙‍♂️', energy: '80%', hunger: 'Baja (20%)' }},
        YPF: {{ trait: 'Resiliencia de Recursos', mood: 'Fuerza Telúrica', avatar: '🦬', energy: '75%', hunger: 'Baja (15%)' }}
      }};

      function changeMochiTicker() {{
        const sel = document.getElementById('mochi-ticker-select').value;
        const profile = tickerProfiles[sel];
        document.getElementById('mochi-avatar').innerText = profile.avatar;
        document.getElementById('mochi-name-display').innerText = 'Kuro [Vinculado a $' + sel + ']';
        document.getElementById('mochi-trait-val').innerText = profile.trait;
        document.getElementById('mochi-mood-val').innerText = profile.mood;
        document.getElementById('mochi-energy-val').innerText = profile.energy;
        document.getElementById('mochi-hunger-val').innerText = profile.hunger;
        document.getElementById('mochi-winner').innerText = 'Genética adaptada a $' + sel;
      }}

      function feedMochi() {{
        document.getElementById('mochi-hunger-val').innerText = 'Saciado (0%)';
        document.getElementById('mochi-winner').innerText = '🍖 Kuro consumió liquidez de mercado!';
      }}

      function runMochiRace() {{
        const sel = document.getElementById('mochi-ticker-select').value;
        const profile = tickerProfiles[sel];
        const el = document.getElementById('mochi-winner');
        el.innerText = '🏁 ' + profile.avatar + ' Kuro aceleró con el momentum de $' + sel + '! Tiempo: 9.84s';
        el.style.color = 'var(--accent-pink)';
      }}
    </script>

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

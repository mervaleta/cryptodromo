import re

with open("/data/workspace/cryptodromo/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Locate top-nav flex container in index.html
# It currently has: <div class="css-1g58v8s"><a rel="noopener noreferrer" href="/"><img src="/texturas/logo_janch_header.png" .../></a></div>
# Followed by <div class="css-1tfsrnn"><img src="/texturas/wallet.png" .../></div>

nav_links_html = """
<div style="display:flex; align-items:center; justify-content:center; gap:22px; flex:1; font-weight:700; font-size:0.95rem; letter-spacing:0.05em;">
  <a href="/bets" style="color:#f1f5f9; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='#7ACE7A'" onmouseout="this.style.color='#f1f5f9'">BETS</a>
  <a href="/fixture" style="color:#f1f5f9; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='#7ACE7A'" onmouseout="this.style.color='#f1f5f9'">FIXTURE</a>
  <a href="/live" style="background:#CD0604; color:#fff; padding:3px 12px; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; font-weight:800; font-size:0.85rem; box-shadow:0 0 10px rgba(205,6,4,0.4);">
    <span style="display:inline-block; width:6px; height:6px; background:#fff; border-radius:50%;"></span> LIVE
  </a>
  <a href="/ranking" style="color:#f1f5f9; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='#7ACE7A'" onmouseout="this.style.color='#f1f5f9'">RANKING</a>
  <a href="/results" style="color:#f1f5f9; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='#7ACE7A'" onmouseout="this.style.color='#f1f5f9'">RESULTS</a>
  <a href="/racers" style="color:#f1f5f9; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='#7ACE7A'" onmouseout="this.style.color='#f1f5f9'">RACERS</a>
  <a href="/stats" style="color:#f1f5f9; text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='#7ACE7A'" onmouseout="this.style.color='#f1f5f9'">STATS</a>
  <a href="/profile" style="color:#60efff; text-decoration:none; font-weight:800; transition:color 0.2s;" onmouseover="this.style.color='#00ffcc'" onmouseout="this.style.color='#60efff'">PROFILE</a>
</div>
"""

# Find where logo ends and right flex starts
logo_end = html.find('logo_janch_header.png')
if logo_end != -1:
    target_tag = '</a></div><style data-emotion="css 1tfsrnn">'
    idx = html.find(target_tag, logo_end)
    if idx != -1:
        html = html[:idx + len('</a></div>')] + nav_links_html + html[idx + len('</a></div>'):]
        print("Injected top nav links into Home!")
    else:
        print("Target tag not found near logo")
else:
    print("Logo not found")

with open("/data/workspace/cryptodromo/index.html", "w", encoding="utf-8") as f:
    f.write(html)

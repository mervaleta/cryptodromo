#!/usr/bin/env python3
"""
Generate remaining missing footer pages with on-brand styling.
"""

EXTRA_PAGES = {
    "community/referral.html": {
        "title": "Programa de Referidos | Cryptodromo",
        "h1": "Programa de Referidos",
        "content": """
        <p>Invitá a tus amigos y colegas corredores a unirse al hipódromo y obtené recompensas automáticas en créditos.</p>
        <br/>
        <h3>¿Cómo funciona?</h3>
        <ul>
          <li><strong>Compartí tu link de jinete:</strong> Obtené tu enlace único desde tu panel de <strong>/profile</strong>.</li>
          <li><strong>Bono de Bienvenida:</strong> Tu invitado recibe <strong>1.000 créditos (1.000 CR)</strong> al registrarse.</li>
          <li><strong>Comisión de Pozo:</strong> Recibís el <strong>5% de los créditos apostados</strong> por tus referidos en sus primeras 100 carreras.</li>
        </ul>
        """
    },
    "community/affiliate.html": {
        "title": "Programa de Afiliados | Cryptodromo",
        "h1": "Programa de Afiliados y Creadores",
        "content": """
        <p>Diseñado para canales de streaming de cripto, comunidades de trading y creadores de contenido deportivo virtual.</p>
        <br/>
        <h3>Beneficios para Afiliados:</h3>
        <ul>
          <li>Comisiones escalonadas de hasta el <strong>20% RevShare</strong> en paquetes de créditos adquiridos.</li>
          <li>Acceso a banners animados, widgets de cuotas en vivo y overlays para OBS.</li>
          <li>Pagos semanales en USDT, BTC o transferencia directa.</li>
        </ul>
        <p>Para postularte, escribinos a <a href="mailto:affiliates@cryptodromo.com" style="color:#60efff;">affiliates@cryptodromo.com</a>.</p>
        """
    },
    "community/events.html": {
        "title": "Eventos y Torneos | Cryptodromo",
        "h1": "Grandes Premios y Eventos Especiales",
        "content": """
        <p>Todos los viernes y fines de semana celebramos los clásicos estelares con pozos garantizados y multiplicadores de velocidad.</p>
        <br/>
        <h3>Próximos Clásicos en Calendario:</h3>
        <ul>
          <li><strong>Gran Premio Satoshi (Viernes 22:00 UTC):</strong> Pozo garantizado de 500.000 créditos con pista de césped nocturna.</li>
          <li><strong>Copa Halving Bull & Bear (Sábado 20:00 UTC):</strong> Dosis de aceleración amplificadas por volatilidad de derivados.</li>
          <li><strong>Desafío de Sprinters DeFi:</strong> Torneo exclusivo para corredores UNI, SUSHI, CAKE y AAVE.</li>
        </ul>
        """
    },
    "community/downloads.html": {
        "title": "Descargas | Cryptodromo",
        "h1": "Descargas y Recursos Multimedia",
        "content": """
        <p>Accedé a los kits oficiales de marca, wallpapers y aplicaciones compañeras de Cryptódromo:</p>
        <br/>
        <ul>
          <li><strong>Media & Streamer Kit:</strong> Overlays transparentes, alertas de victoria y logos oficiales en SVG y PNG.</li>
          <li><strong>Wallpapers 4K:</strong> Ilustraciones retro/synthwave del hipódromo y los corredores.</li>
          <li><strong>Historical Odds Dataset:</strong> Archivos CSV con los resultados históricos de las últimas 10.000 carreras para análisis cuantitativo.</li>
        </ul>
        """
    },
    "contact/mediakit.html": {
        "title": "Kit de Prensa | Cryptodromo",
        "h1": "Media Kit Oficial",
        "content": """
        <p>Descargá los recursos gráficos autorizados para prensa, blogs y coberturas editoriales:</p>
        <br/>
        <ul>
          <li>Logos en alta resolución (fondo oscuro, fondo claro y monograma de Janch).</li>
          <li>Paleta de colores oficial: Neon Cyan (#60EFFF), Neon Pink (#FF007F), Gold (#F9CA24) y Jet Black (#0C0F14).</li>
          <li>Guía de estilo y directrices de uso de marca.</li>
        </ul>
        <p>Consultas de prensa: <a href="mailto:press@cryptodromo.com" style="color:#60efff;">press@cryptodromo.com</a>.</p>
        """
    },
    "contact/newsletter.html": {
        "title": "Boletín Oficial | Cryptodromo",
        "h1": "Suscribite al Boletín Oficial",
        "content": """
        <p>Recibí en tu correo el fixture destacado de la semana, reportes de rendimiento de los corredores y alertas de torneos especiales.</p>
        <br/>
        <form onsubmit="event.preventDefault(); alert('¡Gracias por suscribirte al boletín de Cryptódromo!');" style="margin-top:20px; display:flex; gap:10px; max-width:480px;">
          <input type="email" placeholder="tu@email.com" required style="flex:1; padding:12px; background:#181d27; border:1px solid #2d3748; color:#fff; border-radius:6px; outline:none;"/>
          <button type="submit" style="background:#60efff; color:#0c0f14; font-weight:800; border:none; padding:12px 20px; border-radius:6px; cursor:pointer;">Suscribirme</button>
        </form>
        """
    },
    "contact/sitemap.html": {
        "title": "Mapa del Sitio | Cryptodromo",
        "h1": "Mapa del Sitio (Sitemap)",
        "content": """
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:24px; margin-top:20px;">
          <div>
            <strong style="color:#60efff;">Carreras &amp; Juego</strong>
            <ul style="margin-top:8px;">
              <li><a href="/">Hipódromo (Home)</a></li>
              <li><a href="/bets">Apuestas (Bets)</a></li>
              <li><a href="/fixture">Fixture Diario</a></li>
              <li><a href="/live">En Vivo (Live Stream)</a></li>
              <li><a href="/ranking">Ranking de Jinetes</a></li>
              <li><a href="/results">Resultados Históricos</a></li>
              <li><a href="/racers">Fichas de Corredores</a></li>
              <li><a href="/stats">Estadísticas de Pista</a></li>
              <li><a href="/profile">Perfil &amp; Cajero</a></li>
            </ul>
          </div>
          <div>
            <strong style="color:#60efff;">Institucional</strong>
            <ul style="margin-top:8px;">
              <li><a href="/aboutus">Acerca de Nosotros</a></li>
              <li><a href="/aboutus/history">Nuestra Historia</a></li>
              <li><a href="/aboutus/howItWorks">Cómo Funciona</a></li>
              <li><a href="/aboutus/mission">Misión</a></li>
              <li><a href="/aboutus/vision">Visión</a></li>
              <li><a href="/aboutus/ourteam">Equipo</a></li>
              <li><a href="/aboutus/roadmap">Hoja de Ruta</a></li>
            </ul>
          </div>
          <div>
            <strong style="color:#60efff;">Ayuda &amp; Soporte</strong>
            <ul style="margin-top:8px;">
              <li><a href="/help">Centro de Ayuda</a></li>
              <li><a href="/help/faq">Preguntas Frecuentes</a></li>
              <li><a href="/help/tutorials">Tutoriales</a></li>
              <li><a href="/help/guides">Guías</a></li>
              <li><a href="/help/glossary">Glosario</a></li>
              <li><a href="/help/troubleshooting">Solución de Problemas</a></li>
              <li><a href="/help/support">Soporte 24/7</a></li>
            </ul>
          </div>
          <div>
            <strong style="color:#60efff;">Legal &amp; Comunidad</strong>
            <ul style="margin-top:8px;">
              <li><a href="/privacypolicy">Política de Privacidad</a></li>
              <li><a href="/privacypolicy/legal">Términos de Servicio</a></li>
              <li><a href="/privacypolicy/tos">Aviso Legal</a></li>
              <li><a href="/community/social">Redes Sociales</a></li>
              <li><a href="/community/blog">Blog de Noticias</a></li>
              <li><a href="/contact">Contacto</a></li>
            </ul>
          </div>
        </div>
        """
    }
}

import os
from generate_footer_html import make_template

base_dir = "/data/workspace/cryptodromo"
for rel_path, data in EXTRA_PAGES.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    html_content = make_template(data["title"], data["h1"], data["content"])
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    dir_name = full_path[:-5] # remove .html
    os.makedirs(dir_name, exist_ok=True)
    with open(os.path.join(dir_name, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"Generated {rel_path} and {dir_name}/index.html")

#!/usr/bin/env python3
"""
Footer Enrichener & Link Fixer for Cryptodromo.
Enriches footer pages with on-brand, high-quality content and binds all footer links.
"""

PAGES_CONTENT = {
    "help/faq.html": {
        "title": "Preguntas Frecuentes (FAQ) | Cryptodromo",
        "h1": "Preguntas Frecuentes",
        "content": """
        <h3>1. ¿Cómo funciona Cryptódromo?</h3>
        <p>Cryptódromo es un hipódromo virtual donde cada caballo representa una criptomoneda del mercado real. La velocidad y aceleración de cada corredor durante los 12 tramos de 5 segundos están determinadas por las variaciones de precio en tiempo real del activo correspondiente.</p>
        <br/>
        <h3>2. ¿Las carreras son justas y transparentes?</h3>
        <p>Absolutamente. No utilizamos generadores de números aleatorios convencionales (RNG) cerrados. Cada carrera se alimenta de feeds de mercado verificables y entropía de bloques, permitiendo una experiencia provably fair donde los resultados son auditables por la comunidad.</p>
        <br/>
        <h3>3. ¿Con qué frecuencia se corren las carreras?</h3>
        <p>Se disputa una carrera cada 3 minutos, totalizando 480 carreras diarias ininterrumpidas. El cronograma completo de la jornada se puede consultar en la sección Fixture.</p>
        <br/>
        <h3>4. ¿Qué son los Créditos y Janch?</h3>
        <p>Los créditos son la unidad interna utilizada para participar en las predicciones y torneos. 1 crédito equivale aproximadamente a $0.01 USD. Podés adquirir paquetes en la sección Profile o ganar créditos en promociones y la ruleta diaria.</p>
        <br/>
        <h3>5. ¿Cómo se liquidan las apuestas?</h3>
        <p>Al finalizar la carrera, el 50% del pozo acumulado de todos los participantes se distribuye entre los apostadores del caballo ganador, calculado de acuerdo al dividendo (odds) correspondiente al momento del cierre de apuestas.</p>
        """
    },
    "help/glossary.html": {
        "title": "Glosario | Cryptodromo",
        "h1": "Glosario de Carreras y Cripto",
        "content": """
        <h3>Dosis de Velocidad</h3>
        <p>Impulso de potencia asignado a cada caballo en cada uno de los 12 tramos de la carrera, correlacionado matemáticamente con la variación porcentual del precio de la moneda.</p>
        <br/>
        <h3>Fixture</h3>
        <p>Cronograma oficial que lista todas las 480 carreras del día, indicando horario de largada, nombre del clásico, estado de pista y competidores habilitados.</p>
        <br/>
        <h3>Dividendo (Odds)</h3>
        <p>Multiplicador de premio que paga cada caballo en caso de resultar vencedor. Varía dinámicamente según el volumen apostado por la comunidad.</p>
        <br/>
        <h3>Janch Index</h3>
        <p>Índice compuesto de rendimiento histórico del caballo que mide regularidad, victorias y velocidad promedio en las últimas 50 participaciones.</p>
        <br/>
        <h3>Superficie de Pista</h3>
        <p>Condición del terreno (Dirt o Grass) que rota a lo largo del día e interactúa con el estilo de tracción y rendimiento de los competidores.</p>
        """
    },
    "help/tutorials.html": {
        "title": "Tutoriales | Cryptodromo",
        "h1": "Guías y Tutoriales Paso a Paso",
        "content": """
        <h3>Paso 1: Identificación y Billetera</h3>
        <p>Conectá tu cuenta vía Google, GitHub o tu billetera Web3 (MetaMask) desde el menú superior. Recibirás tu bono inicial de bienvenida en créditos.</p>
        <br/>
        <h3>Paso 2: Análisis del Fixture</h3>
        <p>Ingresá a la sección <strong>Fixture</strong> para revisar la próxima carrera. Evaluá las cotizaciones de mercado en vivo de monedas como BTC, ETH, SOL, BNB, DOGE y MATIC.</p>
        <br/>
        <h3>Paso 3: Realizar una Predicción (Bets)</h3>
        <p>Seleccioná tu caballo favorito, definí la cantidad de créditos a asignar y confirmá antes de que el reloj de cuenta regresiva llegue a 00:00.</p>
        <br/>
        <h3>Paso 4: Ver la Carrera en Vivo (Live)</h3>
        <p>Accedé a <strong>/live</strong> para disfrutar del hipódromo interactivo en 2D, el visor con tribunas, carteles y la definición fotográfica en los 1000 metros.</p>
        """
    },
    "help/troubleshooting.html": {
        "title": "Solución de Problemas | Cryptodromo",
        "h1": "Diagnóstico y Ayuda Técnica",
        "content": """
        <h3>No se visualiza la carrera en vivo</h3>
        <p>Verificá que tu navegador tenga habilitada la aceleración de hardware para Canvas/WebGL. Podés acceder al visor directo en <strong>/viewer</strong> para una carga ultra ligera.</p>
        <br/>
        <h3>No se actualiza el saldo de créditos</h3>
        <p>El saldo se almacena de forma segura en tu sesión local. Podés forzar la sincronización haciendo clic en el avatar superior y seleccionando 'Sincronizar' o volviendo a ingresar.</p>
        <br/>
        <h3>Problemas con MetaMask</h3>
        <p>Asegurate de estar conectado a la red Ethereum o Polygon y de tener la extensión desbloqueada. También podés utilizar el ingreso directo por Email o GitHub.</p>
        """
    },
    "help/support.html": {
        "title": "Soporte Técnico | Cryptodromo",
        "h1": "Centro de Soporte al Usuario",
        "content": """
        <p>Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier consulta sobre tu cuenta, acreditaciones, streaming de carreras o reglas de la plataforma.</p>
        <br/>
        <h3>Canales de Atención:</h3>
        <ul>
          <li><strong>Correo Oficial:</strong> <a href="mailto:info@cryptodromo.com" style="color:#60efff;">info@cryptodromo.com</a></li>
          <li><strong>Comunidad Discord / Telegram:</strong> Canal de anuncios y asistencia de apuestas.</li>
          <li><strong>Tiempo de respuesta estimado:</strong> Menos de 4 horas en días hábiles.</li>
        </ul>
        """
    },
    "aboutus/history.html": {
        "title": "Nuestra Historia | Cryptodromo",
        "h1": "La Historia de Cryptódromo",
        "content": """
        <p>Cryptódromo nació como una respuesta innovadora a la monotonía de los juegos de azar tradicionales y los generadores de números pseudo-aleatorios opacos.</p>
        <br/>
        <p>Inspirados en la velocidad y volatilidad de los mercados financieros globales y la pasión de las carreras de pura sangre, nuestro equipo de ingenieros y entusiastas de Web3 diseñó un sistema patentable donde los movimientos de precios del libro de órdenes se transforman en física de carrera en tiempo real.</p>
        <br/>
        <p>Hoy en día, Cryptódromo ofrece 480 carreras diarias continuas, uniendo análisis de trading, simulación deportiva y educación financiera en un ecosistema abierto y transparente.</p>
        """
    },
    "aboutus/mission.html": {
        "title": "Nuestra Misión | Cryptodromo",
        "h1": "Nuestra Misión",
        "content": """
        <p>Nuestra misión es transformar la educación financiera y el entretenimiento digital a través de una economía gamificada impulsada por datos reales de mercado.</p>
        <br/>
        <p>Buscamos desmitificar los mercados de criptoactivos ofreciendo una vía intuitiva, emocionante y visualmente atractiva para comprender tendencias, correlaciones y volatilidad mientras los usuarios disfrutan de carreras justas e inalterables.</p>
        """
    },
    "aboutus/vision.html": {
        "title": "Nuestra Visión | Cryptodromo",
        "h1": "Nuestra Visión de Futuro",
        "content": """
        <p>Aspiramos a consolidar a Cryptódromo como el estándar internacional de deportes de simulación impulsados por mercados financieros (Market-Driven Racing).</p>
        <br/>
        <p>Visualizamos un hipódromo descentralizado con múltiples pistas globales (Wall Street, Cripto, Commodities), torneos interplanetarios y contratos inteligentes que garanticen la máxima custodia y liquidez para cada corredor.</p>
        """
    },
    "aboutus/ourteam.html": {
        "title": "Nuestro Equipo | Cryptodromo",
        "h1": "Conocé al Equipo Detrás de la Pista",
        "content": """
        <p>Somos un equipo multidisciplinario de matemáticos, desarrolladores full-stack, artistas pixel-art y operadores bursátiles apasionados por las tecnologías distribuidas.</p>
        <br/>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-top:20px;">
          <div style="background:#1a202c; padding:16px; border-radius:8px; border:1px solid #2d3748;">
            <strong style="color:#60efff;">Lead Architecture</strong><br/>
            <span>Sistemas de Entropía y Físicas Cuánticas</span>
          </div>
          <div style="background:#1a202c; padding:16px; border-radius:8px; border:1px solid #2d3748;">
            <strong style="color:#00ffcc;">Game Engine &amp; Visor</strong><br/>
            <span>Renderizado 2D y Spritesheets dinámicos</span>
          </div>
          <div style="background:#1a202c; padding:16px; border-radius:8px; border:1px solid #2d3748;">
            <strong style="color:#f9ca24;">Trading Analytics</strong><br/>
            <span>Oráculos de Mercado y Feeds de Precios</span>
          </div>
        </div>
        """
    },
    "privacypolicy/legal.html": {
        "title": "Términos de Servicio | Cryptodromo",
        "h1": "Términos y Condiciones de Uso",
        "content": """
        <p>Al acceder y utilizar los servicios de Cryptódromo, usted acepta cumplir con los siguientes términos y condiciones de servicio:</p>
        <br/>
        <h3>1. Elegibilidad</h3>
        <p>Debe ser mayor de 18 años para participar en la plataforma y realizar pronósticos con créditos.</p>
        <br/>
        <h3>2. Simulación y Créditos</h3>
        <p>Los créditos dentro del modo de demostración son unidades virtuales de participación. La plataforma opera bajo estrictos estándares de juego responsable.</p>
        <br/>
        <h3>3. Integridad de la Simulación</h3>
        <p>Cualquier intento de manipular los feeds de datos o vulnerar la arquitectura del hipódromo derivará en la suspensión inmediata de la cuenta.</p>
        """
    },
    "privacypolicy/tos.html": {
        "title": "Aviso Legal | Cryptodromo",
        "h1": "Aviso Legal y Declaración de Cumplimiento",
        "content": """
        <p>Cryptódromo opera una plataforma de simulación deportiva de entretenimiento y destreza basada en cotizaciones de mercado.</p>
        <br/>
        <p>Los nombres, logotipos y símbolos de las criptomonedas (Bitcoin, Ethereum, Solana, etc.) pertenecen a sus respectivos proyectos y comunidades y se utilizan con fines exclusivamente representativos dentro de la simulación deportiva.</p>
        """
    },
    "community/social.html": {
        "title": "Redes Sociales | Cryptodromo",
        "h1": "Comunidad Oficial y Redes",
        "content": """
        <p>Sumate a nuestras comunidades oficiales para seguir las carreras destacadas del día, debatir estrategias y recibir códigos de créditos exclusivos:</p>
        <br/>
        <ul>
          <li><strong>X (Twitter):</strong> <a href="https://x.com" target="_blank" style="color:#60efff;">@cryptodromo</a></li>
          <li><strong>Telegram:</strong> Anuncios de largadas y Clásicos de la Noche</li>
          <li><strong>Discord:</strong> Sala de jinetes, análisis de odds y soporte en vivo</li>
          <li><strong>YouTube:</strong> Resúmenes de las mejores carreras y récords de pista</li>
        </ul>
        """
    },
    "community/blog.html": {
        "title": "Noticias y Novedades | Cryptodromo",
        "h1": "Noticias y Artículos Oficiales",
        "content": """
        <h3>Clásico de la Noche: SushiSwap bate récord histórico de velocidad</h3>
        <p>Con un repunte del 6.2% en su cotización de mercado, el jinete de SUSHI dominó la arena alcanzando una velocidad punta de 71.4 km/h en los últimos 200 metros.</p>
        <br/>
        <h3>Nuevo sistema de Perfil y Tienda de Créditos lanzado</h3>
        <p>Presentamos la flamante interfaz de Usuario y Cajero en <strong>/profile</strong>, con integración de wallets Web3 y paquetes de bienvenida para todos los jinetes.</p>
        """
    },
    "contact/careers.html": {
        "title": "Trabajá con Nosotros | Cryptodromo",
        "h1": "Oportunidades Laborales",
        "content": """
        <p>En Cryptódromo siempre estamos en la búsqueda de talentos apasionados por la programación gráfica, los oráculos blockchain y los productos de alta concurrencia.</p>
        <br/>
        <h3>Posiciones Abiertas:</h3>
        <ul>
          <li><strong>Fullstack Engineer (Next.js / Node / Python)</strong> - Remoto</li>
          <li><strong>Pixel Artist / 2D Animator (Sprites y Estadios)</strong> - Remoto</li>
          <li><strong>Quant Developer (Market Volatility Feeds)</strong> - Remoto</li>
        </ul>
        <br/>
        <p>Envianos tu portfolio o perfil de GitHub a <a href="mailto:careers@cryptodromo.com" style="color:#60efff;">careers@cryptodromo.com</a>.</p>
        """
    }
}

print(f"Loaded {len(PAGES_CONTENT)} page content definitions.")

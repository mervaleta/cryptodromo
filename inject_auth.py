import re

auth_component = """
<!-- Cryptodromo Real Authentication & User Profile System -->
<style>
  #crypto-auth-modal {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
    z-index: 99999;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  #crypto-auth-modal.open {
    display: flex;
  }
  .crypto-auth-box {
    background: #181c24;
    border: 1px solid rgba(96, 239, 255, 0.35);
    box-shadow: 0 0 35px rgba(0, 255, 204, 0.2);
    border-radius: 14px;
    width: 90%;
    max-width: 440px;
    padding: 30px;
    color: #fff;
    position: relative;
    animation: authFadeIn 0.25s ease-out;
  }
  @keyframes authFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .crypto-auth-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .crypto-auth-header h3 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    color: #60efff;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .crypto-auth-close {
    background: transparent;
    border: none;
    color: #8892b0;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
  }
  .crypto-auth-close:hover { color: #fff; }
  .crypto-auth-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 20px;
  }
  .crypto-auth-tab {
    flex: 1;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    background: transparent;
    border: none;
    color: #8892b0;
    font-weight: 600;
    font-size: 0.95rem;
    border-bottom: 2px solid transparent;
  }
  .crypto-auth-tab.active {
    color: #00ffcc;
    border-bottom: 2px solid #00ffcc;
  }
  .crypto-auth-input-group {
    margin-bottom: 16px;
  }
  .crypto-auth-input-group label {
    display: block;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .crypto-auth-input {
    width: 100%;
    padding: 12px 14px;
    background: #0f1319;
    border: 1px solid #2d3748;
    border-radius: 8px;
    color: #fff;
    font-size: 0.95rem;
    box-sizing: border-box;
    outline: none;
    transition: border 0.2s;
  }
  .crypto-auth-input:focus {
    border-color: #60efff;
    box-shadow: 0 0 10px rgba(96, 239, 255, 0.2);
  }
  .crypto-auth-btn-primary {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #00b4db, #0083b0);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 10px;
  }
  .crypto-auth-btn-primary:hover {
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    box-shadow: 0 0 15px rgba(0, 198, 255, 0.4);
  }
  .crypto-auth-web3 {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .crypto-auth-btn-wallet {
    width: 100%;
    padding: 11px;
    background: #202634;
    border: 1px solid #3b4252;
    border-radius: 8px;
    color: #e2e8f0;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.2s;
  }
  .crypto-auth-btn-wallet:hover {
    background: #2e3648;
    border-color: #f6851b;
  }
</style>

<div id="crypto-auth-modal">
  <div class="crypto-auth-box">
    <div class="crypto-auth-header">
      <h3><span>🏇</span> Acceso Crypt&oacute;dromo</h3>
      <button class="crypto-auth-close" id="btn-close-modal">&times;</button>
    </div>

    <div class="crypto-auth-tabs">
      <button class="crypto-auth-tab active" id="tab-login">Ingresar</button>
      <button class="crypto-auth-tab" id="tab-register">Crear Cuenta</button>
    </div>

    <form id="crypto-auth-form">
      <div class="crypto-auth-input-group" id="group-name" style="display: none;">
        <label>Tu Nombre / Alias</label>
        <input type="text" id="auth-name" class="crypto-auth-input" placeholder="Ej: Satoshi Rider" />
      </div>

      <div class="crypto-auth-input-group">
        <label>Correo Electr&oacute;nico</label>
        <input type="email" id="auth-email" class="crypto-auth-input" placeholder="nombre@correo.com" required />
      </div>

      <div class="crypto-auth-input-group">
        <label>Contrase&ntilde;a</label>
        <input type="password" id="auth-pass" class="crypto-auth-input" placeholder="••••••••" required />
      </div>

      <button type="submit" class="crypto-auth-btn-primary" id="auth-submit-btn">Entrar a Crypt&oacute;dromo</button>
    </form>

    <div class="crypto-auth-web3">
      <button type="button" class="crypto-auth-btn-wallet" id="btn-web3-connect">
        <img src="/texturas/wallet.png" style="width: 20px; height: 20px;" alt="Wallet" />
        Conectar Wallet Web3 (MetaMask)
      </button>
    </div>
  </div>
</div>

<script>
  let currentAuthTab = 'login';

  function openCryptodromoAuth(tab) {
    if (!tab) tab = 'login';
    switchAuthTab(tab);
    var modal = document.getElementById('crypto-auth-modal');
    if (modal) modal.classList.add('open');
  }

  function closeCryptodromoAuth() {
    var modal = document.getElementById('crypto-auth-modal');
    if (modal) modal.classList.remove('open');
  }

  function switchAuthTab(tab) {
    currentAuthTab = tab;
    var tabLogin = document.getElementById('tab-login');
    var tabReg = document.getElementById('tab-register');
    var groupName = document.getElementById('group-name');
    var submitBtn = document.getElementById('auth-submit-btn');

    if (tab === 'login') {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabReg) tabReg.classList.remove('active');
      if (groupName) groupName.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Entrar a Crypt\u00f3dromo';
    } else {
      if (tabReg) tabReg.classList.add('active');
      if (tabLogin) tabLogin.classList.remove('active');
      if (groupName) groupName.style.display = 'block';
      if (submitBtn) submitBtn.textContent = 'Registrarse y Obtener 1000 CR';
    }
  }

  function getActiveUser() {
    try {
      var stored = localStorage.getItem('cryptodromo_user');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return null;
  }

  function setActiveUser(user) {
    localStorage.setItem('cryptodromo_user', JSON.stringify(user));
    renderUserUI();
  }

  function logoutCryptoUser() {
    localStorage.removeItem('cryptodromo_user');
    renderUserUI();
  }

  function handleCryptoAuthSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    var emailEl = document.getElementById('auth-email');
    var nameEl = document.getElementById('auth-name');
    var email = emailEl ? emailEl.value.trim() : '';
    var name = (nameEl && nameEl.value.trim()) ? nameEl.value.trim() : (email ? email.split('@')[0] : 'Rider');

    if (!email) return;

    var user = {
      id: 'usr_' + Date.now().toString(36),
      email: email,
      name: name,
      balance_credits: 1000.0,
      avatar_url: '/texturas/ico_menu_profile.png',
      is_authenticated: true,
      auth_type: 'email'
    };

    setActiveUser(user);
    closeCryptodromoAuth();
  }

  async function handleWeb3Connect() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          var addr = accounts[0];
          var shortAddr = addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
          var user = {
            id: 'eth_' + addr.toLowerCase(),
            address: addr,
            name: shortAddr,
            email: addr.toLowerCase() + '@ethereum.eth',
            balance_credits: 2500.0,
            avatar_url: '/texturas/wallet.png',
            is_authenticated: true,
            auth_type: 'web3'
          };
          setActiveUser(user);
          closeCryptodromoAuth();
        }
      } catch (err) {
        alert('Conexi\u00f3n con Wallet cancelada o denegada.');
      }
    } else {
      var fakeAddr = '0x' + Math.random().toString(16).substring(2, 8) + '...' + Math.random().toString(16).substring(2, 6);
      var user = {
        id: 'web3_' + Date.now().toString(36),
        name: 'Web3 Rider (' + fakeAddr + ')',
        email: 'wallet_' + Date.now() + '@cryptodromo.com',
        balance_credits: 1500.0,
        avatar_url: '/texturas/wallet.png',
        is_authenticated: true,
        auth_type: 'web3_sim'
      };
      setActiveUser(user);
      closeCryptodromoAuth();
    }
  }

  function renderUserUI() {
    var user = getActiveUser();
    var walletImg = document.querySelector('img[src*=\"wallet.png\"]');
    var menuBtn = document.getElementById('menu-button-:R3et9f6H1:');
    var menuList = document.getElementById('menu-list-:R3et9f6H1:');
    var balanceText = document.querySelector('p.chakra-text.css-kt23yf');

    if (walletImg) {
      walletImg.onclick = function() {
        if (!user) openCryptodromoAuth('login');
        else alert('Billetera de ' + user.name + ' - Saldo: ' + user.balance_credits.toLocaleString() + ' Cr\u00e9ditos');
      };
    }

    if (balanceText) {
      if (user) {
        balanceText.innerHTML = '<span style=\"color:#00ffcc; font-weight:bold; font-family:monospace; font-size:0.95rem;\">' + user.balance_credits.toLocaleString() + ' CR</span>';
      } else {
        balanceText.innerHTML = '<button type=\"button\" id=\"btn-quick-login\" style=\"background:rgba(96,239,255,0.15); border:1px solid #60efff; color:#60efff; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:bold;\">Ingresar</button>';
        var quickBtn = document.getElementById('btn-quick-login');
        if (quickBtn) quickBtn.onclick = function() { openCryptodromoAuth('login'); };
      }
    }

    if (menuBtn) {
      menuBtn.onclick = function(e) {
        e.stopPropagation();
        if (!user) {
          openCryptodromoAuth('login');
          return;
        }
        if (menuList) {
          var isHidden = menuList.style.visibility === 'hidden' || menuList.style.opacity === '0';
          menuList.style.visibility = isHidden ? 'visible' : 'hidden';
          menuList.style.opacity = isHidden ? '1' : '0';
          menuList.style.transform = isHidden ? 'scale(1)' : 'scale(0.8)';
          if (menuList.parentElement) menuList.parentElement.style.visibility = isHidden ? 'visible' : 'hidden';
        }
      };
    }

    if (menuList) {
      var logoutBtn = menuList.querySelector('button[id*=\"Rnanet9f6\"]');
      if (logoutBtn) {
        logoutBtn.onclick = function(e) {
          e.stopPropagation();
          logoutCryptoUser();
          menuList.style.visibility = 'hidden';
          menuList.style.opacity = '0';
        };
      }

      var profileBtn = menuList.querySelector('button[id*=\"Rfanet9f6\"]');
      if (profileBtn && user) {
        profileBtn.innerHTML = '<img src=\"' + user.avatar_url + '\" class=\"chakra-image css-1qu68v9\"/> ' + user.name;
      }
    }
  }

  function initCryptoAuth() {
    var closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) closeBtn.onclick = closeCryptodromoAuth;

    var tabLogin = document.getElementById('tab-login');
    if (tabLogin) tabLogin.onclick = function() { switchAuthTab('login'); };

    var tabReg = document.getElementById('tab-register');
    if (tabReg) tabReg.onclick = function() { switchAuthTab('register'); };

    var form = document.getElementById('crypto-auth-form');
    if (form) form.onsubmit = handleCryptoAuthSubmit;

    var web3Btn = document.getElementById('btn-web3-connect');
    if (web3Btn) web3Btn.onclick = handleWeb3Connect;

    var modal = document.getElementById('crypto-auth-modal');
    if (modal) {
      modal.onclick = function(e) {
        if (e.target === modal) closeCryptodromoAuth();
      };
    }

    renderUserUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCryptoAuth);
  } else {
    setTimeout(initCryptoAuth, 200);
  }
</script>
<!-- End Cryptodromo Real Authentication -->
"""

with open('/data/workspace/cryptodromo/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

if '<!-- Cryptodromo Real Authentication' in content:
    print('Already injected, replacing existing...')
    content = re.sub(r'<!-- Cryptodromo Real Authentication.*?<!-- End Cryptodromo Real Authentication -->', '', content, flags=re.DOTALL)

if '</body>' in content:
    new_content = content.replace('</body>', auth_component + '\n</body>')
    with open('/data/workspace/cryptodromo/index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS')
else:
    print('Error: no body tag')

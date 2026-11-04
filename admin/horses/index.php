<?php
declare(strict_types=1);
require __DIR__.'/../fixture/_auth.php';
header('Content-Type: text/html; charset=utf-8');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#08110f">
<title>Cryptódromo · Editor de caballos</title>
<link rel="stylesheet" href="./editor.css"><link rel="icon" href="/assets/cryptodromo-logo.png">
</head>
<body>
<header class="masthead">
 <a class="brand" href="/"><img src="/assets/cryptodromo-logo.png" alt=""><span>CRYPTÓDROMO <small>ESTUDIO DE CABALLOS</small></span></a>
 <nav aria-label="Administración"><a href="/admin/fixture/">Fixture</a><a href="/racers/">Plantel público</a><a href="/">Estadio</a></nav>
</header>
<main>
 <div class="heading"><div><p class="eyebrow">ADMINISTRACIÓN · ESTUDIO DE IDENTIDADES</p><h1>Horse Atelier <span>100</span></h1>
 <p>Un caballo maestro compartido. Cien personalidades, colores y fichas independientes.</p></div>
 <div class="master-label"><span class="status-dot"></span><div><strong>BTC · MASTER 3D</strong><small>Integración visual pendiente de aprobación</small></div></div></div>
 <p class="notice" id="message" role="status" aria-live="polite">Conectando el editor privado…</p>
 <div class="workspace">
 <aside class="roster-panel" aria-label="Seleccionar corredor">
 <div class="roster-head"><strong>PLANTEL</strong><span id="counts">100 caballos</span></div>
 <input id="search" type="search" placeholder="Buscar BTC, Solana…" aria-label="Buscar un caballo">
 <select id="tier" aria-label="Filtrar categoría"><option value="all">Todas las categorías</option><option value="star">Estrellas</option><option value="core">Principales</option><option value="challenger">Desafiantes</option></select>
 <div id="roster" class="roster-list" role="list"></div>
 </aside>
 <section class="editor-panel">
 <div class="section-top"><div><p class="eyebrow">FICHA INDIVIDUAL</p><h2 id="selected-title">BTC <span>Bitcoin</span></h2><p id="save-status" class="muted">Sin modificaciones</p></div><div class="chip-group"><span class="chip" id="current-tier">ESTRELLA</span><span class="chip" id="current-publish">BASE</span></div></div>
 <div class="tabs" role="tablist" aria-label="Campos del caballo"><button type="button" data-tab="identity" class="active" aria-selected="true">Identidad</button><button type="button" data-tab="appearance" aria-selected="false">Pelaje y materiales</button><button type="button" data-tab="networks" aria-selected="false">Redes y enlaces</button></div>
 <form id="horse-form" autocomplete="off">
  <fieldset class="tab-panel" data-panel="identity"><legend class="sr-only">Identidad</legend>
   <div class="field-grid"><label>Nombre de pista <input name="name" maxlength="80" required></label><label>Apodo <input name="nickname" maxlength="80" placeholder="Ej: El relámpago naranja"></label></div>
   <label>Lema <input name="tagline" maxlength="160" placeholder="Una frase para presentar al corredor"></label>
   <label>Biografía <textarea name="biography" maxlength="1800" rows="8" placeholder="Origen, carácter, rivalidades, logros y relato del caballo…"></textarea></label>
   <div class="logo-uploader"><h3>Logo del token</h3><p class="muted tiny">Identifica al proyecto de la criptomoneda, no a un equipo. PNG, JPG o WebP de hasta 2 MB. Los archivos SVG no se admiten.</p><div class="logo-controls"><input type="file" id="logo-file" accept="image/png,image/jpeg,image/webp" aria-label="Elegir logo del token"><button id="upload-logo" type="button">Cargar logo</button><button id="remove-logo" type="button" class="quiet">Quitar logo</button></div><p id="logo-status" class="muted tiny" role="status">Sin logo personalizado</p></div><p class="muted tiny">La ficha narrativa es independiente del activo y de su rendimiento en carrera.</p>
  </fieldset>
  <fieldset class="tab-panel" data-panel="appearance" hidden><legend class="sr-only">Pelaje y materiales</legend>
   <div class="field-grid"><label>Apariencia del pelaje<select name="appearanceMode"><option value="brand_colored">Color de marca (actual)</option><option value="natural_coat">Pelaje natural</option></select></label><label>Largo de crin <select name="maneStyle"><option value="short">Corto</option><option value="medium" selected>Medio</option><option value="long">Largo</option></select></label><label>Largo de cola <select name="tailStyle"><option value="short">Corto</option><option value="medium" selected>Medio</option><option value="long">Largo</option></select></label></div>
   <p class="muted tiny">Elegí cada color con el selector o ingresá un valor hexadecimal exacto (#RRGGBB). Ambos controles permanecen sincronizados.</p><div id="color-fields" class="color-grid"></div>
   <div class="field-grid range-grid"><label>Volumen de la crin <span id="maneScale-output">1.00×</span><input type="range" name="maneScale" min="0.65" max="1.85" step="0.05" value="1"></label><label>Volumen de la cola <span id="tailScale-output">1.00×</span><input type="range" name="tailScale" min="0.65" max="1.85" step="0.05" value="1"></label></div>
   <p class="muted tiny">Los campos individuales quedan listos para conectarse al modelo BTC aprobado. Esta previsualización vectorial distingue las capas disponibles actualmente; crin y cola 3D se separarán mediante el adaptador.</p>
  </fieldset>
  <fieldset class="tab-panel" data-panel="networks" hidden><legend class="sr-only">Redes y enlaces</legend>
   <p class="muted">Registrá las redes blockchain donde existe el activo. No son redes sociales ni categorías de competición.</p>
   <div class="network-title"><strong>Redes blockchain</strong><button type="button" id="add-network">+ Agregar red</button></div>
   <div id="network-list"></div>
   <h3>Enlaces del proyecto del token</h3><div class="field-grid"><label>Sitio web <input type="url" name="website" maxlength="350" placeholder="https://…"></label><label>X / Twitter <input type="url" name="x" maxlength="350" placeholder="https://x.com/…"></label><label>Telegram <input type="url" name="telegram" maxlength="350" placeholder="https://t.me/…"></label><label>Discord <input type="url" name="discord" maxlength="350" placeholder="https://discord.gg/…"></label></div>
  </fieldset>
  <div class="actions"><button id="save" type="submit" class="primary">Guardar borrador</button><button id="publish" type="button" class="publish">Publicar este caballo</button><button id="reset" type="button" class="quiet">Restaurar original</button></div>
 </form>
 </section>
 <aside class="preview-panel"><div class="preview-header"><strong>VISTA PREVIA</strong><span>MASTER VECTORIAL · 12 POSES</span></div>
 <div class="preview-stage"><svg id="horse-svg" viewBox="0 0 170 170" role="img" aria-label="Vista previa animada del caballo"><title>Caballo en movimiento</title></svg><p class="preview-symbol" id="preview-symbol">BTC</p></div>
 <div class="profile-card"><div class="logo-preview"><img id="logo-preview" alt="Logo del token" hidden><span id="logo-placeholder">SIN LOGO</span></div><h3 id="preview-name">Bitcoin</h3><p id="preview-tagline">Ficha de carrera</p><div id="preview-color" class="preview-color"></div></div>
 <a id="open-racer" href="/racers/#BTC" target="_blank" rel="noopener noreferrer" class="preview-link">Abrir visor 3D actual</a>
 <p class="small-note">El visor 3D público aún no aplica estos borradores. Después de aprobar el nuevo BTC, el adaptador usará la misma configuración para todos los tokens, sin duplicar modelos.</p>
 </aside>
 </div>
 <footer><span>Las fichas cambian identidad y estética. Nunca alteran precios, rankings, fixture ni resultados.</span><span id="revision">Revisión: 0</span></footer>
</main>
<script type="module" src="./editor.js"></script>
</body>
</html>

<?php
declare(strict_types=1);
require __DIR__.'/fixture/_auth.php';
header('Content-Type: text/html; charset=utf-8');
header("Content-Security-Policy: default-src 'self'; style-src 'self'; img-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#08110f"><title>Cryptódromo · Administración</title><link rel="stylesheet" href="/admin/horses/editor.css"></head><body>
<header class="masthead"><a class="brand" href="/"><img src="/assets/cryptodromo-logo.png" alt=""><span>CRYPTÓDROMO <small>ADMINISTRACIÓN</small></span></a><nav><a href="/">Ver estadio</a><a href="/racers/">Ver corredores</a></nav></header>
<main><section class="heading"><div><p class="eyebrow">PANEL ADMINISTRATIVO</p><h1>Dirección de Cryptódromo</h1><p>Herramientas de configuración separadas del motor financiero.</p></div></section>
<div class="workspace"><section class="editor-panel"><p class="eyebrow">ESTUDIO DE IDENTIDAD</p><h2>Horse Atelier</h2><p class="muted">Editá nombre, biografía, redes blockchain, picker y hexadecimal, pelo corto/medio/largo, logos, pelaje, crin, cola, pezuñas y más, con borradores privados y publicación por corredor.</p><p><a class="preview-link" href="/admin/horses/">Entrar al editor de caballos</a></p></section><section class="editor-panel"><p class="eyebrow">DIRECCIÓN DE CARRERAS</p><h2>Fixture</h2><p class="muted">Administrá borradores del calendario sintético y consultá simulaciones sin alterar los resultados oficiales.</p><p><a class="preview-link" href="/admin/fixture/">Entrar al fixture</a></p></section></div>
<footer>Este panel requiere autenticación administrativa. No permite editar cotizaciones ni resultados deportivos.</footer></main></body></html>

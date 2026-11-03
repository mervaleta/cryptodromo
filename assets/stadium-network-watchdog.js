/* Classic-script fallback: never leave world pages stuck on "Preparando".
 * Intentionally ES5-style to run even if module execution fails.
 */
(function () {
  var root=document.getElementById('world-app');
  if(!root)return;
  function fallback() {
    if(root.dataset.worldReady==='1')return;
    root.innerHTML='<section class="world-panel world-boot-error" role="alert"><span class="world-eyebrow">CRYPTÓDROMO WORLD</span><h1>No se pudo cargar esta sección.</h1><p>El calendario mundial no está disponible en este momento. Podés volver a intentarlo o consultar el fixture cripto que sigue funcionando.</p><div class="world-actions"><button type="button" id="world-try-again" class="world-button world-button-primary">Reintentar</button><a class="world-button world-button-ghost" href="/fixture/">Fixture cripto</a><a class="world-button world-button-ghost" href="/estadio/">Explorador 3D</a></div></section>';
    var retry=document.getElementById('world-try-again');
    if(retry)retry.addEventListener('click',function(){location.reload();});
  }
  window.addEventListener('DOMContentLoaded',function(){
    window.setTimeout(fallback,6500);
  },{once:true});
})();

/* Optional, framework-agnostic accessible shortcut menus. No dependencies. */
export function initCrpShortcuts(root=document){
 const toggles=[...root.querySelectorAll('[data-crp-shortcut]')];
 function close(except){for(const b of toggles){if(b===except)continue;b.setAttribute('aria-expanded','false');const m=document.getElementById(b.getAttribute('aria-controls'));if(m)m.hidden=true}}
 for(const b of toggles){const m=document.getElementById(b.getAttribute('aria-controls'));if(!m)continue;
 b.setAttribute('aria-expanded','false');m.hidden=true;
 b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')==='true';close();b.setAttribute('aria-expanded',String(!open));m.hidden=open;if(!open)m.querySelector('a,button')?.focus()});
 b.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if(b.getAttribute('aria-expanded')!=='true')b.click();else m.querySelector('a,button')?.focus()}});
 m.addEventListener('keydown',e=>{if(e.key==='Escape'){close();b.focus()}});
 }
 root.addEventListener('pointerdown',e=>{if(!e.target.closest('.crp-shortcut'))close()});
 root.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 return ()=>close();
}

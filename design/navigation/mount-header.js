/* Staged integration helper. Only call after existing page header is located and reviewed. */
import {initCrpShortcuts} from './crp-shortcuts.js';
export function mountCrpHeader(markup,options={}){
 const selector=options.selector||'header.sitebar,header.top,header.bar';
 const existing=document.querySelector(selector);
 if(!existing)throw new Error('CRP header: existing header not found; no DOM changes made');
 const tpl=document.createElement('template');tpl.innerHTML=markup.trim();
 const next=tpl.content.firstElementChild;
 if(!next||!next.matches('[data-crp-header]'))throw new Error('CRP header: invalid markup');
 const path=location.pathname.replace(/\/index\.html$/,'/');
 const links=[...next.querySelectorAll('[data-crp-route]')];
 links.forEach(a=>{if(a.getAttribute('data-crp-route')===path)a.setAttribute('aria-current','page')});
 existing.replaceWith(next);
 initCrpShortcuts(next);
 return next;
}

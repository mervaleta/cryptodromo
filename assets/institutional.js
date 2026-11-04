const menuButton=document.querySelector('.menubtn');
const menu=document.querySelector('.navlinks');
if(menuButton&&menu){menuButton.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});}
document.querySelectorAll('[data-year]').forEach(node=>node.textContent=new Date().getFullYear());

/* Include inventory on legacy institutional pages without the universal navigation. */
if(!document.querySelector('script[src*="/assets/ad-inventory.js"]')){const advertising=document.createElement('script');advertising.src='/assets/ad-inventory.js?v=1';advertising.defer=true;document.head.appendChild(advertising)}

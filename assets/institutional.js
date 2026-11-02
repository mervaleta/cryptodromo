const menuButton=document.querySelector('.menubtn');
const menu=document.querySelector('.navlinks');
if(menuButton&&menu){menuButton.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});}
document.querySelectorAll('[data-year]').forEach(node=>node.textContent=new Date().getFullYear());

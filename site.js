const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});}

// Akili Studio typography: Caviar Dreams remains the primary display typeface; Montserrat is the secondary typeface.
const caviarFont=document.createElement('link');
caviarFont.rel='stylesheet';
caviarFont.href='https://fonts.bunny.net/css?family=Caviar+Dreams:400,700&display=swap';
document.head.appendChild(caviarFont);

const montserratFont=document.createElement('link');
montserratFont.rel='stylesheet';
montserratFont.href='https://fonts.googleapis.com/css2?family=Montserrat:wght@400&display=swap';
document.head.appendChild(montserratFont);

const typography=document.createElement('style');
typography.textContent=`:root{--font:'Caviar Dreams',Arial,sans-serif;--font-secondary:'Montserrat',Arial,sans-serif}body{font-family:var(--font-secondary)}h1,h2,h3,blockquote,cite{font-family:var(--font)}.brand-logo{font-family:var(--font)}`;
document.head.appendChild(typography);

// Quiet-luxury reveal motion: restrained, lightweight and accessibility-aware.
const revealTargets=document.querySelectorAll('main>section,.project-card,.case-card,.service-copy,.contact-grid>* ,.about-image,.project-gallery img');
revealTargets.forEach((el,index)=>{el.classList.add('reveal');el.style.transitionDelay=`${Math.min(index*35,280)}ms`;});

if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.12,rootMargin:'0px 0px -40px'});
 revealTargets.forEach(el=>observer.observe(el));
}else{revealTargets.forEach(el=>el.classList.add('is-visible'));}

// Keep the mobile navigation closed after selecting a page.
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>{if(nav&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}}));

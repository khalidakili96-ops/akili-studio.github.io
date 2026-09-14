const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});}

// Akili Studio typography is loaded statically in each page <head>.

// Refined scroll reveals with staggered timing.
const revealTargets=document.querySelectorAll('main>section,.project-card,.case-card,.service-copy,.contact-grid>* ,.about-image,.project-gallery img');
revealTargets.forEach((el,index)=>{el.classList.add('reveal');el.style.transitionDelay=`${Math.min(index*35,280)}ms`;});
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.12,rootMargin:'0px 0px -40px'});
 revealTargets.forEach(el=>observer.observe(el));
}else{revealTargets.forEach(el=>el.classList.add('is-visible'));}

// Main-page project storytelling: quietly cycle through multiple project images.
document.querySelectorAll('.project-card[data-gallery]').forEach(card=>{
 const media=card.querySelector('.project-media');
 if(!media)return;
 let images=[];
 try{images=JSON.parse(card.dataset.gallery);}catch(e){return;}
 if(!Array.isArray(images)||images.length<2)return;
 const original=media.querySelector('img');
 if(original)original.remove();
 images.forEach((src,index)=>{
   const img=document.createElement('img');
   img.className=`project-slide${index===0?' is-active':''}`;
   img.src=src;
   img.alt=card.dataset.alt||'';
   img.loading=index===0?'eager':'lazy';
   media.appendChild(img);
 });
 const progress=document.createElement('div');
 progress.className='project-progress';
 progress.innerHTML='<span></span>';
 media.appendChild(progress);
 const counter=document.createElement('span');
 counter.className='project-index';
 counter.textContent=`01 / ${String(images.length).padStart(2,'0')}`;
 media.appendChild(counter);
 let current=0;
 let timer=null;
 const advance=()=>{
   const slides=media.querySelectorAll('.project-slide');
   if(!slides.length)return;
   slides[current].classList.remove('is-active');
   current=(current+1)%slides.length;
   slides[current].classList.add('is-active');
   counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
   const bar=progress.querySelector('span');
   bar.style.animation='none';
   void bar.offsetWidth;
   bar.style.animation='projectProgress 3.8s linear infinite';
 };
 const start=()=>{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!timer)timer=setInterval(advance,3800);};
 const stop=()=>{if(timer){clearInterval(timer);timer=null;}};
 card.addEventListener('mouseenter',stop);
 card.addEventListener('mouseleave',start);
 card.addEventListener('focusin',stop);
 card.addEventListener('focusout',start);
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 start();
});

// Very subtle hero depth effect on desktop; disabled for touch and reduced-motion users.
const heroContent=document.querySelector('.hero-home .hero-content');
if(heroContent&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!('ontouchstart' in window)){
 window.addEventListener('scroll',()=>{
   const y=Math.min(window.scrollY*.08,36);
   heroContent.style.transform=`translate3d(0,${y}px,0)`;
 },{passive:true});
}

// Keep mobile navigation closed after selecting a page.
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>{if(nav&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}}));

// Load the global Akili typography contract on every page, including mobile.
if(!document.querySelector('link[data-akili-typography]')){
 const typography=document.createElement('link');
 typography.rel='stylesheet';
 typography.href='typography.css?v=5';
 typography.dataset.akiliTypography='true';
 document.head.appendChild(typography);
}

const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});}

const revealTargets=document.querySelectorAll('main>section,.project-card,.case-card,.service-copy,.contact-grid>* ,.about-image,.project-gallery img');
revealTargets.forEach((el,index)=>{el.classList.add('reveal');el.style.transitionDelay=`${Math.min(index*35,280)}ms`;});
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.12,rootMargin:'0px 0px -40px'});
 revealTargets.forEach(el=>observer.observe(el));
}else{revealTargets.forEach(el=>el.classList.add('is-visible'));}

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchDevice='ontouchstart' in window || navigator.maxTouchPoints>0;

document.querySelectorAll('.project-card[data-gallery]').forEach(card=>{
 const media=card.querySelector('.project-media');
 if(!media)return;
 let images=[];
 try{images=JSON.parse(card.dataset.gallery);}catch(e){return;}
 if(!Array.isArray(images)||images.length<2)return;
 media.replaceChildren();
 images.forEach((src,index)=>{
   const img=document.createElement('img');
   img.className=`project-slide${index===0?' is-active':''}`;
   img.src=src;
   img.alt=card.dataset.alt||'';
   img.loading='eager';
   img.decoding='async';
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
 card.classList.add('has-gallery');
 let current=0;
 const restartProgress=()=>{
   const bar=progress.querySelector('span');
   if(!bar)return;
   bar.style.animation='none';
   void bar.offsetWidth;
   bar.style.animation='projectProgress 3.8s linear infinite';
 };
 const advance=()=>{
   const slides=media.querySelectorAll('.project-slide');
   if(slides.length<2)return;
   slides[current].classList.remove('is-active');
   current=(current+1)%slides.length;
   slides[current].classList.add('is-active');
   counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
   restartProgress();
 };
 restartProgress();
 window.setInterval(advance,3800);
 if(!touchDevice&&!reducedMotion){
   card.addEventListener('pointermove',event=>{
     const rect=card.getBoundingClientRect();
     const x=(event.clientX-rect.left)/rect.width-.5;
     const y=(event.clientY-rect.top)/rect.height-.5;
     card.style.setProperty('--tilt-x',`${(y*-2.2).toFixed(2)}deg`);
     card.style.setProperty('--tilt-y',`${(x*2.2).toFixed(2)}deg`);
     card.classList.add('is-pointer-active');
   });
   card.addEventListener('pointerleave',()=>{
     card.classList.remove('is-pointer-active');
     card.style.setProperty('--tilt-x','0deg');
     card.style.setProperty('--tilt-y','0deg');
   });
 }
});

if(!touchDevice && !reducedMotion){
 document.querySelectorAll('.service-grid article').forEach(service=>{
   service.addEventListener('pointerenter',()=>{
     document.querySelectorAll('.service-grid article').forEach(item=>{
       item.style.opacity=item===service?'1':'.48';
       if(item===service){
         item.style.transform='translateY(-10px) scale(1.10)';
         item.style.zIndex='20';
         item.style.boxShadow='0 30px 70px rgba(0,0,0,.34)';
       }else{
         item.style.transform='scale(1)';
         item.style.zIndex='1';
         item.style.boxShadow='none';
       }
     });
   });
   service.addEventListener('pointerleave',()=>{
     document.querySelectorAll('.service-grid article').forEach(item=>{
       item.style.opacity='1';
       item.style.transform='scale(1)';
       item.style.zIndex='1';
       item.style.boxShadow='none';
     });
   });
 });
}

const heroContent=document.querySelector('.hero-home .hero-content');
if(heroContent&&!reducedMotion&&!touchDevice){window.addEventListener('scroll',()=>{const y=Math.min(window.scrollY*.08,36);heroContent.style.transform=`translate3d(0,${y}px,0)`;},{passive:true});}
const header=document.querySelector('.site-header');
if(header&&!reducedMotion){const updateHeader=()=>header.classList.toggle('is-scrolled',window.scrollY>24);updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});}
document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>{if(nav&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}}));

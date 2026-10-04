const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
if(menu&&nav){
 const focusableSelector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
 const announcement=document.createElement('div');
 announcement.id='site-announcement';
 announcement.className='sr-only';
 announcement.setAttribute('role','status');
 announcement.setAttribute('aria-live','polite');
 announcement.setAttribute('aria-atomic','true');
 document.body.appendChild(announcement);
 let lastMenuTrigger=menu;
 const setAnnouncement=message=>{announcement.textContent=message;};
 const setNavState=open=>{
   nav.classList.toggle('open',open);
   document.documentElement.classList.toggle('nav-open',open);
   document.body.classList.toggle('nav-open',open);
   menu.setAttribute('aria-expanded',String(open));
   menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
   menu.textContent=open?'Close':'Menu';
   if(open){
     lastMenuTrigger=document.activeElement||menu;
     const firstLink=nav.querySelector('a');
     if(firstLink)firstLink.focus();
     setAnnouncement('Navigation menu opened.');
   }else{
     setAnnouncement('Navigation menu closed.');
     if(lastMenuTrigger&&typeof lastMenuTrigger.focus==='function')lastMenuTrigger.focus();
   }
 };
 const toggleNavigation=event=>{event.preventDefault();event.stopPropagation();setNavState(!nav.classList.contains('open'));};
 menu.addEventListener('click',toggleNavigation);
 document.addEventListener('keydown',event=>{
   if(!nav.classList.contains('open'))return;
   if(event.key==='Escape'){event.preventDefault();setNavState(false);return;}
   if(event.key!=='Tab')return;
   const focusables=[...nav.querySelectorAll(focusableSelector),menu].filter(el=>el.getClientRects().length>0);
   if(!focusables.length)return;
   const first=focusables[0],last=focusables[focusables.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 document.addEventListener('click',event=>{
   if(!nav.classList.contains('open'))return;
   if(!nav.contains(event.target)&&!menu.contains(event.target))setNavState(false);
 });
 window.addEventListener('resize',()=>{if(window.innerWidth>760&&nav.classList.contains('open'))setNavState(false);},{passive:true});
}

const isProjectDetail=!!document.querySelector('.villa-hero,.celeste-hero,.dolce-hero');
const revealTargets=isProjectDetail?document.querySelectorAll('.project-card,.case-card,.service-copy,.contact-grid>* ,.about-image,.project-gallery img'):document.querySelectorAll('main>section:not(.hero-home),.project-card,.case-card,.service-copy,.contact-grid>* ,.about-image,.project-gallery img');
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
 if(touchDevice&&images.length>4)images=images.slice(0,4);

 // Keep only the first frame in the initial DOM. Additional gallery frames are
 // requested on demand when the card is visible, preventing below-the-fold
 // portfolio imagery from competing with the homepage hero and LCP.
 const makeSlide=(src,index)=>{
   const img=document.createElement('img');
   img.className=`project-slide${index===0?' is-active':''}`;
   img.src=src;
   img.alt=card.dataset.alt||'';
   img.loading='lazy';
   img.decoding='async';
   img.dataset.gallerySrc=src;
   if(index>0)img.dataset.deferred='true';
   return img;
 };
 const first=media.querySelector('.project-slide.is-active')||media.querySelector('.project-slide');
 media.replaceChildren();
 if(first){
   first.className='project-slide is-active';
   first.alt=card.dataset.alt||'';
   first.loading='lazy';
   first.decoding='async';
   const initialSrc=first.dataset.src||first.getAttribute('src');
   first.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3C/svg%3E';
   first.dataset.deferred='true';
   media.appendChild(first);
 }else{
   media.appendChild(makeSlide(images[0],0));
 }
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
 let galleryTimer=null;
 let loadedCount=1;

 const loadSlide=(index)=>{
   if(index<0||index>=images.length)return;
   let slide=media.querySelectorAll('.project-slide')[index];
   if(!slide){
     slide=makeSlide(images[index],index);
     media.insertBefore(slide,progress);
   }
   if(slide.dataset.deferred==='true'){
     slide.src=images[index];
     slide.removeAttribute('data-deferred');
     loadedCount=Math.max(loadedCount,index+1);
   }
 };

 const restartProgress=()=>{
   const bar=progress.querySelector('span');
   if(!bar)return;
   bar.style.animation='none';
   requestAnimationFrame(()=>{bar.style.animation='projectProgress 3.8s linear infinite';});
 };
 const advance=()=>{
   const slides=media.querySelectorAll('.project-slide');
   if(current+1>=images.length)return;
   loadSlide(current+1);
   const next=media.querySelectorAll('.project-slide')[current+1];
   if(!next)return;
   slides[current]?.classList.remove('is-active');
   current++;
   next.classList.add('is-active');
   counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;
   restartProgress();
   // Warm one frame ahead without loading the entire gallery.
   if(current+1<images.length)loadSlide(current+1);
 };
 const startGallery=()=>{
   if(galleryTimer||reducedMotion)return;
   loadSlide(0);
   loadSlide(1);
   restartProgress();
   galleryTimer=window.setInterval(advance,3800);
 };
 const stopGallery=()=>{
   if(!galleryTimer)return;
   window.clearInterval(galleryTimer);
   galleryTimer=null;
 };
 if('IntersectionObserver' in window){
   const galleryObserver=new IntersectionObserver(entries=>{
     entries.forEach(entry=>entry.isIntersecting?startGallery():stopGallery());
   },{threshold:.05,rootMargin:'120px 0px'});
   galleryObserver.observe(card);
 }else{
   startGallery();
 }
 if(!touchDevice&&!reducedMotion){
   let pointerRect=null;
   card.addEventListener('pointerenter',()=>{pointerRect=card.getBoundingClientRect();});
   card.addEventListener('pointermove',event=>{
     const rect=pointerRect||card.getBoundingClientRect();
     const x=(event.clientX-rect.left)/rect.width-.5;
     const y=(event.clientY-rect.top)/rect.height-.5;
     card.style.setProperty('--tilt-x',`${(y*-2.2).toFixed(2)}deg`);
     card.style.setProperty('--tilt-y',`${(x*2.2).toFixed(2)}deg`);
     card.classList.add('is-pointer-active');
   });
   card.addEventListener('pointerleave',()=>{
     pointerRect=null;
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
if(heroContent&&!reducedMotion&&!touchDevice){let heroScrollFrame=0;window.addEventListener('scroll',()=>{if(heroScrollFrame)return;heroScrollFrame=requestAnimationFrame(()=>{heroScrollFrame=0;const y=Math.min(window.scrollY*.08,36);heroContent.style.transform=`translate3d(0,${y}px,0)`;});},{passive:true});}
const header=document.querySelector('.site-header');
if(header&&!reducedMotion){const updateHeader=()=>header.classList.toggle('is-scrolled',window.scrollY>24);updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});}



// Defer heavy hero video downloads until the page has loaded; the poster remains the immediate visual.
document.querySelectorAll('video[data-defer-video]').forEach(video=>{
 const source=video.querySelector('source[data-src]');
 if(!source)return;
 const loadVideo=()=>{
   if(video.dataset.loaded)return;
   video.dataset.loaded='true';
   source.src=source.dataset.src;
   video.load();
   video.play().catch(()=>{});
 };
 if('requestIdleCallback' in window) window.requestIdleCallback(loadVideo,{timeout:1800});
 else window.setTimeout(loadVideo,900);
});

// Keep image boxes stable while assets decode, reducing layout shift on portfolio pages.
document.querySelectorAll('.project-gallery img,.villa-gallery img,.case-card img,.project-card img,.about6-hero-media img,.about6-close img').forEach(img=>{
 if(!img.closest('.residenza-gallery'))img.style.contentVisibility='visible';
});

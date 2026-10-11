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
 // New galleries carry responsive metadata; retain support for legacy strings.
 images=images.map(image=>typeof image==='string'?{src:image}:image);
 if(touchDevice&&images.length>4)images=images.slice(0,4);

 const setSlideSource=(img,image)=>{
   if(image.width&&image.height){img.width=image.width;img.height=image.height;}
   if(image.srcset){
     // object-fit:cover can require more pixels than the card's visible width.
     const ratio=image.width/image.height;
     const box=media.getBoundingClientRect();
     img.sizes=`${Math.ceil(Math.max(box.width,box.height*ratio))}px`;
     img.srcset=image.srcset;
   }
   img.src=image.src;
 };
 const makeSlide=(image,index)=>{
   const img=document.createElement('img');
   img.className=`project-slide${index===0?' is-active':''}`;
   img.alt=card.dataset.alt||'';
   img.loading='lazy';
   img.decoding='async';
   img.fetchPriority='low';
   img.dataset.gallerySrc=image.src;
   img.dataset.slideIndex=String(index);
   setSlideSource(img,image);
   return img;
 };

 const existing=media.querySelector('.project-slide.is-active')||media.querySelector('.project-slide');
 media.replaceChildren();

 const first=existing||makeSlide(images[0],0);
 first.className='project-slide is-active';
 first.alt=card.dataset.alt||'';
 first.loading='lazy';
 first.decoding='async';
 first.fetchPriority='low';
 first.removeAttribute('data-src');
 first.removeAttribute('data-deferred');
 first.dataset.slideIndex='0';
 setSlideSource(first,images[0]);
 media.appendChild(first);
 // Refresh sizes when rotating a phone or resizing a desktop window.
 if('ResizeObserver' in window){
   new ResizeObserver(()=>media.querySelectorAll('.project-slide').forEach(slide=>{
     const image=images[Number(slide.dataset.slideIndex)];
     if(image?.srcset){const box=media.getBoundingClientRect();slide.sizes=`${Math.ceil(Math.max(box.width,box.height*image.width/image.height))}px`;}
   })).observe(media);
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

 const loadSlide=index=>{
   if(index<0||index>=images.length)return null;
   let slide=media.querySelector(`[data-slide-index="${index}"]`);
   if(!slide){
     slide=makeSlide(images[index],index);
     media.insertBefore(slide,progress);
   }
   return slide;
 };

 const restartProgress=()=>{
   if(reducedMotion)return;
   const bar=progress.querySelector('span');
   if(!bar)return;
   bar.style.animation='none';
   requestAnimationFrame(()=>{bar.style.animation='projectProgress 3.8s linear infinite';});
 };

 const advance=()=>{
   const nextIndex=(current+1)%images.length;
   const next=loadSlide(nextIndex);
   const currentSlide=media.querySelector(`[data-slide-index="${current}"]`);
   if(!next)return;
   currentSlide?.classList.remove('is-active');
   next.classList.add('is-active');
   current=nextIndex;
   counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;
   restartProgress();
   loadSlide((current+1)%images.length);
 };

 const startGallery=()=>{
   if(galleryTimer)return;
   galleryTimer=window.setInterval(advance,3800);
   restartProgress();
 };

 const stopGallery=()=>{
   if(!galleryTimer)return;
   window.clearInterval(galleryTimer);
   galleryTimer=null;
 };

 // Advance visible cards only; offscreen slides should not compete with the hero.
 // Each observer callback and tab visibility change reconciles the same state.
 let inView=!('IntersectionObserver' in window);
 const syncGallery=()=>{if(inView&&!document.hidden)startGallery();else stopGallery();};
 if('IntersectionObserver' in window){
   const galleryObserver=new IntersectionObserver(entries=>{
     inView=entries[0].isIntersecting;
     syncGallery();
   },{threshold:0});
   galleryObserver.observe(card);
 }
 syncGallery();

 // Resume without resetting the frame when the card and browser tab are visible.
 document.addEventListener('visibilitychange',()=>{
   syncGallery();
 });
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
 // Idle callbacks can run before the poster arrives. Wait for the page first.
 const scheduleVideo=()=>{
   if('requestIdleCallback' in window)window.requestIdleCallback(loadVideo,{timeout:1800});
   else window.setTimeout(loadVideo,900);
 };
 if(document.readyState==='complete')scheduleVideo();
 else window.addEventListener('load',scheduleVideo,{once:true});
});

// Keep image boxes stable while assets decode, reducing layout shift on portfolio pages.
document.querySelectorAll('.project-gallery img,.villa-gallery img,.case-card img,.project-card img,.about6-hero-media img,.about6-close img').forEach(img=>{
 if(!img.closest('.residenza-gallery'))img.style.contentVisibility='visible';
});

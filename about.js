document.addEventListener('DOMContentLoaded',function(){
  const groups=document.querySelectorAll('.about6-philosophy-principles');
  const navItems=[...document.querySelectorAll('.about6-page-nav button')];
  const sections=[...document.querySelectorAll('.about6-track')];
  const lightSections=new Set(['about6-pov','about6-beliefs','about6-founder','about6-vision-mission']);
  const pageNav=document.querySelector('.about6-page-nav');

  const setNav=function(index){
    navItems.forEach(function(el,i){
      const active=i===index;
      el.classList.toggle('is-active',active);
      if(active) el.setAttribute('aria-current','true');
      else el.removeAttribute('aria-current');
    });
    const activeSection=sections[index];
    if(pageNav) pageNav.classList.toggle('is-light',!!(activeSection && lightSections.has(activeSection.classList[1])));
  };

  groups.forEach(function(group){
    const items=[...group.children];
    if(!items.length)return;
    const activate=function(item){items.forEach(function(el){const active=el===item;el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));});};
    items.forEach(function(item){
      item.addEventListener('mouseenter',function(){activate(item);});
      item.addEventListener('focusin',function(){activate(item);});
      item.addEventListener('click',function(){activate(item);});
      item.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(item);}});
    });
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){if(entry.isIntersecting && entry.intersectionRatio>.55)activate(entry.target);});
      },{threshold:[.55]});
      items.forEach(function(item){observer.observe(item);});
    }
  });

  navItems.forEach(function(item){
    item.addEventListener('click',function(){
      const target=document.getElementById(item.dataset.target);
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  const methodList=document.querySelector('.about6-method-list');
  if(methodList){
    const methods=[...methodList.children];
    const setMethodProgress=function(index){
      if(index<0)return;
      methods.forEach(function(el,i){
        const active=i===index;
        el.classList.toggle('is-reached',i<=index);
        el.classList.toggle('is-hovered',active);
        el.setAttribute('aria-pressed',String(active));
      });
      if(window.matchMedia('(max-width: 900px)').matches){
        const target=methods[index];
        if(target){
          const end=target.offsetTop+8;
          methodList.style.setProperty('--method-progress-height',end+'px');
        }
      }else{
        const target=methods[index];
        if(target){
          const lastIndex=methods.length-1;
          let end;
          if(index===0) end=5;
          else if(index===lastIndex) end=target.offsetLeft+target.offsetWidth;
          else end=target.offsetLeft+(target.offsetWidth/2);
          methodList.style.setProperty('--method-progress-width',Math.max(0,end-5)+'px');
        }
      }
    };
    const resetMethodProgress=function(){
      methods.forEach(function(el){el.classList.remove('is-reached','is-hovered');el.setAttribute('aria-pressed','false');});
      methodList.style.setProperty('--method-progress-width','0px');
      methodList.style.setProperty('--method-progress-height','0px');
    };
    methods.forEach(function(method,index){
      method.addEventListener('mouseenter',function(){setMethodProgress(index);});
      method.addEventListener('focusin',function(){setMethodProgress(index);});
      method.addEventListener('click',function(){setMethodProgress(index);});
      method.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();setMethodProgress(index);}});
      method.addEventListener('mouseleave',function(){resetMethodProgress();});
      method.addEventListener('focusout',function(){
        if(!method.contains(document.activeElement))resetMethodProgress();
      });
    });
  }

  if('IntersectionObserver' in window && sections.length && navItems.length){
    const sectionObserver=new IntersectionObserver(function(entries){
      const visible=entries.filter(function(entry){return entry.isIntersecting;});
      if(!visible.length)return;
      visible.sort(function(a,b){
        return Math.abs(a.boundingClientRect.top-window.innerHeight*.38)-Math.abs(b.boundingClientRect.top-window.innerHeight*.38);
      });
      const index=sections.indexOf(visible[0].target);
      if(index>-1){setNav(index);const activeSection=sections[index];const announcer=document.getElementById('about-announcement');if(announcer&&activeSection){const label=activeSection.querySelector('.about6-label');announcer.textContent=label?label.textContent.replace(/\s+/g,' ').trim():`Section ${String(index+1).padStart(2,'0')}`;}}
    },{rootMargin:'-18% 0px -58% 0px',threshold:[0,.2,.5]});
    sections.forEach(function(section){sectionObserver.observe(section);});
  }
});

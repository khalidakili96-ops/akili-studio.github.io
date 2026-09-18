document.addEventListener('DOMContentLoaded',function(){
  const groups=document.querySelectorAll('.about6-philosophy-principles');
  const navItems=[...document.querySelectorAll('.about6-page-nav button')];
  const sections=[...document.querySelectorAll('.about6-track')];

  const setNav=function(index){
    navItems.forEach(function(el,i){
      el.classList.toggle('is-active',i===index);
    });
    const activeSection=sections[index];
    const lightSection=activeSection && activeSection.classList.contains('about6-pov') || activeSection && activeSection.classList.contains('about6-beliefs') || activeSection && activeSection.classList.contains('about6-founder') || activeSection && activeSection.classList.contains('about6-vision-mission');
    const pageNav=document.querySelector('.about6-page-nav');
    if(pageNav) pageNav.classList.toggle('is-light',!!lightSection);
  };

  groups.forEach(function(group){
    const items=[...group.children];
    if(!items.length)return;

    const activate=function(item){
      items.forEach(function(el){
        el.classList.toggle('is-active',el===item);
      });
    };

    items.forEach(function(item){
      item.addEventListener('mouseenter',function(){activate(item);});
      item.addEventListener('focusin',function(){activate(item);});
    });

    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting && entry.intersectionRatio>.55){
            activate(entry.target);
          }
        });
      },{threshold:[.55]});
      items.forEach(function(item){observer.observe(item);});
    }
  });

  navItems.forEach(function(item){
    item.addEventListener('click',function(){
      const target=document.getElementById(item.dataset.target);
      if(target){
        target.scrollIntoView({behavior:'smooth',block:'start'});
      }
    });
  });

  if('IntersectionObserver' in window && sections.length && navItems.length){
    const sectionObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          const index=sections.indexOf(entry.target);
          if(index>-1)setNav(index);
        }
      });
    },{
      rootMargin:'-35% 0px -55% 0px',
      threshold:0
    });
    sections.forEach(function(section){sectionObserver.observe(section);});
  }
});

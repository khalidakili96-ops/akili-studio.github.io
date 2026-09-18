document.addEventListener('DOMContentLoaded',function(){
  const groups=document.querySelectorAll('.about6-philosophy-principles');
  groups.forEach(function(group){
    const items=[...group.children];
    if(!items.length)return;
    const activate=function(item){
      items.forEach(function(el){el.classList.toggle('is-active',el===item)});
    };
    items.forEach(function(item){
      item.addEventListener('mouseenter',function(){activate(item)});
      item.addEventListener('focusin',function(){activate(item)});
    });
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting && entry.intersectionRatio>.55) activate(entry.target);
        });
      },{threshold:[.55]});
      items.forEach(function(item){observer.observe(item)});
    }
  });
});
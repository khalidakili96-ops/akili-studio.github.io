/* Pointer, keyboard and touch share the existing About method's progress interaction. */
(() => {
 const groups=document.querySelectorAll('.about6-beliefs-grid,.id-method-grid,.service-landing .process,.services-v2 .process,.category-editorial .design-stages');
 groups.forEach(group=>{
  const items=[...group.children];if(items.length<2)return;
  group.classList.add('akili-method');group.style.setProperty('--method-count',items.length);
  let current=-1;
  function progress(index){
   current=index;
   items.forEach((item,i)=>{item.classList.toggle('is-reached',i<=index);item.classList.toggle('is-hovered',i===index);item.setAttribute('aria-pressed',String(i===index));});
   const target=items[index];
   const end=index===0?5:index===items.length-1?target.offsetLeft+target.offsetWidth:target.offsetLeft+target.offsetWidth/2;
   group.style.setProperty('--method-progress-width',`${Math.max(0,end-5)}px`);
   group.style.setProperty('--method-progress-height',`${target.offsetTop+8}px`);
  }
  function reset(){current=-1;items.forEach(item=>{item.classList.remove('is-reached','is-hovered');item.setAttribute('aria-pressed','false');});group.style.setProperty('--method-progress-width','0px');group.style.setProperty('--method-progress-height','0px');}
  items.forEach((item,index)=>{
   item.classList.add('akili-method-step');item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-pressed','false');
   item.addEventListener('mouseenter',()=>progress(index));item.addEventListener('focus',()=>progress(index));item.addEventListener('click',()=>progress(index));
   item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();progress(index);}});
  });
  group.addEventListener('mouseleave',()=>{if(!group.contains(document.activeElement))reset();});
  group.addEventListener('focusout',event=>{if(!group.contains(event.relatedTarget))reset();});
  window.addEventListener('resize',()=>{if(current>=0)progress(current);},{passive:true});
 });
})();

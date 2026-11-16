(() => {
 document.querySelectorAll('.id-method-grid,[data-method-track]').forEach(group=>{
 const items=[...group.children];let current=-1;
 function progress(index){
  current=index;items.forEach((item,i)=>{item.classList.toggle('is-reached',i<=index);item.classList.toggle('is-hovered',i===index);item.setAttribute('aria-pressed',String(i===index));});
  const target=items[index];
  const end=index===0?5:index===items.length-1?target.offsetLeft+target.offsetWidth:target.offsetLeft+target.offsetWidth/2;
  group.style.setProperty('--method-progress-width',`${Math.max(0,end-5)}px`);
  const nodeY=parseFloat(getComputedStyle(group).getPropertyValue('--method-node-y'))||8;
  group.style.setProperty('--method-progress-height',`${target.offsetTop+nodeY}px`);
 }
 function reset(){current=-1;items.forEach(item=>{item.classList.remove('is-reached','is-hovered');item.setAttribute('aria-pressed','false');});group.style.setProperty('--method-progress-width','0px');group.style.setProperty('--method-progress-height','0px');}
 items.forEach((item,index)=>{
  item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-pressed','false');
  item.addEventListener('mouseenter',()=>progress(index));item.addEventListener('focus',()=>progress(index));item.addEventListener('click',()=>progress(index));
  item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();progress(index);}});
 });
 group.addEventListener('mouseleave',()=>{if(!group.contains(document.activeElement))reset();});
 group.addEventListener('focusout',event=>{if(!group.contains(event.relatedTarget))reset();});
 window.addEventListener('resize',()=>{if(current>=0)progress(current);},{passive:true});
 });
})();

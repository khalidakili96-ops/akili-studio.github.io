/* Shared equivalents of the approved About process and section-navigation patterns. */
(() => {
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('[data-simple-progress]').forEach(group=>{
  const items=[...group.children];
  if(items.length<2)return;
  group.classList.add('experience-stages');
  let current=-1;
  const activate=index=>{
   current=index;
   items.forEach((item,i)=>item.classList.toggle('is-current',i===index));
   const target=items[index];
   group.style.setProperty('--stage-progress',`${(index+1)/items.length*100}%`);
   group.style.setProperty('--stage-progress-y',`${target.offsetTop+target.offsetHeight}px`);
  };
  items.forEach((item,index)=>{
   item.classList.add('experience-stage');
   item.tabIndex=0;
   item.addEventListener('pointerenter',()=>activate(index));
   item.addEventListener('focus',()=>activate(index));
  });
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting);
    if(visible.length){const first=visible.sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];activate(items.indexOf(first.target));}
   },{threshold:.3});
   items.forEach(item=>observer.observe(item));
  }
  window.addEventListener('resize',()=>{if(current>=0)activate(current);},{passive:true});
 });
 // About retains its original navigation and behaviour. Single-section forms/contact stay simple.
 if(document.querySelector('.about6-page-nav'))return;
 const sections=[...document.querySelectorAll('main>section')].filter(s=>s.querySelector('h1,h2'));
 if(sections.length<3)return;
 const nav=document.createElement('nav');
 nav.className='experience-nav';nav.setAttribute('aria-label','On this page');
 const buttons=sections.map((section,index)=>{
  if(!section.id)section.id=`page-section-${index+1}`;
  const heading=section.querySelector('h1,h2').textContent.replace(/\s+/g,' ').trim();
  const button=document.createElement('button');button.type='button';
  button.textContent=String(index+1).padStart(2,'0');
  button.setAttribute('aria-label',`Go to ${heading}`);button.setAttribute('aria-controls',section.id);
  button.addEventListener('click',()=>{section.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});});
  nav.appendChild(button);return button;
 });
 document.body.appendChild(nav);
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(entry=>entry.isIntersecting);
   if(!visible.length)return;
   const selected=visible.sort((a,b)=>Math.abs(a.boundingClientRect.top)-Math.abs(b.boundingClientRect.top))[0].target;
   buttons.forEach((button,index)=>{if(sections[index]===selected)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
  },{rootMargin:'-10% 0px -55% 0px',threshold:0});
  sections.forEach(section=>observer.observe(section));
 }
})();

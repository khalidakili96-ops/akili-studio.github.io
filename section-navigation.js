(() => {
 // About keeps the original, approved navigation. Never create a second rail.
 if(document.querySelector('.about6-page-nav,.section-navigation'))return;
 const main=document.querySelector('main');if(!main)return;
 let sections=[...main.children].filter(el=>el.tagName==='SECTION');
 if(sections.length<2){
  const form=main.querySelector('.application-form');
  sections=form?[main.querySelector('.application-sidebar'),...form.querySelectorAll('fieldset')].filter(Boolean):[...main.querySelectorAll('.contact-content,.contact-note')];
 }
 if(!sections.length)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const nav=document.createElement('nav');nav.className='section-navigation';nav.setAttribute('aria-label','Page sections');
 const buttons=sections.map((section,index)=>{
  if(!section.id){let id=`page-section-${index+1}`;while(document.getElementById(id))id+='-nav';section.id=id;}
  const heading=section.querySelector('h1,h2,legend,.eyebrow');
  const label=(heading?.textContent||section.getAttribute('aria-label')||(/gallery/.test(section.className)?'Project gallery':`Section ${index+1}`)).replace(/\s+/g,' ').trim();
  const button=document.createElement('button');button.type='button';button.setAttribute('aria-controls',section.id);button.setAttribute('aria-label',`Go to ${label}`);
  const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');button.appendChild(number);
  button.addEventListener('click',()=>section.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'}));
  nav.appendChild(button);return button;
 });
 document.body.appendChild(nav);
 let queued=false;
 const update=()=>{
  queued=false;const line=window.innerHeight*.35;
  const rects=sections.map(section=>section.getBoundingClientRect());
  let active=rects.findIndex(rect=>rect.top<=line&&rect.bottom>line);
  if(active<0)active=rects.reduce((best,rect,index)=>Math.abs(rect.top-line)<Math.abs(rects[best].top-line)?index:best,0);
  buttons.forEach((button,index)=>{button.classList.toggle('is-active',index===active);if(index===active)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
  // Use the active section's actual foreground so the rail works on light and dark surfaces.
  nav.style.setProperty('--section-nav-ink',getComputedStyle(sections[active]).color);
 };
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('load',schedule,{once:true});update();
})();

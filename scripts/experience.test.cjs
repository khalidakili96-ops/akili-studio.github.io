const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const experience=fs.readFileSync(path.join(root,'experience.js'),'utf8');
function dom(html,reduced=false){
 const d=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'});
 d.window.matchMedia=()=>({matches:reduced,addEventListener(){}});
 return d;
}
test('all 14 public pages share navigation, current resources and valid labelled sections',()=>{
 const files=fs.readdirSync(root).filter(n=>n.endsWith('.html')).concat(['interior-design-residential/index.html','interior-design-commercial/index.html']);
 let count=0;
 for(const f of files){const html=fs.readFileSync(path.join(root,f),'utf8');if(html.includes('noindex')||f==='404.html')continue;count++;
  const d=dom(html);const doc=d.window.document;
  assert.deepEqual([...doc.querySelectorAll('#primary-nav a')].map(a=>a.getAttribute('href')),['/','/projects','/interior-design-cairo','/services','/about','/contact'],f);
  assert.equal(doc.querySelectorAll('link[href="/experience.css?v=2"]').length,1,f);
  assert.equal(doc.querySelectorAll('script[src="/experience.js?v=2"]').length,1,f);
  assert.match(doc.querySelector('script[src*="site.js"]').src,/v=26$/);
  d.window.eval(experience);
  for(const b of doc.querySelectorAll('.experience-nav button'))assert.ok(doc.getElementById(b.getAttribute('aria-controls')));
  const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,f);
  if(f==='about.html')assert.equal(doc.querySelectorAll('.experience-nav').length,0);
  d.window.close();
 }assert.equal(count,14);
});
test('process focus mirrors progress without pointer input',()=>{
 const d=dom('<main><div data-simple-progress class="design-stages"><article><h3>Brief</h3></article><article><h3>Design</h3></article></div></main>');
 d.window.eval(experience);const group=d.window.document.querySelector('.design-stages');group.children[1].focus();
 assert.equal(group.style.getPropertyValue('--stage-progress'),'100%');assert.ok(group.children[1].classList.contains('is-current'));assert.ok(!group.children[0].classList.contains('is-current'));d.window.close();
});
test('section navigation honours reduced motion when activated',()=>{
 for(const reduced of [false,true]){const d=dom('<main><section><h2>One</h2></section><section><h2>Two</h2></section><section><h2>Three</h2></section></main>',reduced);
 let options;d.window.HTMLElement.prototype.scrollIntoView=function(o){options=o};d.window.eval(experience);d.window.document.querySelector('.experience-nav button').click();assert.equal(options.behavior,reduced?'auto':'smooth');d.window.close();}
});
test('reduced motion never starts a gallery timer',()=>{
 const d=dom('<a class="project-card" data-gallery=\'["a.webp","b.webp"]\'><div class="project-media"><img class="project-slide is-active" src="a.webp"></div></a>',true);
 let timers=0;d.window.setInterval=()=>{timers++;return 1};d.window.requestAnimationFrame=()=>1;d.window.eval(fs.readFileSync(path.join(root,'site.js'),'utf8'));assert.equal(timers,0);d.window.close();
});
test('approved method pattern supports keyboard selection, reset and all requested groups',()=>{
 const code=fs.readFileSync(path.join(root,'method-pattern.js'),'utf8');
 for(const name of ['about.html','interior-design-cairo.html','services.html','interior-design-commercial/index.html','interior-design-residential/index.html']){
  const d=dom(fs.readFileSync(path.join(root,name),'utf8'));d.window.eval(code);
  const group=d.window.document.querySelector('.akili-method');assert.ok(group,name);
  const items=[...group.children];items[items.length-1].dispatchEvent(new d.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  assert.equal(items[items.length-1].getAttribute('aria-pressed'),'true');assert.ok(items.every(x=>x.classList.contains('is-reached')));
  group.dispatchEvent(new d.window.MouseEvent('mouseleave'));assert.ok(items.every(x=>x.getAttribute('aria-pressed')==='false'));
  assert.ok(d.window.document.querySelector('link[href="/method-pattern.css?v=2"]'));d.window.close();
 }
});
test('logo placement is inherited unchanged and project titles share grid rows',()=>{
 const css=fs.readFileSync(path.join(root,'experience.css'),'utf8');assert.ok(!css.includes('.site-header .brand-logo'));assert.ok(!css.includes('line-height:1.04!important'));
 const pattern=fs.readFileSync(path.join(root,'method-pattern.css'),'utf8');assert.match(pattern,/grid-template-rows:subgrid/);assert.match(pattern,/prefers-reduced-motion/);
});
test('Design with intention shares the principle activation handler for pointer and keyboard',()=>{
 const d=dom(fs.readFileSync(path.join(root,'about.html'),'utf8'));
 d.window.eval(fs.readFileSync(path.join(root,'about.js'),'utf8'));
 d.window.document.dispatchEvent(new d.window.Event('DOMContentLoaded'));
 for(const selector of ['.about6-pov-list','.about6-philosophy-principles']){
  const items=[...d.window.document.querySelector(selector).children];
  assert.ok(d.window.document.querySelector(selector).classList.contains('about6-interactive-list'));
  assert.ok(items.every(x=>x.tabIndex===0&&x.getAttribute('role')==='button'));
  items[1].dispatchEvent(new d.window.MouseEvent('mouseenter'));assert.equal(items[1].getAttribute('aria-pressed'),'true');
  items[3].dispatchEvent(new d.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));assert.equal(items[3].getAttribute('aria-pressed'),'true');assert.equal(items[1].getAttribute('aria-pressed'),'false');
 }d.window.close();
});

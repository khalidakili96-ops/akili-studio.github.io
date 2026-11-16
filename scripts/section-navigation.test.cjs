const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const root=path.resolve(__dirname,'..');const code=fs.readFileSync(path.join(root,'section-navigation.js'),'utf8');
function dom(html,reduced=false){const d=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'});d.window.matchMedia=()=>({matches:reduced});d.window.requestAnimationFrame=cb=>cb();return d;}
test('all 14 public pages have one numbered rail with existing section targets',()=>{
 const files=fs.readdirSync(root).filter(x=>x.endsWith('.html')).concat(['interior-design-residential/index.html','interior-design-commercial/index.html']);let count=0;
 for(const file of files){const html=fs.readFileSync(path.join(root,file),'utf8');if(html.includes('noindex')||file==='404.html')continue;count++;
  const d=dom(html);d.window.eval(code);d.window.eval(code);const doc=d.window.document;
  const rail=doc.querySelectorAll('.section-navigation,.about6-page-nav');assert.equal(rail.length,1,file);
  const buttons=[...rail[0].querySelectorAll('button')];assert.ok(buttons.length>=2,file);
  buttons.forEach((button,i)=>{assert.ok(doc.getElementById(button.getAttribute('aria-controls')),file);assert.equal(button.querySelector('span').textContent,String(i+1).padStart(2,'0'),file);});
  if(file==='about.html')assert.equal(doc.querySelectorAll('.section-navigation').length,0);
  else assert.ok(doc.querySelector('script[src="/section-navigation.js?v=1"]'),file);
  const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);assert.equal(ids.length,new Set(ids).size,file);d.window.close();
 }assert.equal(count,14);
});
test('scroll chooses the visible section and switches colour to match its surface',()=>{
 const d=dom('<main><section id="one" style="color:white"><h1>One</h1></section><section id="two" style="color:rgb(33,31,27)"><h2>Two</h2></section></main>');
 let scrolled=false;const [one,two]=d.window.document.querySelectorAll('section');one.getBoundingClientRect=()=>({top:scrolled?-700:0,bottom:scrolled?0:700});two.getBoundingClientRect=()=>({top:scrolled?0:700,bottom:scrolled?700:1400});
 d.window.eval(code);const nav=d.window.document.querySelector('nav');assert.equal(nav.querySelector('[aria-current="true"]').getAttribute('aria-controls'),'one');
 scrolled=true;d.window.dispatchEvent(new d.window.Event('scroll'));assert.equal(nav.querySelector('[aria-current="true"]').getAttribute('aria-controls'),'two');assert.equal(nav.style.getPropertyValue('--section-nav-ink'),'rgb(33, 31, 27)');d.window.close();
});
test('buttons scroll without form submission and honour the current motion preference',()=>{
 for(const reduced of [false,true]){const d=dom('<main><section><h1>Start</h1></section><section><h2>Next</h2></section></main>',reduced);let called;d.window.HTMLElement.prototype.scrollIntoView=function(options){called=options};d.window.eval(code);const button=d.window.document.querySelector('nav button');assert.equal(button.type,'button');button.click();assert.equal(called.behavior,reduced?'auto':'smooth');d.window.close();}
});

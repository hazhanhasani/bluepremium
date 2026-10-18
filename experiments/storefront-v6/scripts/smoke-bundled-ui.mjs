/**
 * Browser smoke test for the exact inline HTML/JavaScript shipped inside Worker.
 * Vite dev-server tests alone cannot detect packaging-only runtime errors.
 * All external resources and commerce APIs are intercepted, no real order possible.
 */
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';

const full=await readFile(new URL('../../../src/parts/030.part',import.meta.url),'utf8');
const start='function bpV6Html(){ return ';
const a=full.indexOf(start),b=full.indexOf('; }\n',a);
if(a<0||b<a)throw Error('V6 Worker HTML renderer missing');
const markup=JSON.parse(full.slice(a+start.length,b));
if(!markup.includes('id="root"')||!markup.includes('telegram-web-app.js'))
  throw Error('Bundled HTML incomplete');

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];
const failures=[];
page.on('pageerror',err=>errors.push(String(err.stack||err.message).slice(0,1200)));
page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text().slice(0,1000))});
page.on('requestfailed',req=>failures.push(req.url().slice(0,160)+' '+req.failure()?.errorText));
await page.route('**/*',async route=>{
  const url=route.request().url();
  if(url==='http://127.0.0.1:54445/'||url.startsWith('http://127.0.0.1:54445/?')){
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:markup});
  }
  if(url.startsWith('https://telegram.org/js/telegram-web-app.js')){
    return route.fulfill({status:200,contentType:'application/javascript',
      body:'window.Telegram={WebApp:{initData:"",ready(){},expand(){}}};'});
  }
  return route.fulfill({status:204,body:''});
});
try {
  await page.goto('http://127.0.0.1:54445/',{waitUntil:'domcontentloaded',timeout:20000});
  await page.locator('.bp-card').first().waitFor({state:'visible',timeout:13000});
  const cards=await page.locator('.bp-card').count();
  if(cards!==4)throw Error('Expected four product cards; received '+cards);
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  console.log('Bundled Worker V6 HTML mounted successfully with four service cards.');
}catch(error){
  console.error('Bundled Worker runtime FAILED:',String(error?.message||error));
  console.error('Page runtime errors:',JSON.stringify(errors.slice(0,8)));
  console.error('Network errors:',JSON.stringify(failures.slice(0,5)));
  console.error('HTML root snapshot:',(await page.locator('#root').innerHTML().catch(()=>'' )).slice(0,500));
  throw error;
}finally{await browser.close()}

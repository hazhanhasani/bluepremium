/**
 * Package the isolated Vite/React UI into one self-contained Worker HTML
 * renderer. This file is generated and must never include payment/provider
 * credentials or external application chunks.
 */
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dist=join(root,'dist');
const assetDir=join(dist,'assets');
const files=await readdir(assetDir);
const jsFile=files.filter(f=>/^index-.*\.js$/.test(f));
const cssFile=files.filter(f=>/^index-.*\.css$/.test(f));
if(jsFile.length!==1||cssFile.length!==1)throw Error('Unexpected Vite asset graph: code splitting or missing bundle');
let markup=await readFile(join(dist,'index.html'),'utf8');
const js=await readFile(join(assetDir,jsFile[0]),'utf8');
const css=await readFile(join(assetDir,cssFile[0]),'utf8');
if(/(^|\n)\s*import\s+[^.(]/.test(js)||/import\(/.test(js))throw Error('Dynamic imports are not supported in the single-file Worker UI');
const script=js.replace(/<\/script/gi,'<\\/script');
const javascriptTag=/<script\b[^>]*\bsrc="\/assets\/index-[^"]+\.js"[^>]*><\/script>/;
const cssTag=/<link\b[^>]*\bhref="\/assets\/index-[^"]+\.css"[^>]*>/;
if(!javascriptTag.test(markup)||!cssTag.test(markup))throw Error('Could not locate Vite built assets');
markup=markup.replace(javascriptTag,'<script type="module">'+script+'</script>')
  .replace(cssTag,'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');
const unexpected = [...markup.matchAll(/<(?:script|link)\\b[^>]*(?:src|href)="\\/assets\\/[^"]+"[^>]*>/gi)].map(m => m[0].slice(0,260));
if (unexpected.length) throw Error('Unbundled HTML assets: '+unexpected.join(' | '));
const commit=String(process.env.GITHUB_SHA||'local').slice(0,16).replace(/[^a-f0-9]/g,'');
markup=markup.replace('</head>',`<meta name="bluepremium-build" content="v6-${commit}"></head>`);
if(!markup.includes('bp-demo')&&!markup.includes('id="root"'))throw Error('Root unavailable');
if(markup.length>1400000)throw Error('Bundled HTML too large for Worker');
const source=[
 '/** Generated V6 React UI. Keep production checkout APIs unchanged. */',
 'const BP_V6_BUILD_ID = '+JSON.stringify('v6-'+commit)+';',
 'function bpV6Html(){ return '+JSON.stringify(markup)+'; }',
 ''].join('\n');
const destination=resolve(root,'../../src/parts/030.part');
await mkdir(resolve(root,'../../src/parts'),{recursive:true});
await writeFile(destination,source);
console.log('Bundled V6 UI into '+destination+' ('+source.length+' chars, '+markup.length+' HTML chars).');

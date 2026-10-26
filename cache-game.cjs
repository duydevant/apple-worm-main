const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const ROOT = path.resolve(__dirname);
const WEB = path.join(ROOT, 'www');
const BASE = 'https://9212eedf-92d3-409f-9469-a6f67a2d1870.gdn.poki.com/b2e08cba-a56c-44ae-900f-58c7f6f2f63b/';
const SDK = 'https://game-cdn.poki.com/';
const pending = new Map();
const log = (record) => fs.appendFileSync(path.join(ROOT,'logs','downloads.jsonl'), JSON.stringify({time:new Date().toISOString(),...record})+'\n');
function locate(input) {
  const u = new URL(input, BASE);
  let relative;
  if (u.href.startsWith(BASE)) relative = u.pathname.slice(new URL(BASE).pathname.length);
  else if (u.origin === new URL(SDK).origin) relative = '__remote/game-cdn.poki.com'+u.pathname;
  else throw new Error('Origin outside game download scope');
  relative = decodeURIComponent(relative);
  if (!relative || /[<>:"|?*\x00-\x1f]/.test(relative)) throw new Error('Invalid path');
  const dest = path.resolve(WEB, relative);
  if (!dest.startsWith(WEB+path.sep)) throw new Error('Path outside www');
  return {url:u.href,dest};
}
async function download(input) {
  const {url,dest} = locate(input);
  if(fs.existsSync(dest)) return dest;
  if(pending.has(dest)) return pending.get(dest);
  const promise = new Promise((resolve,reject)=>{
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    const tmp=dest+'.download';
    const args=['-sS','-L','--fail','--compressed','--retry','2','--connect-timeout','15','--max-time','120','--referer','https://poki.com/','--output',tmp,'--write-out','%{http_code}',url];
    const child=spawn('curl.exe',args,{windowsHide:true});
    let output='',error='';
    child.stdout.on('data',x=>output+=x); child.stderr.on('data',x=>error+=x);
    child.on('error',reject);
    child.on('close',code=>{
      if(code===0 && /^2\d\d$/.test(output.trim())) {
        fs.renameSync(tmp,dest); log({url,status:Number(output),bytes:fs.statSync(dest).size,path:path.relative(WEB,dest)}); resolve(dest);
      } else {if(fs.existsSync(tmp))fs.unlinkSync(tmp);log({url,status:output,error:error.trim()});reject(new Error(`${output}: ${url}: ${error.trim()}`));}
    });
  });
  pending.set(dest,promise);
  try{return await promise;}finally{pending.delete(dest);}
}
async function batch(urls) {
  const list=[...new Set(urls)]; let next=0,completed=0; const failed=[];
  await Promise.all(Array.from({length:8},async()=>{while(next<list.length){const url=list[next++];try{await download(url);}catch(e){failed.push({url,error:e.message});}completed++;if(completed%25===0||completed===list.length)console.log(`Downloaded ${completed}/${list.length}; failures ${failed.length}`);}}));
  return failed;
}
const mime={'.js':'application/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.html':'text/html','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.svg':'image/svg+xml'};
async function main(){
  http.createServer(async(req,res)=>{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let uri=req.url;
    try{
      let remote;
      if(uri.startsWith('/__remote/game-cdn.poki.com/')) remote=SDK+uri.slice('/__remote/game-cdn.poki.com/'.length);
      else remote=new URL(uri.replace(/^\//,''),BASE).href;
      log({event:'nginx-404',uri});
      const file=await download(remote);
      res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':fs.statSync(file).size,'X-Game-Cache':'downloaded-after-404'});
      if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
    }catch(e){res.writeHead(404,{'Content-Type':'text/plain'});res.end(e.message);}
  }).listen(18767,'127.0.0.1',()=>{
    fs.writeFileSync(path.join(ROOT,'logs','helper.pid'),String(process.pid));
    console.log('curl download helper on 127.0.0.1:18767');
  });
}
main().catch(e=>{console.error(e);process.exitCode=1;});

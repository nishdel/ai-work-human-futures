'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/ai-work-human-futures(?=\/|$)/,'');
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname||'/index.html'));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 const type={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.md':'text/plain'};
 const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':type[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT)||4178,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(Number(process.env.PORT)||4178)+'/ai-work-human-futures/'));

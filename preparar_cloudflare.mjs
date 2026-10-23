/** Prepara solo la web y sus datos; no ejecuta cálculos ni modifica sus fuentes. */
import {readdir, lstat, mkdir, copyFile, readFile, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const base=path.dirname(fileURLToPath(import.meta.url)), destino=path.join(base,'dist');
const MAX_ARCHIVOS=20000, MAX_TAMANO=25*1024*1024;
const permitidos=[/^assets\/(portada|pronosticos|mapas|validacion)-(claro|oscuro)\.(mp4|webp)$/, /^index\.html$/, /^observaciones\/(metadata|obs_(t2m|pp6h|tmax|tmin|pp24h))\.csv$/,
  /^estadisticos\/estadisticos_(t2m|pp6h|tmax|tmin|pp24h)_\d{8}\.csv$/,
  /^modelos\/ciclos\.json$/, /^modelos\/20\d{6}(00|12)\/[^/]+\.csv$/,
  /^mapas\/(departamentos|sectores_climaticos)\.geojson$/,
  /^mapas\/(prec|tmax|tmin|piscopp)_\d{8}\.tif$/,
  /^mapas\/20\d{6}(00|12)\/[^/]+\.tif$/];
const obligatorios=['index.html','observaciones/metadata.csv','modelos/ciclos.json',
  'mapas/departamentos.geojson','mapas/sectores_climaticos.geojson',
  ...['t2m','pp6h','tmax','tmin','pp24h'].map(v=>`observaciones/obs_${v}.csv`)];

async function inventariar(carpeta,prefijo='') {
  const encontrados=[];
  for(const entrada of await readdir(carpeta,{withFileTypes:true})) {
    const relativo=prefijo+entrada.name, absoluto=path.join(carpeta,entrada.name);
    if(entrada.isSymbolicLink())throw new Error(`No se permiten enlaces simbólicos en los datos: ${relativo}`);
    if(entrada.isDirectory())encontrados.push(...await inventariar(absoluto,relativo+'/'));
    else if(entrada.isFile()&&permitidos.some(p=>p.test(relativo)))encontrados.push(relativo);
  }
  return encontrados;
}
const archivos=['index.html'];
for(const carpeta of ['observaciones','modelos','estadisticos','mapas','assets']) {
  const info=await lstat(path.join(base,carpeta));
  if(!info.isDirectory()||info.isSymbolicLink())throw new Error(`Carpeta de datos no válida: ${carpeta}`);
  archivos.push(...await inventariar(path.join(base,carpeta),carpeta+'/'));
}
const incluidos=new Set(archivos);
for(const archivo of obligatorios)if(!incluidos.has(archivo))throw new Error(`Falta un archivo de la plataforma: ${archivo}`);
for(const variable of ['t2m','pp6h','tmax','tmin','pp24h'])if(!archivos.some(a=>new RegExp(`^estadisticos/estadisticos_${variable}_\\d{8}\\.csv$`).test(a)))throw new Error(`Faltan estadísticos de ${variable}`);
if(archivos.length+2>MAX_ARCHIVOS)throw new Error('Se supera el máximo de archivos del plan gratuito');
let total=0;
for(const relativo of archivos) {
  const info=await lstat(path.join(base,relativo));
  if(!info.isFile()||info.isSymbolicLink())throw new Error(`Archivo no válido: ${relativo}`);
  if(info.size>MAX_TAMANO)throw new Error(`El archivo supera 25 MiB: ${relativo}`);
  total+=info.size;
}
function prepararIndex(html) {
  html=html.replaceAll('https://api.github.com/repos/CumulusRichi/station-nwp/git/trees/main?recursive=1','catalogos/mapas.json')
           .replaceAll('https://api.github.com/repos/CumulusRichi/station-nwp/contents/estadisticos?ref=main','catalogos/estadisticos.json');
  if(/api\.github\.com|raw\.githubusercontent\.com/i.test(html))throw new Error('El index contiene otra consulta directa a GitHub que debe adaptarse');
  if(!html.includes('<!-- cloudflare:sesion -->')) {
    const control=`<!-- cloudflare:sesion -->
<meta name="robots" content="noindex,nofollow"/>
<script>
(()=>{const original=window.fetch.bind(window);let entrando=false;window.fetch=async function(entrada,opciones){const respuesta=await original(entrada,opciones),url=new URL(entrada instanceof Request?entrada.url:String(entrada),location.href);if(respuesta.status===401&&url.origin===location.origin&&!url.pathname.startsWith('/_auth/')&&!entrando){entrando=true;location.assign('/_auth/login?next='+encodeURIComponent(location.pathname+location.search+location.hash));}return respuesta;};})();
</script>
<style>.cerrar-sesion{display:inline-block;margin:0 0 0 18px}.cerrar-sesion button{border:0;background:transparent;color:inherit;opacity:.75;font:inherit;font-size:10px;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:5px 0}.cerrar-sesion button:hover{opacity:1}.cerrar-sesion button:focus-visible{outline:2px solid currentColor;outline-offset:3px}@media(max-width:650px){.cerrar-sesion{margin:8px 0 0;display:block}}</style>`;
    if(!html.includes('</head>'))throw new Error('El index no tiene cierre de cabecera');
    html=html.replace('</head>',control+'\n</head>');
    const pie=html.lastIndexOf('</footer>');
    if(pie<0)throw new Error('El index no tiene pie de página');
    html=html.slice(0,pie)+'<form method="post" action="/_auth/logout" class="cerrar-sesion"><button type="submit">Cerrar sesión</button></form>'+html.slice(pie);
  }
  return html;
}
// Solo se adapta la copia desplegada; el index del repositorio queda intacto.
const index=prepararIndex(await readFile(path.join(base,'index.html'),'utf8'));
// La reconstrucción elimina del despliegue los archivos que ya no existen en el repositorio.
await rm(destino,{recursive:true,force:true});
await mkdir(destino,{recursive:true});
for(const relativo of archivos.sort()) {
  const salida=path.join(destino,relativo);
  await mkdir(path.dirname(salida),{recursive:true});
  if(relativo==='index.html')await writeFile(salida,index);else await copyFile(path.join(base,relativo),salida);
}
const mapas={truncated:false,tree:archivos.filter(a=>a.startsWith('mapas/')&&a.endsWith('.tif')).sort().map(a=>({path:a,type:'blob'}))};
const estadisticos=archivos.filter(a=>a.startsWith('estadisticos/')).sort().map(a=>({name:path.posix.basename(a),type:'file'}));
await mkdir(path.join(destino,'catalogos'),{recursive:true});
await writeFile(path.join(destino,'catalogos/mapas.json'),JSON.stringify(mapas));
await writeFile(path.join(destino,'catalogos/estadisticos.json'),JSON.stringify(estadisticos));
console.log(`Preparados ${archivos.length+2} archivos (${(total/1024/1024).toFixed(1)} MiB) para Cloudflare.`);
console.log('Catálogos locales de mapas y estadísticos actualizados. No se modificaron los datos de origen.');


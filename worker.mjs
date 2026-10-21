/** Acceso por una contraseña compartida. El secreto SITE_PASSWORD se configura en Cloudflare. */
const COOKIE = '__Host-nwp_session';
const DURACION = 12 * 60 * 60;
const encoder = new TextEncoder();
let credenciales;

function escapar(valor) {
  return String(valor).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}
function headersPrivados(headers = {}) {
  const h = new Headers(headers);
  h.set('Cache-Control', 'private, no-store');
  h.set('Vary', 'Cookie');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'same-origin');
  h.set('Cross-Origin-Resource-Policy', 'same-origin');
  return h;
}
function texto(mensaje, status, extras = {}) {
  return new Response(mensaje, {status, headers: headersPrivados({'Content-Type':'text/plain; charset=utf-8', ...extras})});
}
function destinoSeguro(valor, origen) {
  try {
    const url = new URL(valor || '/', origen);
    if (url.origin !== origen || url.pathname.startsWith('/_auth/')) return '/';
    return url.pathname + url.search + url.hash;
  } catch { return '/'; }
}
function formulario(destino, mensaje = '', status = 200) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Acceso · NWP-STATION</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#eef2f6;color:#19334e;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}.acceso{width:min(100%,420px);padding:38px 32px;background:white;border:1px solid #d9e0e8;border-radius:16px;box-shadow:0 14px 50px #102e4810}.institucion{font-size:11px;letter-spacing:.17em;font-weight:750;color:#637b8e}h1{font-size:28px;letter-spacing:-.04em;margin:14px 0 10px}p{font-size:13px;line-height:1.65;color:#63768a;margin:0 0 24px}label{display:block;font-size:12px;font-weight:650;margin-bottom:8px}input{width:100%;padding:13px;border:1px solid #c8d4df;border-radius:7px;font:inherit;font-size:16px}input:focus{outline:2px solid #75a9be;outline-offset:2px}button{width:100%;margin-top:16px;padding:13px;background:#123653;color:white;border:0;border-radius:7px;font:inherit;font-size:13px;font-weight:650;cursor:pointer}button:hover{background:#205574}.mensaje{color:#a33232;font-size:12px;min-height:18px;margin:12px 0 0}.pie{margin-top:24px;border-top:1px solid #e3e9ee;padding-top:16px;font-size:10px;color:#718495}@media(max-width:450px){.acceso{padding:30px 24px}}
</style></head><body><main class="acceso"><div class="institucion">SENAMHI</div><h1>NWP-STATION</h1><p>Ingrese la contraseña de acceso para consultar la plataforma.</p><form method="post" action="/_auth/login"><input type="hidden" name="next" value="${escapar(destino)}"><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus maxlength="512"><button type="submit">Ingresar</button><div class="mensaje" role="status">${escapar(mensaje)}</div></form><div class="pie">Modelos atmosféricos, observaciones y evaluación de pronósticos.</div></main></body></html>`;
  const h = headersPrivados({'Content-Type':'text/html; charset=utf-8'});
  h.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  return new Response(html, {status, headers:h});
}
async function claves(password) {
  if (credenciales?.password === password) return credenciales;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(password)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), {name:'HMAC', hash:'SHA-256'}, false, ['sign','verify']);
  credenciales = {password, digest, key};
  return credenciales;
}
async function comprobarPassword(valor, digest) {
  const recibido = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(valor)));
  let diferencia = 0;
  for (let i = 0; i < digest.length; i++) diferencia |= digest[i] ^ recibido[i];
  return diferencia === 0;
}
function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/, '');
}
function decodificar(valor) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(valor)) return null;
  try { return Uint8Array.from(atob(valor.replaceAll('-','+').replaceAll('_','/')+'='), c => c.charCodeAt(0)); }
  catch { return null; }
}
function firmaSesion(host, expira, nonce) { return encoder.encode(`nwp-session-v1|${host}|${expira}|${nonce}`); }
async function crearSesion(key, host) {
  const expira = Math.floor(Date.now()/1000)+DURACION;
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const firma = base64url(await crypto.subtle.sign('HMAC', key, firmaSesion(host,expira,nonce)));
  return `v1.${expira}.${nonce}.${firma}`;
}
async function sesionValida(request, key, host) {
  const cookies = request.headers.get('Cookie') || '';
  const valor = cookies.split(';').map(c=>c.trim()).find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if (!valor || valor.length > 180) return false;
  const partes = valor.split('.');
  if (partes.length !== 4 || partes[0] !== 'v1' || !/^\d{10,11}$/.test(partes[1]) || !/^[A-Za-z0-9_-]{22}$/.test(partes[2])) return false;
  const expira = Number(partes[1]), ahora = Math.floor(Date.now()/1000), firma = decodificar(partes[3]);
  if (!firma || expira <= ahora || expira > ahora+DURACION+60) return false;
  return crypto.subtle.verify('HMAC', key, firma, firmaSesion(host,expira,partes[2]));
}
async function cuerpoLimitado(request, limite = 4096) {
  if (Number(request.headers.get('Content-Length') || 0) > limite) return null;
  if (!request.body) return '';
  const lector = request.body.getReader(), partes = [];
  let longitud = 0;
  while (true) {
    const {done,value} = await lector.read();
    if (done) break;
    longitud += value.byteLength;
    if (longitud > limite) { await lector.cancel(); return null; }
    partes.push(value);
  }
  const total = new Uint8Array(longitud);
  let posicion = 0;
  for (const parte of partes) { total.set(parte,posicion); posicion+=parte.byteLength; }
  return new TextDecoder().decode(total);
}
function redirigir(destino, cookie) {
  const headers = headersPrivados({Location:destino});
  if (cookie) headers.set('Set-Cookie',cookie);
  return new Response(null, {status:303, headers});
}
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.protocol !== 'https:') { url.protocol='https:'; return redirigir(url.href); }
      // Nunca servir los archivos si falta la contraseña o su configuración.
      if (typeof env.SITE_PASSWORD !== 'string' || !env.SITE_PASSWORD || !env.ASSETS || !env.LOGIN_LIMITER) {
        return texto('Acceso cerrado. Falta completar la configuración de la plataforma.', 503);
      }
      const {key,digest} = await claves(env.SITE_PASSWORD);
      if (url.pathname === '/_auth/login') {
        if (request.method === 'GET') {
          const destino=destinoSeguro(url.searchParams.get('next'),url.origin);
          return await sesionValida(request,key,url.host) ? redirigir(destino) : formulario(destino);
        }
        if (request.method !== 'POST') return texto('Método no permitido.',405,{Allow:'GET, POST'});
        if (request.headers.get('Origin') !== url.origin) return texto('Origen no permitido.',403);
        const tipo = request.headers.get('Content-Type') || '';
        if (!tipo.toLowerCase().startsWith('application/x-www-form-urlencoded')) return texto('Formato no permitido.',415);
        // Solo se limita el inicio de sesión; las consultas de CSV y TIFF no usan este contador.
        const ip = request.headers.get('CF-Connecting-IP') || 'sin-ip';
        const {success} = await env.LOGIN_LIMITER.limit({key:`nwp-login:${ip}`});
        if (!success) {
          const respuesta=formulario('/', 'Demasiados intentos. Espere un minuto y vuelva a intentarlo.',429);
          respuesta.headers.set('Retry-After','60');
          return respuesta;
        }
        const cuerpo = await cuerpoLimitado(request);
        if (cuerpo === null) return texto('Solicitud demasiado grande.',413);
        const campos = new URLSearchParams(cuerpo), password = campos.get('password') || '';
        const destino = destinoSeguro(campos.get('next'),url.origin);
        if (!await comprobarPassword(password,digest)) return formulario(destino,'Contraseña incorrecta.',401);
        const sesion = await crearSesion(key,url.host);
        return redirigir(destino,`${COOKIE}=${sesion}; Path=/; Max-Age=${DURACION}; HttpOnly; Secure; SameSite=Strict`);
      }
      if (url.pathname === '/_auth/logout') {
        if (request.method !== 'POST') return texto('Método no permitido.',405,{Allow:'POST'});
        if (request.headers.get('Origin') !== url.origin) return texto('Origen no permitido.',403);
        return redirigir('/_auth/login',`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
      }
      if (!['GET','HEAD'].includes(request.method)) return texto('Método no permitido.',405,{Allow:'GET, HEAD'});
      if (!await sesionValida(request,key,url.host)) {
        if (request.method === 'HEAD') return texto('',401);
        const destino = destinoSeguro(url.pathname+url.search,url.origin);
        return formulario(destino,'',401);
      }
      // ASSETS es el único origen de datos; no hay una URL pública alternativa en este Worker.
      const headers = new Headers(request.headers);
      headers.delete('Cookie');
      headers.delete('Authorization');
      const respuesta = await env.ASSETS.fetch(new Request(request,{headers}));
      const salida = headersPrivados(respuesta.headers);
      salida.delete('Access-Control-Allow-Origin');
      return new Response(request.method==='HEAD'?null:respuesta.body,{status:respuesta.status,statusText:respuesta.statusText,headers:salida});
    } catch {
      // Un fallo de autenticación nunca da acceso al contenedor de archivos.
      return texto('No se pudo completar la solicitud. Vuelva a intentarlo.',503);
    }
  }
};

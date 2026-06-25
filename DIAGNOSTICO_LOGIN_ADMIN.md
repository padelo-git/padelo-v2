# Documento de Diagnóstico - Login de Admin (Owner Panel)

## Objetivo
Diagnosticar y resolver el error "network error" que impide el login al Owner Panel desde la Mac del usuario.

## Arquitectura del Sistema

```
Usuario (Mac) → HTTPS → Nginx (443) → Frontend (React)
                                            ↓
                                      Axios POST /auth/login
                                            ↓
                                      Nginx proxy /auth/
                                            ↓
                                      Backend (FastAPI :8000)
                                            ↓
                                      PostgreSQL
```

## Componentes a Verificar

### 1. Frontend (React - AdminLogin.jsx)

**Configuración esperada:**
- URL del endpoint de login: `/auth/login` (relativa, no hardcoded)
- Método: POST
- Headers: Content-Type: application/json
- Body: `{ email, password }`

**Cómo verificar:**
```bash
cat frontend/src/pages/AdminLogin.jsx
```

**Comandos de diagnóstico:**
- Abrir DevTools → Network tab
- Intentar login
- Verificar que la petición se envía a `/auth/login`
- Verificar status code y respuesta

**Posibles problemas:**
- URL hardcoded con IP incorrecta
- URL HTTP en lugar de HTTPS (mixed content)
- Error de CORS

---

### 2. Backend (FastAPI - config.py)

**Configuración esperada:**
- CORS_ORIGINS debe incluir:
  - `https://nexasist.com`
  - `http://18.212.126.125`
  - `http://18.212.126.125:8000`
  - `http://localhost:3000`
- Endpoint `/auth/login` debe aceptar POST
- Respuesta: JSON con `{ access_token, token_type, user }`

**Cómo verificar:**
```bash
cat backend/core/config.py
```

**Comandos de diagnóstico:**
```bash
# Desde el servidor
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"davidgctd@gmail.com","password":"Argentina2026"}'
```

**Posibles problemas:**
- CORS origin faltante
- Endpoint no existe
- Error de autenticación

---

### 3. Nginx (Reverse Proxy)

**Configuración esperada:**
- Escuchar en puerto 443 (HTTPS)
- Certificado SSL válido para nexasist.com
- Location `/auth/` debe proxyar a `http://localhost:8000/auth/`
- Headers correctos:
  - `Host $host`
  - `X-Real-IP $remote_addr`
  - `X-Forwarded-For $proxy_add_x_forwarded_for`
  - `X-Forwarded-Proto $scheme`

**Cómo verificar:**
```bash
# Desde el servidor
cat /etc/nginx/sites-available/nexasist
nginx -t
systemctl status nginx
```

**Comandos de diagnóstico:**
```bash
# Verificar configuración
nginx -t

# Verificar logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Reiniciar nginx
systemctl restart nginx
```

**Posibles problemas:**
- Configuración incorrecta
- Certificado SSL expirado
- Puerto 443 bloqueado
- Proxy mal configurado

---

### 4. Docker (Contenedores)

**Configuración esperada:**
- Frontend: puerto 3000:80 (host:container)
- Backend: puerto 8000:8000 (host:container)
- Contenedores corriendo
- Red Docker funcionando

**Cómo verificar:**
```bash
# Desde el servidor
docker ps
docker-compose ps
docker network ls
```

**Comandos de diagnóstico:**
```bash
# Ver contenedores
docker ps -a

# Ver logs de contenedores
docker logs padelo-v2-frontend-1
docker logs padelo-v2-backend-1

# Ver redes
docker network inspect padelo-v2_default

# Reiniciar contenedores
docker-compose restart
```

**Posibles problemas:**
- Contenedor detenido
- Puerto mapeado incorrectamente
- Red Docker no funciona
- Recursos insuficientes

---

### 5. AWS Security Groups

**Configuración esperada:**
- Puerto 80 (HTTP): abierto a 0.0.0.0/0
- Puerto 443 (HTTPS): abierto a 0.0.0.0/0
- Puerto 22 (SSH): abierto solo a IP del usuario
- Puerto 8000: abierto (opcional, para acceso directo al backend)

**Cómo verificar:**
- Desde consola de AWS → EC2 → Security Groups
- Verificar reglas de inbound

**Comandos de diagnóstico:**
```bash
# Desde el servidor
sudo ufw status
```

**Posibles problemas:**
- Puertos bloqueados
- Regla de IP incorrecta
- Security group mal configurado

---

### 6. SSL/TLS (Certificados)

**Configuración esperada:**
- Certificado válido para nexasist.com
- Emitido por Let's Encrypt
- No expirado
- Chain completo

**Cómo verificar:**
```bash
# Desde el servidor
ls -la /etc/letsencrypt/live/nexasist.com/
cat /etc/letsencrypt/live/nexasist.com/fullchain.pem
openssl x509 -in /etc/letsencrypt/live/nexasist.com/cert.pem -text -noout
```

**Comandos de diagnóstico:**
```bash
# Verificar certificado
openssl s_client -connect nexasist.com:443 -servername nexasist.com

# Verificar expiración
certbot certificates
```

**Posibles problemas:**
- Certificado expirado
- Certificado mal configurado
- Chain incompleto
- Dominio incorrecto

---

### 7. DNS

**Configuración esperada:**
- nexasist.com → 18.212.126.125 (A record)
- Propagación DNS completa

**Cómo verificar:**
```bash
# Desde cualquier lugar
nslookup nexasist.com
dig nexasist.com
host nexasist.com
```

**Comandos de diagnóstico:**
```bash
nslookup nexasist.com
dig nexasist.com +short
```

**Posibles problemas:**
- DNS no propagado
- Record incorrecto
- TTL alto

---

### 8. Browser/Mac (Cliente)

**Configuración esperada:**
- Browser moderno (Chrome, Safari, Firefox)
- No bloquear cookies
- No bloquear scripts
- Cache limpio
- No extensions interfiriendo

**Cómo verificar:**
- Abrir DevTools → Console
- Abrir DevTools → Network
- Intentar login
- Verificar errores en Console
- Verificar peticiones en Network

**Comandos de diagnóstico:**
- Limpiar cache del browser
- Probar en modo incógnito
- Probar en otro browser
- Probar en otro dispositivo
- Deshabilitar extensions

**Posibles problemas:**
- Cache corrupto
- Extensiones interfiriendo
- HSTS (HTTP Strict Transport Security)
- Browser antiguo
- Proxy/VPN interfiriendo

---

## Checklist de Verificación

### Paso 1: Verificar Backend Directo
```bash
# Desde el servidor
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"davidgctd@gmail.com","password":"Argentina2026"}'
```
- [ ] Retorna 200 OK
- [ ] Retorna JSON con token

### Paso 2: Verificar Nginx
```bash
# Desde el servidor
nginx -t
systemctl status nginx
```
- [ ] Configuración válida
- [ ] Nginx corriendo

### Paso 3: Verificar SSL
```bash
openssl s_client -connect nexasist.com:443 -servername nexasist.com
```
- [ ] Certificado válido
- [ ] No expirado

### Paso 4: Verificar DNS
```bash
nslookup nexasist.com
```
- [ ] Apunta a 18.212.126.125

### Paso 5: Verificar Contenedores Docker
```bash
docker ps
```
- [ ] Frontend corriendo
- [ ] Backend corriendo
- [ ] PostgreSQL corriendo

### Paso 6: Verificar Puertos AWS
- [ ] Puerto 80 abierto
- [ ] Puerto 443 abierto

### Paso 7: Verificar Frontend
- [ ] AdminLogin.jsx usa URL relativa `/auth/login`
- [ ] No hay hardcoded IPs

### Paso 8: Verificar CORS
- [ ] `https://nexasist.com` en CORS_ORIGINS

### Paso 9: Probar Login desde Mac
- [ ] Abrir https://nexasist.com/admin-login
- [ ] Abrir DevTools → Network
- [ ] Intentar login
- [ ] Verificar petición en Network tab
- [ ] Verificar status code
- [ ] Verificar respuesta

---

## Flujo de Diagnóstico

1. **Verificar servidor primero** (backend, nginx, docker)
2. **Verificar red** (DNS, SSL, puertos)
3. **Verificar configuración** (CORS, frontend)
4. **Verificar cliente** (browser, Mac)

Si todo está correcto en el servidor pero falla en el cliente, el problema es:
- Browser cache
- HSTS
- Extensions
- Proxy/VPN
- Firewall local en Mac

---

## Comandos Útiles

### Ver todo el estado del sistema
```bash
# Desde el servidor
echo "=== Docker ==="
docker ps
echo -e "\n=== Nginx ==="
systemctl status nginx
echo -e "\n=== Puertos ==="
sudo netstat -tlnp | grep -E ':(80|443|8000|3000)'
echo -e "\n=== Firewall ==="
sudo ufw status
echo -e "\n=== SSL ==="
certbot certificates
echo -e "\n=== Backend Test ==="
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"davidgctd@gmail.com","password":"Argentina2026"}'
```

### Ver logs en tiempo real
```bash
# Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Docker
docker logs -f padelo-v2-frontend-1
docker logs -f padelo-v2-backend-1
```

---

## Valores de Referencia

- **Email admin**: davidgctd@gmail.com
- **Password admin**: Argentina2026
- **IP servidor**: 18.212.126.125
- **Dominio**: nexasist.com
- **URL login**: https://nexasist.com/admin-login
- **Endpoint backend**: /auth/login

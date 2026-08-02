# DameCancha — frontend

Aplicación web responsive para buscar clubes, consultar disponibilidad, reservar canchas, administrar reservas, gestionar clubes, torneos y banco de suplentes.

## Requisitos

- Node.js 22
- Backend de DameCancha disponible
- Variables definidas a partir de `.env.example`

## Desarrollo local

```bash
cp .env.example .env.local
npm ci
npm run dev
```

La variable mínima es:

```env
VITE_API_URL=http://localhost:3000
```

## Validación antes de publicar

```bash
npm ci
npm run lint
npm run build
```

El build de producción exige una `VITE_API_URL` válida con HTTPS.

## Deploy en Netlify

El repositorio incluye `netlify.toml` con:

- `npm run build`
- publicación desde `dist`
- reescritura SPA hacia `index.html`
- cabeceras de seguridad básicas
- caché prolongada para assets versionados

Crear en Netlify, como mínimo:

```env
VITE_API_URL=https://api.dominio.example
VITE_MERCADOPAGO_PUBLIC_KEY=
```

Los datos de contacto son opcionales y se controlan con las demás variables `VITE_*` documentadas en `.env.example`.

## Seguridad

- Nunca colocar el Access Token privado de Mercado Pago en variables `VITE_*`.
- No subir `.env`, `.env.local`, tokens, contraseñas ni credenciales al repositorio.
- Las protecciones del frontend son de experiencia de usuario; la autorización definitiva debe realizarse siempre en el backend.

## Preproducción

Leer `PREPRODUCCION.md` y el paquete de auditoría antes de conectar credenciales productivas o aceptar pagos reales.

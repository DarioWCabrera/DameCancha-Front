# Estado de preproducción del frontend

Esta copia forma parte de la auditoría del 30/07/2026.

## Antes de publicar

```bash
cp .env.example .env.local
npm ci
npm run lint
npm run build
npm run preview
```

`VITE_API_URL` debe apuntar al backend de staging o producción y usar HTTPS en el build productivo.

## Verificaciones obligatorias

- login y recuperación;
- panel usuario, club y admin;
- reserva, edición y cancelación;
- retorno de Mercado Pago;
- 360, 390, 412, 768 y 1024 px;
- Chrome Android y Safari iPhone cuando sea posible;
- ausencia de scroll horizontal;
- variables y contactos productivos;
- rutas directas en Netlify.

## Restricción

No habilitar pagos reales hasta resolver la política de modificación/cancelación de reservas pagadas y completar el checklist incluido en el paquete de auditoría.

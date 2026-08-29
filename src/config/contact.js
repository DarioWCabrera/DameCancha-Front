const value = (key) => String(import.meta.env[key] || '').trim();

/*
 * Datos de contacto públicos de DameCancha.
 *
 * Las variables VITE_* permiten reemplazarlos por ambiente (local, staging,
 * producción), pero dejamos los datos históricos como fallback para que el
 * header no pierda los accesos si una variable todavía no fue configurada.
 */
export const CONTACT = {
  email: value('VITE_SUPPORT_EMAIL') || 'damecancha.tsas@gmail.com',
  phone: value('VITE_SUPPORT_PHONE') || '2983 616090',
  whatsapp: value('VITE_SUPPORT_WHATSAPP') || '5492983616090',
  instagramUrl:
    value('VITE_INSTAGRAM_URL') || 'https://www.instagram.com/damecanchas?igsi=czN4NRlN3d6cXh0/',
  facebookUrl:
    value('VITE_FACEBOOK_URL') ||
    'https://www.facebook.com/share/19JaWy2xKz/',
  headquarters:
    value('VITE_HQ_TEXT') || 'Tres Arroyos, Buenos Aires, Argentina',
};

export const emailHref = CONTACT.email ? `mailto:${CONTACT.email}` : '';
export const emailComposeHref = CONTACT.email
  ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email)}`
  : '';
export const phoneHref = CONTACT.phone
  ? `tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`
  : '';
export const whatsappHref = CONTACT.whatsapp
  ? `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, '')}`
  : '';

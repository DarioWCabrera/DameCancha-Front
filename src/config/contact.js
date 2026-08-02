const value = (key) => String(import.meta.env[key] || '').trim();

export const CONTACT = {
  email: value('VITE_SUPPORT_EMAIL'),
  phone: value('VITE_SUPPORT_PHONE'),
  whatsapp: value('VITE_SUPPORT_WHATSAPP'),
  instagramUrl: value('VITE_INSTAGRAM_URL'),
  facebookUrl: value('VITE_FACEBOOK_URL'),
  headquarters: value('VITE_HQ_TEXT') || 'Tres Arroyos, Buenos Aires, Argentina',
};

export const emailHref = CONTACT.email ? `mailto:${CONTACT.email}` : '';
export const phoneHref = CONTACT.phone
  ? `tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`
  : '';
export const whatsappHref = CONTACT.whatsapp
  ? `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, '')}`
  : '';

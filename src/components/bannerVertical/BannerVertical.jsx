import React, { useEffect, useMemo, useState } from 'react';
import './BannerVertical.css';

/*
  Imágenes disponibles para banners.
  Ajustá estas rutas si tus archivos tienen otros nombres.
*/
import img1 from '../bannerVertical/banners/img1.webp';
import img2 from '../bannerVertical/banners/img2.webp';
import img3 from '../bannerVertical/banners/img3.webp';
import img4 from '../bannerVertical/banners/img4.webp';
import img5 from '../bannerVertical/banners/img5.webp';
import img6 from '../bannerVertical/banners/img6.webp';

/*
  Lista de banners.
  Si en el futuro querés mandar cada banner a una URL distinta,
  completá la propiedad url.
*/
const BANNERS = [
  { src: img1, alt: 'Banner publicitario 1', url: '' },
  { src: img2, alt: 'Banner publicitario 2', url: '' },
  { src: img3, alt: 'Banner publicitario 3', url: '' },
  { src: img4, alt: 'Banner publicitario 4', url: '' },
  { src: img5, alt: 'Banner publicitario 5', url: '' },
  { src: img6, alt: 'Banner publicitario 6', url: '' },
];

/*
  Devuelve un banner aleatorio.
  excludeSrc sirve para evitar repetir exactamente la misma imagen
  en el siguiente cambio o para forzar que izquierda/derecha no arranquen igual.
*/
const obtenerBannerAleatorio = (excludeSrc = '') => {
  const candidatos = BANNERS.filter((banner) => banner.src !== excludeSrc);
  const lista = candidatos.length ? candidatos : BANNERS;
  const indice = Math.floor(Math.random() * lista.length);
  return lista[indice];
};

/*
  BannerVertical
  - Muestra banners solo visualmente.
  - Alterna la imagen cada cierta cantidad de segundos.
  - Puede recibir side para estilos laterales.
  - page se usa para aplicar estilos distintos en login u otras pantallas.
*/
const BannerVertical = ({ side = 'left', page = 'default' }) => {
  /*
    Banner inicial.
    Para el lado derecho arrancamos evitando la primera imagen por simple variedad.
  */
  const [bannerActual, setBannerActual] = useState(() => {
    const evitar = side === 'right' ? img1 : '';
    return obtenerBannerAleatorio(evitar);
  });

  /*
    Alterna automáticamente el banner cada 8 segundos.
    Siempre intenta cambiar a una imagen distinta de la actual.
  */
  useEffect(() => {
    const intervalo = setInterval(() => {
      setBannerActual((bannerPrevio) => obtenerBannerAleatorio(bannerPrevio?.src));
    }, 8000);

    return () => clearInterval(intervalo);
  }, []);

  /*
    Clase dinámica para poder diferenciar visualmente login de otras páginas.
  */
  const className = useMemo(() => {
    return `banner-vertical banner-vertical--${side} banner-vertical--${page}`;
  }, [side, page]);

  /*
    Si el banner tiene URL, al hacer click abre una nueva pestaña.
  */
  const handleClick = () => {
    if (bannerActual?.url) {
      window.open(bannerActual.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!bannerActual) return null;

  return (
    <div
      className={className}
      onClick={handleClick}
      role={bannerActual?.url ? 'button' : undefined}
      tabIndex={bannerActual?.url ? 0 : undefined}
      onKeyDown={(e) => {
        if (!bannerActual?.url) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Banner publicitario"
    >
      <img
        src={bannerActual.src}
        alt={bannerActual.alt}
        className="banner-vertical-imagen"
      />
    </div>
  );
};

export default BannerVertical;

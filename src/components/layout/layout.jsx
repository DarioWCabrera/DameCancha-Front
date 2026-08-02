import React from 'react';
import BannerVertical from '../bannerVertical/BannerVertical';
import Header from '../header/header';
import Footer from '../footer/footer';

import './layout.css';

/*
  Layout general de páginas públicas.
  - Renderiza Header y Footer.
  - Puede mostrar banners laterales solo si la página lo solicita.
  - Se usa especialmente en Login para que los banners NO aparezcan
    en pantallas donde no los queremos mostrar.
*/
const Layout = ({
  children,
  showBanners = false,
  bannerContext = 'default',
}) => {
  return (
    <>
      <div className={`app-layout ${showBanners ? 'app-layout--with-banners' : ''}`}>
        <Header />

        <div className={`layout ${showBanners ? 'layout--with-banners' : ''}`}>
          {/*
            Banner izquierdo.
            Se renderiza solo cuando showBanners=true.
          */}
          {showBanners && (
            <aside className="layout-banner layout-banner--left" aria-label="Publicidad izquierda">
              <BannerVertical side="left" page={bannerContext} />
            </aside>
          )}

          {/*
            Contenido principal de la página.
            Agregamos una clase extra cuando existen banners para poder
            ajustar anchos desde CSS sin romper otras pantallas.
          */}
          <main
            className={`main-content ${showBanners ? 'main-content--with-banners' : ''} main-content--${bannerContext}`}
          >
            {children}
          </main>

          {/*
            Banner derecho.
            Se renderiza solo cuando showBanners=true.
          */}
          {showBanners && (
            <aside className="layout-banner layout-banner--right" aria-label="Publicidad derecha">
              <BannerVertical side="right" page={bannerContext} />
            </aside>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Layout;

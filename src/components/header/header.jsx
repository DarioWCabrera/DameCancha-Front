import "./header.css";

import logo from "../../assets/logo_blanco_720.png";

import { CONTACT, emailComposeHref } from "../../config/contact";

export default function Header() {
  const hasSocialLinks = Boolean(
    emailComposeHref || CONTACT.instagramUrl || CONTACT.facebookUrl
  );

  return (
    <header className="header-container">
      <div className="header-izquierda">
        <img
          src={logo}
          alt="DameCancha"
          className="header-logo"
        />
      </div>

      {hasSocialLinks && (
        <nav
          className="header-centro"
          aria-label="Contacto y redes sociales"
        >
          {emailComposeHref && (
            <a
              href={emailComposeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="header-centro-link"
              aria-label="Enviar email"
            >
              <i
                className="bi bi-envelope"
                aria-hidden="true"
              ></i>
            </a>
          )}

          {CONTACT.instagramUrl && (
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="header-centro-link"
              aria-label="Instagram"
            >
              <i
                className="bi bi-instagram"
                aria-hidden="true"
              ></i>
            </a>
          )}

          {CONTACT.facebookUrl && (
            <a
              href={CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="header-centro-link"
              aria-label="Facebook"
            >
              <i
                className="bi bi-facebook"
                aria-hidden="true"
              ></i>
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
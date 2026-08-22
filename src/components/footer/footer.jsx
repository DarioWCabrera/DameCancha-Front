import "./footer.css";

import { CONTACT, emailHref, phoneHref } from "../../config/contact";

export default function Footer() {
  return (
    <footer className="footer-container">

      {/* COLUMNA 1 - DAMECANCHA */}
      <div className="footer-section footer-left">
        <h3>Unite a DameCancha</h3>

        <ul>
          <li>
            <a href="#deportes" className="footer-link">
              Reservá tu cancha en tres clicks
            </a>
          </li>

          <li>
            © {new Date().getFullYear()}. Todos los derechos reservados
          </li>
        </ul>
      </div>

      {/* COLUMNA 2 - CONTACTANOS */}
      <div className="footer-section footer-center">
        <h3>Contactanos</h3>

        <ul>
          {emailHref && (
            <li>
              Email:{" "}
              <a href={emailHref} className="footer-link">
                {CONTACT.email}
              </a>
            </li>
          )}

          {phoneHref && (
            <li>
              Tel:{" "}
              <a href={phoneHref} className="footer-link">
                {CONTACT.phone}
              </a>
            </li>
          )}

          <li>HQ: {CONTACT.headquarters}</li>
        </ul>
      </div>

      {/* COLUMNA 3 - LEGAL */}
      <div className="footer-section footer-right">
        <h3>Legal</h3>

        <ul>
          <li>
            <a
              href="/legal/terminos.html"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Términos y condiciones
            </a>
          </li>

          <li>
            <a
              href="/legal/privacidad.html"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de privacidad
            </a>
          </li>

          <li>
            <a
              href="/legal/cookies.html"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de cookies
            </a>
          </li>

          <li>
            <a
              href="/legal/reservas.html"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reservas y cancelaciones
            </a>
          </li>
        </ul>
      </div>

    </footer>
  );
}
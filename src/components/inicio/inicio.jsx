import { API_URL, apiUrl, mediaUrl } from '../../config/api';
import React, { useEffect, useState } from "react";
import { deportes } from "../staticData";
import "./inicio.css";
import WhatsAppButton from "../WhatsApp/WhatsAppButton";

import futbol5 from "../imagenes/futbol5.png";
import futbol11 from "../imagenes/futbol11.png";
import basquet from "../imagenes/basquet.png";
import tennis from "../imagenes/tennis.png";
import voley from "../imagenes/voley.png";
import padel from "../imagenes/padel.png";
import natacion from "../imagenes/natacion.png";
import golf from "../imagenes/golf.png";

import logo from "../../assets/logo_blanco_720.png";
import fondoEstadio from "./backgroud1.png";

import Login from "../login/login";

const sportImages = {
  "Futbol 5": futbol5,
  "Futbol 7": futbol5,
  "Futbol 11": futbol11,
  Basquet: basquet,
  Tenis: tennis,
  Padel: padel,
  Voley: voley,
  Natacion: natacion,
  Golf: golf,
};

const inicioModales = {
  comoFunciona: {
    titulo: "¿Cómo funciona DameCancha?",
    bajada:
      "Reservar una cancha no debería depender de llamadas, mensajes o respuestas tardías.",
    items: [
      {
        icono: "1️⃣",
        titulo: "Elegí tu deporte",
        descripcion:
          "Seleccioná fútbol, tenis, pádel, básquet u otra categoría disponible.",
      },
      {
        icono: "2️⃣",
        titulo: "Buscá canchas disponibles",
        descripcion:
          "Consultá clubes cercanos, horarios libres, ubicación y servicios.",
      },
      {
        icono: "3️⃣",
        titulo: "Reservá tu horario",
        descripcion:
          "Ingresá a tu cuenta para avanzar con la reserva de forma rápida.",
      },
    ],
  },
  beneficios: {
    titulo: "Beneficios de usar DameCancha",
    bajada:
      "Una plataforma para reservar canchas, encontrar jugadores, organizar torneos y gestionar clubes de manera más simple.",
    items: [
      {
        icono: "👥",
        titulo: "Banco de suplentes",
        descripcion:
          "¿Te falta un jugador o estás solo y buscás equipo? Publicá tu disponibilidad, encontrá personas compatibles y completá el partido.",
      },
      {
        icono: "🏆",
        titulo: "Torneos y eventos",
        descripcion:
          "Publicá torneos, promocionalos dentro de la plataforma y atraé nuevos jugadores a tu club.",
      },
      {
        icono: "⚡",
        titulo: "Todo en un solo lugar",
        descripcion:
          "Gestioná horarios, reservas, jugadores, torneos y actividades desde una plataforma simple y organizada.",
      },
    ],
  },
  categorias: {
    titulo: "Categorías disponibles",
    bajada:
      "Explorá diferentes deportes y encontrá espacios deportivos según la actividad que quieras practicar.",
    items: [
      {
        icono: "⚽",
        titulo: "Fútbol",
        descripcion:
          "Canchas de fútbol 5, fútbol 7 y fútbol 11 para partidos entre amigos o equipos.",
      },
      {
        icono: "🎾",
        titulo: "Tenis y Pádel",
        descripcion:
          "Espacios para partidos individuales, dobles, entrenamientos o clases.",
      },
      {
        icono: "🏀",
        titulo: "Básquet y Vóley",
        descripcion:
          "Canchas para partidos recreativos, entrenamientos y encuentros grupales.",
      },
      {
        icono: "🏊",
        titulo: "Otros deportes",
        descripcion:
          "Natación, golf y más disciplinas según disponibilidad de cada club.",
      },
    ],
  },
};

const Inicio = ({ onLoginSuccess, onRegister, onRegisterClub, onAdminLogin }) => {
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [usuariosRegistrados, setUsuariosRegistrados] = useState(0);
  const [modalActivo, setModalActivo] = useState(null);

  useEffect(() => {
    const CONTADOR_INICIAL = 50;

    // IMPORTANTE:
    // Acá va la cantidad de usuarios REALES que tenés hoy en Neon.
    const USUARIOS_REALES_INICIALES = 1;

    const animarContador = (total) => {
      let contador = 0;

      const incremento = Math.max(1, Math.ceil(total / 70));

      const intervalo = setInterval(() => {
        contador += incremento;

        if (contador >= total) {
          contador = total;
          clearInterval(intervalo);
        }

        setUsuariosRegistrados(contador);
      }, 20);
    };

    const obtenerCantidadUsuarios = async () => {
      try {
        const response = await fetch(apiUrl("/user/count"));

        if (!response.ok) {
          throw new Error("No se pudo obtener la cantidad de usuarios");
        }

        const data = await response.json();

        const usuariosNuevos = Math.max(
          0,
          data.total - USUARIOS_REALES_INICIALES
        );

        const totalVisible =
          CONTADOR_INICIAL + usuariosNuevos * 7;

        animarContador(totalVisible);
      } catch (error) {
        console.error(
          "Error al obtener usuarios registrados:",
          error
        );

        animarContador(CONTADOR_INICIAL);
      }
    };

    obtenerCantidadUsuarios();
  }, []);

  const irAlLogin = () => {
    setMostrarLogin(true);
  };

  /*
    El Banco de suplentes es privado.
    Guardamos la intención para que, después del login,
    App.jsx redirija al usuario directamente a esa sección.
  */
  const irAlBancoSuplentes = () => {
    localStorage.setItem(
      'redirectAfterLogin',
      '/banco-de-suplentes'
    );
    setMostrarLogin(true);
  };

  const abrirModal = (modal) => {
    setModalActivo(modal);
  };

  const cerrarModal = () => {
    setModalActivo(null);
  };

  if (mostrarLogin) {
    return (
      <Login
        onLoginSuccess={onLoginSuccess}
        onRegister={onRegister}
        onRegisterClub={onRegisterClub}
      />
    );
  }

  return (
    <main
      className="inicio-page"
      style={{ backgroundImage: `url(${fondoEstadio})` }}
    >
      <div className="inicio-overlay">
        <header className="inicio-header">
          <button
            type="button"
            className="inicio-logo-btn"
            onClick={irAlLogin}
          >
            <img src={logo} alt="Logo DameCancha" className="inicio-logo" />
          </button>

          <nav className="inicio-nav">
            <button type="button" onClick={() => abrirModal("comoFunciona")}>
              ¿Cómo funciona?
            </button>

            <button type="button" onClick={() => abrirModal("beneficios")}>
              Beneficios
            </button>

            <button type="button" onClick={() => abrirModal("categorias")}>
              Categorías
            </button>

            <button
              type="button"
              className="inicio-login-btn"
              onClick={irAlLogin}
            >
              Ingresar
            </button>

            {/* <button
              type="button"
              className="inicio-admin-btn"
              onClick={onAdminLogin}
            >
              Admin
            </button> */}
          </nav>
        </header>

        <section className="inicio-hero">
          <button type="button" className="inicio-badge" onClick={irAlLogin}>
            ⭐ La forma más fácil de reservar canchas
          </button>

          <h1 className="inicio-title">
            Reservá tu cancha
            <span>en minutos</span>
          </h1>

          <p className="inicio-description">
            Encontrá canchas disponibles, consultá horarios, conocé cada club y
            organizá tu partido sin perder tiempo en llamadas o mensajes.
          </p>

          <p className="inicio-highlight">
            ✅ Sin llamadas. Sin mensajes. <strong>Sin esperas.</strong>
          </p>

          <div className="inicio-actions">
            <article
              className="inicio-action-card inicio-action-card-primary"
              onClick={irAlLogin}
            >
              <div className="inicio-card-icon">👥</div>

              <div className="inicio-card-content">
                <h2>Quiero reservar</h2>
                <p>Para usuarios, amigos y equipos amateur.</p>
              </div>

              <button
                type="button"
                className="inicio-card-btn inicio-card-btn-light"
                onClick={irAlLogin}
              >
                Reservar ahora →
              </button>
            </article>

            <article
              className="inicio-action-card inicio-action-card-secondary"
              onClick={irAlLogin}
            >
              <div className="inicio-card-icon">🏟️</div>

              <div className="inicio-card-content">
                <h2>Soy dueño de cancha</h2>
                <p>Publicá tu club, gestioná horarios y recibí reservas.</p>
              </div>

              <button
                type="button"
                className="inicio-card-btn inicio-card-btn-blue"
                onClick={irAlLogin}
              >
                Publicar mi club →
              </button>
            </article>
          </div>
        </section>

        <aside className="inicio-users-floating-card">
          <span className="inicio-users-number">
            +{usuariosRegistrados}
          </span>

          <p>
            jugadores ya forman parte de <strong>DameCancha</strong>
          </p>
        </aside>

        <section className="inicio-banco-suplentes">
          <div className="inicio-banco-suplentes__icon">
            <i className="bi bi-people-fill"></i>
          </div>

          <div className="inicio-banco-suplentes__content">
            <span>Nueva comunidad deportiva</span>
            <h2>¿Querés jugar pero no tenés equipo?</h2>
            <p>
              Encontrá compañeros por deporte, nivel, zona, día y
              horario. Formá el partido y después reservá la cancha.
            </p>
          </div>

          <button
            type="button"
            onClick={irAlBancoSuplentes}
          >
            Explorar Banco de suplentes
            <i className="bi bi-arrow-right"></i>
          </button>
        </section>

        <section className="inicio-benefits" onClick={irAlLogin}>
          <div className="inicio-benefit">
            <span>📅</span>
            <div>
              <h3>Ver canchas disponibles</h3>
              <p>En tu zona</p>
            </div>
          </div>

          <div className="inicio-benefit">
            <span>⏰</span>
            <div>
              <h3>Consultar horarios</h3>
              <p>En tiempo real</p>
            </div>
          </div>

          <div className="inicio-benefit">
            <span>📍</span>
            <div>
              <h3>Información clara</h3>
              <p>Fotos, servicios y ubicación</p>
            </div>
          </div>

          <div className="inicio-benefit">
            <span>🏆</span>
            <div>
              <h3>Organizá tu partido</h3>
              <p>Fácil y rápido</p>
            </div>
          </div>

          <div className="inicio-benefit">
            <span>📈</span>
            <div>
              <h3>Más reservas</h3>
              <p>Para dueños de cancha</p>
            </div>
          </div>
        </section>

        <section className="inicio-sports">
          <h2>Elegí tu deporte</h2>

          <div className="inicio-sports-list">
            {deportes.map((sport) => (
              <button
                key={sport.id}
                type="button"
                onClick={irAlLogin}
                className="inicio-sport-pill"
              >
                <img
                  src={sportImages[sport.nombre]}
                  alt={sport.nombre}
                  className="inicio-sport-icon"
                />

                <span>{sport.nombre}</span>
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="inicio-footer" onClick={irAlLogin}>
          🛡️ Seguro · Confiable · Rápido · DameCancha
        </button>


        {modalActivo && (
          <div className="inicio-modal-backdrop" onClick={cerrarModal}>
            <section
              className="inicio-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="inicio-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="inicio-modal-close"
                onClick={cerrarModal}
                aria-label="Cerrar modal"
              >
                ×
              </button>

              <div className="inicio-modal-header">
                <h2 id="inicio-modal-title">
                  {inicioModales[modalActivo].titulo}
                </h2>
                <p>{inicioModales[modalActivo].bajada}</p>
              </div>

              <div className="inicio-modal-grid">
                {inicioModales[modalActivo].items.map((item) => (
                  <article className="inicio-modal-card" key={item.titulo}>
                    <span>{item.icono}</span>
                    <h3>{item.titulo}</h3>
                    <p>{item.descripcion}</p>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="inicio-modal-action"
                onClick={irAlLogin}
              >
                Ingresar para continuar →
              </button>
            </section>
          </div>
        )}

        <WhatsAppButton />
      </div>
    </main>
  );
};

export default Inicio;
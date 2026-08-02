import { mediaUrl } from '../../config/api';
import React from 'react';
import './tarjetaCalendario.css';
import Calendar from './calendario';

function CalendarView({ club, onDateSelect, onBack }) {
  const DEFAULT_LOGO =
    'https://img.freepik.com/vector-premium/diseno-camiseta-deportiva-logotipo-deporte-deporte-muestra-triangulo-medio_856405-2413.jpg?semt=ais_hybrid&w=740&q=80';

  const getLogoUrl = (logo) => {
    if (!logo) return DEFAULT_LOGO;
    if (logo.startsWith('http')) return logo;
    return mediaUrl(logo);
  };

  const nombreClub = club?.nombre || club?.razonSocial || club?.nombre_club || 'Club';
  const direccionClub = club?.direccion || club?.direccion_club || 'Av. Siempreviva 742';

  return (
    <div className="calendar-main-layout">
      <div className="info-panel">
        <div className="tarjeta-info-header">
          <p className="header-title">CLUB SELECCIONADO</p>
        </div>

        <div className="club-detalle-content">
          <img
            src={getLogoUrl(club?.logo_club || club?.logoSrc)}
            alt={`Logo de ${nombreClub}`}
            className="club-logo"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_LOGO;
            }}
          />

          <h1 className="club-nombre">{nombreClub}</h1>

          <p className="club-direccion">
            {direccionClub} <i className="bi bi-map"></i>
          </p>

          <p className="club-descripcion">
            {club?.descripcion ||
              'Un espacio pensado para quienes buscan crecer, superarse y disfrutar en un entorno activo. Nuestro club ofrece instalaciones modernas, actividades variadas y un ambiente que impulsa el trabajo en equipo, la disciplina y el compañerismo. Tanto quienes recién comienzan como quienes buscan mejorar su rendimiento encuentran aquí un lugar donde formarse, entrenar y compartir experiencias. El objetivo es fomentar un estilo de vida saludable, promover valores positivos y brindar un punto de encuentro donde cada persona pueda desarrollar su potencial al máximo.'}
            {' '}
            <i className="bi bi-book"></i>
          </p>
        </div>
      </div>

      <div className="calendar-panel">
        <Calendar onDateSelect={onDateSelect} onBack={onBack} />
      </div>
    </div>
  );
}

export default CalendarView;
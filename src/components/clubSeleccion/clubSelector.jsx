import { API_URL, apiUrl, mediaUrl } from '../../config/api';
import React, { useEffect, useState } from 'react';
import './clubSelector.css';

const ClubSelector = ({ selectedSport, onClubSelect, onBack }) => {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizarTexto = (texto = '') =>
    texto
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
        const response = await fetch(apiUrl('/cancha'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });


        if (!response.ok) {
          throw new Error('No se pudieron obtener las canchas');
        }

        const data = await response.json();
        setCanchas(data);
      } catch (error) {
        console.error('Error al cargar canchas:', error);
        setError('No se pudieron cargar las canchas disponibles.');
      } finally {
        setLoading(false);
      }
    };

    fetchCanchas();
  }, []);

  const deporteSeleccionado = selectedSport?.nombre || selectedSport?.razonSocial;
  const deporteSeleccionadoNormalizado = normalizarTexto(deporteSeleccionado);

  const canchasDelDeporte = canchas.filter((cancha) => {
    const deporteCancha =
      cancha?.deporte?.nombre_deporte ||
      cancha?.nombre_deporte ||
      '';

    return normalizarTexto(deporteCancha) === deporteSeleccionadoNormalizado;
  });

  if (loading) {
    return (
      <div className="club-selector-container">
        <h2 className="club-selector-title">Cargando canchas...</h2>
      </div>
    );
  }

  return (
    <div className="club-selector-container">
      <h2 className="club-selector-title">
        Canchas disponibles para {deporteSeleccionado}
      </h2>

      {error && <p className="club-selector-empty">{error}</p>}

      <div className="club-selector-list">
        {canchasDelDeporte.map((cancha) => {
          const club = cancha.club;
          const deporte = cancha.deporte;

          const nombreClub = club?.nombre_club || 'Club sin nombre';
          const nombreCancha = cancha.nombre_cancha || 'Cancha sin nombre';
          const nombreDeporte = deporte?.nombre_deporte || deporteSeleccionado;

          return (
            <button
              key={cancha.id_cancha}
              onClick={() =>
                onClubSelect({
                  id: club?.id_club,
                  id_club: club?.id_club,

                  id_cancha: cancha.id_cancha,
                  nombre_cancha: nombreCancha,

                  nombre: nombreClub,
                  razonSocial: nombreClub,
                  ciudad: club?.ciudad_club,
                  telefono: club?.telefono_club,

                  deporte: nombreDeporte,
                  deporteSeleccionado: nombreDeporte,

                  precio_por_hora: cancha.precio_por_hora,

                  logoSrc:
                    club?.logo_club ||
                    'https://img.freepik.com/vector-premium/diseno-camiseta-deportiva-logotipo-deporte-deporte-muestra-triangulo-medio_856405-2413.jpg?semt=ais_hybrid&w=740&q=80',
                })
              }
              className="club-selector-item"
            >
              <img
                src={
                  club.logo_club
                    ? mediaUrl(club.logo_club)
                    : 'https://img.freepik.com/vector-premium/diseno-camiseta-deportiva-logotipo-deporte-deporte-muestra-triangulo-medio_856405-2413.jpg?semt=ais_hybrid&w=740&q=80'
                }
                alt={club.nombre_club}
                className="club-icon"
              

              onError={(e) => {
                e.currentTarget.src = 'https://img.freepik.com/vector-premium/diseno-camiseta-deportiva-logotipo-deporte-deporte-muestra-triangulo-medio_856405-2413.jpg?semt=ais_hybrid&w=740&q=80';
              }}
                />

              <div>
                <strong>{nombreClub}</strong>
                <br />
                <span>{nombreCancha}</span>
              </div>
            </button>
          );
        })}
      </div>

      {canchasDelDeporte.length === 0 && !error && (
        <p className="club-selector-empty">
          No hay canchas disponibles para este deporte.
        </p>
      )}

      <div className="club-selector-back-container">
        <button onClick={onBack} className="club-selector-back-button">
          Volver
        </button>
      </div>
    </div>
  );
};

export default ClubSelector;
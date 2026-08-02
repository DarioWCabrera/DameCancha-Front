import React from 'react';
import { deportes } from '../staticData';
import { useAuth } from '../../hooks/useAuth';
const { user } = useAuth();

const ClubSelector = ({ onSportSelect, onLogout, onShowReservas }) => {
  return (
    <div className="sport-selector-container">
      <div className="sport-selector-header">
        <h2 className="sport-selector-title">Seleccionar Deporte {user.nombre}</h2>
        <div className="sport-selector-actions">
          <button
            onClick={onShowReservas}
            className="sport-selector-reservas-button"
          >
            Mis Reservas 
          </button>
          <button
            onClick={onLogout}
            className="sport-selector-logout-button"
          >
            Desloguear
          </button>
        </div>
      </div>
      <div className="sport-selector-list">
        {deportes.map(sport => (
          <button
            key={sport.id}
            onClick={() => onSportSelect(sport)}
            className="sport-selector-item"
          >
            {sport.nombre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClubSelector;
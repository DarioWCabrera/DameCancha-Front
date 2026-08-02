import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { horarios } from '../staticData';
import './slotTiempo.css';

const TimeSlots = ({
  date,
  sport,
  club,
  reservas = [],
  onBack,
  onAddReserva,
  onReservaComplete,
}) => {
  const [horariosReservados, setHorariosReservados] = useState([]);

  const nombreClub = club?.razonSocial || club?.nombre || 'Club';
  const nombreDeporte = club?.deporte || sport?.nombre || 'Deporte';

  const idCancha = club?.id_cancha; // 🔥 CLAVE

  useEffect(() => {
  }, [club, reservas]);

  const horariosDisponibles = horarios.map((horario) => {
    const reservadoLocal = horariosReservados.includes(horario.id);

    let ocupadoPorReserva = false;

    if (reservas.length > 0 && date && idCancha) {
      const fechaSeleccionadaStr = date.toISOString().split('T')[0];

      ocupadoPorReserva = reservas.some((reserva) => {
        if (!reserva.fecha || !reserva.hora) return false;

        const fechaReservaStr = new Date(reserva.fecha)
          .toISOString()
          .split('T')[0];

        const mismaCancha = reserva.id_cancha === idCancha;
        const mismaFecha = fechaReservaStr === fechaSeleccionadaStr;
        const mismaHora = reserva.hora === horario.hora;

        return mismaCancha && mismaFecha && mismaHora;
      });
    }

    // lógica horario pasado
    let horarioDisponibleHoy = true;
    let horarioPasado = false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaSeleccionada = new Date(date);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    if (fechaSeleccionada.getTime() === hoy.getTime()) {
      const horaActual = new Date().getHours();
      const [horaHorario] = horario.hora.split(':').map(Number);

      horarioDisponibleHoy = horaHorario > horaActual;
      horarioPasado = horaHorario <= horaActual;
    }

    const disponible =
      !reservadoLocal &&
      !ocupadoPorReserva &&
      horarioDisponibleHoy;

    return {
      ...horario,
      disponible,
      ocupado: ocupadoPorReserva,
      horarioPasado,
    };
  });

  const handleReservarHorario = (horario) => {
    if (!horario.disponible) return;

    Swal.fire({
      title: 'Turno reservado',
      text: `Cancha: ${club.nombre_cancha}. Club: ${nombreClub}. Fecha: ${date.toLocaleDateString('es-AR')}. Horario: ${horario.hora}.`,
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });

    setHorariosReservados((prev) => [...prev, horario.id]);

    if (onAddReserva) {
      onAddReserva({
        id_cancha: idCancha, // 🔥 ahora guardamos esto
        nombre_cancha: club.nombre_cancha,
        club: nombreClub,
        deporte: nombreDeporte,
        fecha: date.toISOString(),
        hora: horario.hora,
      });
    }

    if (onReservaComplete) {
      onReservaComplete();
    }
  };

  return (
    <div className="time-slots-container">
      <h2 className="time-slots-title">Horarios Disponibles</h2>

      <p><strong>Club:</strong> {nombreClub}</p>
      <p><strong>Cancha:</strong> {club.nombre_cancha}</p>
      <p><strong>Deporte:</strong> {nombreDeporte}</p>

      <div className="time-slots-grid">
        {horariosDisponibles.map((horario) => (
          <button
            key={horario.id}
            disabled={!horario.disponible}
            onClick={() => handleReservarHorario(horario)}
            className={`time-slot-btn ${
              horario.disponible ? 'available' : 'occupied'
            }`}
          >
            {horario.hora}
          </button>
        ))}
      </div>

      <button onClick={onBack} className="back-button">
        Volver
      </button>
    </div>
  );
};

export default TimeSlots;

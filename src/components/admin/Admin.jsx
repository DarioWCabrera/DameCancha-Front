

import React from "react";
import "./Admin.css";

const Admin = ({ clubesRegistrados, setClubesRegistrados }) => {
  // Solicitudes: clubes no aprobados
  const solicitudes = clubesRegistrados.filter(c => !c.aprobado);
  // Clubes aprobados (solo dinámicos)
  const clubes = clubesRegistrados.filter(c => c.aprobado);

  // Aceptar solicitud
  const aceptarSolicitud = (id) => {
    setClubesRegistrados(prev => prev.map(c => c.id === id ? { ...c, aprobado: true, activo: true } : c));
  };

  // Toggle activo/inactivo
  const toggleClub = (id) => {
    setClubesRegistrados(prev => prev.map(c => c.id === id ? { ...c, activo: !c.activo } : c));
  };

  return (
    <div className="admin-container">
      <h2>Solicitudes de Registro de Clubes</h2>
      {solicitudes.length === 0 ? (
        <p>No hay nuevas solicitudes.</p>
      ) : (
        <ul className="solicitudes-list">
          {solicitudes.map((sol) => (
            <li key={sol.id}>
              {sol.nombre}
              <button onClick={() => aceptarSolicitud(sol.id)}>
                Aceptar
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Clubes Registrados</h2>
      {clubes.length === 0 ? (
        <p>No hay clubes registrados.</p>
      ) : (
        <ul className="clubes-list">
          {clubes.map((club) => (
            <li key={club.id}>
              {club.nombre}
              <label className="switch">
                <input
                  type="checkbox"
                  checked={club.activo}
                  onChange={() => toggleClub(club.id)}
                />
                <span className="slider"></span>
              </label>
              <span className={club.activo ? "activo" : "inactivo"}>
                {club.activo ? "Activo" : "Inactivo"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Admin;
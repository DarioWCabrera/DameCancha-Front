import { apiUrl } from '../../config/api';
import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminPanel = ({ adminUser, onLogout }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [newAdminNombre, setNewAdminNombre] = useState('');
  const [newAdminApellido, setNewAdminApellido] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [admins, setAdmins] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [clubesAceptados, setClubesAceptados] = useState([]);

  // Los clubes se incorporan automáticamente y se administran desde esta lista.
  // Cargar clubes aceptados desde la base de datos
  const fetchClubesAceptados = async () => {
    try {
      const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
      const response = await fetch(apiUrl('/club/aceptados/admin'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClubesAceptados(data);
      }
    } catch (error) {
      console.error('Error al cargar clubes aceptados:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/user'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const users = await response.json();
      const adminRows = users
        .filter((user) => user.tipo_usuario === 'admin')
        .map((user) => ({
          id: user.id_usuario,
          username: `${user.nombre_usuario || ''} ${user.apellido_usuario || ''}`.trim() || user.email_usuario,
          email: user.email_usuario,
          createdAt: user.created_at
            ? new Date(user.created_at).toLocaleDateString('es-AR')
            : 'Sin fecha',
        }));

      setAdmins(adminRows);
    } catch (error) {
      console.error('Error al cargar administradores:', error);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchClubesAceptados();
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    
    // Validar campos requeridos
    if (!newAdminNombre || !newAdminApellido || !newAdminEmail || !newAdminPassword) {
      setErrorMessage('Por favor completa todos los campos');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Preparar datos para enviar al backend
      const adminData = {
        nombre_usuario: newAdminNombre,
        apellido_usuario: newAdminApellido,
        email_usuario: newAdminEmail,
        password_usuario: newAdminPassword,
        // Establecer tipo como admin (el endpoint ya lo fuerza, pero lo incluimos por claridad)
        tipo_usuario: 'admin'
      };


      // Enviar solicitud al backend para crear el admin
      const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
      const response = await fetch(apiUrl('/user/create-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminData),
      });


      if (response.ok) {
        await response.json();
        
        await fetchAdmins();

        // Limpiar formulario
        setNewAdminNombre('');
        setNewAdminApellido('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        
        setSuccessMessage('Admin creado exitosamente en la base de datos');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        console.error('Error del backend:', errorData);
        throw new Error(errorData.message || 'Error al crear el admin');
      }
    } catch (error) {
      console.error('Error al crear admin:', error);
      setErrorMessage(error.message || 'Error al crear el admin. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleClubStatus = async (clubId, currentActivo) => {
    try {
      const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
      const response = await fetch(apiUrl(`/club/${clubId}/toggle-status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !currentActivo })
      });

      if (response.ok) {
        setClubesAceptados(prev => 
          prev.map(club => 
            club.id === clubId ? { ...club, activo: !currentActivo } : club
          )
        );
      } else {
        console.error('Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error al cambiar el estado del club:', error);
    }
  };

  // Los clubes nuevos quedan activos de inmediato. El admin puede inactivarlos o reactivarlos.


  return (
    <div className="admin-panel-container">
      {/* Header del Panel */}
      <div className="admin-panel-header">
        <h1 className="admin-panel-title">Panel de Administrador</h1>
        <div className="admin-header-actions">
          <button 
            className="admin-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            <i className="bi bi-gear"></i> Configuración
          </button>
          <button 
            className="admin-logout-btn"
            onClick={onLogout}
          >
            <i className="bi bi-box-arrow-right"></i> Salir
          </button>
        </div>
      </div>

      {/* Sección de Configuración */}
      {showSettings && (
        <div className="admin-settings-section">
          <h2>Configuración de Admins</h2>
          
          <div className="admin-form-box">
            <h3>Datos Actuales</h3>
            <div className="admin-current-info">
              <p><strong>Usuario:</strong> {`${adminUser?.nombre || adminUser?.nombre_usuario || ''} ${adminUser?.apellido || adminUser?.apellido_usuario || ''}`.trim() || adminUser?.email || adminUser?.email_usuario || 'Administrador'}</p>
              <p><strong>Rol:</strong> Administrador</p>
              <p><strong>Sesión:</strong> Activa</p>
            </div>
          </div>

<div className="admin-form-box">
             <h3>Agregar Nuevo Admin</h3>
             <form onSubmit={handleAddAdmin} className="admin-add-form">
               <div className="admin-form-group">
                 <label>Nombre:</label>
                 <input
                   type="text"
                   placeholder="Nombre"
                   value={newAdminNombre}
                   onChange={(e) => setNewAdminNombre(e.target.value)}
                   className="admin-input"
                   maxLength={100}
                   required
                 />
               </div>
               <div className="admin-form-group">
                 <label>Apellido:</label>
                 <input
                   type="text"
                   placeholder="Apellido"
                   value={newAdminApellido}
                   onChange={(e) => setNewAdminApellido(e.target.value)}
                   className="admin-input"
                   maxLength={100}
                   required
                 />
               </div>
               <div className="admin-form-group">
                 <label>Email:</label>
                 <input
                   type="email"
                   placeholder="email@example.com"
                   value={newAdminEmail}
                   onChange={(e) => setNewAdminEmail(e.target.value)}
                   className="admin-input"
                   maxLength={150}
                   autoComplete="email"
                   required
                 />
               </div>
               <div className="admin-form-group">
                 <label>Contraseña:</label>
                 <input
                   type="password"
                   placeholder="Contraseña"
                   value={newAdminPassword}
                   onChange={(e) => setNewAdminPassword(e.target.value)}
                   className="admin-input"
                   minLength={8}
                   maxLength={128}
                   autoComplete="new-password"
                   pattern="(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\d).{8,128}"
                   title="Debe tener al menos 8 caracteres, una letra y un número"
                   required
                 />
               </div>
               <button type="submit" className="admin-submit-btn" disabled={loading}>
                 {loading ? 'Creando...' : 'Agregar Admin'}
               </button>
               {errorMessage && <p className="admin-error-msg" style={{color: 'red'}}>{errorMessage}</p>}
               {successMessage && <p className="admin-success-msg">{successMessage}</p>}
             </form>
           </div>

          <div className="admin-form-box">
            <h3>Admins Registrados</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Fecha de Creación</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td>{admin.username}</td>
                    <td>{admin.email}</td>
                    <td>{admin.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gestión de clubes: altas automáticas, con posibilidad de inactivar/reactivar. */}
      {/* Sección de Clubes Registrados */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          Clubes registrados ({clubesAceptados.length})
        </h2>
        
        {clubesAceptados.length === 0 ? (
          <p className="admin-no-items">No hay clubes registrados aún</p>
        ) : (
          <div className="admin-clubs-grid">
            {clubesAceptados.map(club => (
              <div key={club.id} className="admin-club-card">
                <div className="admin-club-header">
                  <h3>{club.nombre || club.razonSocial}</h3>
                  <span className={`admin-badge-status ${club.activo ? 'activo' : 'inactivo'}`}>
                    {club.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="admin-club-details">
                  <p><strong>Email:</strong> {club.email}</p>
                  <p><strong>Dirección:</strong> {club.direccion || 'No disponible'}</p>
                </div>
                <div className="admin-club-toggle">
                  <label className="admin-toggle-switch">
                    <input
                      type="checkbox"
                      checked={club.activo || false}
                      onChange={() => toggleClubStatus(club.id, club.activo)}
                      className="admin-toggle-input"
                    />
                    <span className="admin-toggle-slider"></span>
                  </label>
                  <span>{club.activo ? 'Visible en la plataforma' : 'Oculto en la plataforma'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

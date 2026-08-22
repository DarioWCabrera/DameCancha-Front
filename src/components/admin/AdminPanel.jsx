import { apiUrl } from '../../config/api';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
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

  // Solicitudes de baja del servicio.
  const [solicitudesBaja, setSolicitudesBaja] = useState([]);
  const [cargandoSolicitudesBaja, setCargandoSolicitudesBaja] = useState(false);
  const [procesandoSolicitudBajaId, setProcesandoSolicitudBajaId] = useState(null);

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

  const fetchSolicitudesBaja = async () => {
    setCargandoSolicitudesBaja(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(apiUrl('/solicitud-baja/admin'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data?.message || 'No se pudieron cargar las solicitudes de baja.'
        );
      }

      setSolicitudesBaja(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar solicitudes de baja:', error);
      setSolicitudesBaja([]);
    } finally {
      setCargandoSolicitudesBaja(false);
    }
  };

  const obtenerNombreClubSolicitud = (solicitud) => {
    const clubRelacionado = clubesAceptados.find(
      (club) => Number(club.id) === Number(solicitud.id_club)
    );

    return (
      clubRelacionado?.nombre ||
      clubRelacionado?.razonSocial ||
      `Club #${solicitud.id_club}`
    );
  };

  const formatearFechaSolicitud = (fecha) => {
    if (!fecha) return 'Sin fecha';

    const parsed = new Date(fecha);

    if (Number.isNaN(parsed.getTime())) {
      return String(fecha);
    }

    return parsed.toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const procesarSolicitudBaja = async (solicitud) => {
    if (!solicitud?.id_solicitud || solicitud.estado !== 'pendiente') {
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: 'Procesar solicitud de baja',
      html: `
        <p>Vas a marcar como procesada la solicitud:</p>
        <p><strong>${solicitud.codigo || `#${solicitud.id_solicitud}`}</strong></p>
        <p>Esto no desactiva automáticamente el club.</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar procesada',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    setProcesandoSolicitudBajaId(solicitud.id_solicitud);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(
        apiUrl(`/solicitud-baja/${solicitud.id_solicitud}/procesar`),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || 'No se pudo procesar la solicitud de baja.'
        );
      }

      setSolicitudesBaja((prev) =>
        prev.map((item) =>
          String(item.id_solicitud) === String(solicitud.id_solicitud)
            ? data.solicitud
            : item
        )
      );

      await Swal.fire({
        icon: 'success',
        title: 'Solicitud procesada',
        text: 'La solicitud quedó marcada como procesada correctamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al procesar solicitud de baja:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo procesar',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setProcesandoSolicitudBajaId(null);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchClubesAceptados();
    fetchAdmins();
    fetchSolicitudesBaja();
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

      {/* Solicitudes de baja del servicio */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          Solicitudes de baja ({solicitudesBaja.length})
        </h2>

        {cargandoSolicitudesBaja ? (
          <p className="admin-no-items">Cargando solicitudes...</p>
        ) : solicitudesBaja.length === 0 ? (
          <p className="admin-no-items">No hay solicitudes de baja registradas</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Club</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Procesada</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {solicitudesBaja.map((solicitud) => {
                  const pendiente = solicitud.estado === 'pendiente';
                  const procesando =
                    String(procesandoSolicitudBajaId) ===
                    String(solicitud.id_solicitud);

                  return (
                    <tr key={solicitud.id_solicitud}>
                      <td>
                        <strong>{solicitud.codigo || '-'}</strong>
                      </td>

                      <td>{obtenerNombreClubSolicitud(solicitud)}</td>

                      <td>
                        {solicitud.motivo?.trim()
                          ? solicitud.motivo
                          : 'Sin motivo informado'}
                      </td>

                      <td>
                        <span
                          className={`admin-badge-status ${
                            pendiente ? 'activo' : 'inactivo'
                          }`}
                        >
                          {pendiente ? 'Pendiente' : 'Procesada'}
                        </span>
                      </td>

                      <td>{formatearFechaSolicitud(solicitud.created_at)}</td>

                      <td>
                        {solicitud.processed_at
                          ? formatearFechaSolicitud(solicitud.processed_at)
                          : '-'}
                      </td>

                      <td>
                        {pendiente ? (
                          <button
                            type="button"
                            className="admin-submit-btn"
                            onClick={() => procesarSolicitudBaja(solicitud)}
                            disabled={procesando}
                          >
                            {procesando ? 'Procesando...' : 'Procesar'}
                          </button>
                        ) : (
                          <span>Completada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
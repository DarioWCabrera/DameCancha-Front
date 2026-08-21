import { API_URL, apiUrl, mediaUrl } from './config/api';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';


import Inicio from './components/inicio/inicio.jsx';
import Register from './components/register/registerClub';
import RegisterUser from './components/register/registerUsuario';
import PanelDelClub from './components/panelDelClub/PanelDelClub';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import DashboardUsuario from './components/dashboardUsuario/DashboardUsuario';
import BancoSuplentes from './components/bancoSuplentes/BancoSuplentes';
import { useAuth } from './hooks/useAuth';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const tokenNoVencido = (token) => {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const limpiarSesionPersistida = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_user');
};

const restaurarUsuarioDesdeStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (!saved || !tokenNoVencido(token)) {
      limpiarSesionPersistida();
      return null;
    }

    return JSON.parse(saved);
  } catch {
    limpiarSesionPersistida();
    return null;
  }
};

const normalizarEstadoPagoDesdeApi = (estadoPago) => {
  const estado = (estadoPago || 'pago_en_club').toString().toLowerCase();

  // Se conservan como pagadas únicamente las reservas históricas que ya
  // habían sido confirmadas por la integración anterior.
  if (
    estado === 'pagado' ||
    estado === 'approved' ||
    estado === 'approved_demo' ||
    estado === 'aprobado' ||
    estado === 'pagada online'
  ) {
    return 'pagado';
  }

  // Desde esta versión no existe pago online: toda reserva pendiente,
  // rechazada o nueva se abona presencialmente en el club.
  return 'pago_en_club';
};

const normalizarFechaCalendarioDesdeApi = (valor) => {
  if (!valor) return '';

  const texto = String(valor).trim();
  const matchIso = texto.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matchIso) return matchIso[1];

  const matchVisual = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchVisual) return `${matchVisual[3]}-${matchVisual[2]}-${matchVisual[1]}`;

  return texto;
};

const timestampReserva = (reserva) => {
  const fecha = String(reserva?.fecha || '').slice(0, 10);
  const hora = String(reserva?.hora || reserva?.hora_inicio || '00:00').slice(0, 5);

  let anio;
  let mes;
  let dia;

  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    [anio, mes, dia] = fecha.split('-').map(Number);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
    [dia, mes, anio] = fecha.split('/').map(Number);
  } else {
    return Number.MAX_SAFE_INTEGER;
  }

  const [h = 0, m = 0] = hora.split(':').map(Number);
  return new Date(anio, mes - 1, dia, h, m, 0, 0).getTime();
};

const ordenarReservasAsc = (lista = []) =>
  [...lista].sort((a, b) => {
    const diferencia = timestampReserva(a) - timestampReserva(b);
    if (diferencia !== 0) return diferencia;
    return Number(a?.id_reserva || a?.id || 0) - Number(b?.id_reserva || b?.id || 0);
  });

const mapReservaDesdeApi = (r) => {
  const estadoPago = normalizarEstadoPagoDesdeApi(
    r.estado_pago || r.mercado_pago_status
  );

  return {
    id: r.id_reserva,
    id_reserva: r.id_reserva,
    id_cancha: r.cancha?.id_cancha,
    deporte: r.cancha?.deporte?.nombre_deporte || 'Deporte',
    club: r.cancha?.club?.nombre_club || 'Club',
    cancha: r.cancha?.nombre_cancha || 'Cancha',
    fecha: normalizarFechaCalendarioDesdeApi(r.fecha),
    hora: r.hora_inicio?.slice(0, 5) || '',
    hora_fin: r.hora_fin?.slice(0, 5) || '',
    estado: r.estado
      ? r.estado.charAt(0).toUpperCase() + r.estado.slice(1)
      : 'Confirmada',

    // Datos de pago: imprescindibles para que al recargar no vuelva a aparecer como pendiente.
    estado_pago: estadoPago,
    mercado_pago_preference_id: r.mercado_pago_preference_id || null,
    mercado_pago_payment_id: r.mercado_pago_payment_id || null,
    mercado_pago_status: r.mercado_pago_status || null,
    monto_pagado: r.monto_pagado || null,
    fecha_pago: r.fecha_pago || null,

    // Datos del cliente visibles únicamente para el dueño del club mediante
    // el endpoint protegido /reserva/club/:idClub.
    id_usuario: r.usuario?.id_usuario ?? null,
    cliente_nombre: [r.usuario?.nombre_usuario, r.usuario?.apellido_usuario]
      .filter(Boolean)
      .join(' ') || 'Usuario',
    cliente_telefono: r.usuario?.telefono_usuario || '',

    direccion: r.cancha?.club?.direccion_club || '',
    ciudad: r.cancha?.club?.ciudad_club || '',
    provincia: r.cancha?.club?.provincia_club || '',
    precio: r.monto_total,
    monto_total: r.monto_total,
  };
};

/*
  App es el componente raíz de DameCancha.
  Decide qué pantalla mostrar según:
  - si el usuario está logueado
  - si es dueño de club
  - si es usuario común
  - si está registrándose
  - si está entrando al panel admin
*/
function App() {
  const navigate = useNavigate();
  const { logout, login } = useAuth();

  /*
    Estados de sesión.
    currentUser guarda el usuario logueado.
    adminUser guarda el administrador logueado.
  */

  const [currentUser, setCurrentUser] = useState(restaurarUsuarioDesdeStorage);
  const [adminUser, setAdminUser] = useState(() => {
    const restored = restaurarUsuarioDesdeStorage();
    return restored?.tipo === 'admin' ? restored : null;
  });

  /*
    Estados globales de datos.
    Por ahora reservas, usuarios y clubes siguen mockeados/locales.
    Más adelante pueden venir desde backend.
  */
  const [usuarios, setUsuarios] = useState([]);
  const [clubesRegistrados, setClubesRegistrados] = useState([]);
  const [reservas, setReservas] = useState([]);
  const reservasRequestSeq = useRef(0);

  /*
    Se ejecuta cuando el login fue correcto.
    Guarda el usuario recibido desde el backend.
  */
  const handleLogin = (user) => {
    login(user); // llama a la función login de useAuth para actualizar el estado de autenticación
    setCurrentUser(user);
     localStorage.setItem('user', JSON.stringify(user)); // guarda el usuario en localStorage para persistencia
    if (user) {
      if (user.tipo === 'usuario') {
        fetchReservas();

        const redirectAfterLogin =
          localStorage.getItem('redirectAfterLogin');

        localStorage.removeItem('redirectAfterLogin');

        navigate(
          redirectAfterLogin === '/banco-de-suplentes'
            ? '/banco-de-suplentes'
            : '/dashboardUsuario'
        );
      } else if ((user.tipo === 'club' || user.tipo === 'dueno') && user.club?.id_club) {
        fetchReservasPorClub(user.club.id_club);
        navigate('/panelDelClub');
      } else if (user.tipo === 'admin') {
        navigate('/panelAdmin');
      }
    }
  };

  const fetchReservasPorClub = async (idClub) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/reserva/club/${idClub}?_=${Date.now()}`), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReservas(data.map(mapReservaDesdeApi));
      }
    } catch (error) {
      console.error('Error al cargar reservas del club:', error);
    }
  };

  const fetchReservas = async () => {
    const requestSeq = ++reservasRequestSeq.current;

    try {
      const token = localStorage.getItem('token');
      if (!token) return [];

      // Las reservas del usuario se resuelven desde el JWT en el backend.
      // Evita inconsistencias entre un id guardado en el frontend y el usuario
      // realmente autenticado.
      const response = await fetch(apiUrl(`/reserva/mias?_=${Date.now()}`), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reservasMapeadas = ordenarReservasAsc(data.map(mapReservaDesdeApi));

        // Si había una consulta anterior más lenta, no permitimos que pise
        // una respuesta más reciente (por ejemplo, justo después de reservar).
        if (requestSeq === reservasRequestSeq.current) {
          setReservas(reservasMapeadas);
        }

        return reservasMapeadas;
      }
    } catch (error) {
      console.error('Error al cargar reservas iniciales:', error);
    }

    return [];
  };

  /*
    Al recargar la página, React reinicia el estado en memoria.
    El usuario y el token quedan en localStorage, pero reservas vuelve a [].
    Este efecto vuelve a pedir los datos al backend si la sesión sigue activa.
  */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!currentUser || !token) return undefined;

    const refrescarDatosSesion = () => {
      if (currentUser.tipo === 'usuario') {
        fetchReservas();
        return;
      }

      if (
        (currentUser.tipo === 'club' || currentUser.tipo === 'dueno') &&
        currentUser.club?.id_club
      ) {
        fetchReservasPorClub(currentUser.club.id_club);
      }
    };

    refrescarDatosSesion();

    // Al volver a la pestaña o ventana, refrescamos para que una reserva recién
    // creada/modificada en otra vista no quede fuera del panel lateral.
    const alVolverAlFoco = () => refrescarDatosSesion();
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') refrescarDatosSesion();
    };

    window.addEventListener('focus', alVolverAlFoco);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    return () => {
      window.removeEventListener('focus', alVolverAlFoco);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, [currentUser?.id_usuario, currentUser?.tipo, currentUser?.club?.id_club]);

  /*
    Cierra sesión.
    Limpia usuario común y administrador por seguridad.
  */

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setReservas([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  /*
    Se ejecuta cuando termina un registro.
    Si el nuevo usuario es club, lo guarda en clubesRegistrados.
    Si no, lo guarda en usuarios.
  */
  const handleRegisterComplete = (nuevoUsuario) => {
    if (nuevoUsuario && nuevoUsuario.tipo === 'club') {
      setClubesRegistrados((prev) => [...prev, { ...nuevoUsuario, estado: 'activo', activo: true }]);
    } else {
      setUsuarios((prev) => [...prev, nuevoUsuario]);
    }
  };

  /*
    Se ejecuta cuando el administrador inicia sesión.
  */
  const handleAdminLogin = (admin) => {
    login(admin);
    setCurrentUser(admin);
    setAdminUser(admin);
    localStorage.setItem('user', JSON.stringify(admin));
    navigate('/panelAdmin');
  };

  /*
    Cierra sesión del panel administrador.
  */
  const handleAdminLogout = () => {
    logout();
    setAdminUser(null);
    setCurrentUser(null);
    limpiarSesionPersistida();
    navigate('/');
  };

  /*
    Agrega una reserva al estado global.
    El DashboardUsuario usa esta función cuando confirma una reserva.
  */
  const handleAddReserva = (reserva) => {
    const nuevaReserva = {
      id: reserva.id || Date.now(),
      ...reserva,
      timestamp: new Date().toISOString(),
      estado: reserva.estado || 'Confirmada',
    };

    setReservas((prev) => {
      const idNuevaReserva = String(nuevaReserva.id);
      const existe = prev.some((r) => String(r.id_reserva || r.id) === idNuevaReserva);

      if (!existe) return ordenarReservasAsc([...prev, nuevaReserva]);

      return ordenarReservasAsc(
        prev.map((r) =>
          String(r.id_reserva || r.id) === idNuevaReserva
            ? { ...r, ...nuevaReserva }
            : r
        )
      );
    });
  };

  /*
    Actualiza una reserva existente en el estado global.
    Se usa al modificar para evitar que la reserva original quede duplicada.
  */
  const handleUpdateReserva = (reservaId, reservaActualizada) => {
    const idObjetivo = String(reservaId);

    setReservas((prev) =>
      ordenarReservasAsc(
        prev.map((reserva) =>
          String(reserva.id_reserva || reserva.id) === idObjetivo
            ? {
                ...reserva,
                ...reservaActualizada,
                id: reserva.id || reservaActualizada.id || reservaId,
                timestamp: new Date().toISOString(),
                estado: reservaActualizada.estado || reserva.estado || 'Confirmada',
              }
            : reserva
        )
      )
    );
  };

  /*
    Elimina una reserva del estado global.
  */
  const handleDeleteReserva = (reservaId) => {
    setReservas((prev) => prev.filter((r) => String(r.id_reserva || r.id) !== String(reservaId)));
  };

  /*
    Pantalla de login admin.
  */
  return (
    <Routes>
      {/* Inicio / Login unified view */}
      <Route 
        path="/" 
        element={
          currentUser ? (
            currentUser.tipo === 'admin' ? (
              <Navigate to="/panelAdmin" replace />
            ) : currentUser.tipo === 'club' || currentUser.tipo === 'dueno' ? (
              <Navigate to="/panelDelClub" replace />
            ) : (
              <Navigate to="/dashboardUsuario" replace />
            )
          ) : (
            <div className="app-container">
              <Inicio
                onLoginSuccess={handleLogin}
                onRegister={() => navigate('/register-usuario')}
                onRegisterClub={() => navigate('/register-club')}
                onAdminLogin={() => navigate('/admin-login')}
              />
            </div>
          )
        } 
      />

      {/* Admin Login Route */}
      <Route 
        path="/admin-login" 
        element={
          adminUser || (currentUser && currentUser.tipo === 'admin') ? (
            <Navigate to="/panelAdmin" replace />
          ) : (
            <AdminLogin
              onAdminLoginSuccess={handleAdminLogin}
              onBackToMain={() => navigate('/')}
            />
          )
        } 
      />

      {/* Register Club Route */}
      <Route 
        path="/register-club" 
        element={
          <div className="app-container">
            <Register
              onRegisterComplete={(nuevoUsuario) => {
                handleRegisterComplete(nuevoUsuario);
                navigate('/');
              }}
              onCancelRegister={() => navigate('/')}
            />
          </div>
        } 
      />

      {/* Register Usuario Route */}
      <Route 
        path="/register-usuario" 
        element={
          <div className="app-container">
            <RegisterUser
              onRegisterComplete={(nuevoUsuario) => {
                handleRegisterComplete(nuevoUsuario);
                navigate('/');
              }}
              onCancelRegister={() => navigate('/')}
            />
          </div>
        } 
      />

      {/* Dashboard Usuario Route */}
      <Route 
        path="/dashboardUsuario" 
        element={
          currentUser && currentUser.tipo === 'usuario' ? (
            <DashboardUsuario
              usuario={currentUser}
              reservas={reservas}
              clubesRegistrados={clubesRegistrados}
              usuarios={usuarios}
              onLogout={handleLogout}
              onAddReserva={handleAddReserva}
              onUpdateReserva={handleUpdateReserva}
              onDeleteReserva={handleDeleteReserva}
              onRefreshReservas={() => fetchReservas()}
              onOpenBancoSuplentes={() =>
                navigate('/banco-de-suplentes')
              }
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      {/* Banco de suplentes: acceso privado para usuarios autenticados */}
      <Route
        path="/banco-de-suplentes"
        element={
          currentUser && currentUser.tipo === 'usuario' ? (
            <BancoSuplentes
              usuario={currentUser}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Panel del Club Route */}
      <Route 
        path="/panelDelClub" 
        element={
          currentUser && (currentUser.tipo === 'club' || currentUser.tipo === 'dueno') ? (
            <PanelDelClub
              club={currentUser}
              reservas={reservas}
              onLogout={handleLogout}
              onBackToMain={handleLogout}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      {/* Panel de Administrador Route */}
      <Route 
        path="/panelAdmin" 
        element={
          adminUser || (currentUser && currentUser.tipo === 'admin') ? (
            <AdminPanel
              adminUser={adminUser || currentUser}
              onLogout={handleAdminLogout}
              clubesRegistrados={clubesRegistrados}
              setClubesRegistrados={setClubesRegistrados}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Inicio from '../components/inicio/inicio.jsx';
import Register from '../components/register/registerClub';
import RegisterUser from '../components/register/registerUsuario';
import AdminLogin from '../components/admin/AdminLogin';
import AdminPanel from '../components/admin/AdminPanel';
import PanelDelClub from '../components/panelDelClub/PanelDelClub';
import DashboardUsuario from '../components/dashboardUsuario/DashboardUsuario';
import { RequireAuth } from './ProtectedRoute';

export const AppRouter = ({
  currentUser,
  adminUser,
  usuarios,
  clubesRegistrados,
  reservas,
  setClubesRegistrados,
  // handlers
  handleLogin,
  handleLogout,
  handleRegisterUser,
  handleRegisterClub,
  handleCancelRegister,
  handleRegisterComplete,
  handleAdminLogin,
  handleAdminLogout,
  handleAddReserva,
  handleDeleteReserva,
}) => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Landing page */}
      <Route
        path="/"
        element={
          <Inicio
            onLoginSuccess={handleLogin}
            onRegister={handleRegisterUser}
            onRegisterClub={handleRegisterClub}
            onAdminLogin={() => navigate('/admin-login')}
          />
        }
      />

      {/* Registro */}
      <Route
        path="/register/club"
        element={
          <Register
            onRegisterComplete={handleRegisterComplete}
            onCancelRegister={handleCancelRegister}
          />
        }
      />
      <Route
        path="/register/user"
        element={
          <RegisterUser
            onRegisterComplete={handleRegisterComplete}
            onCancelRegister={handleCancelRegister}
          />
        }
      />

      {/* Admin login (público) */}
      <Route
        path="/admin-login"
        element={
          <AdminLogin
            onAdminLoginSuccess={handleAdminLogin}
            onBackToMain={() => navigate('/')}
          />
        }
      />

      {/* Rutas protegidas para admin (Requiere adminUser no nulo) */}
      <Route element={<RequireAuth isAllowed={!!adminUser} redirectTo="/admin-login" />}>
        <Route
          path="/admin"
          element={
            <AdminPanel
              adminUser={adminUser}
              onLogout={handleAdminLogout}
              clubesRegistrados={clubesRegistrados}
              setClubesRegistrados={setClubesRegistrados}
            />
          }
        />
      </Route>

      {/* Dueño de club (Requiere currentUser no nulo y tipo 'club') */}
      <Route
        element={<RequireAuth isAllowed={!!currentUser && currentUser.tipo === 'club'} redirectTo="/" />}
      >
        <Route
          path="/club"
          element={
            <PanelDelClub
              club={currentUser}
              reservas={reservas}
              onLogout={handleLogout}
              onBackToMain={handleLogout}
            />
          }
        />
      </Route>

      {/* Usuario normal (Requiere currentUser no nulo y tipo 'usuario') */}
      <Route
        element={<RequireAuth isAllowed={!!currentUser && currentUser.tipo === 'usuario'} redirectTo="/" />}
      >
        <Route
          path="/dashboard"
          element={
            <DashboardUsuario
              usuario={currentUser}
              reservas={reservas}
              clubesRegistrados={clubesRegistrados}
              usuarios={usuarios}
              onLogout={handleLogout}
              onAddReserva={handleAddReserva}
              onDeleteReserva={handleDeleteReserva}
            />
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

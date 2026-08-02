import React, { useState } from 'react';
import { apiUrl } from '../../config/api';
import './Admin.css';

const AdminLogin = ({ onAdminLoginSuccess, onBackToMain }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Email o contraseña incorrectos.');
      }

      if (data?.user?.tipo !== 'admin' || !data?.token) {
        throw new Error('Esta cuenta no tiene permisos de administrador.');
      }

      localStorage.setItem('token', data.token);
      onAdminLoginSuccess(data.user);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo iniciar sesión.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h2 className="admin-login-title">Panel de Administrador</h2>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <p className="admin-login-error" role="alert">{error}</p>}

          <div className="admin-form-group">
            <label className="admin-label" htmlFor="admin-email">Email:</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="Email del administrador"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="admin-input"
              maxLength={150}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label" htmlFor="admin-password">Contraseña:</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="admin-input"
              maxLength={128}
              required
            />
          </div>

          <button type="submit" className="admin-login-button" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar como Admin'}
          </button>

          <button
            type="button"
            className="admin-back-button"
            onClick={onBackToMain}
            disabled={loading}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

import { API_URL, apiUrl, mediaUrl } from '../../config/api';
import React, { useState } from 'react';
import './login.css';
import Layout from '../layout/layout';
import { useAuth } from '../../hooks/useAuth';

const recoveryModalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '390px',
    backgroundColor: '#ffffff',
    borderRadius: '22px',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #0d6efd, #0ea5e9)',
    padding: '24px 24px 22px',
    color: '#ffffff',
    textAlign: 'center',
  },
  icon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 12px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
  },
  title: { margin: 0, fontSize: '21px', fontWeight: 800 },
  body: { padding: '26px 24px 24px' },
  description: {
    margin: '0 0 18px',
    color: '#334155',
    fontSize: '15px',
    lineHeight: 1.45,
  },
  strongBlue: { color: '#0d6efd', fontWeight: 800 },
  inputGroup: { position: 'relative', marginBottom: '14px' },
  input: {
    width: '100%',
    height: '46px',
    border: '1px solid #d7e3f5',
    borderRadius: '12px',
    padding: '0 14px',
    outline: 'none',
    color: '#0f172a',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '18px',
  },
  backButton: {
    border: 'none',
    background: 'transparent',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    padding: 0,
  },
  primaryButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #0d6efd, #0ea5e9)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '13px',
    borderRadius: '12px',
    padding: '13px 18px',
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(13, 110, 253, 0.3)',
    letterSpacing: '0.2px',
  },
  fullButton: {
    width: '100%',
    border: 'none',
    background: 'linear-gradient(135deg, #0d6efd, #0ea5e9)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '14px',
    borderRadius: '12px',
    padding: '14px 18px',
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(13, 110, 253, 0.3)',
    marginTop: '8px',
  },
  error: {
    margin: '0 0 14px',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 700,
  },
  success: {
    margin: '0 0 14px',
    color: '#0d6efd',
    fontSize: '13px',
    fontWeight: 700,
  },
};

const Login = ({ onLoginSuccess, onRegister, onRegisterClub }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const { login } = useAuth();

  const validarPassword = (password) => {
    const tieneMinimoCaracteres = password.length >= 8;
    const tieneLetra = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password);
    const tieneNumero = /\d/.test(password);

    return tieneMinimoCaracteres && tieneLetra && tieneNumero;
  };

  const PASSWORD_POLICY_MESSAGE =
    'La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.';

  const openRecoveryModal = () => {
    setRecoveryEmail(username || '');
    setRecoveryCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setRecoveryStep(1);
    setRecoveryError('');
    setRecoverySuccess('');
    setShowRecoveryModal(true);
  };

  const closeRecoveryModal = () => {
    setShowRecoveryModal(false);
    setRecoveryStep(1);
    setRecoveryError('');
    setRecoverySuccess('');
    setRecoveryLoading(false);
  };

  const handleSendRecoveryCode = async (e) => {
    e.preventDefault();

    if (!recoveryEmail) {
      setRecoveryError('Ingresá el email registrado.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const response = await fetch(apiUrl('/auth/forgot-password/send-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo enviar el código.');
      }

      setRecoverySuccess('Código enviado correctamente.');
      setRecoveryStep(2);
    } catch (error) {
      setRecoveryError(error.message || 'No se pudo enviar el código.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!recoveryCode || !newPassword || !confirmNewPassword) {
      setRecoveryError('Completá todos los campos.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Las contraseñas no coinciden.');
      return;
    }

    if (!validarPassword(newPassword)) {
      setRecoveryError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const response = await fetch(apiUrl('/auth/forgot-password/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          code: recoveryCode,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo actualizar la contraseña.');
      }

      setRecoverySuccess('Contraseña actualizada correctamente.');
      setPassword('');
      setUsername(recoveryEmail);

      setTimeout(() => {
        closeRecoveryModal();
      }, 1200);
    } catch (error) {
      setRecoveryError(error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const loginRequest = async (url) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    const data = await response.json();

    return { ok: response.ok, data };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      } else {
        setError(data?.message || 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <Layout showBanners={true} bannerContext="login">
      <main className="login-page-container">
        <section className="login-container">
          <div className="login-icon-header">
            <i className="bi bi-trophy-fill"></i>
          </div>

          <h2 className="login-title">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <p className="login-error">{error}</p>}

            <div className="login-form-group">
              <label htmlFor="login-email" className="login-label">Mail:</label>

              <div className="login-input-wrapper">
                <i className="bi bi-envelope login-input-icon"></i>

                <input
                  id="login-email"
                  type="email"
                  placeholder="Mail registrado"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label htmlFor="login-password" className="login-label">Contraseña:</label>

              <div className="login-input-wrapper">
                <i className="bi bi-lock login-input-icon"></i>

                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input login-input-password"
                  required
                />

                <i
                  className={`bi ${mostrarPassword ? 'bi-eye-slash' : 'bi-eye'} login-toggle-password-icon`}
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                ></i>
              </div>
            </div>

            <button type="submit" className="login-submit-button">
              <span>Ingresar</span>
              <i className="bi bi-arrow-right"></i>
            </button>

            <button
              type="button"
              onClick={openRecoveryModal}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                color: '#0d6efd',
                fontWeight: 800,
                fontSize: '14px',
                margin: '14px 0 8px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>

            <div className="login-register-container">
              <p className="login-register-text">¿No tienes una cuenta?</p>

              <div className="login-register-buttons">
                <button type="button" onClick={onRegister} className="login-register-user-button">
                  <i className="bi bi-person-plus"></i>
                  <span>Registrarse como Usuario</span>
                </button>

                <button type="button" onClick={onRegisterClub} className="login-register-club-button">
                  <i className="bi bi-building"></i>
                  <span>¿Tienes canchas? Trabaja con nosotros</span>
                </button>
              </div>
            </div>
          </form>
        </section>

        {showRecoveryModal && (
          <div style={recoveryModalStyles.overlay}>
            <div style={recoveryModalStyles.modal}>
              <div style={recoveryModalStyles.header}>
                <div style={recoveryModalStyles.icon}>
                  <i className="bi bi-key-fill"></i>
                </div>

                <h3 style={recoveryModalStyles.title}>Recuperar contraseña</h3>
              </div>

              <div style={recoveryModalStyles.body}>
                {recoveryError && <p style={recoveryModalStyles.error}>{recoveryError}</p>}
                {recoverySuccess && <p style={recoveryModalStyles.success}>{recoverySuccess}</p>}

                {recoveryStep === 1 ? (
                  <form onSubmit={handleSendRecoveryCode}>
                    <p style={recoveryModalStyles.description}>
                      <strong>Recibir código de acceso por e-mail</strong>
                    </p>

                    <div style={recoveryModalStyles.inputGroup}>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="Ingrese su email"
                        style={recoveryModalStyles.input}
                        required
                      />
                    </div>

                    <div style={recoveryModalStyles.actions}>
                      <button type="button" onClick={closeRecoveryModal} style={recoveryModalStyles.backButton}>
                        <i className="bi bi-arrow-left"></i>
                        <span>Volver</span>
                      </button>

                      <button type="submit" style={recoveryModalStyles.primaryButton} disabled={recoveryLoading}>
                        {recoveryLoading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <p style={recoveryModalStyles.description}>
                      Ingrese el código que enviamos a{' '}
                      <strong style={recoveryModalStyles.strongBlue}>{recoveryEmail}</strong>{' '}
                      y cree una nueva contraseña.
                      <br />
                      <strong>Seleccioná una opción para entrar</strong>
                    </p>

                    <div style={recoveryModalStyles.inputGroup}>
                      <input
                        type="text"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                        placeholder="Ingrese su código de acceso"
                        style={recoveryModalStyles.input}
                        maxLength="6"
                        required
                      />
                    </div>

                    <div style={recoveryModalStyles.inputGroup}>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingrese su contraseña"
                        style={recoveryModalStyles.input}
                        required
                      />
                      <small style={{ color: '#64748b', display: 'block', marginTop: '6px', fontSize: '12px' }}>
                        Mínimo 8 caracteres, una letra y un número.
                      </small>
                    </div>

                    <div style={recoveryModalStyles.inputGroup}>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirmar contraseña"
                        style={recoveryModalStyles.input}
                        required
                      />
                    </div>

                    <button type="submit" style={recoveryModalStyles.fullButton} disabled={recoveryLoading}>
                      {recoveryLoading ? 'CONFIRMANDO...' : 'CONFIRMAR'}
                    </button>

                    <div style={{ marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryStep(1);
                          setRecoveryError('');
                          setRecoverySuccess('');
                        }}
                        style={recoveryModalStyles.backButton}
                      >
                        <i className="bi bi-arrow-left"></i>
                        <span>Volver</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
};

export default Login;

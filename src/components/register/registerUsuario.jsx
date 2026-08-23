import { API_URL, apiUrl, mediaUrl } from '../../config/api';
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Swal from 'sweetalert2';
import ReCAPTCHA from 'react-google-recaptcha';
import './register.css';
import Logo from './logo.jpg';
import LogoBlanco from './logo_blanco.webp';
import LogoSoloBlanco from './logoSoloBlanco.png';



function RegisterUser({ onRegisterComplete, onCancelRegister }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    DNI: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
    direccion: '',
    provincia: '',
    ciudad: '',
    cp: '',
  });
  const [provincias, setProvincias] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [mostrarProvincias, setMostrarProvincias] = useState(false);
  const [mostrarCiudades, setMostrarCiudades] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);


  useEffect(() => {
    const loadProvincias = async () => {
      try {
        const res = await fetch(apiUrl('/georef/provincias'));
        const data = await res.json();


        // 1. Extraemos el arreglo de provincias de forma segura
        const listaProvincias = Array.isArray(data) ? data : (data.provincias || []);

        // 2. Ordenamos la lista alfabéticamente por el campo 'nombre' y actualizamos el estado
        setProvincias(
          [...listaProvincias].sort((a, b) => {
            const textoA = a.nombre || "";
            const textoB = b.nombre || "";
            return textoA.localeCompare(textoB);
          })
        );


      } catch (err) {
        console.error('Error provincias', err);
      }
    };

    loadProvincias();
  }, []);

  useEffect(() => {
    if (!formData.provincia) return;

    const loadCiudades = async () => {
      try {
        const res = await fetch(
          apiUrl(`/georef/localidades?provincia=${encodeURIComponent(formData.provincia)}`)
        );
        const data = await res.json();
        const listaCiudades = Array.isArray(data) ? data : (data.localidades || []);
        setCiudades(
          [...listaCiudades].sort((a, b) => {
            const textoA = a.nombre || "";
            const textoB = b.nombre || "";
            return textoA.localeCompare(textoB);
          })
        );
      } catch (err) {
        console.error('Error ciudades', err);
      }
    };

    loadCiudades();
  }, [formData.provincia]);

  useEffect(() => {
    const savedData = sessionStorage.getItem('userData');

    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);


  const normalizarTexto = (texto = '') => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const provinciasFiltradas = provincias.filter((p) =>
    normalizarTexto(p.nombre).startsWith(normalizarTexto(formData.provincia))
  );

  const ciudadesFiltradas = ciudades.filter((c) =>
    normalizarTexto(c.nombre).startsWith(normalizarTexto(formData.ciudad))
  );

  const validarPassword = (password) => {
    const tieneMinimoCaracteres = password.length >= 8;
    const tieneLetra = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password);
    const tieneNumero = /\d/.test(password);

    return tieneMinimoCaracteres && tieneLetra && tieneNumero;
  };

  const PASSWORD_POLICY_MESSAGE =
    'La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.';

  /*
    Actualiza el estado cada vez que el usuario escribe en un input.
  */
  const handleChange = (e) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'provincia' && {
        ciudad: '',
      }),
    }));

    if (id === 'provincia') {
      setCiudades([]);
      setMostrarProvincias(true);
    }

    if (id === 'ciudad') {
      setMostrarCiudades(true);
    }
  };


  /*
    Valida y envía el formulario al backend.
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recaptchaToken) {
      return Swal.fire({
        icon: 'warning',
        title: 'Verificación requerida',
        text: 'Por favor, confirmá que no sos un robot.',
      });
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
      });
      return;
    }

    if (!validarPassword(formData.password)) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña inválida',
        text: PASSWORD_POLICY_MESSAGE,
      });
      return;
    }

    const emailExists = async (email) => {
      try {
        const response = await fetch(apiUrl('/user/email'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email }),
        });
        const dniExistsResponse = await fetch(apiUrl('/user/dni'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dni: formData.DNI }),
        });

        const data = await response.json();
        return data.exists;
      } catch (error) {
        console.error('Error al verificar el email:', error);
        return false;
      }
    };

    if (await emailExists(formData.email)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El email ya está registrado.',
      });
      return;
    }



    if (!/^\d{7,8}$/.test(formData.DNI)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El DNI debe tener 7 u 8 números.',
      });
      return;
    }

    try {
      const response = await fetch(apiUrl('/user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: formData.nombre,
          apellido_usuario: formData.apellido,
          email_usuario: formData.email,
          dni_usuario: formData.DNI,
          password_usuario: formData.password,
          telefono_usuario: formData.telefono,
          direccion_usuario: formData.direccion,
          ciudad_usuario: formData.ciudad,
          provincia_usuario: formData.provincia,
          cp_usuario: formData.cp,
          tipo_usuario: 'usuario',
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el usuario.');
      }

      // Enviar email de bienvenida (sin bloquear el flujo)
      try {
        await fetch(apiUrl('/contact'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: `${formData.nombre} ${formData.apellido}`,
            email: formData.email,
            subject: '¡Bienvenido a DameCancha!',
            razonSocial: '',
            message: ``,
          }),
        });
      } catch (mailError) {
        console.warn('El correo de bienvenida no se pudo enviar:', mailError);
      }

      Swal.fire({
        title: 'Registro completado',
        text: 'Ahora puede iniciar sesión con sus credenciales.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });

      if (onRegisterComplete) {
        onRegisterComplete(data);
      }
      setFormData({
        nombre: '',
        apellido: '',
        DNI: '',
        telefono: '',
        email: '',
        password: '',
        confirmPassword: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        cp: '',
        canchas: [],
      });

      sessionStorage.removeItem('userData');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
      });
    }
  };

  return (
    <div className="register-page">
      {/* Header blanco superior. Usa el logo azul con texto. */}
      <header className="register-header">
        <img src={Logo} alt="DameCancha" className="register-header__logo" />

        <div className="register-header__right">
          <span>
            <i className="bi bi-shield-check"></i>
            Únete a la red de clubes
          </span>
        </div>
      </header>

      {/* Contenedor central. El fondo de cancha se maneja desde register.css */}
      <main className="register-container">
        <section className="card shadow-lg card-custom">
          <div className="card-body">
            {/* Encabezado interno de la card. Usa el logo blanco sin texto. */}
            <div className="Titulo">
              <img src={LogoSoloBlanco} alt="DameCancha" className="register-card-logo" />

              <h2 className="text-center titulo-principal">Registro de Usuarios</h2>

              <h6 className="text-center subtitulo-principal">
                Completá el siguiente formulario para formar parte de nuestra red de clubes.
              </h6>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Nombre y apellido */}
              <div className="row mb-3">
                <div className="col-md-6 position-relative">
                  <label htmlFor="nombre" className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="nombre"
                    placeholder="Nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-person icon-inside"></i>
                </div>

                <div className="col-md-6 position-relative">
                  <label htmlFor="apellido" className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="apellido"
                    placeholder="Apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-person icon-inside"></i>
                </div>
              </div>

              {/* DNI y teléfono */}
              <div className="row mb-3">
                <div className="col-md-6 position-relative">
                  <label htmlFor="DNI" className="form-label">DNI</label>
                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="DNI"
                    placeholder="27234567"
                    value={formData.DNI}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-hash icon-inside"></i>
                </div>

                <div className="col-md-6 position-relative">
                  <label htmlFor="telefono" className="form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="telefono"
                    placeholder="Ej: 2983-404040"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-telephone icon-inside"></i>
                </div>
              </div>

              {/* Email */}
              <div className="row mb-3">
                <div className="col-md-12 position-relative">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-lg input-with-icon"
                    id="email"
                    placeholder="Ej: MiUsuario@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-envelope icon-inside"></i>
                </div>
              </div>

              {/* Contraseñas */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>

                  <div className="position-relative">
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      className="form-control form-control-lg password-input"
                      id="password"
                      placeholder="Ingrese su contraseña"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />

                    

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setMostrarPassword((prev) => !prev)}
                      aria-label={
                        mostrarPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      <i
                        className={`bi ${mostrarPassword ? 'bi-eye-slash' : 'bi-eye'
                          }`}
                      ></i>
                    </button>
                  </div>

                  <small className="text-light d-block mt-1">
                    Mínimo 8 caracteres, una letra y un número.
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="confirmPassword" className="form-label">
                    Repetir Contraseña
                  </label>

                  <div className="position-relative">
                    <input
                      type={mostrarConfirmPassword ? 'text' : 'password'}
                      className="form-control form-control-lg input-with-icon password-input"
                      id="confirmPassword"
                      placeholder="Repita su contraseña"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />

                   

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setMostrarConfirmPassword((prev) => !prev)
                      }
                      aria-label={
                        mostrarConfirmPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      <i
                        className={`bi ${mostrarConfirmPassword
                            ? 'bi-eye-slash'
                            : 'bi-eye'
                          }`}
                      ></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dirección, provincia, ciudad y código postal */}
              <div className="row mb-3">

                {/* Dirección */}
                <div className="col-md-4 position-relative">
                  <label htmlFor="direccion" className="form-label">Dirección</label>

                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="direccion"
                    placeholder="Dirección"
                    value={formData.direccion}
                    onChange={handleChange}
                    required
                  />

                  <i className="bi bi-geo-alt icon-inside"></i>
                </div>

                {/* Provincia (GEoREF - ID) */}
                <div className="col-md-3 position-relative">
                  <label htmlFor="provincia" className="form-label">Provincia</label>

                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    onFocus={() => setMostrarProvincias(true)}
                    placeholder="Provincia"
                    autoComplete="off"
                    required
                  />

                  {mostrarProvincias && formData.provincia && provinciasFiltradas.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 1000,
                        left: 0,
                        right: 0,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        border: '1px solid #ced4da',
                        borderRadius: '0 0 10px 10px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
                      }}
                    >
                      {provinciasFiltradas.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="dropdown-item"
                          style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            width: '100%',
                            border: 'none',
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            fontSize: '15px',
                            cursor: 'pointer',
                          }}
                          onMouseDown={() => {
                            setFormData((prev) => ({
                              ...prev,
                              provincia: p.nombre,
                              ciudad: '',
                            }));

                            setCiudades([]);
                            setMostrarProvincias(false);
                          }}
                        >
                          {p.nombre}
                        </button>
                      ))}
                    </div>
                  )}

                  <i className="bi bi-flag icon-inside"></i>
                </div>

                {/* Ciudad / Localidad (GEoREF) */}
                <div className="col-md-3 position-relative">
                  <label htmlFor="ciudad" className="form-label">Ciudad</label>

                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    onFocus={() => setMostrarCiudades(true)}
                    disabled={!formData.provincia}
                    placeholder="Ciudad"
                    autoComplete="off"
                    required
                  />

                  {mostrarCiudades && formData.ciudad && ciudadesFiltradas.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 1000,
                        left: 0,
                        right: 0,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        border: '1px solid #ced4da',
                        borderRadius: '0 0 10px 10px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
                      }}
                    >
                      {ciudadesFiltradas.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="dropdown-item"
                          style={{
                            padding: '10px 14px',
                            textAlign: 'left',
                            width: '100%',
                            border: 'none',
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            fontSize: '15px',
                            cursor: 'pointer',
                          }}
                          onMouseDown={() => {
                            setFormData((prev) => ({
                              ...prev,
                              ciudad: c.nombre,
                            }));

                            setMostrarCiudades(false);
                          }}
                        >
                          {c.nombre}
                        </button>
                      ))}
                    </div>
                  )}

                  <i className="bi bi-map icon-inside"></i>
                </div>

                {/* CP */}
                <div className="col-md-2 position-relative">
                  <label htmlFor="cp" className="form-label">CP</label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="7"
                    pattern="\d{1,7}"
                    className="form-control form-control-lg input-with-icon"
                    id="cp"
                    placeholder="CP"
                    value={formData.cp}
                    onChange={handleChange}
                    required
                  />

                  <i className="bi bi-mailbox icon-inside"></i>
                </div>

              </div>

              {/* Términos y condiciones */}
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="terminosUsuario"
                  required
                />

                <label
                  className="form-check-label"
                  htmlFor="terminosUsuario"
                >
                  Acepto los{' '}
                  <a
                    href="/legal/terminos.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Términos y Condiciones
                  </a>{' '}
                  y la{' '}
                  <a
                    href="/legal/privacidad.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Política de Privacidad
                  </a>
                </label>
              </div>

              <p className="register-privacy-note">
                Tus datos serán utilizados para gestionar tu cuenta y las funciones de DameCancha.{' '}
                <a
                  href="/legal/privacidad.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Más información
                </a>
              </p>

              {/* reCAPTCHA */}
              <div className="d-flex justify-content-center mb-3">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                  onErrored={() => setRecaptchaToken(null)}
                />
              </div>

              {/* Botón principal con ícono */}
              <button className="btn btn-primary btn-lg w-100" type="submit">
                <i className="bi bi-send"></i>
                Enviar Formulario
              </button>
            </form>

            {/* Botón secundario con ícono */}
            <button
              type="button"
              className="btn btn-outline-light btn-lg w-100 mt-3"
              onClick={onCancelRegister}
            >
              <i className="bi bi-arrow-left"></i>
              Volver al Login
            </button>

            {/* Footer interno de la card */}
            <div className="register-card-footer">
              <div className="register-brand-footer">
                <span>Gracias por interesarse en</span>
                <img src={LogoBlanco} alt="DameCancha" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer blanco inferior de página */}
      <footer className="register-footer">
        <span>© 2024 DameCancha - Todos los derechos reservados</span>
        <span>Conectamos clubes con deportistas</span>
      </footer>
    </div>
  );
}
export default RegisterUser;
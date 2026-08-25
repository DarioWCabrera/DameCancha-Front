import { API_URL, apiUrl, mediaUrl } from '../../config/api';
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Swal from 'sweetalert2';
import ReCAPTCHA from 'react-google-recaptcha';
import './register.css';

/*
  Logo azul con texto.
  Se usa en el header blanco superior.
*/
import Logo from './logo.jpg';

/*
  Logo blanco con texto.
  Se usa abajo, dentro de la card azul.
*/
import LogoBlanco from './logo_blanco.webp';

/*
  Logo blanco solo.
  Se usa arriba del título, dentro de la card azul.
*/
import LogoSoloBlanco from './logoSoloBlanco.png';

/*
  Lista de deportes/canchas disponibles.
  Se separa en una constante para no repetir código dentro del return.
*/
const CANCHAS_DISPONIBLES = [
  'Fútbol 5',
  'Fútbol 7',
  'Fútbol 11',
  'Básquet',
  'Tenis',
  'Vóley',
  'Pádel',
  'Natación',
  'Pelota Paleta',
];

/*
  Register
  Formulario de registro para dueño de club/cancha.

  Funcionalidades:
  - Guarda los campos en formData.
  - Permite seleccionar varias canchas.
  - Permite adjuntar logo.
  - Envía los datos al backend con FormData.
  - Usa el endpoint configurado en VITE_API_URL.
*/
function Register({ onRegisterComplete, onCancelRegister }) {
  /*
    Estado principal del formulario.
    IMPORTANTE:
    Cada propiedad debe coincidir con el id de cada input.
    Ejemplo:
    id="direccion" usa formData.direccion.
    id="ciudad" usa formData.ciudad.
    id="provincia" usa formData.provincia.
  */
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    razonSocial: '',
    CUIT: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    cp: '',
    logo: null,
    canchas: [],
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
    Actualiza inputs normales y el input file del logo.
    Si el campo es archivo, guarda files[0].
    Si no, guarda el value del input.
  */
  const handleChange = (e) => {
    const { id, name, value, files, type } = e.target;
    const fieldName = name || id;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: type === 'file' ? files[0] || null : value,
      ...(fieldName === 'provincia' && {
        ciudad: '',
      }),
    }));

    if (fieldName === 'provincia') {
      setCiudades([]);
      setMostrarProvincias(true);
    }

    if (fieldName === 'ciudad') {
      setMostrarCiudades(true);
    }
  };

  /*
    Agrega o quita una cancha del array formData.canchas.
  */
  const handleCanchaChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => {
      const canchasActualizadas = prev.canchas.includes(value)
        ? prev.canchas.filter((cancha) => cancha !== value)
        : [...prev.canchas, value];

      return {
        ...prev,
        canchas: canchasActualizadas,
      };
    });
  };

  /*
    Envía el formulario al backend.
    No se usa JSON porque también se manda un archivo de imagen.
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
      return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
      });
    }

    if (!validarPassword(formData.password)) {
      return Swal.fire({
        icon: 'error',
        title: 'Contraseña inválida',
        text: PASSWORD_POLICY_MESSAGE,
      });
    }

    if (!/^\d{2}-\d{8}-\d{1}$/.test(formData.CUIT)) {
      return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El formato del CUIT es incorrecto. Debe ser XX-XXXXXXXX-X.',
      });
    }

    try {
      const formDataToSend = new FormData();

      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('apellido', formData.apellido);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('razonSocial', formData.razonSocial);
      formDataToSend.append('CUIT', formData.CUIT);

      /*
        Dirección, ciudad y provincia se envían separados.
        Si tu backend todavía no tiene direccion, podés agregarla luego
        en la entidad/DTO correspondiente.
      */
      formDataToSend.append('direccion', formData.direccion);
      formDataToSend.append('ciudad', formData.ciudad);
      formDataToSend.append('provincia', formData.provincia);
      formDataToSend.append('cp', formData.cp);
      formDataToSend.append('tipo', 'dueno');

      formDataToSend.append('canchas', JSON.stringify(formData.canchas));
      formDataToSend.append('recaptchaToken', recaptchaToken);

      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      const response = await fetch(apiUrl('/user/register'), {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrar el club.');
      }

      // Mostrar éxito del registro
      Swal.fire({
        title: 'Registro completado',
        text: 'El dueño y el club fueron creados correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });

      // Enviar email de bienvenida (sin esperar respuesta)
      try {
        const mailResponse = await fetch(apiUrl('/contact'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: `${formData.nombre} ${formData.apellido}`,
            razonSocial: formData.razonSocial,
            email: formData.email,
            subject: 'Club Registrado en DameCancha',
            message: ``,

          }),
        });

        if (!mailResponse.ok) {
          const mailError = await mailResponse.json();
          console.warn('El correo no se envió correctamente:', mailError);
        } else {
        }
      } catch (mailError) {
        console.error('Error al enviar el mail:', mailError);
      }

      setFormData({
        nombre: '',
        apellido: '',
        razonSocial: '',
        CUIT: '',
        telefono: '',
        email: '',
        password: '',
        confirmPassword: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        cp: '',
        logo: null,
        canchas: [],
      });

      if (onRegisterComplete) {
        onRegisterComplete({ ...result, tipo: 'club' });
      }
    } catch (error) {
      console.error('Error al registrar:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Hubo un error al registrar el club.',
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
              <img
                src={LogoSoloBlanco}
                alt="DameCancha"
                className="register-card-logo"
              />

              <h2 className="text-center titulo-principal">
                Registro de Club / Propietario
              </h2>

              <h6 className="text-center subtitulo-principal">
                Completá el siguiente formulario para formar parte de nuestra red de clubes.
              </h6>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Nombre y apellido */}
              <div className="row mb-3">
                <div className="col-md-6 position-relative">
                  <label htmlFor="nombre" className="form-label">
                    Nombre
                  </label>
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
                  <label htmlFor="apellido" className="form-label">
                    Apellido
                  </label>
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

              {/* Razón social y CUIT */}
              <div className="row mb-3">
                <div className="col-md-6 position-relative">
                  <label htmlFor="razonSocial" className="form-label">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="razonSocial"
                    placeholder="Ej: River Plate FC"
                    value={formData.razonSocial}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-building icon-inside"></i>
                </div>

                <div className="col-md-6 position-relative">
                  <label htmlFor="CUIT" className="form-label">
                    CUIT
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg input-with-icon"
                    id="CUIT"
                    placeholder="20-12345678-9"
                    value={formData.CUIT}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-hash icon-inside"></i>
                </div>
              </div>

              {/* Teléfono y email */}
              <div className="row mb-3">
                <div className="col-md-6 position-relative">
                  <label htmlFor="telefono" className="form-label">
                    Teléfono
                  </label>
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

                <div className="col-md-6 position-relative">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg input-with-icon"
                    id="email"
                    placeholder="Ej: club@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <i className="bi bi-envelope icon-inside"></i>
                </div>
              </div>

              {/* Bloque visual separado para las canchas que alquila el club */}
              <div className="card-canchas">
                <h5>Canchas que alquila</h5>

                <div className="row">
                  {CANCHAS_DISPONIBLES.map((cancha) => (
                    <div className="col-md-4 mb-2" key={cancha}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`club-${cancha}`}
                          value={cancha}
                          checked={formData.canchas.includes(cancha)}
                          onChange={handleCanchaChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`club-${cancha}`}
                        >
                          {cancha}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjuntar logo */}
              <div className="row mb-3">
                <div className="col-md-12">
                  <label htmlFor="logo" className="form-label">
                    Adjuntar Logo
                  </label>

                  <div className="upload-box">
                    <div className="upload-box__top">
                      <div className="upload-box__left">
                        <div className="upload-box__icon">
                          <i className="bi bi-cloud-arrow-up"></i>
                        </div>

                        <div className="upload-box__text">
                          <strong>Arrastrá y soltá tu archivo aquí</strong>
                          <span>o seleccioná un archivo</span>
                        </div>
                      </div>

                      <div className="upload-box__info">
                        <span>Formatos permitidos: JPG, PNG, WEBP</span>
                        <span>Tamaño máximo: 2MB</span>
                      </div>
                    </div>

                    <div className="upload-box__bottom">
                      <label htmlFor="logo" className="upload-box__button">
                        Seleccionar archivo
                      </label>

                      <span className="upload-box__filename">
                        {formData.logo
                          ? formData.logo.name
                          : 'Ningún archivo seleccionado'}
                      </span>
                    </div>

                    <input
                      type="file"
                      id="logo"
                      name="logo"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleChange}
                      className="upload-box__input"
                    />

                  </div>
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
                      className="form-control form-control-lg input-with-icon password-input"
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
                      className="form-control form-control-lg password-input"
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
              <h5>Nos pondremos en contacto con usted a la brevedad</h5>

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

export default Register;
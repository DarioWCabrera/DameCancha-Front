import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import logoCanchasYa from '../../assets/logo_blanco_720.png';
import './BancoSuplentes.css';

const API_URL = 'http://localhost:3000';

const DIAS = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

const FORM_INICIAL = {
  id_deporte: '',
  nivel: '',
  modalidad: '',
  posicion: '',
  ciudad: '',
  dias_disponibles: [],
  hora_desde: '18:00',
  hora_hasta: '22:00',
  fecha_desde: '',
  fecha_hasta: '',
  descripcion: '',
  contacto_visible: false,
};

const FILTROS_INICIALES = {
  id_deporte: '',
  ciudad: '',
  nivel: '',
  dia: '',
  fecha: '',
  hora: '',
};

const SOLICITUD_INICIAL = {
  mensaje: '',
  fecha_propuesta: '',
  hora_propuesta: '',
};

const obtenerMensajeError = async (response, fallback) => {
  const texto = await response.text();

  if (!texto) return fallback;

  try {
    const data = JSON.parse(texto);

    if (Array.isArray(data?.message)) {
      return data.message.join('. ');
    }

    return data?.message || fallback;
  } catch {
    return texto;
  }
};

const requestApi = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      await obtenerMensajeError(
        response,
        `No se pudo completar la operación. Error HTTP ${response.status}.`
      )
    );
  }

  if (response.status === 204) return null;

  const texto = await response.text();
  return texto ? JSON.parse(texto) : null;
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';

  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : fecha;
};

const formatearHora = (hora) => String(hora || '').slice(0, 5);

const nombreCompleto = (persona) =>
  `${persona?.nombre || ''} ${persona?.apellido || ''}`.trim() || 'Jugador';

function BancoSuplentes({ usuario, onLogout }) {
  const navigate = useNavigate();

  const [vista, setVista] = useState('buscar');
  const [deportes, setDeportes] = useState([]);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [misDisponibilidades, setMisDisponibilidades] = useState([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState([]);

  const [form, setForm] = useState(FORM_INICIAL);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [disponibilidadSolicitud, setDisponibilidadSolicitud] =
    useState(null);
  const [solicitudForm, setSolicitudForm] = useState(
    SOLICITUD_INICIAL
  );

  const nombreUsuario =
    `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() ||
    'Usuario';

  const inicialesUsuario = nombreUsuario
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();

  const mostrarError = (error) =>
    Swal.fire({
      icon: 'error',
      title: 'No se pudo completar',
      text: error?.message || 'Ocurrió un error inesperado.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#087bff',
    });

  const mostrarExito = (titulo, texto) =>
    Swal.fire({
      icon: 'success',
      title: titulo,
      text: texto,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#087bff',
    });

  const cargarDeportes = async () => {
    try {
      const response = await fetch(`${API_URL}/deporte`);
      const data = await response.json();

      setDeportes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar deportes:', error);
    }
  };

  const construirQuery = () => {
    const query = new URLSearchParams();

    Object.entries(filtros).forEach(([clave, valor]) => {
      if (String(valor || '').trim()) {
        query.set(clave, String(valor).trim());
      }
    });

    const texto = query.toString();
    return texto ? `?${texto}` : '';
  };

  const cargarDisponibilidades = async () => {
    setCargando(true);

    try {
      const data = await requestApi(
        `/banco-suplentes/disponibilidades${construirQuery()}`
      );

      setDisponibilidades(Array.isArray(data) ? data : []);
    } catch (error) {
      mostrarError(error);
    } finally {
      setCargando(false);
    }
  };

  const cargarMisDisponibilidades = async () => {
    setCargando(true);

    try {
      const data = await requestApi(
        '/banco-suplentes/mis-disponibilidades'
      );

      setMisDisponibilidades(Array.isArray(data) ? data : []);
    } catch (error) {
      mostrarError(error);
    } finally {
      setCargando(false);
    }
  };

  const cargarSolicitudes = async () => {
    setCargando(true);

    try {
      const [recibidas, enviadas] = await Promise.all([
        requestApi('/banco-suplentes/solicitudes/recibidas'),
        requestApi('/banco-suplentes/solicitudes/enviadas'),
      ]);

      setSolicitudesRecibidas(
        Array.isArray(recibidas) ? recibidas : []
      );
      setSolicitudesEnviadas(
        Array.isArray(enviadas) ? enviadas : []
      );
    } catch (error) {
      mostrarError(error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDeportes();
    cargarDisponibilidades();
  }, []);

  useEffect(() => {
    if (vista === 'mias') {
      cargarMisDisponibilidades();
    }

    if (vista === 'solicitudes') {
      cargarSolicitudes();
    }
  }, [vista]);

  const actualizarForm = (campo, valor) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const alternarDia = (dia) => {
    setForm((actual) => ({
      ...actual,
      dias_disponibles: actual.dias_disponibles.includes(dia)
        ? actual.dias_disponibles.filter((item) => item !== dia)
        : [...actual.dias_disponibles, dia],
    }));
  };

  const validarForm = () => {
    if (
      !form.id_deporte ||
      !form.nivel.trim() ||
      !form.ciudad.trim() ||
      !form.fecha_desde ||
      !form.fecha_hasta ||
      !form.descripcion.trim()
    ) {
      throw new Error('Completá todos los campos obligatorios.');
    }

    if (form.dias_disponibles.length === 0) {
      throw new Error('Seleccioná al menos un día disponible.');
    }

    if (form.fecha_desde > form.fecha_hasta) {
      throw new Error(
        'La fecha inicial no puede ser posterior a la final.'
      );
    }

    if (form.hora_desde >= form.hora_hasta) {
      throw new Error(
        'La hora inicial debe ser anterior a la hora final.'
      );
    }
  };

  const publicarDisponibilidad = async (event) => {
    event.preventDefault();

    try {
      validarForm();
      setGuardando(true);

      await requestApi('/banco-suplentes/disponibilidades', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          id_deporte: Number(form.id_deporte),
        }),
      });

      setForm(FORM_INICIAL);
      await mostrarExito(
        'Disponibilidad publicada',
        'Ya aparecés en el Banco de suplentes.'
      );
      setVista('mias');
    } catch (error) {
      mostrarError(error);
    } finally {
      setGuardando(false);
    }
  };

  const actualizarEstadoPublicacion = async (
    idDisponibilidad,
    estado
  ) => {
    try {
      await requestApi(
        `/banco-suplentes/disponibilidades/${idDisponibilidad}/estado`,
        {
          method: 'PATCH',
          body: JSON.stringify({ estado }),
        }
      );

      await cargarMisDisponibilidades();
    } catch (error) {
      mostrarError(error);
    }
  };

  const eliminarPublicacion = async (idDisponibilidad) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar publicación?',
      text: 'Dejará de aparecer para los demás jugadores.',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await requestApi(
        `/banco-suplentes/disponibilidades/${idDisponibilidad}`,
        { method: 'DELETE' }
      );

      await cargarMisDisponibilidades();
    } catch (error) {
      mostrarError(error);
    }
  };

  const quitarPublicacionDeMiLista = async (idDisponibilidad) => {
    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Quitar de tu lista?',
      text: 'La publicación dejará de mostrarse en Mis publicaciones.',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await requestApi(
        `/banco-suplentes/disponibilidades/${idDisponibilidad}/ocultar`,
        { method: 'PATCH' }
      );

      await cargarMisDisponibilidades();
    } catch (error) {
      mostrarError(error);
    }
  };

  const abrirSolicitud = (disponibilidad) => {
    setDisponibilidadSolicitud(disponibilidad);
    setSolicitudForm(SOLICITUD_INICIAL);
  };

  const cerrarSolicitud = () => {
    setDisponibilidadSolicitud(null);
    setSolicitudForm(SOLICITUD_INICIAL);
  };

  const enviarSolicitud = async (event) => {
    event.preventDefault();

    try {
      setGuardando(true);

      await requestApi(
        `/banco-suplentes/disponibilidades/${disponibilidadSolicitud.id_disponibilidad}/solicitudes`,
        {
          method: 'POST',
          body: JSON.stringify({
            mensaje: solicitudForm.mensaje.trim() || undefined,
            fecha_propuesta:
              solicitudForm.fecha_propuesta || undefined,
            hora_propuesta:
              solicitudForm.hora_propuesta || undefined,
          }),
        }
      );

      cerrarSolicitud();
      await mostrarExito(
        'Solicitud enviada',
        'La otra persona podrá aceptarla o rechazarla.'
      );
      setVista('solicitudes');
    } catch (error) {
      mostrarError(error);
    } finally {
      setGuardando(false);
    }
  };

  const responderSolicitud = async (idSolicitud, estado) => {
    try {
      await requestApi(
        `/banco-suplentes/solicitudes/${idSolicitud}/estado`,
        {
          method: 'PATCH',
          body: JSON.stringify({ estado }),
        }
      );

      await cargarSolicitudes();
    } catch (error) {
      mostrarError(error);
    }
  };

  const quitarSolicitudDeMiLista = async (idSolicitud) => {
    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Quitar solicitud?',
      text: 'La solicitud dejará de mostrarse en tu lista.',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await requestApi(
        `/banco-suplentes/solicitudes/${idSolicitud}/ocultar`,
        { method: 'PATCH' }
      );

      await cargarSolicitudes();
    } catch (error) {
      mostrarError(error);
    }
  };

  const contactosAceptados = useMemo(
    () =>
      [...solicitudesRecibidas, ...solicitudesEnviadas].filter(
        (solicitud) => solicitud.estado === 'aceptada'
      ).length,
    [solicitudesRecibidas, solicitudesEnviadas]
  );

  const abrirContacto = (contacto, nombre) => {
    const telefono = contacto?.telefono?.replace(/\D/g, '');

    if (telefono) {
      window.open(
        `https://wa.me/${telefono}?text=${encodeURIComponent(
          `Hola ${nombre}, te contacto desde el Banco de suplentes de DameCancha.`
        )}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    if (contacto?.email) {
      window.location.href = `mailto:${contacto.email}`;
      return;
    }

    Swal.fire({
      icon: 'info',
      title: 'Contacto no disponible',
      text: 'La otra persona no tiene un teléfono o email registrado.',
      confirmButtonText: 'Entendido',
    });
  };

  return (
    <main className="bs-page">
      <header className="bs-header">
        <button
          type="button"
          className="bs-brand"
          onClick={() => navigate('/dashboardUsuario')}
        >
          <img src={logoCanchasYa} alt="DameCancha" />
        </button>

        <div className="bs-header__title">
          <span>Comunidad DameCancha</span>
          <h1>Banco de suplentes</h1>
        </div>

        <div className="bs-header__user">
          <span className="bs-avatar">{inicialesUsuario}</span>
          <strong>{nombreUsuario}</strong>

          <button
            type="button"
            onClick={() => navigate('/dashboardUsuario')}
          >
            Volver al dashboard
          </button>

          <button type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="bs-hero">
        <div>
          <span className="bs-hero__kicker">
            <i className="bi bi-people-fill"></i>
            Encontrá con quién jugar
          </span>

          <h2>Formá el partido antes de reservar la cancha</h2>

          <p>
            Buscá compañeros por deporte, nivel, zona, día y
            horario. También podés publicar cuándo estás disponible.
          </p>
        </div>

        <div className="bs-hero__actions">
          <button
            type="button"
            onClick={() => setVista('buscar')}
          >
            Buscar jugadores
          </button>

          <button
            type="button"
            className="bs-hero__primary"
            onClick={() => setVista('publicar')}
          >
            Publicar disponibilidad
          </button>
        </div>
      </section>

      <nav className="bs-tabs" aria-label="Secciones del Banco de suplentes">
        {[
          ['buscar', 'Buscar jugadores', 'bi-search'],
          ['publicar', 'Quiero jugar', 'bi-person-plus-fill'],
          ['mias', 'Mis publicaciones', 'bi-card-checklist'],
          ['solicitudes', `Solicitudes${contactosAceptados ? ` (${contactosAceptados})` : ''}`, 'bi-chat-dots-fill'],
        ].map(([clave, texto, icono]) => (
          <button
            key={clave}
            type="button"
            className={vista === clave ? 'active' : ''}
            onClick={() => setVista(clave)}
          >
            <i className={`bi ${icono}`}></i>
            {texto}
          </button>
        ))}
      </nav>

      <section className="bs-content">
        {vista === 'buscar' && (
          <>
            <div className="bs-section-heading">
              <div>
                <span>Jugadores disponibles</span>
                <h2>Buscá una coincidencia</h2>
              </div>

              <button
                type="button"
                className="bs-refresh"
                onClick={cargarDisponibilidades}
                disabled={cargando}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Actualizar
              </button>
            </div>

            <form
              className="bs-filters"
              onSubmit={(event) => {
                event.preventDefault();
                cargarDisponibilidades();
              }}
            >
              <label>
                <span>Deporte</span>
                <select
                  value={filtros.id_deporte}
                  onChange={(event) =>
                    setFiltros((actual) => ({
                      ...actual,
                      id_deporte: event.target.value,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  {deportes.map((deporte) => (
                    <option
                      key={deporte.id_deporte}
                      value={deporte.id_deporte}
                    >
                      {deporte.nombre_deporte}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Ciudad</span>
                <input
                  value={filtros.ciudad}
                  onChange={(event) =>
                    setFiltros((actual) => ({
                      ...actual,
                      ciudad: event.target.value,
                    }))
                  }
                  placeholder="Tres Arroyos"
                />
              </label>

              <label>
                <span>Nivel</span>
                <input
                  value={filtros.nivel}
                  onChange={(event) =>
                    setFiltros((actual) => ({
                      ...actual,
                      nivel: event.target.value,
                    }))
                  }
                  placeholder="Intermedio"
                />
              </label>

              <label>
                <span>Día</span>
                <select
                  value={filtros.dia}
                  onChange={(event) =>
                    setFiltros((actual) => ({
                      ...actual,
                      dia: event.target.value,
                    }))
                  }
                >
                  <option value="">Cualquier día</option>
                  {DIAS.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Fecha</span>
                <input
                  type="date"
                  value={filtros.fecha}
                  onChange={(event) =>
                    setFiltros((actual) => ({
                      ...actual,
                      fecha: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Horario</span>
                <input
                  type="time"
                  value={filtros.hora}
                  onChange={(event) =>
                    setFiltros((actual) => ({
                      ...actual,
                      hora: event.target.value,
                    }))
                  }
                />
              </label>

              <button type="submit" className="bs-filter-submit">
                <i className="bi bi-funnel-fill"></i>
                Aplicar filtros
              </button>

              <button
                type="button"
                className="bs-filter-clear"
                onClick={() => {
                  setFiltros(FILTROS_INICIALES);
                  setTimeout(cargarDisponibilidades, 0);
                }}
              >
                Limpiar
              </button>
            </form>

            {cargando ? (
              <div className="bs-empty">
                <i className="bi bi-arrow-repeat"></i>
                <strong>Cargando jugadores...</strong>
              </div>
            ) : disponibilidades.length > 0 ? (
              <div className="bs-player-grid">
                {disponibilidades.map((disponibilidad) => (
                  <article
                    key={disponibilidad.id_disponibilidad}
                    className="bs-player-card"
                  >
                    <div className="bs-player-card__top">
                      <span className="bs-player-card__avatar">
                        {nombreCompleto(disponibilidad.usuario)
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((palabra) => palabra[0])
                          .join('')
                          .toUpperCase()}
                      </span>

                      <div>
                        <h3>
                          {nombreCompleto(disponibilidad.usuario)}
                        </h3>
                        <p>
                          {disponibilidad.deporte?.nombre_deporte} ·{' '}
                          {disponibilidad.nivel}
                        </p>
                      </div>

                      {disponibilidad.es_propia && (
                        <span className="bs-own-badge">
                          Tu publicación
                        </span>
                      )}
                    </div>

                    <div className="bs-player-card__chips">
                      {disponibilidad.modalidad && (
                        <span>{disponibilidad.modalidad}</span>
                      )}
                      {disponibilidad.posicion && (
                        <span>{disponibilidad.posicion}</span>
                      )}
                      <span>
                        <i className="bi bi-geo-alt"></i>
                        {disponibilidad.ciudad}
                      </span>
                    </div>

                    <p className="bs-player-card__description">
                      {disponibilidad.descripcion}
                    </p>

                    <dl className="bs-player-card__availability">
                      <div>
                        <dt>Días</dt>
                        <dd>
                          {disponibilidad.dias_disponibles.join(', ')}
                        </dd>
                      </div>

                      <div>
                        <dt>Horario</dt>
                        <dd>
                          {formatearHora(disponibilidad.hora_desde)} a{' '}
                          {formatearHora(disponibilidad.hora_hasta)}
                        </dd>
                      </div>

                      <div>
                        <dt>Disponible hasta</dt>
                        <dd>
                          {formatearFecha(disponibilidad.fecha_hasta)}
                        </dd>
                      </div>
                    </dl>

                    {!disponibilidad.es_propia && (
                      <button
                        type="button"
                        className="bs-player-card__contact"
                        onClick={() =>
                          abrirSolicitud(disponibilidad)
                        }
                      >
                        <i className="bi bi-send-fill"></i>
                        Enviar solicitud
                      </button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="bs-empty">
                <i className="bi bi-people"></i>
                <strong>No encontramos jugadores con esos filtros</strong>
                <p>
                  Probá otra fecha, horario o publicá tu propia
                  disponibilidad.
                </p>
              </div>
            )}
          </>
        )}

        {vista === 'publicar' && (
          <form
            className="bs-publication-form"
            onSubmit={publicarDisponibilidad}
          >
            <div className="bs-section-heading">
              <div>
                <span>Quiero jugar</span>
                <h2>Publicá tu disponibilidad</h2>
                <p>
                  Solo los usuarios autenticados de DameCancha podrán
                  verla.
                </p>
              </div>
            </div>

            <div className="bs-form-grid">
              <label>
                <span>Deporte *</span>
                <select
                  required
                  value={form.id_deporte}
                  onChange={(event) =>
                    actualizarForm('id_deporte', event.target.value)
                  }
                >
                  <option value="">Seleccionar</option>
                  {deportes.map((deporte) => (
                    <option
                      key={deporte.id_deporte}
                      value={deporte.id_deporte}
                    >
                      {deporte.nombre_deporte}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Nivel *</span>
                <input
                  required
                  value={form.nivel}
                  onChange={(event) =>
                    actualizarForm('nivel', event.target.value)
                  }
                  placeholder="Inicial, intermedio, avanzado..."
                />
              </label>

              <label>
                <span>Modalidad</span>
                <input
                  value={form.modalidad}
                  onChange={(event) =>
                    actualizarForm('modalidad', event.target.value)
                  }
                  placeholder="Pareja, equipo, recreativo..."
                />
              </label>

              <label>
                <span>Posición o rol</span>
                <input
                  value={form.posicion}
                  onChange={(event) =>
                    actualizarForm('posicion', event.target.value)
                  }
                  placeholder="Revés, arquero, delantero..."
                />
              </label>

              <label>
                <span>Ciudad *</span>
                <input
                  required
                  value={form.ciudad}
                  onChange={(event) =>
                    actualizarForm('ciudad', event.target.value)
                  }
                  placeholder="Tres Arroyos"
                />
              </label>

              <label>
                <span>Desde *</span>
                <input
                  type="date"
                  required
                  value={form.fecha_desde}
                  onChange={(event) =>
                    actualizarForm('fecha_desde', event.target.value)
                  }
                />
              </label>

              <label>
                <span>Hasta *</span>
                <input
                  type="date"
                  required
                  value={form.fecha_hasta}
                  onChange={(event) =>
                    actualizarForm('fecha_hasta', event.target.value)
                  }
                />
              </label>

              <label>
                <span>Horario desde *</span>
                <input
                  type="time"
                  required
                  value={form.hora_desde}
                  onChange={(event) =>
                    actualizarForm('hora_desde', event.target.value)
                  }
                />
              </label>

              <label>
                <span>Horario hasta *</span>
                <input
                  type="time"
                  required
                  value={form.hora_hasta}
                  onChange={(event) =>
                    actualizarForm('hora_hasta', event.target.value)
                  }
                />
              </label>
            </div>

            <fieldset className="bs-days">
              <legend>Días disponibles *</legend>

              <div>
                {DIAS.map((dia) => (
                  <label
                    key={dia}
                    className={
                      form.dias_disponibles.includes(dia)
                        ? 'selected'
                        : ''
                    }
                  >
                    <input
                      type="checkbox"
                      checked={form.dias_disponibles.includes(dia)}
                      onChange={() => alternarDia(dia)}
                    />
                    {dia}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="bs-description">
              <span>Contanos brevemente qué buscás *</span>
              <textarea
                required
                maxLength={1000}
                value={form.descripcion}
                onChange={(event) =>
                  actualizarForm('descripcion', event.target.value)
                }
                placeholder="Juego hace dos años, busco compañero para partidos recreativos..."
              />
              <small>{form.descripcion.length}/1000</small>
            </label>

            <label className="bs-privacy-option">
              <input
                type="checkbox"
                checked={form.contacto_visible}
                onChange={(event) =>
                  actualizarForm(
                    'contacto_visible',
                    event.target.checked
                  )
                }
              />

              <span>
                <strong>Permitir contacto directo</strong>
                <small>
                  Si no lo activás, tus datos se comparten recién
                  cuando aceptás una solicitud.
                </small>
              </span>
            </label>

            <div className="bs-form-actions">
              <button
                type="button"
                onClick={() => setVista('buscar')}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary"
                disabled={guardando}
              >
                {guardando
                  ? 'Publicando...'
                  : 'Publicar disponibilidad'}
              </button>
            </div>
          </form>
        )}

        {vista === 'mias' && (
          <>
            <div className="bs-section-heading">
              <div>
                <span>Mi perfil deportivo</span>
                <h2>Mis publicaciones</h2>
              </div>

              <button
                type="button"
                className="bs-refresh"
                onClick={cargarMisDisponibilidades}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Actualizar
              </button>
            </div>

            {misDisponibilidades.length > 0 ? (
              <div className="bs-own-list">
                {misDisponibilidades.map((publicacion) => (
                  <article key={publicacion.id_disponibilidad}>
                    <div>
                      <span
                        className={`bs-status bs-status--${publicacion.estado}`}
                      >
                        {publicacion.estado}
                      </span>

                      <h3>
                        {publicacion.deporte?.nombre_deporte} ·{' '}
                        {publicacion.nivel}
                      </h3>

                      <p>{publicacion.descripcion}</p>

                      <small>
                        {publicacion.dias_disponibles.join(', ')} ·{' '}
                        {formatearHora(publicacion.hora_desde)} a{' '}
                        {formatearHora(publicacion.hora_hasta)} · hasta{' '}
                        {formatearFecha(publicacion.fecha_hasta)}
                      </small>
                    </div>

                    <div className="bs-own-list__actions">
                      {publicacion.estado === 'activa' ? (
                        <button
                          type="button"
                          onClick={() =>
                            actualizarEstadoPublicacion(
                              publicacion.id_disponibilidad,
                              'pausada'
                            )
                          }
                        >
                          Pausar
                        </button>
                      ) : publicacion.estado === 'pausada' ? (
                        <button
                          type="button"
                          onClick={() =>
                            actualizarEstadoPublicacion(
                              publicacion.id_disponibilidad,
                              'activa'
                            )
                          }
                        >
                          Reactivar
                        </button>
                      ) : null}

                      {['activa', 'pausada'].includes(
                        publicacion.estado
                      ) && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            eliminarPublicacion(
                              publicacion.id_disponibilidad
                            )
                          }
                        >
                          <i className="bi bi-trash"></i>
                          Eliminar
                        </button>
                      )}

                      {['eliminada', 'vencida'].includes(
                        publicacion.estado
                      ) && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            quitarPublicacionDeMiLista(
                              publicacion.id_disponibilidad
                            )
                          }
                        >
                          <i className="bi bi-trash"></i>
                          Quitar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bs-empty">
                <i className="bi bi-person-plus"></i>
                <strong>Todavía no publicaste tu disponibilidad</strong>
                <button
                  type="button"
                  onClick={() => setVista('publicar')}
                >
                  Crear publicación
                </button>
              </div>
            )}
          </>
        )}

        {vista === 'solicitudes' && (
          <>
            <div className="bs-section-heading">
              <div>
                <span>Coordinación entre jugadores</span>
                <h2>Solicitudes</h2>
              </div>

              <button
                type="button"
                className="bs-refresh"
                onClick={cargarSolicitudes}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Actualizar
              </button>
            </div>

            <div className="bs-request-columns">
              <section>
                <h3>Recibidas</h3>

                {solicitudesRecibidas.length ? (
                  solicitudesRecibidas.map((solicitud) => (
                    <article
                      key={solicitud.id_solicitud}
                      className="bs-request-card"
                    >
                      <header>
                        <strong>
                          {nombreCompleto(solicitud.solicitante)}
                        </strong>
                        <span
                          className={`bs-status bs-status--${solicitud.estado}`}
                        >
                          {solicitud.estado}
                        </span>
                      </header>

                      <p>
                        Quiere jugar{' '}
                        <strong>
                          {
                            solicitud.disponibilidad.deporte
                              ?.nombre_deporte
                          }
                        </strong>
                        .
                      </p>

                      {solicitud.mensaje && (
                        <blockquote>{solicitud.mensaje}</blockquote>
                      )}

                      {(solicitud.fecha_propuesta ||
                        solicitud.hora_propuesta) && (
                        <small>
                          Propuesta:{' '}
                          {formatearFecha(
                            solicitud.fecha_propuesta
                          )}{' '}
                          {solicitud.hora_propuesta
                            ? `a las ${formatearHora(
                                solicitud.hora_propuesta
                              )}`
                            : ''}
                        </small>
                      )}

                      {solicitud.estado === 'pendiente' && (
                        <div className="bs-request-card__actions">
                          <button
                            type="button"
                            className="success"
                            onClick={() =>
                              responderSolicitud(
                                solicitud.id_solicitud,
                                'aceptada'
                              )
                            }
                          >
                            Aceptar
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              responderSolicitud(
                                solicitud.id_solicitud,
                                'rechazada'
                              )
                            }
                          >
                            Rechazar
                          </button>
                        </div>
                      )}

                      {solicitud.estado === 'aceptada' && (
                        <div className="bs-request-card__actions">
                          <button
                            type="button"
                            className="success"
                            onClick={() =>
                              abrirContacto(
                                solicitud.solicitante.contacto,
                                nombreCompleto(
                                  solicitud.solicitante
                                )
                              )
                            }
                          >
                            Contactar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate('/dashboardUsuario')
                            }
                          >
                            Buscar cancha
                          </button>
                        </div>
                      )}

                      {solicitud.estado !== 'pendiente' && (
                        <div className="bs-request-card__actions">
                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              quitarSolicitudDeMiLista(
                                solicitud.id_solicitud
                              )
                            }
                          >
                            <i className="bi bi-trash"></i>
                            Quitar
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="bs-inline-empty">
                    No recibiste solicitudes todavía.
                  </p>
                )}
              </section>

              <section>
                <h3>Enviadas</h3>

                {solicitudesEnviadas.length ? (
                  solicitudesEnviadas.map((solicitud) => (
                    <article
                      key={solicitud.id_solicitud}
                      className="bs-request-card"
                    >
                      <header>
                        <strong>
                          {nombreCompleto(solicitud.propietario)}
                        </strong>
                        <span
                          className={`bs-status bs-status--${solicitud.estado}`}
                        >
                          {solicitud.estado}
                        </span>
                      </header>

                      <p>
                        {
                          solicitud.disponibilidad.deporte
                            ?.nombre_deporte
                        }{' '}
                        · {solicitud.disponibilidad.nivel}
                      </p>

                      {solicitud.mensaje && (
                        <blockquote>{solicitud.mensaje}</blockquote>
                      )}

                      {solicitud.estado === 'pendiente' && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            responderSolicitud(
                              solicitud.id_solicitud,
                              'cancelada'
                            )
                          }
                        >
                          Cancelar solicitud
                        </button>
                      )}

                      {solicitud.estado === 'aceptada' && (
                        <div className="bs-request-card__actions">
                          <button
                            type="button"
                            className="success"
                            onClick={() =>
                              abrirContacto(
                                solicitud.propietario.contacto,
                                nombreCompleto(
                                  solicitud.propietario
                                )
                              )
                            }
                          >
                            Contactar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate('/dashboardUsuario')
                            }
                          >
                            Buscar cancha
                          </button>
                        </div>
                      )}

                      {solicitud.estado !== 'pendiente' && (
                        <div className="bs-request-card__actions">
                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              quitarSolicitudDeMiLista(
                                solicitud.id_solicitud
                              )
                            }
                          >
                            <i className="bi bi-trash"></i>
                            Quitar
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="bs-inline-empty">
                    No enviaste solicitudes todavía.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </section>

      {disponibilidadSolicitud && (
        <div
          className="bs-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarSolicitud();
            }
          }}
        >
          <form className="bs-modal" onSubmit={enviarSolicitud}>
            <button
              type="button"
              className="bs-modal__close"
              onClick={cerrarSolicitud}
              aria-label="Cerrar"
            >
              ×
            </button>

            <span className="bs-modal__icon">
              <i className="bi bi-send-fill"></i>
            </span>

            <h2>Enviar solicitud</h2>

            <p>
              A {nombreCompleto(disponibilidadSolicitud.usuario)} para
              jugar{' '}
              {disponibilidadSolicitud.deporte?.nombre_deporte}.
            </p>

            <label>
              <span>Mensaje</span>
              <textarea
                maxLength={500}
                value={solicitudForm.mensaje}
                onChange={(event) =>
                  setSolicitudForm((actual) => ({
                    ...actual,
                    mensaje: event.target.value,
                  }))
                }
                placeholder="Hola, estoy buscando compañero para jugar..."
              />
            </label>

            <div className="bs-modal__grid">
              <label>
                <span>Fecha propuesta</span>
                <input
                  type="date"
                  value={solicitudForm.fecha_propuesta}
                  onChange={(event) =>
                    setSolicitudForm((actual) => ({
                      ...actual,
                      fecha_propuesta: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Horario</span>
                <input
                  type="time"
                  value={solicitudForm.hora_propuesta}
                  onChange={(event) =>
                    setSolicitudForm((actual) => ({
                      ...actual,
                      hora_propuesta: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="bs-modal__actions">
              <button type="button" onClick={cerrarSolicitud}>
                Cancelar
              </button>

              <button
                type="submit"
                className="primary"
                disabled={guardando}
              >
                {guardando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default BancoSuplentes;

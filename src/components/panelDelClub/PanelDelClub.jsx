import { apiUrl, mediaUrl } from '../../config/api';
import React, { useEffect, useRef, useState } from 'react';
import './PanelDelClub.css';
import { horarios } from '../staticData';
import Swal from 'sweetalert2';
import funcionalidadEnProgreso from '../../assets/PROGRESS.png';

const PanelDelClub = ({ club, onLogout, reservas = [] }) => {
  /*
    Estado donde se guardan las canchas que llegan desde el backend.
  */
  const [canchas, setCanchas] = useState([]);

  /*
    Deportes reales cargados desde el backend.
    Se usan para guardar la cancha con el id_deporte correcto de la base.
  */
  const [deportesDisponibles, setDeportesDisponibles] = useState([]);

  /*
    Controla si se muestra o no la sección de configuración.
  */
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [mostrarModalSuscripcion, setMostrarModalSuscripcion] = useState(false);

  const abrirModalSuscripcion = () => {
    setMostrarModalSuscripcion(true);
  };

  const cerrarModalSuscripcion = () => {
    setMostrarModalSuscripcion(false);
  };


  /*
    Controla si se muestra o no el formulario para agregar una cancha nueva.
  */
  const [showAddCancha, setShowAddCancha] = useState(false);

  /*
    Controla si se muestra o no el calendario simple dentro de próximas reservas.
  */
  const [showCalendar, setShowCalendar] = useState(false);

  const horariosIniciales = horarios.map((h) => h.id);
  const [horariosPorCancha, setHorariosPorCancha] = useState({});
  const [canchaEditandoId, setCanchaEditandoId] = useState(null);
  const [canchaHorariosId, setCanchaHorariosId] = useState(null);
  const [guardandoHorariosId, setGuardandoHorariosId] = useState(null);
  const [guardandoCanchaId, setGuardandoCanchaId] = useState(null);

  /*
    Gestión de bloqueos excepcionales por cancha.
    Un bloqueo impide reservas durante una fecha y rango horario concretos.
  */
  const [canchaBloqueosId, setCanchaBloqueosId] = useState(null);
  const [bloqueosPorCancha, setBloqueosPorCancha] = useState({});
  const [cargandoBloqueosId, setCargandoBloqueosId] = useState(null);
  const [guardandoBloqueoId, setGuardandoBloqueoId] = useState(null);
  const [eliminandoBloqueoId, setEliminandoBloqueoId] = useState(null);
  const [bloqueoForm, setBloqueoForm] = useState({
    fecha: '',
    hora_inicio: '09:00',
    hora_fin: '10:00',
    tipo: 'torneo',
    motivo: '',
  });

  /*
    Gestión de torneos del club.
    El flyer se envía como multipart/form-data y el resto de los campos
    se administran desde este formulario.
  */
  const [torneos, setTorneos] = useState([]);
  const [cargandoTorneos, setCargandoTorneos] = useState(false);
  const [guardandoTorneo, setGuardandoTorneo] = useState(false);
  const [actualizandoEstadoTorneoId, setActualizandoEstadoTorneoId] = useState(null);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [torneoEditandoId, setTorneoEditandoId] = useState(null);
  const [flyerTorneo, setFlyerTorneo] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState('');
  const flyerInputRef = useRef(null);
  const [torneoForm, setTorneoForm] = useState({
    titulo: '',
    id_deporte: '',
    fecha_inicio: '',
    fecha_fin: '',
    contacto: '',
    descripcion: '',
    estado: 'borrador',
  });

  const [editCancha, setEditCancha] = useState({
    nombre: '',
    deporte: '',
    tipo_suelo: '',
    descripcion: '',
    precio_por_hora: '',
  });

  /*
    Estado del formulario para agregar una cancha nueva.
    El precio se guarda como texto para permitir mostrarlo con punto de miles.
  */
  const [newCancha, setNewCancha] = useState({
    nombre: '',
    deporte: '',
    tipo_suelo: '',
    descripcion: '',
    precio_por_hora: '',
  });

  /*
    Guarda el ID de la cancha cuyo precio se está editando.
    Si está en null, no hay ninguna cancha en edición.
  */
  const [editingCanchaId, setEditingCanchaId] = useState(null);

  /*
    Guarda temporalmente el precio que el usuario está editando.
  */
  const [editingPrice, setEditingPrice] = useState('');

  /*
    Algunas respuestas del login traen los datos del club dentro de club.club.
    Por eso se normaliza en esta constante.
    El objeto que llega puede ser:
    - currentUser con estructura { id_usuario, club: {...} }
    - O directamente el club si viene anidado con id_club
  */
  const clubPrincipal = club?.club || (club?.id_club ? club : null);

  const idClubActual =
    clubPrincipal?.id_club ||
    clubPrincipal?.id ||
    club?.id_club ||
    club?.id ||
    null;

  /*
    Nombre del club.
    Se usan varias alternativas porque puede venir con distinto nombre
    según cómo responda el backend.
  */
  const nombreClub =
    clubPrincipal?.nombre_club ||
    club?.razonSocial ||
    club?.nombre_club ||
    'Nombre del Club';

  /*
    Nombre del dueño.
    También se usan varias alternativas por compatibilidad con el backend.
  */
  const nombreDueno =
    club?.nombre ||
    club?.nombre_dueno ||
    'dueño';

  const [logoClubActual, setLogoClubActual] = useState('');
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const logoInputRef = useRef(null);

  const obtenerLogoDesdeClub = () =>
    clubPrincipal?.logo_club ||
    clubPrincipal?.logo ||
    club?.logo_club ||
    club?.logo ||
    '';

  useEffect(() => {
    setLogoClubActual(obtenerLogoDesdeClub());
  }, [clubPrincipal?.logo_club, clubPrincipal?.logo, club?.logo_club, club?.logo]);

  const construirUrlLogo = (logo) => {
    if (!logo) return '';

    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }

    return mediaUrl(logo);
  };

  const logoClubUrl = construirUrlLogo(logoClubActual);

  const serviciosInicialesClub =
    clubPrincipal?.servicios_club ||
    clubPrincipal?.servicios ||
    club?.servicios_club ||
    club?.servicios ||
    '';

  const [serviciosClub, setServiciosClub] = useState(serviciosInicialesClub);
  const [guardandoServiciosClub, setGuardandoServiciosClub] = useState(false);

  useEffect(() => {
    setServiciosClub(serviciosInicialesClub);
  }, [idClubActual, serviciosInicialesClub]);

  const handleGuardarServiciosClub = async () => {
    if (!idClubActual) {
      Swal.fire({
        icon: 'error',
        title: 'Club no disponible',
        text: 'No se pudo identificar el club para guardar los servicios.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    setGuardandoServiciosClub(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/club/${idClubActual}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          servicios_club: serviciosClub.trim(),
        }),
      });

      const texto = await response.text();
      let data = null;

      if (texto) {
        try {
          data = JSON.parse(texto);
        } catch {
          data = texto;
        }
      }

      if (!response.ok) {
        const mensaje =
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : '') ||
          'No se pudieron guardar los servicios del club.';

        throw new Error(mensaje);
      }

      Swal.fire({
        icon: 'success',
        title: 'Servicios actualizados',
        text: 'Las amenidades del club fueron guardadas correctamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
        background: '#ffffff',
        color: '#071f4d',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          confirmButton: 'cy-alert-button',
        },
      });
    } catch (error) {
      console.error('Error al guardar servicios del club:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudieron guardar los servicios',
        text: error.message || 'Intentá nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setGuardandoServiciosClub(false);
    }
  };

  const inicialesClub = nombreClub
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();

  const abrirSelectorLogo = () => {
    logoInputRef.current?.click();
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!tiposPermitidos.includes(file.type)) {
      e.target.value = '';

      Swal.fire({
        icon: 'warning',
        title: 'Formato no permitido',
        text: 'El logo debe ser JPG, PNG o WEBP.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      e.target.value = '';

      Swal.fire({
        icon: 'warning',
        title: 'Archivo demasiado grande',
        text: 'El logo no puede superar los 2MB.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });

      return;
    }

    if (!clubPrincipal?.id_club) {
      e.target.value = '';

      Swal.fire({
        icon: 'error',
        title: 'Club no disponible',
        text: 'No se pudo identificar el club para actualizar el logo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });

      return;
    }

    setSubiendoLogo(true);

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();

      data.append('logo', file);

      const response = await fetch(apiUrl(`/club/${clubPrincipal.id_club}/logo`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'No se pudo actualizar el logo.');
      }

      const nuevoLogo =
        result.logo ||
        result.logo_club ||
        result.club?.logo_club ||
        result.club?.logo ||
        '';

      if (nuevoLogo) {
        setLogoClubActual(nuevoLogo);
      }

      Swal.fire({
        icon: 'success',
        title: 'Logo actualizado',
        text: 'El logo del club fue actualizado correctamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
        background: '#ffffff',
        color: '#071f4d',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          confirmButton: 'cy-alert-button',
        },
      });
    } catch (error) {
      console.error('Error al subir logo:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo subir el logo',
        text: error.message || 'Intentá nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setSubiendoLogo(false);
      e.target.value = '';
    }
  };

  const getWelcomeStorageKey = () => {
    const clubId = clubPrincipal?.id_club || 'sin-club';
    return `damecancha_welcome_panel_seen_${clubId}`;
  };

  const cerrarWelcomeModal = () => {
    localStorage.setItem(getWelcomeStorageKey(), 'true');
    setShowWelcomeModal(false);
  };

  const irAConfiguracionDesdeWelcome = () => {
    localStorage.setItem(getWelcomeStorageKey(), 'true');
    setShowWelcomeModal(false);
    setShowSettings(true);
  };

  useEffect(() => {
    if (!clubPrincipal?.id_club) return;

    const yaVioBienvenida = localStorage.getItem(
      `damecancha_welcome_panel_seen_${clubPrincipal.id_club}`
    );

    if (!yaVioBienvenida) {
      setShowWelcomeModal(true);
    }
  }, [clubPrincipal?.id_club]);

  /* =========================================================
     FORMATEO DE IMPORTES
     Permite ver $40.000 en pantalla,
     pero enviar 40000 al backend.
  ========================================================= */

  /*
    Limpia cualquier importe y lo convierte en número.
    Acepta valores como "40.000", "$40.000" o 40000.
  */
  const limpiarImporte = (value) => {
    if (value === null || value === undefined || value === '') return 0;

    const cleanValue = value.toString().replace(/\./g, '').replace(/\D/g, '');

    return Number(cleanValue || 0);
  };

  /*
    Corrige importes viejos que quedaron multiplicados por 100.
    Ejemplo del problema actual:
    - Se quería guardar 40.000
    - En la DB quedó 4.000.000
    - Para mostrarlo en pantalla lo normalizamos a 40.000

    IMPORTANTE:
    Esto no vuelve a multiplicar el precio al guardar.
    Al guardar se manda el número limpio que el usuario escribió.
  */
  const normalizarImporteDesdeBackend = (value) => {
    if (value === null || value === undefined || value === '') return 0;

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const texto = String(value).trim();

    // Los DECIMAL de MySQL suelen llegar como "40000.00".
    if (/^-?\d+(?:\.\d{1,2})?$/.test(texto)) {
      const numeroDecimal = Number(texto);
      return Number.isFinite(numeroDecimal) ? numeroDecimal : 0;
    }

    return limpiarImporte(texto);
  };

  /*
    Convierte un valor numérico en texto con punto de miles.
    Ejemplo: 40000 => "40.000".
  */
  const formatPrice = (value) => {
    const numero = limpiarImporte(value);

    if (!numero) return '';

    return String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  /*
    Limpia un valor con puntos para mandarlo como número al backend.
    Ejemplo: "40.000" => 40000.
  */
  const parsePrice = (value) => limpiarImporte(value);

  /*
    Agrega el signo pesos al importe formateado.
    Antes de mostrar, normaliza importes viejos inflados por 100.
    Ejemplo: 4000000 => "$40.000".
  */
  const formatMoney = (value) => {
    const importeNormalizado = normalizarImporteDesdeBackend(value);

    return `$${formatPrice(importeNormalizado) || '0'}`;
  };

  /*
    Maneja el cambio del input al editar precio de cancha.
    Mientras el usuario escribe, el valor se formatea con punto de miles.
  */
  const handleEditingPriceChange = (e) => {
    setEditingPrice(formatPrice(e.target.value));
  };

  /*
    Maneja el cambio del precio al agregar una cancha nueva.
  */
  const handleNewCanchaPriceChange = (e) => {
    setNewCancha({
      ...newCancha,
      precio_por_hora: formatPrice(e.target.value)
    });
  };

  const handleEditCanchaPriceChange = (e) => {
    setEditCancha({
      ...editCancha,
      precio_por_hora: formatPrice(e.target.value)
    });
  };

  const getCanchaId = (cancha) => cancha.id_cancha || cancha.id;

  const getDeporteId = (cancha) =>
    cancha.id_deporte?.id_deporte || cancha.deporte?.id_deporte || cancha.id_deporte || '';

  const getHorariosDeCancha = (idCancha) =>
    horariosPorCancha[idCancha] || horariosIniciales;

  const mapDisponibilidadesAHorarios = (disponibilidades) => {
    if (!Array.isArray(disponibilidades) || disponibilidades.length === 0) {
      return horariosIniciales;
    }

    const horasGuardadas = new Set();

    disponibilidades.forEach((d) => {
      const horaCorta = d.hora_inicio?.slice(0, 5);
      if (horaCorta) horasGuardadas.add(horaCorta);
    });

    const idsHorarios = horarios
      .filter((h) => horasGuardadas.has(h.hora))
      .map((h) => h.id);

    return idsHorarios.length > 0 ? idsHorarios : horariosIniciales;
  };

  const construirDisponibilidades = (idsHorarios) => {
    const horasSeleccionadas = horarios
      .filter((h) => idsHorarios.includes(h.id))
      .map((h) => h.hora);

    const disponibilidades = [];

    for (let dia = 0; dia < 7; dia++) {
      horasSeleccionadas.forEach((hora) => {
        const [h, m] = hora.split(':').map(Number);
        const horaFin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

        disponibilidades.push({
          dia_semana: dia,
          hora_inicio: `${hora}:00`,
          hora_fin: horaFin,
        });
      });
    }

    return disponibilidades;
  };

  /* =========================================================
     CARGA DE CANCHAS DEL CLUB
     Cuando el componente se monta, consulta al backend
     las canchas asociadas al club logueado.
  ========================================================= */

  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
        const response = await fetch(
          apiUrl(`/cancha/club/${idClubActual}`),
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setCanchas(data || []);
      } catch (error) {
        console.error('Error cargando canchas:', error);
        setCanchas([]);
      }
    };

    if (idClubActual) {
      fetchCanchas();
    } else {
      console.warn('Club principal o ID de club no disponible', clubPrincipal);
    }
  }, [idClubActual]);

  useEffect(() => {
    const fetchDeportes = async () => {
      try {
        const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
        const response = await fetch(apiUrl('/deporte'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('No se pudieron cargar los deportes');
        }

        const data = await response.json();

        setDeportesDisponibles(
          Array.isArray(data)
            ? [...data].sort((a, b) => {
              const textoA = a.nombre_deporte || "";
              const textoB = b.nombre_deporte || "";
              return textoA.localeCompare(textoB);
            })
            : []
        );

      } catch (error) {
        console.error('Error cargando deportes:', error);
        setDeportesDisponibles([]);
      }
    };

    fetchDeportes();
  }, []);

  useEffect(() => {
    if (!showSettings || !canchas.length) return;

    const cargarHorariosGuardados = async () => {
      try {
        const token = localStorage.getItem('token');

        const entradas = await Promise.all(
          canchas.map(async (cancha) => {
            const idCancha = getCanchaId(cancha);
            const response = await fetch(
              apiUrl(`/disponibilidad/cancha/${idCancha}`),
              { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!response.ok) return [idCancha, horariosIniciales];

            const disponibilidades = await response.json();
            return [idCancha, mapDisponibilidadesAHorarios(disponibilidades)];
          })
        );

        setHorariosPorCancha((prev) => ({
          ...prev,
          ...Object.fromEntries(entradas),
        }));
      } catch (error) {
        console.error('Error al cargar horarios guardados:', error);
      }
    };

    cargarHorariosGuardados();
  }, [showSettings, canchas]);

  const toggleHorarioCancha = (idCancha, horarioId) => {
    setHorariosPorCancha((prev) => {
      const actuales = prev[idCancha] || horariosIniciales;

      return {
        ...prev,
        [idCancha]: actuales.includes(horarioId)
          ? actuales.filter((id) => id !== horarioId)
          : [...actuales, horarioId],
      };
    });
  };

  const handleGuardarHorarios = async (idCancha) => {
    if (!idCancha) return;

    setGuardandoHorariosId(idCancha);

    try {
      const disponibilidades = construirDisponibilidades(getHorariosDeCancha(idCancha));
      const token = localStorage.getItem('token');

      const response = await fetch(apiUrl(`/disponibilidad/cancha/${idCancha}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(disponibilidades),
      });

      if (!response.ok) {
        throw new Error('No se pudieron guardar los horarios');
      }

      setCanchaHorariosId(null);

      Swal.fire({
        icon: 'success',
        title: '¡Listo!',
        text: 'Los horarios de la cancha fueron guardados correctamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
        background: '#ffffff',
        color: '#071f4d',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          confirmButton: 'cy-alert-button',
        },
      });
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron guardar los horarios de esta cancha. Intentá nuevamente.',
        confirmButtonText: 'Aceptar',
      });
    } finally {
      setGuardandoHorariosId(null);
    }
  };


  /* =========================================================
     BLOQUEOS EXCEPCIONALES DE CANCHA
     Permiten cerrar turnos por torneo, mantenimiento, evento,
     cierre u otro motivo sin crear reservas ficticias.
  ========================================================= */

  const obtenerFechaLocalISO = () => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  };

  const fechaMinimaBloqueo = obtenerFechaLocalISO();

  const leerRespuestaHttp = async (response) => {
    const texto = await response.text();

    if (!texto) return null;

    try {
      return JSON.parse(texto);
    } catch {
      return texto;
    }
  };

  const obtenerMensajeError = (data, fallback) => {
    if (Array.isArray(data?.message)) {
      return data.message.join('. ');
    }

    return (
      data?.message ||
      data?.error ||
      (typeof data === 'string' ? data : '') ||
      fallback
    );
  };

  const formatearFechaBloqueo = (fecha) => {
    if (!fecha) return 'Sin fecha';

    const fechaLimpia = String(fecha).slice(0, 10);
    const [anio, mes, dia] = fechaLimpia.split('-');

    if (!anio || !mes || !dia) return fechaLimpia;

    return `${dia}/${mes}/${anio}`;
  };

  const limpiarFormularioBloqueo = () => {
    setBloqueoForm({
      fecha: '',
      hora_inicio: '09:00',
      hora_fin: '10:00',
      tipo: 'torneo',
      motivo: '',
    });
  };

  const cargarBloqueosCancha = async (idCancha) => {
    if (!idCancha) return;

    setCargandoBloqueosId(idCancha);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(
        apiUrl(`/bloqueo-cancha/cancha/${idCancha}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudieron cargar los bloqueos. Error HTTP ${response.status}.`
          )
        );
      }

      setBloqueosPorCancha((prev) => ({
        ...prev,
        [idCancha]: Array.isArray(data) ? data : [],
      }));
    } catch (error) {
      console.error('Error al cargar bloqueos:', error);

      setBloqueosPorCancha((prev) => ({
        ...prev,
        [idCancha]: [],
      }));

      Swal.fire({
        icon: 'error',
        title: 'No se pudieron cargar los bloqueos',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setCargandoBloqueosId(null);
    }
  };

  const alternarBloqueosCancha = async (idCancha) => {
    const seEstaCerrando = canchaBloqueosId === idCancha;

    setCanchaEditandoId(null);
    setCanchaHorariosId(null);
    setCanchaBloqueosId(seEstaCerrando ? null : idCancha);
    limpiarFormularioBloqueo();

    if (!seEstaCerrando) {
      await cargarBloqueosCancha(idCancha);
    }
  };

  const handleCrearBloqueo = async (e, idCancha) => {
    e.preventDefault();

    const {
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      tipo,
      motivo,
    } = bloqueoForm;

    if (!fecha || !horaInicio || !horaFin || !tipo) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completá la fecha, el horario y el tipo de bloqueo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
      return;
    }

    if (fecha < fechaMinimaBloqueo) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha inválida',
        text: 'No se pueden crear bloqueos en fechas anteriores a hoy.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
      return;
    }

    if (horaInicio >= horaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Horario inválido',
        text: 'La hora de finalización debe ser posterior a la hora de inicio.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
      return;
    }

    setGuardandoBloqueoId(idCancha);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(
        apiUrl('/bloqueo-cancha'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_cancha: Number(idCancha),
            fecha,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            tipo,
            motivo: motivo.trim() || undefined,
          }),
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudo crear el bloqueo. Error HTTP ${response.status}.`
          )
        );
      }

      await cargarBloqueosCancha(idCancha);
      limpiarFormularioBloqueo();

      await Swal.fire({
        icon: 'success',
        title: 'Turno bloqueado',
        text: 'La cancha quedó marcada como no disponible en ese horario.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al crear bloqueo:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo bloquear el turno',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setGuardandoBloqueoId(null);
    }
  };

  const handleLiberarBloqueo = async (bloqueo, idCancha) => {
    const idBloqueo = bloqueo?.id_bloqueo;

    if (!idBloqueo) return;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: 'Liberar turno',
      text: `Vas a quitar el bloqueo del ${formatearFechaBloqueo(
        bloqueo.fecha
      )}, de ${String(bloqueo.hora_inicio).slice(0, 5)} a ${String(
        bloqueo.hora_fin
      ).slice(0, 5)} hs.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) return;

    setEliminandoBloqueoId(idBloqueo);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(
        apiUrl(`/bloqueo-cancha/${idBloqueo}`),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudo liberar el turno. Error HTTP ${response.status}.`
          )
        );
      }

      setBloqueosPorCancha((prev) => ({
        ...prev,
        [idCancha]: (prev[idCancha] || []).filter(
          (item) => item.id_bloqueo !== idBloqueo
        ),
      }));

      Swal.fire({
        icon: 'success',
        title: 'Turno liberado',
        text: 'El horario volvió a quedar disponible.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al liberar bloqueo:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo liberar el turno',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setEliminandoBloqueoId(null);
    }
  };

  /* =========================================================
     GESTIÓN DE TORNEOS
     Permite crear, editar, publicar, finalizar y cancelar
     torneos vinculados al club autenticado.
  ========================================================= */

  const construirUrlFlyer = (flyerUrl) => {
    if (!flyerUrl) return '';

    if (
      String(flyerUrl).startsWith('http://') ||
      String(flyerUrl).startsWith('https://') ||
      String(flyerUrl).startsWith('blob:')
    ) {
      return flyerUrl;
    }

    return mediaUrl(flyerUrl);
  };

  const obtenerIdDeporteTorneo = (torneo) =>
    torneo?.deporte?.id_deporte ||
    torneo?.id_deporte?.id_deporte ||
    torneo?.id_deporte ||
    '';

  const obtenerNombreDeporteTorneo = (torneo) =>
    torneo?.deporte?.nombre_deporte ||
    torneo?.id_deporte?.nombre_deporte ||
    deportesDisponibles.find(
      (deporte) =>
        Number(deporte.id_deporte) === Number(obtenerIdDeporteTorneo(torneo))
    )?.nombre_deporte ||
    'Deporte sin identificar';

  const limpiarFormularioTorneo = () => {
    if (flyerPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(flyerPreview);
    }

    setTorneoForm({
      titulo: '',
      id_deporte: '',
      fecha_inicio: '',
      fecha_fin: '',
      contacto: '',
      descripcion: '',
      estado: 'borrador',
    });
    setFlyerTorneo(null);
    setFlyerPreview('');
    setTorneoEditandoId(null);

    if (flyerInputRef.current) {
      flyerInputRef.current.value = '';
    }
  };

  const cerrarFormularioTorneo = () => {
    limpiarFormularioTorneo();
    setShowTournamentForm(false);
  };

  const abrirFormularioNuevoTorneo = () => {
    limpiarFormularioTorneo();
    setShowTournamentForm(true);

    window.setTimeout(() => {
      document
        .querySelector('.pdc-tournament-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const cargarTorneosClub = async () => {
    if (!idClubActual) {
      setTorneos([]);
      return;
    }

    setCargandoTorneos(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(
        apiUrl(`/torneo/club/${idClubActual}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudieron cargar los torneos. Error HTTP ${response.status}.`
          )
        );
      }

      setTorneos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar torneos:', error);
      setTorneos([]);

      Swal.fire({
        icon: 'error',
        title: 'No se pudieron cargar los torneos',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setCargandoTorneos(false);
    }
  };

  useEffect(() => {
    if (!idClubActual) return;

    cargarTorneosClub();
  }, [idClubActual]);

  const handleFlyerTorneoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!tiposPermitidos.includes(file.type)) {
      e.target.value = '';

      Swal.fire({
        icon: 'warning',
        title: 'Formato no permitido',
        text: 'El flyer debe ser una imagen JPG, PNG o WEBP.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      e.target.value = '';

      Swal.fire({
        icon: 'warning',
        title: 'Archivo demasiado grande',
        text: 'El flyer no puede superar los 5 MB.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
      return;
    }

    if (flyerPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(flyerPreview);
    }

    setFlyerTorneo(file);
    setFlyerPreview(URL.createObjectURL(file));
  };

  const iniciarEdicionTorneo = (torneo) => {
    if (!torneo?.id_torneo) return;

    if (flyerPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(flyerPreview);
    }

    setTorneoEditandoId(torneo.id_torneo);
    setTorneoForm({
      titulo: torneo.titulo || '',
      id_deporte: String(obtenerIdDeporteTorneo(torneo) || ''),
      fecha_inicio: String(torneo.fecha_inicio || '').slice(0, 10),
      fecha_fin: String(torneo.fecha_fin || '').slice(0, 10),
      contacto: torneo.contacto || '',
      descripcion: torneo.descripcion || '',
      estado: torneo.estado || 'borrador',
    });
    setFlyerTorneo(null);
    setFlyerPreview(construirUrlFlyer(torneo.flyer_url));
    setShowTournamentForm(true);

    window.setTimeout(() => {
      document
        .querySelector('.pdc-tournament-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const validarFormularioTorneo = () => {
    if (!idClubActual) {
      return 'No se pudo identificar el club.';
    }

    if (torneoForm.titulo.trim().length < 3) {
      return 'El título debe tener al menos 3 caracteres.';
    }

    if (!Number(torneoForm.id_deporte)) {
      return 'Seleccioná el deporte del torneo.';
    }

    if (!torneoForm.fecha_inicio || !torneoForm.fecha_fin) {
      return 'Completá la fecha de inicio y la fecha de finalización.';
    }

    if (torneoForm.fecha_fin < torneoForm.fecha_inicio) {
      return 'La fecha de finalización no puede ser anterior a la fecha de inicio.';
    }

    if (torneoForm.descripcion.trim().length < 10) {
      return 'La descripción debe tener al menos 10 caracteres.';
    }

    if (!torneoEditandoId && !flyerTorneo) {
      return 'Seleccioná el flyer del torneo.';
    }

    return '';
  };

  const guardarTorneo = async (estadoDestino) => {
    const mensajeValidacion = validarFormularioTorneo();

    if (mensajeValidacion) {
      Swal.fire({
        icon: 'warning',
        title: 'Revisá el formulario',
        text: mensajeValidacion,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
      return;
    }

    setGuardandoTorneo(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const formData = new FormData();
      formData.append('id_club', String(idClubActual));
      formData.append('id_deporte', String(torneoForm.id_deporte));
      formData.append('titulo', torneoForm.titulo.trim());
      formData.append('descripcion', torneoForm.descripcion.trim());
      formData.append('fecha_inicio', torneoForm.fecha_inicio);
      formData.append('fecha_fin', torneoForm.fecha_fin);
      formData.append('contacto', torneoForm.contacto.trim());
      formData.append('estado', estadoDestino);

      if (flyerTorneo) {
        formData.append('flyer', flyerTorneo);
      }

      const esEdicion = Boolean(torneoEditandoId);
      const response = await fetch(
        esEdicion
          ? apiUrl(`/torneo/${torneoEditandoId}`)
          : apiUrl('/torneo'),
        {
          method: esEdicion ? 'PATCH' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudo guardar el torneo. Error HTTP ${response.status}.`
          )
        );
      }

      await cargarTorneosClub();
      cerrarFormularioTorneo();

      await Swal.fire({
        icon: 'success',
        title: esEdicion ? 'Torneo actualizado' : 'Torneo creado',
        text:
          estadoDestino === 'publicado'
            ? 'El torneo ya está publicado y visible para los usuarios.'
            : 'El torneo quedó guardado como borrador.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al guardar torneo:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar el torneo',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setGuardandoTorneo(false);
    }
  };

  const handleSubmitTorneo = (e) => {
    e.preventDefault();
    guardarTorneo(torneoForm.estado || 'borrador');
  };

  const cambiarEstadoTorneo = async (torneo, nuevoEstado) => {
    if (!torneo?.id_torneo) return;

    const etiquetas = {
      publicado: 'publicar',
      finalizado: 'finalizar',
      borrador: 'pasar a borrador',
    };

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: `¿Querés ${etiquetas[nuevoEstado] || 'actualizar'} este torneo?`,
      text: torneo.titulo,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#087bff',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) return;

    setActualizandoEstadoTorneoId(torneo.id_torneo);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        apiUrl(`/torneo/${torneo.id_torneo}/estado`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudo actualizar el torneo. Error HTTP ${response.status}.`
          )
        );
      }

      setTorneos((prev) =>
        prev.map((item) =>
          item.id_torneo === torneo.id_torneo ? data : item
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El torneo ahora está ${nuevoEstado}.`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al actualizar estado del torneo:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar el torneo',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setActualizandoEstadoTorneoId(null);
    }
  };

  const cancelarTorneo = async (torneo) => {
    if (!torneo?.id_torneo) return;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: 'Cancelar torneo',
      text: `Vas a cancelar ${torneo.titulo}. Dejará de mostrarse entre los torneos publicados.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar torneo',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) return;

    setActualizandoEstadoTorneoId(torneo.id_torneo);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        apiUrl(`/torneo/${torneo.id_torneo}`),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudo cancelar el torneo. Error HTTP ${response.status}.`
          )
        );
      }

      setTorneos((prev) =>
        prev.map((item) =>
          item.id_torneo === torneo.id_torneo
            ? { ...item, estado: 'cancelado' }
            : item
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Torneo cancelado',
        text: 'La publicación dejó de estar activa.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al cancelar torneo:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo cancelar el torneo',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setActualizandoEstadoTorneoId(null);
    }
  };

  const eliminarTorneo = async (torneo) => {
    if (!torneo?.id_torneo) return;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar torneo definitivamente',
      text: `Vas a eliminar ${torneo.titulo} y su flyer. Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) return;

    setActualizandoEstadoTorneoId(torneo.id_torneo);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        apiUrl(`/torneo/${torneo.id_torneo}/eliminar`),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await leerRespuestaHttp(response);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudo eliminar el torneo. Error HTTP ${response.status}.`
          )
        );
      }

      setTorneos((prev) =>
        prev.filter((item) => item.id_torneo !== torneo.id_torneo)
      );

      if (torneoEditandoId === torneo.id_torneo) {
        cerrarFormularioTorneo();
      }

      await Swal.fire({
        icon: 'success',
        title: 'Torneo eliminado',
        text: 'El torneo fue eliminado definitivamente del panel.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al eliminar torneo:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar el torneo',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setActualizandoEstadoTorneoId(null);
    }
  };

  const handleAddCancha = async (e) => {
    e.preventDefault();

    const precioLimpio = parsePrice(newCancha.precio_por_hora);

    if (!newCancha.nombre || !newCancha.deporte || !precioLimpio) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completá los campos requeridos.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
        background: '#ffffff',
        color: '#071f4d',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          confirmButton: 'cy-alert-button',
        },
      });
      return;
    }

    try {
      const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
      const response = await fetch(apiUrl('/cancha'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre_cancha: newCancha.nombre,
          id_deporte: parseInt(newCancha.deporte),
          id_club: Number(idClubActual),
          precio_por_hora: precioLimpio,
          tipo_suelo: newCancha.tipo_suelo,
          descripcion_cancha: newCancha.descripcion,
        }),
      });

      const responsePayload = await response.json().catch(() => ({}));

      if (response.ok) {
        const data = responsePayload;

        // Volvemos a consultar el listado completo para que el panel siempre refleje
        // exactamente lo persistido en PostgreSQL/Neon.
        try {
          const refreshResponse = await fetch(apiUrl(`/cancha/club/${idClubActual}`), {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setCanchas(Array.isArray(refreshData) ? refreshData : []);
          } else {
            setCanchas((prev) => [...prev, data]);
          }
        } catch {
          setCanchas((prev) => [...prev, data]);
        }

        Swal.fire({
          icon: 'success',
          title: 'Cancha agregada',
          text: `La cancha "${newCancha.nombre}" fue agregada correctamente.`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#087bff',
          background: '#ffffff',
          color: '#071f4d',
          customClass: {
            popup: 'cy-alert-popup',
            title: 'cy-alert-title',
            confirmButton: 'cy-alert-button',
          },
        });

        setNewCancha({
          nombre: '',
          deporte: '',
          tipo_suelo: '',
          descripcion: '',
          precio_por_hora: '',
        });

        setShowAddCancha(false);
      } else {
        const mensajeBackend = Array.isArray(responsePayload?.message)
          ? responsePayload.message.join(' ')
          : responsePayload?.message;

        Swal.fire({
          icon: 'error',
          title: 'No se pudo agregar la cancha',
          text: mensajeBackend || 'Revisá los datos ingresados o intentá nuevamente.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#ef4444',
          background: '#ffffff',
          color: '#071f4d',
          customClass: {
            popup: 'cy-alert-popup',
            title: 'cy-alert-title',
            confirmButton: 'cy-alert-button',
          },
        });
      }
    } catch (error) {
      console.error('Error al agregar cancha:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Intentá nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        color: '#071f4d',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          confirmButton: 'cy-alert-button',
        },
      });
    }
  };

  const iniciarEdicionCancha = (cancha) => {
    setCanchaHorariosId(null);
    setCanchaBloqueosId(null);
    setCanchaEditandoId(cancha.id_cancha);
    setEditCancha({
      nombre: cancha.nombre_cancha || '',
      deporte: String(getDeporteId(cancha) || ''),
      tipo_suelo: cancha.tipo_suelo || '',
      descripcion: cancha.descripcion_cancha || '',
      precio_por_hora: formatPrice(normalizarImporteDesdeBackend(cancha.precio_por_hora || 0)),
    });
  };

  const cancelarEdicionCancha = () => {
    setCanchaEditandoId(null);
    setEditCancha({
      nombre: '',
      deporte: '',
      tipo_suelo: '',
      descripcion: '',
      precio_por_hora: '',
    });
  };

  const handleUpdateCancha = async (e, canchaId) => {
    e.preventDefault();

    const precioLimpio = parsePrice(editCancha.precio_por_hora);
    const idDeporte = Number(editCancha.deporte);
    const idCanchaNumerico = Number(canchaId);

    if (!editCancha.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresá el nombre de la cancha.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });

      return;
    }

    if (!Number.isInteger(idDeporte) || idDeporte <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Deporte inválido',
        text: 'Seleccioná un deporte válido.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });

      return;
    }

    if (!Number.isInteger(idCanchaNumerico) || idCanchaNumerico <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Cancha inválida',
        text: 'No se pudo identificar la cancha que querés modificar.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });

      return;
    }

    if (!Number.isFinite(precioLimpio) || precioLimpio <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'Ingresá un precio mayor a cero.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });

      return;
    }

    setGuardandoCanchaId(canchaId);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      /*
       * Se envían únicamente propiedades que existen actualmente
       * en el DTO y en la entidad del backend.
       */
      const payload = {
        nombre_cancha: editCancha.nombre.trim(),
        id_deporte: idDeporte,
        precio_por_hora: precioLimpio,
        tipo_suelo: editCancha.tipo_suelo.trim(),
        descripcion_cancha: editCancha.descripcion.trim(),
      };

      const response = await fetch(
        apiUrl(`/cancha/${idCanchaNumerico}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      /*
       * Algunas respuestas de error pueden no traer JSON.
       * Por eso primero obtenemos el texto y luego intentamos parsearlo.
       */
      const responseText = await response.text();

      let resultado = null;

      if (responseText) {
        try {
          resultado = JSON.parse(responseText);
        } catch {
          resultado = responseText;
        }
      }

      if (!response.ok) {
        const mensajeBackend = Array.isArray(resultado?.message)
          ? resultado.message.join('. ')
          : resultado?.message ||
          resultado?.error ||
          (typeof resultado === 'string' ? resultado : null);

        throw new Error(
          mensajeBackend ||
          `No se pudo actualizar la cancha. Error HTTP ${response.status}.`
        );
      }

      if (!resultado || typeof resultado !== 'object') {
        throw new Error(
          'El servidor no devolvió los datos de la cancha actualizada.'
        );
      }

      setCanchas((prev) =>
        prev.map((cancha) =>
          Number(getCanchaId(cancha)) === idCanchaNumerico
            ? {
              ...cancha,
              ...resultado,
            }
            : cancha
        )
      );

      cancelarEdicionCancha();

      await Swal.fire({
        icon: 'success',
        title: 'Cancha actualizada',
        text: 'Los datos de la cancha fueron guardados correctamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
        background: '#ffffff',
        color: '#071f4d',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          confirmButton: 'cy-alert-button',
        },
      });
    } catch (error) {
      console.error('Error al actualizar cancha:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar la cancha',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado. Intentá nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setGuardandoCanchaId(null);
    }
  };

  const handleDeleteCancha = async (cancha) => {
    const canchaId = getCanchaId(cancha);

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar cancha',
      text: `¿Querés eliminar "${cancha.nombre_cancha}"?`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#071f4d',
      customClass: {
        popup: 'cy-alert-popup',
        title: 'cy-alert-title',
        confirmButton: 'cy-alert-button cy-alert-button--danger',
        cancelButton: 'cy-alert-cancel',
      },
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/cancha/${canchaId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar la cancha');
      }

      setCanchas((prev) => prev.filter((item) => getCanchaId(item) !== canchaId));
      setHorariosPorCancha((prev) => {
        const next = { ...prev };
        delete next[canchaId];
        return next;
      });

      Swal.fire({
        icon: 'success',
        title: 'Cancha eliminada',
        text: 'La cancha ya no aparece en el panel.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#087bff',
      });
    } catch (error) {
      console.error('Error al eliminar cancha:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la cancha. Intentá nuevamente.',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  /* =========================================================
     EDITAR PRECIO DE CANCHA
     Actualiza el precio por hora de una cancha existente.
  ========================================================= */

  const handleUpdatePrice = async (canchaId) => {
    const precioLimpio = parsePrice(editingPrice);

    if (!precioLimpio || precioLimpio <= 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    try {
      const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
      const response = await fetch(apiUrl(`/cancha/${canchaId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          precio_por_hora: precioLimpio
        }),
      });

      if (response.ok) {
        setCanchas((prev) =>
          prev.map((cancha) =>
            cancha.id_cancha === canchaId
              ? { ...cancha, precio_por_hora: precioLimpio }
              : cancha
          )
        );

        setEditingCanchaId(null);
        setEditingPrice('');
      } else {
        alert('Error al actualizar el precio');
      }
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      alert('Error de conexión');
    }
  };


  const normalizarFecha = (fecha) => {
    if (!fecha) return null;

    if (fecha instanceof Date) {
      if (Number.isNaN(fecha.getTime())) return null;
      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${anio}-${mes}-${dia}`;
    }

    const texto = String(fecha).trim();
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    const visual = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (visual) return `${visual[3]}-${visual[2]}-${visual[1]}`;

    return null;
  };

  const crearFechaCalendario = (fecha) => {
    const normalizada = normalizarFecha(fecha);
    if (!normalizada) return null;
    const [anio, mes, dia] = normalizada.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  };

  /*
    Formatea una fecha para mostrarla en pantalla sin convertirla primero a UTC.
  */
  const formatearFecha = (fecha) => {
    const date = crearFechaCalendario(fecha);
    if (!date || Number.isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-ES');
  };

  /*
    Fecha de hoy normalizada.
  */
  const hoy = normalizarFecha(new Date());

  /*
    Datos del mes actual para calcular ingresos del mes.
  */
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth();
  const anioActual = fechaActual.getFullYear();

  /*
    Las reservas llegan desde App.jsx ya asociadas al club actual.
    Conservamos también las canceladas para poder calcular el historial de
    cancelaciones por usuario, pero las excluimos de las métricas y agendas activas.
  */
  const reservasDelClub = reservas;

  const esReservaCancelada = (reserva) => {
    const estado = String(reserva?.estado || '').trim().toLowerCase();
    return estado === 'cancelada' || estado === 'cancelado';
  };

  const reservasActivasDelClub = reservasDelClub.filter(
    (reserva) => !esReservaCancelada(reserva)
  );

  /*
    Reservas del día actual.
  */
  const reservasDeHoy = reservasActivasDelClub.filter(
    (reserva) => normalizarFecha(reserva.fecha) === hoy
  );

  /*
    Reservas del mes actual.
  */
  const reservasDelMes = reservasActivasDelClub.filter((reserva) => {
    const fechaReserva = crearFechaCalendario(reserva.fecha);

    if (!fechaReserva || Number.isNaN(fechaReserva.getTime())) return false;

    return (
      fechaReserva.getMonth() === mesActual &&
      fechaReserva.getFullYear() === anioActual
    );
  });

  /*
    Suma de ingresos del día.
  */
  const ingresosHoy = reservasDeHoy.reduce(
    (total, reserva) => total + normalizarImporteDesdeBackend(reserva.precio || reserva.monto_total || 0),
    0
  );

  /*
    Suma de ingresos del mes.
  */
  const ingresosMes = reservasDelMes.reduce(
    (total, reserva) => total + normalizarImporteDesdeBackend(reserva.precio || reserva.monto_total || 0),
    0
  );

  /*
    Imágenes utilizadas para representar cada deporte.
  */
  const imagenesPorDeporte = {
    'Fútbol 5': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500',
    'Fútbol 7': 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=500',
    'Fútbol 11': 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=500',
    Básquet: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
    Tenis: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500',
    Vóley: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=500',
    Pádel: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
    Natación: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500',
    Golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500',
  };

  /*
    Procesa las canchas para agregarles datos útiles para la vista:
    - nombre del deporte
    - cantidad de reservas de hoy
    - próxima reserva
    - imagen correspondiente
  */
  const canchasProcesadas = canchas.map((cancha) => {
    const nombreDeporte = cancha.id_deporte?.nombre_deporte || 'Deporte';

    const reservasDeLaCancha = reservasActivasDelClub.filter(
      (reserva) => reserva.id_cancha === cancha.id_cancha
    );

    const reservasHoyDeLaCancha = reservasDeLaCancha.filter(
      (reserva) => normalizarFecha(reserva.fecha) === hoy
    );

    const proximaReserva = reservasDeLaCancha
      .filter((reserva) => {
        const fecha = normalizarFecha(reserva.fecha);
        return fecha && fecha >= hoy;
      })
      .sort((a, b) => {
        const fechaA = new Date(`${normalizarFecha(a.fecha)}T${a.hora || '00:00'}`);
        const fechaB = new Date(`${normalizarFecha(b.fecha)}T${b.hora || '00:00'}`);
        return fechaA - fechaB;
      })[0];

    return {
      ...cancha,
      deporte: nombreDeporte,
      reservasHoy: reservasHoyDeLaCancha.length,
      proxima: proximaReserva
        ? `${formatearFecha(proximaReserva.fecha)} - ${proximaReserva.hora}`
        : 'Sin reservas',
      img:
        imagenesPorDeporte[nombreDeporte] ||
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500',
    };
  });

  /*
    Lista de reservas próximas ordenadas por fecha y hora.
  */
  const reservasProximas = reservasActivasDelClub
    .filter((reserva) => {
      const fecha = normalizarFecha(reserva.fecha);
      return fecha && fecha >= hoy;
    })
    .sort((a, b) => {
      const fechaA = new Date(`${normalizarFecha(a.fecha)}T${a.hora || '00:00'}`);
      const fechaB = new Date(`${normalizarFecha(b.fecha)}T${b.hora || '00:00'}`);
      return fechaA - fechaB;
    });

  /*
    Historial simple de cancelaciones por usuario dentro de este club.
    No bloquea automáticamente a nadie: solo le da al dueño información
    para reconocer reincidencias y decidir cómo actuar.
  */
  const cancelacionesPorUsuario = reservasDelClub.reduce((acumulado, reserva) => {
    const idUsuario = reserva.id_usuario;
    const estado = String(reserva.estado || '').trim().toLowerCase();

    if (!idUsuario || estado !== 'cancelada') return acumulado;

    acumulado[idUsuario] = (acumulado[idUsuario] || 0) + 1;
    return acumulado;
  }, {});

  const obtenerCancelacionesUsuario = (reserva) =>
    reserva.id_usuario ? cancelacionesPorUsuario[reserva.id_usuario] || 0 : 0;



  return (
    <div className="pdc-owner-dashboard">
      {/* 
        Este contenedor centra todo el contenido del dashboard.
        Sirve para que header, cards y paneles tengan el mismo ancho visual.
      */}
      <div className="pdc-shell">
        {/* HEADER SUPERIOR */}
        <header className="pdc-header">
          <div className="pdc-main-title">
            <h1>Dashboard</h1>
            <p>Resumen general de tu club</p>
          </div>

          <div className="pdc-club-title">
            <h2>{nombreClub}</h2>
            <p>¡Hola {nombreDueno}!</p>
          </div>

          <div className="pdc-header-actions">
            <button
              className="pdc-settings-button"
              onClick={() => setShowSettings(!showSettings)}
              title="Configuración"
            >
              <i className={showSettings ? 'bi bi-arrow-left' : 'bi bi-gear'}></i>
              {showSettings ? 'Volver al dashboard' : 'Configuración'}
            </button>
            <button
              className="pdc-pay-button"
              onClick={abrirModalSuscripcion}
              title="Pagar Suscripción"
            >
              <i className="bi bi-credit-card"></i>
              Pagar Suscripción
            </button>

            <button
              type="button"
              className="pdc-logout-button"
              onClick={onLogout}
              title="Cerrar sesión"
            >
              <i className="bi bi-box-arrow-right"></i>
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* SECCIÓN DE CONFIGURACIÓN */}
        {showSettings && (
          <section className="pdc-settings-section">
            <div className="pdc-settings-container">
              <h2>Configuración del Club</h2>

              {/* Formulario para agregar canchas */}
              <div className="pdc-settings-box">
                <h3>Gestionar canchas</h3>

                <div className="pdc-settings-main-actions">
                  {!showAddCancha && (
                    <button
                      type="button"
                      className="pdc-btn-add-cancha"
                      onClick={() => setShowAddCancha(true)}
                    >
                      <i className="bi bi-plus-circle"></i>
                      Agregar nueva cancha
                    </button>
                  )}

                  <button
                    type="button"
                    className="pdc-btn-add-cancha"
                    onClick={abrirSelectorLogo}
                    disabled={subiendoLogo}
                  >
                    <i className="bi bi-image"></i>
                    {subiendoLogo ? 'Subiendo logo...' : 'Agregar logo'}
                  </button>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUploadLogo}
                    className="pdc-logo-file-input"
                  />
                </div>

                {showAddCancha && (
                  <form onSubmit={handleAddCancha} className="pdc-add-cancha-form">
                    <div className="pdc-form-group">
                      <label>Nombre de la cancha:</label>
                      <input
                        type="text"
                        placeholder="Ej: Cancha A, Cancha de Padel 1"
                        value={newCancha.nombre}
                        onChange={(e) =>
                          setNewCancha({ ...newCancha, nombre: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="pdc-form-group">
                      <label>Deporte:</label>
                      <select
                        value={newCancha.deporte}
                        onChange={(e) =>
                          setNewCancha({ ...newCancha, deporte: e.target.value })
                        }
                        required
                      >
                        <option value="">Selecciona un deporte</option>
                        {deportesDisponibles.map((deporte) => (
                          <option
                            key={deporte.id_deporte}
                            value={deporte.id_deporte}
                          >
                            {deporte.nombre_deporte}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pdc-form-group">
                      <label>Tipo de suelo:</label>
                      <input
                        type="text"
                        placeholder="Ej: Cemento, césped sintético, polvo de ladrillo"
                        value={newCancha.tipo_suelo}
                        onChange={(e) =>
                          setNewCancha({ ...newCancha, tipo_suelo: e.target.value })
                        }
                      />
                    </div>

                    <div className="pdc-form-group">
                      <label>Descripción:</label>
                      <input
                        type="text"
                        placeholder="Ej: Techada, iluminación LED, medidas oficiales"
                        value={newCancha.descripcion}
                        onChange={(e) =>
                          setNewCancha({ ...newCancha, descripcion: e.target.value })
                        }
                      />
                    </div>

                    <div className="pdc-form-group">
                      <label>Precio por hora ($):</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej: 40.000"
                        value={newCancha.precio_por_hora}
                        onChange={handleNewCanchaPriceChange}
                        required
                      />
                    </div>

                    <div className="pdc-form-actions">
                      <button type="submit" className="pdc-btn-success">
                        Agregar cancha
                      </button>

                      <button
                        type="button"
                        className="pdc-btn-cancel"
                        onClick={() => setShowAddCancha(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="pdc-settings-box pdc-services-box">
                <div className="pdc-services-header">
                  <div>
                    <span className="pdc-services-kicker">INFORMACIÓN DEL CLUB</span>
                    <h3>Servicios disponibles / Amenidades</h3>
                    <p className="pdc-settings-description">
                      Agregá los servicios que ofrece tu club para que luego los
                      usuarios puedan verlos antes de reservar.
                    </p>
                  </div>

                  <i className="bi bi-stars" aria-hidden="true"></i>
                </div>

                <div className="pdc-form-group">
                  <label htmlFor="servicios-club">
                    Servicios disponibles
                  </label>

                  <textarea
                    id="servicios-club"
                    rows={5}
                    maxLength={800}
                    placeholder="Ej: Servicio de cantina, vestuarios, duchas, estacionamiento, iluminación nocturna, alquiler de paletas, WiFi, espacio para cumpleaños."
                    value={serviciosClub}
                    onChange={(e) => setServiciosClub(e.target.value)}
                  />

                  <small className="pdc-services-help">
                    Separá cada servicio con comas. Esta información será visible
                    para los usuarios cuando consulten el club.
                  </small>
                </div>

                <div className="pdc-services-actions">
                  <span>{serviciosClub.length}/800 caracteres</span>

                  <button
                    type="button"
                    className="pdc-btn-save-settings"
                    onClick={handleGuardarServiciosClub}
                    disabled={guardandoServiciosClub}
                  >
                    <i className="bi bi-check2-circle"></i>
                    {guardandoServiciosClub
                      ? 'Guardando...'
                      : 'Guardar servicios'}
                  </button>
                </div>
              </div>

              <div className="pdc-settings-box">
                <h3>Canchas configuradas</h3>
                <p className="pdc-settings-description">
                  Editá los datos de cada cancha o abrí el reloj para definir sus horarios.
                </p>

                {canchasProcesadas.length === 0 ? (
                  <p className="pdc-alert pdc-alert-info">Todavía no hay canchas para configurar.</p>
                ) : (
                  <div className="pdc-settings-courts-list">
                    {canchasProcesadas.map((cancha) => {
                      const idCancha = getCanchaId(cancha);
                      const editando = canchaEditandoId === idCancha;
                      const editandoHorarios = canchaHorariosId === idCancha;
                      const editandoBloqueos = canchaBloqueosId === idCancha;
                      const horariosActuales = getHorariosDeCancha(idCancha);
                      const bloqueosActuales = bloqueosPorCancha[idCancha] || [];

                      return (
                        <div className="pdc-settings-court" key={idCancha}>
                          <div className="pdc-settings-court-summary">
                            <div>
                              <strong>{cancha.nombre_cancha}</strong>
                              <span>
                                {cancha.deporte}
                                {cancha.tipo_suelo ? ` · ${cancha.tipo_suelo}` : ''}
                              </span>
                            </div>

                            <div className="pdc-settings-court-actions">
                              <button
                                type="button"
                                className="pdc-icon-action pdc-icon-action-edit"
                                title="Editar cancha"
                                onClick={() => iniciarEdicionCancha(cancha)}
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>

                              <button
                                type="button"
                                className="pdc-icon-action pdc-icon-action-clock"
                                title="Editar horarios"
                                onClick={() => {
                                  setCanchaEditandoId(null);
                                  setCanchaBloqueosId(null);
                                  setCanchaHorariosId(editandoHorarios ? null : idCancha);
                                }}
                              >
                                <i className="bi bi-clock"></i>
                              </button>

                              <button
                                type="button"
                                className={`pdc-icon-action pdc-icon-action-block ${
                                  editandoBloqueos ? 'is-active' : ''
                                }`}
                                title="Bloquear turnos"
                                aria-label={`Bloquear turnos de ${cancha.nombre_cancha}`}
                                aria-expanded={editandoBloqueos}
                                onClick={() => alternarBloqueosCancha(idCancha)}
                              >
                                <i className="bi bi-calendar-x"></i>
                              </button>

                              <button
                                type="button"
                                className="pdc-icon-action pdc-icon-action-delete"
                                title="Eliminar cancha"
                                onClick={() => handleDeleteCancha(cancha)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>

                          {editando && (
                            <form
                              className="pdc-edit-cancha-form"
                              onSubmit={(e) => handleUpdateCancha(e, idCancha)}
                            >
                              <div className="pdc-form-grid">
                                <div className="pdc-form-group">
                                  <label>Nombre:</label>
                                  <input
                                    type="text"
                                    value={editCancha.nombre}
                                    onChange={(e) =>
                                      setEditCancha({ ...editCancha, nombre: e.target.value })
                                    }
                                    required
                                  />
                                </div>

                                <div className="pdc-form-group">
                                  <label>Deporte:</label>
                                  <select
                                    value={editCancha.deporte}
                                    onChange={(e) =>
                                      setEditCancha({ ...editCancha, deporte: e.target.value })
                                    }
                                    required
                                  >
                                    <option value="">Selecciona un deporte</option>
                                    {deportesDisponibles.map((deporte) => (
                                      <option
                                        key={deporte.id_deporte}
                                        value={deporte.id_deporte}
                                      >
                                        {deporte.nombre_deporte}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="pdc-form-group">
                                  <label>Tipo de suelo:</label>
                                  <input
                                    type="text"
                                    value={editCancha.tipo_suelo}
                                    onChange={(e) =>
                                      setEditCancha({ ...editCancha, tipo_suelo: e.target.value })
                                    }
                                  />
                                </div>

                                <div className="pdc-form-group">
                                  <label>Precio por hora ($):</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={editCancha.precio_por_hora}
                                    onChange={handleEditCanchaPriceChange}
                                    required
                                  />
                                </div>
                              </div>

                              <div className="pdc-form-group">
                                <label>Descripción:</label>
                                <input
                                  type="text"
                                  value={editCancha.descripcion}
                                  onChange={(e) =>
                                    setEditCancha({ ...editCancha, descripcion: e.target.value })
                                  }
                                />
                              </div>

                              <div className="pdc-form-actions">
                                <button
                                  type="submit"
                                  className="pdc-btn-success"
                                  disabled={guardandoCanchaId === idCancha}
                                >
                                  {guardandoCanchaId === idCancha ? 'Guardando...' : 'Guardar cancha'}
                                </button>

                                <button
                                  type="button"
                                  className="pdc-btn-cancel"
                                  onClick={cancelarEdicionCancha}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          )}

                          {editandoHorarios && (
                            <div className="pdc-court-schedule-editor">
                              <div className="pdc-horarios-grid">
                                {horarios.map((horario) => (
                                  <label key={horario.id} className="pdc-horario-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={horariosActuales.includes(horario.id)}
                                      onChange={() => toggleHorarioCancha(idCancha, horario.id)}
                                    />
                                    <span className="pdc-horario-label">{horario.hora}</span>
                                  </label>
                                ))}
                              </div>

                              <div className="pdc-settings-actions">
                                <button
                                  type="button"
                                  className="pdc-btn-save-settings"
                                  onClick={() => handleGuardarHorarios(idCancha)}
                                  disabled={guardandoHorariosId === idCancha}
                                >
                                  {guardandoHorariosId === idCancha ? 'Guardando...' : 'Guardar horarios'}
                                </button>
                              </div>
                            </div>
                          )}

                          {editandoBloqueos && (
                            <div className="pdc-court-block-editor">
                              <div className="pdc-block-editor-header">
                                <div>
                                  <span className="pdc-block-editor-kicker">
                                    EXCEPCIÓN DE DISPONIBILIDAD
                                  </span>
                                  <h4>Bloquear turnos</h4>
                                  <p>
                                    Cerrá temporalmente esta cancha por un torneo,
                                    mantenimiento, evento u otro motivo.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="pdc-block-editor-close"
                                  onClick={() => setCanchaBloqueosId(null)}
                                  aria-label="Cerrar gestión de bloqueos"
                                >
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </div>

                              <form
                                className="pdc-block-form"
                                onSubmit={(e) => handleCrearBloqueo(e, idCancha)}
                              >
                                <div className="pdc-block-form-grid">
                                  <div className="pdc-form-group">
                                    <label htmlFor={`bloqueo-fecha-${idCancha}`}>
                                      Fecha:
                                    </label>
                                    <input
                                      id={`bloqueo-fecha-${idCancha}`}
                                      type="date"
                                      min={fechaMinimaBloqueo}
                                      value={bloqueoForm.fecha}
                                      onChange={(e) =>
                                        setBloqueoForm((prev) => ({
                                          ...prev,
                                          fecha: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>

                                  <div className="pdc-form-group">
                                    <label htmlFor={`bloqueo-desde-${idCancha}`}>
                                      Desde:
                                    </label>
                                    <input
                                      id={`bloqueo-desde-${idCancha}`}
                                      type="time"
                                      value={bloqueoForm.hora_inicio}
                                      onChange={(e) =>
                                        setBloqueoForm((prev) => ({
                                          ...prev,
                                          hora_inicio: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>

                                  <div className="pdc-form-group">
                                    <label htmlFor={`bloqueo-hasta-${idCancha}`}>
                                      Hasta:
                                    </label>
                                    <input
                                      id={`bloqueo-hasta-${idCancha}`}
                                      type="time"
                                      value={bloqueoForm.hora_fin}
                                      onChange={(e) =>
                                        setBloqueoForm((prev) => ({
                                          ...prev,
                                          hora_fin: e.target.value,
                                        }))
                                      }
                                      required
                                    />
                                  </div>

                                  <div className="pdc-form-group">
                                    <label htmlFor={`bloqueo-tipo-${idCancha}`}>
                                      Tipo:
                                    </label>
                                    <select
                                      id={`bloqueo-tipo-${idCancha}`}
                                      value={bloqueoForm.tipo}
                                      onChange={(e) =>
                                        setBloqueoForm((prev) => ({
                                          ...prev,
                                          tipo: e.target.value,
                                        }))
                                      }
                                      required
                                    >
                                      <option value="torneo">Torneo</option>
                                      <option value="mantenimiento">
                                        Mantenimiento
                                      </option>
                                      <option value="evento">Evento</option>
                                      <option value="cierre">Cierre</option>
                                      <option value="otro">Otro</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="pdc-form-group">
                                  <label htmlFor={`bloqueo-motivo-${idCancha}`}>
                                    Motivo o detalle:
                                  </label>
                                  <input
                                    id={`bloqueo-motivo-${idCancha}`}
                                    type="text"
                                    maxLength={255}
                                    placeholder="Ej: Torneo interno del club"
                                    value={bloqueoForm.motivo}
                                    onChange={(e) =>
                                      setBloqueoForm((prev) => ({
                                        ...prev,
                                        motivo: e.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                <div className="pdc-block-form-actions">
                                  <button
                                    type="submit"
                                    className="pdc-btn-create-block"
                                    disabled={guardandoBloqueoId === idCancha}
                                  >
                                    <i className="bi bi-lock"></i>
                                    {guardandoBloqueoId === idCancha
                                      ? 'Bloqueando...'
                                      : 'Bloquear horario'}
                                  </button>

                                  <button
                                    type="button"
                                    className="pdc-btn-cancel"
                                    onClick={limpiarFormularioBloqueo}
                                    disabled={guardandoBloqueoId === idCancha}
                                  >
                                    Limpiar
                                  </button>
                                </div>
                              </form>

                              <div className="pdc-blocks-list-section">
                                <div className="pdc-blocks-list-header">
                                  <h5>Bloqueos programados</h5>

                                  <button
                                    type="button"
                                    className="pdc-btn-refresh-blocks"
                                    onClick={() => cargarBloqueosCancha(idCancha)}
                                    disabled={cargandoBloqueosId === idCancha}
                                  >
                                    <i className="bi bi-arrow-clockwise"></i>
                                    {cargandoBloqueosId === idCancha
                                      ? 'Actualizando...'
                                      : 'Actualizar'}
                                  </button>
                                </div>

                                {cargandoBloqueosId === idCancha ? (
                                  <p className="pdc-blocks-message">
                                    Cargando bloqueos...
                                  </p>
                                ) : bloqueosActuales.length === 0 ? (
                                  <p className="pdc-blocks-message">
                                    Esta cancha no tiene bloqueos programados.
                                  </p>
                                ) : (
                                  <div className="pdc-blocks-list">
                                    {bloqueosActuales.map((bloqueo) => (
                                      <article
                                        className="pdc-block-item"
                                        key={bloqueo.id_bloqueo}
                                      >
                                        <div className="pdc-block-item-icon">
                                          <i className="bi bi-calendar-x"></i>
                                        </div>

                                        <div className="pdc-block-item-info">
                                          <div className="pdc-block-item-context">
                                            <i className="bi bi-geo-alt"></i>
                                            <strong>
                                              {cancha.nombre_cancha || 'Cancha'}
                                            </strong>
                                            <span aria-hidden="true">·</span>
                                            <span>{cancha.deporte || 'Deporte'}</span>
                                          </div>

                                          <div className="pdc-block-item-main">
                                            <strong>
                                              {formatearFechaBloqueo(
                                                bloqueo.fecha
                                              )}
                                            </strong>
                                            <span>
                                              {String(
                                                bloqueo.hora_inicio
                                              ).slice(0, 5)}{' '}
                                              a{' '}
                                              {String(bloqueo.hora_fin).slice(
                                                0,
                                                5
                                              )}{' '}
                                              hs
                                            </span>
                                          </div>

                                          <div className="pdc-block-item-detail">
                                            <span className="pdc-block-type">
                                              {bloqueo.tipo || 'otro'}
                                            </span>
                                            <p>
                                              {bloqueo.motivo ||
                                                'Sin detalle adicional'}
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          className="pdc-btn-release-block"
                                          onClick={() =>
                                            handleLiberarBloqueo(
                                              bloqueo,
                                              idCancha
                                            )
                                          }
                                          disabled={
                                            eliminandoBloqueoId ===
                                            bloqueo.id_bloqueo
                                          }
                                        >
                                          <i className="bi bi-unlock"></i>
                                          {eliminandoBloqueoId ===
                                          bloqueo.id_bloqueo
                                            ? 'Liberando...'
                                            : 'Liberar'}
                                        </button>
                                      </article>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {!showSettings && (
          <>
            {/* CARDS SUPERIORES CON ESTADÍSTICAS */}
            <section className="pdc-stats-grid">
          <div className="pdc-stat-card">
            <div className="pdc-stat-icon pdc-green">
              <i className="bi bi-bounding-box"></i>
            </div>

            <div>
              <p>Canchas totales</p>
              <h3>{canchasProcesadas.length}</h3>
              <span>{canchasProcesadas.length} activas</span>
            </div>
          </div>

          <div className="pdc-stat-card">
            <div className="pdc-stat-icon pdc-blue">
              <i className="bi bi-calendar-check"></i>
            </div>

            <div>
              <p>Reservas hoy</p>
              <h3>{reservasDeHoy.length}</h3>
              <span>
                {reservasDeHoy[0]
                  ? `Próxima: ${reservasDeHoy[0].hora}`
                  : 'Sin reservas hoy'}
              </span>
            </div>
          </div>

          <div className="pdc-stat-card">
            <div className="pdc-stat-icon pdc-orange">
              <i className="bi bi-people"></i>
            </div>

            <div>
              <p>Reservas totales</p>
              <h3>{reservasActivasDelClub.length}</h3>
              <span>Total programadas</span>
            </div>
          </div>

          <div className="pdc-stat-card">
            <div className="pdc-stat-icon pdc-purple">
              <i className="bi bi-currency-dollar"></i>
            </div>

            <div>
              <p>Ingresos del día</p>
              <h3>{formatMoney(ingresosHoy)}</h3>
              <span className="pdc-positive">Hoy</span>
            </div>
          </div>

          <div className="pdc-stat-card">
            <div className="pdc-stat-icon pdc-purple">
              <i className="bi bi-cash-stack"></i>
            </div>

            <div>
              <p>Ingresos del mes</p>
              <h3>{formatMoney(ingresosMes)}</h3>
              <span className="pdc-positive">Mes actual</span>
            </div>
          </div>
        </section>

        {/* GRILLA PRINCIPAL: CANCHAS + PRÓXIMAS RESERVAS */}
        <section className="pdc-main-grid">
          <div className="pdc-panel">
            <div className="pdc-panel-header">
              <h3>Canchas de tu club</h3>
            </div>

            {canchasProcesadas.length === 0 ? (
              <p className="pdc-alert pdc-alert-info">No hay canchas cargadas.</p>
            ) : (
              canchasProcesadas.map((cancha) => (
                <div className="pdc-court-row" key={cancha.id_cancha}>
                  <img
                    src={cancha.img}
                    alt={cancha.nombre_cancha}
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500';
                    }}
                  />

                  <div className="pdc-court-info">
                    <h4>{cancha.nombre_cancha}</h4>
                    <p>{cancha.deporte}</p>
                    {(cancha.tipo_suelo || cancha.descripcion_cancha) && (
                      <small>
                        {[cancha.tipo_suelo, cancha.descripcion_cancha]
                          .map((texto) => String(texto || '').trim())
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                    )}
                    <span>Activa</span>
                  </div>

                  {/* Precio por hora con botón de edición */}
                  <div className="pdc-court-reservas">
                    <p>Precio por hora</p>

                    {editingCanchaId === cancha.id_cancha ? (
                      <div className="pdc-price-editor">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingPrice}
                          onChange={handleEditingPriceChange}
                          className="pdc-price-input"
                          autoFocus
                          placeholder="Ej: 40.000"
                        />

                        <button
                          onClick={() => handleUpdatePrice(cancha.id_cancha)}
                          className="pdc-btn-save-mini"
                          title="Guardar"
                        >
                          <i className="bi bi-check"></i>
                        </button>

                        <button
                          onClick={() => {
                            setEditingCanchaId(null);
                            setEditingPrice('');
                          }}
                          className="pdc-btn-cancel-mini"
                          title="Cancelar"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="pdc-price-display">
                        <strong>{formatMoney(cancha.precio_por_hora)}</strong>

                        <button
                          onClick={() => {
                            setEditingCanchaId(cancha.id_cancha);
                            setEditingPrice(formatPrice(normalizarImporteDesdeBackend(cancha.precio_por_hora || 0)));
                          }}
                          className="pdc-btn-edit-mini"
                          title="Editar precio"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reservas de hoy de cada cancha */}
                  <div className="pdc-court-reservas">
                    <p>Reservas hoy</p>
                    <strong>{cancha.reservasHoy}</strong>
                    <small>Próxima: {cancha.proxima}</small>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Panel de próximas reservas */}
          <div className="pdc-panel">
            <div className="pdc-panel-header">
              <h3>Próximas reservas</h3>

              <button
                className="pdc-light-button"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                {showCalendar ? 'Ocultar calendario' : 'Ver calendario'}
                <i className="bi bi-calendar-event"></i>
              </button>
            </div>

            {reservasProximas.length === 0 ? (
              <p className="pdc-alert pdc-alert-info">No hay próximas reservas.</p>
            ) : (
              reservasProximas.map((reserva, index) => (
                <div className="pdc-reservation-row" key={reserva.id || index}>
                  <span>{reserva.hora}</span>

                  <div className="pdc-reservation-info">
                    <strong>{reserva.deporte}</strong>
                    <p>{formatearFecha(reserva.fecha)} · {reserva.cancha}</p>

                    <div className="pdc-reservation-client">
                      <span>
                        <i className="bi bi-person-fill"></i>
                        {reserva.cliente_nombre || 'Usuario'}
                      </span>

                      {reserva.cliente_telefono && (
                        <a href={`tel:${reserva.cliente_telefono}`}>
                          <i className="bi bi-telephone-fill"></i>
                          {reserva.cliente_telefono}
                        </a>
                      )}

                      {obtenerCancelacionesUsuario(reserva) > 0 && (
                        <small
                          className={`pdc-cancellation-count ${
                            obtenerCancelacionesUsuario(reserva) >= 2 ? 'is-warning' : ''
                          }`}
                          title="Cancelaciones registradas por este usuario en tu club"
                        >
                          {obtenerCancelacionesUsuario(reserva)} {
                            obtenerCancelacionesUsuario(reserva) === 1
                              ? 'cancelación previa'
                              : 'cancelaciones previas'
                          }
                        </small>
                      )}
                    </div>
                  </div>

                  <small className="pdc-confirmed">
                    {reserva.estado || 'Confirmada'}
                  </small>
                </div>
              ))
            )}

            {/* Calendario simple desplegable */}
            {showCalendar && (
              <div className="pdc-calendar-preview">
                <h4>Calendario de reservas</h4>

                {reservasProximas.length === 0 ? (
                  <p>No hay reservas cargadas en el calendario.</p>
                ) : (
                  reservasProximas.map((reserva, index) => (
                    <div className="pdc-calendar-preview-item" key={reserva.id || index}>
                      <div>
                        <strong>{formatearFecha(reserva.fecha)}</strong>
                        <span>{reserva.hora}</span>
                      </div>

                      <div className="pdc-calendar-reservation-detail">
                        <p>{reserva.deporte}</p>
                        <small>{reserva.cliente_nombre || 'Usuario'}</small>
                        {reserva.cliente_telefono && (
                          <a href={`tel:${reserva.cliente_telefono}`}>{reserva.cliente_telefono}</a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* GRILLA INFERIOR: TORNEOS + LOGO */}
        <section className="pdc-bottom-grid">
          <div className="pdc-panel pdc-tournaments-panel">
            <div className="pdc-tournaments-header">
              <div>
                <span className="pdc-tournaments-kicker">GESTIÓN DEL CLUB</span>
                <h3>Torneos</h3>
                <p>
                  Creá la publicación, cargá el flyer y administrá su estado
                  sin salir del panel.
                </p>
              </div>

              <button
                type="button"
                className="pdc-create-tournament-button"
                onClick={
                  showTournamentForm
                    ? cerrarFormularioTorneo
                    : abrirFormularioNuevoTorneo
                }
              >
                <i
                  className={
                    showTournamentForm
                      ? 'bi bi-x-circle'
                      : 'bi bi-plus-circle'
                  }
                ></i>
                {showTournamentForm ? 'Cerrar formulario' : 'Crear torneo'}
              </button>
            </div>

            {showTournamentForm && (
              <form
                className="pdc-tournament-form"
                onSubmit={handleSubmitTorneo}
              >
                <div className="pdc-tournament-form-heading">
                  <div>
                    <span>
                      {torneoEditandoId ? 'EDITANDO PUBLICACIÓN' : 'NUEVO TORNEO'}
                    </span>
                    <h4>
                      {torneoEditandoId
                        ? 'Actualizá los datos del torneo'
                        : 'Completá la información del torneo'}
                    </h4>
                  </div>

                  {torneoEditandoId && (
                    <button
                      type="button"
                      className="pdc-tournament-form-reset"
                      onClick={abrirFormularioNuevoTorneo}
                    >
                      <i className="bi bi-plus-lg"></i>
                      Crear otro
                    </button>
                  )}
                </div>

                <div className="pdc-tournament-form-grid">
                  <label className="pdc-tournament-field pdc-tournament-field--wide">
                    <span>Título *</span>
                    <input
                      type="text"
                      minLength={3}
                      maxLength={180}
                      placeholder="Ej: Copa de Verano Fútbol 7"
                      value={torneoForm.titulo}
                      onChange={(e) =>
                        setTorneoForm((prev) => ({
                          ...prev,
                          titulo: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label className="pdc-tournament-field">
                    <span>Deporte *</span>
                    <select
                      value={torneoForm.id_deporte}
                      onChange={(e) =>
                        setTorneoForm((prev) => ({
                          ...prev,
                          id_deporte: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Seleccionar deporte</option>
                      {deportesDisponibles.map((deporte) => (
                        <option
                          key={deporte.id_deporte}
                          value={deporte.id_deporte}
                        >
                          {deporte.nombre_deporte}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="pdc-tournament-field">
                    <span>Contacto</span>
                    <input
                      type="text"
                      maxLength={180}
                      placeholder="Teléfono, WhatsApp o email"
                      value={torneoForm.contacto}
                      onChange={(e) =>
                        setTorneoForm((prev) => ({
                          ...prev,
                          contacto: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="pdc-tournament-field">
                    <span>Fecha de inicio *</span>
                    <input
                      type="date"
                      min={fechaMinimaBloqueo}
                      value={torneoForm.fecha_inicio}
                      onChange={(e) =>
                        setTorneoForm((prev) => ({
                          ...prev,
                          fecha_inicio: e.target.value,
                          fecha_fin:
                            prev.fecha_fin &&
                            prev.fecha_fin < e.target.value
                              ? e.target.value
                              : prev.fecha_fin,
                        }))
                      }
                      required
                    />
                  </label>

                  <label className="pdc-tournament-field">
                    <span>Fecha de finalización *</span>
                    <input
                      type="date"
                      min={torneoForm.fecha_inicio || fechaMinimaBloqueo}
                      value={torneoForm.fecha_fin}
                      onChange={(e) =>
                        setTorneoForm((prev) => ({
                          ...prev,
                          fecha_fin: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label className="pdc-tournament-field pdc-tournament-field--wide">
                    <span>Descripción *</span>
                    <textarea
                      minLength={10}
                      rows={5}
                      placeholder="Contá cómo se juega, categorías, premios, inscripción y toda la información importante."
                      value={torneoForm.descripcion}
                      onChange={(e) =>
                        setTorneoForm((prev) => ({
                          ...prev,
                          descripcion: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <div className="pdc-tournament-field pdc-tournament-field--wide">
                    <span>Flyer {torneoEditandoId ? '(opcional al editar)' : '*'}</span>

                    <div className="pdc-tournament-flyer-control">
                      <input
                        ref={flyerInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFlyerTorneoChange}
                        className="pdc-tournament-file-input"
                      />

                      <button
                        type="button"
                        className="pdc-tournament-file-button"
                        onClick={() => flyerInputRef.current?.click()}
                      >
                        <i className="bi bi-image"></i>
                        {flyerTorneo
                          ? 'Cambiar flyer'
                          : torneoEditandoId
                            ? 'Reemplazar flyer'
                            : 'Seleccionar flyer'}
                      </button>

                      <small>JPG, PNG o WEBP. Máximo 5 MB.</small>
                    </div>

                    {flyerPreview && (
                      <div className="pdc-tournament-flyer-preview">
                        <img
                          src={flyerPreview}
                          alt="Vista previa del flyer del torneo"
                        />
                        <div>
                          <strong>
                            {flyerTorneo?.name || 'Flyer actual del torneo'}
                          </strong>
                          <span>
                            {flyerTorneo
                              ? 'La imagen nueva se subirá al guardar.'
                              : 'Podés conservar este flyer o reemplazarlo.'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pdc-tournament-form-actions">
                  <button
                    type="button"
                    className="pdc-tournament-secondary-button"
                    onClick={cerrarFormularioTorneo}
                    disabled={guardandoTorneo}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="pdc-tournament-draft-button"
                    onClick={() => guardarTorneo('borrador')}
                    disabled={guardandoTorneo}
                  >
                    <i className="bi bi-file-earmark"></i>
                    {guardandoTorneo ? 'Guardando...' : 'Guardar borrador'}
                  </button>

                  <button
                    type="button"
                    className="pdc-tournament-publish-button"
                    onClick={() => guardarTorneo('publicado')}
                    disabled={guardandoTorneo}
                  >
                    <i className="bi bi-megaphone"></i>
                    {guardandoTorneo ? 'Guardando...' : 'Publicar torneo'}
                  </button>
                </div>
              </form>
            )}

            <div className="pdc-tournaments-list-heading">
              <div>
                <strong>Torneos del club</strong>
                <span>{torneos.length} publicación{torneos.length === 1 ? '' : 'es'}</span>
              </div>

              <button
                type="button"
                className="pdc-tournaments-refresh"
                onClick={cargarTorneosClub}
                disabled={cargandoTorneos}
                title="Actualizar torneos"
              >
                <i className={`bi bi-arrow-clockwise ${cargandoTorneos ? 'is-spinning' : ''}`}></i>
              </button>
            </div>

            {cargandoTorneos ? (
              <div className="pdc-tournaments-loading">
                <span className="pdc-tournaments-spinner"></span>
                Cargando torneos...
              </div>
            ) : torneos.length === 0 ? (
              <div className="pdc-tournaments-empty">
                <div className="pdc-tournaments-empty-icon" aria-hidden="true">
                  <i className="bi bi-trophy"></i>
                </div>

                <div>
                  <strong>Todavía no hay torneos creados</strong>
                  <p>
                    Creá el primero y decidí si querés guardarlo como borrador
                    o publicarlo inmediatamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pdc-tournaments-list">
                {torneos.map((torneo) => {
                  const actualizando =
                    actualizandoEstadoTorneoId === torneo.id_torneo;
                  const estado = torneo.estado || 'borrador';

                  return (
                    <article
                      className="pdc-tournament-card"
                      key={torneo.id_torneo}
                    >
                      <div className="pdc-tournament-card-flyer">
                        {torneo.flyer_url ? (
                          <img
                            src={construirUrlFlyer(torneo.flyer_url)}
                            alt={`Flyer de ${torneo.titulo}`}
                          />
                        ) : (
                          <i className="bi bi-image"></i>
                        )}
                      </div>

                      <div className="pdc-tournament-card-content">
                        <div className="pdc-tournament-card-title-row">
                          <div>
                            <span>{obtenerNombreDeporteTorneo(torneo)}</span>
                            <h4>{torneo.titulo}</h4>
                          </div>

                          <span
                            className={`pdc-tournament-status pdc-tournament-status--${estado}`}
                          >
                            {estado}
                          </span>
                        </div>

                        <p className="pdc-tournament-card-dates">
                          <i className="bi bi-calendar-event"></i>
                          {formatearFechaBloqueo(torneo.fecha_inicio)}
                          {' · '}
                          {formatearFechaBloqueo(torneo.fecha_fin)}
                        </p>

                        {torneo.contacto && (
                          <p className="pdc-tournament-card-contact">
                            <i className="bi bi-whatsapp"></i>
                            {torneo.contacto}
                          </p>
                        )}

                        <p className="pdc-tournament-card-description">
                          {torneo.descripcion}
                        </p>

                        <div className="pdc-tournament-card-actions">
                          {estado !== 'cancelado' && (
                            <button
                              type="button"
                              className="pdc-tournament-action pdc-tournament-action--edit"
                              onClick={() => iniciarEdicionTorneo(torneo)}
                              disabled={actualizando}
                              title="Editar torneo"
                            >
                              <i className="bi bi-pencil"></i>
                              Editar
                            </button>
                          )}

                          {estado === 'borrador' && (
                            <button
                              type="button"
                              className="pdc-tournament-action pdc-tournament-action--publish"
                              onClick={() =>
                                cambiarEstadoTorneo(torneo, 'publicado')
                              }
                              disabled={actualizando}
                            >
                              <i className="bi bi-megaphone"></i>
                              Publicar
                            </button>
                          )}

                          {estado === 'publicado' && (
                            <button
                              type="button"
                              className="pdc-tournament-action pdc-tournament-action--finish"
                              onClick={() =>
                                cambiarEstadoTorneo(torneo, 'finalizado')
                              }
                              disabled={actualizando}
                            >
                              <i className="bi bi-flag"></i>
                              Finalizar
                            </button>
                          )}

                          {estado === 'finalizado' && (
                            <button
                              type="button"
                              className="pdc-tournament-action pdc-tournament-action--draft"
                              onClick={() =>
                                cambiarEstadoTorneo(torneo, 'borrador')
                              }
                              disabled={actualizando}
                            >
                              <i className="bi bi-arrow-counterclockwise"></i>
                              Reabrir
                            </button>
                          )}

                          {estado !== 'cancelado' && (
                            <button
                              type="button"
                              className="pdc-tournament-action pdc-tournament-action--cancel"
                              onClick={() => cancelarTorneo(torneo)}
                              disabled={actualizando}
                            >
                              <i className="bi bi-x-octagon"></i>
                              Cancelar
                            </button>
                          )}

                          <button
                            type="button"
                            className="pdc-tournament-action pdc-tournament-action--cancel"
                            onClick={() => eliminarTorneo(torneo)}
                            disabled={actualizando}
                            title="Eliminar torneo definitivamente"
                          >
                            <i className="bi bi-trash3"></i>
                            Eliminar
                          </button>

                          {actualizando && (
                            <span className="pdc-tournament-updating">
                              Actualizando...
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pdc-panel pdc-club-logo-panel">
            <h3>Logo del club</h3>

            <div className="pdc-club-logo-content">
              {logoClubUrl ? (
                <img
                  src={logoClubUrl}
                  alt={`Logo de ${nombreClub}`}
                  className="pdc-club-logo-img"
                />
              ) : (
                <div className="pdc-club-logo-initials">
                  {inicialesClub || 'CY'}
                </div>
              )}
            </div>
          </div>
            </section>
          </>
        )}

        {mostrarModalSuscripcion && (
          <div className="pdc-progress-modal-backdrop" onClick={cerrarModalSuscripcion}>
            <div className="pdc-progress-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="pdc-progress-modal-close"
                onClick={cerrarModalSuscripcion}
                aria-label="Cerrar modal"
              >
                ×
              </button>

              <h2>Funcionalidad en progreso</h2>

              <p>
                Estamos trabajando para que próximamente puedas gestionar y pagar
                tu suscripción desde el panel del club.
              </p>

              <img
                src={funcionalidadEnProgreso}
                alt="Funcionalidad en progreso"
                className="pdc-progress-modal-img"
              />

              <button
                type="button"
                className="pdc-progress-modal-button"
                onClick={cerrarModalSuscripcion}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {showWelcomeModal && (
          <div
            className="pdc-welcome-modal-backdrop"
            onClick={cerrarWelcomeModal}
          >
            <div
              className="pdc-welcome-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="pdc-welcome-modal-close"
                onClick={cerrarWelcomeModal}
                aria-label="Cerrar bienvenida"
              >
                ×
              </button>

              <span className="pdc-welcome-modal-kicker">
                Bienvenido a DameCancha!
              </span>

              <h2>¡Gracias por sumarte, {nombreDueno}!</h2>

              <p>
                Nos alegra que tu club forme parte de DameCancha. Desde este panel
                vas a poder gestionar tus canchas, revisar reservas y controlar
                tus ingresos diarios y mensuales, como asi también agregar un logo
                si no lo hiciste al momento de completar el formulario.
              </p>

              <div className="pdc-welcome-modal-box">
                <h3>Primer paso recomendado</h3>

                <p>
                  Te sugerimos asignarle un <strong>precio por hora</strong> a los
                  turnos de cada cancha o deporte. Esto es importante para que el
                  sistema pueda calcular correctamente tus ingresos del día y del mes.
                </p>

                <p>
                  Si una cancha queda en <strong>$0</strong>, las reservas asociadas
                  no van a reflejar ingresos reales en el dashboard.
                </p>
              </div>

              <div className="pdc-welcome-modal-actions">
                <button
                  type="button"
                  className="pdc-welcome-modal-primary"
                  onClick={irAConfiguracionDesdeWelcome}
                >
                  Configurar mis canchas
                </button>

                <button
                  type="button"
                  className="pdc-welcome-modal-secondary"
                  onClick={cerrarWelcomeModal}
                >
                  Lo haré después
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelDelClub;
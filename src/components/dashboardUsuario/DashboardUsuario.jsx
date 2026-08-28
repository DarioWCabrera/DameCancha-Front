import { API_URL, apiUrl, mediaUrl } from '../../config/api';
import { CONTACT } from '../../config/contact';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './DashboardUsuario.css';
import ClubUbicacionMapa, { construirUbicacionCompleta } from './ClubUbicacionMapa';
import BancoSuplentesCard from '../bancoSuplentes/BancoSuplentesCard';
// import { useAuth } from '../../hooks/useAuth';

import logoDameCancha from '../../assets/logo_blanco_720.png';

import futbol5Icon from '../imagenes/futbol5.png';
import futbol7Icon from '../imagenes/futbol7.png';
import basquetIcon from '../imagenes/basquet.png';
import padelIcon from '../imagenes/padel.png';
import voleyIcon from '../imagenes/voley.png';
import tenisIcon from '../imagenes/tennis.png';
import natacionIcon from '../imagenes/natacion.png';
import golfIcon from '../imagenes/golf.png';
import futbol11Icon from '../imagenes/futbol11.png';
import pelotaPaletaIcon from '../imagenes/PelotaPaleta.png';

/*
  Imágenes de banners publicitarios.
  Estos banners se muestran solo dentro del DashboardUsuario.
  
*/
import bannerImg1 from '../bannerVertical/banners/img1.webp';
import bannerImg2 from '../bannerVertical/banners/img2.webp';
import bannerImg3 from '../bannerVertical/banners/img3.webp';
import bannerImg4 from '../bannerVertical/banners/img4.webp';
import bannerImg5 from '../bannerVertical/banners/img5.webp';
import bannerImg6 from '../bannerVertical/banners/img6.webp';

/*
  Lista temporal de deportes.
  Más adelante debería venir desde el backend con un GET /deportes.
*/
const DEPORTES = [
  { id: 1, nombre: 'Fútbol 5', icono: futbol5Icon },
  { id: 2, nombre: 'Fútbol 7', icono: futbol7Icon },
  { id: 3, nombre: 'Básquet', icono: basquetIcon },
  { id: 4, nombre: 'Tenis', icono: tenisIcon },
  { id: 5, nombre: 'Vóley', icono: voleyIcon },
  { id: 6, nombre: 'Pádel', icono: padelIcon },
  { id: 7, nombre: 'Natación', icono: natacionIcon },
  { id: 8, nombre: 'Golf', icono: golfIcon },
  { id: 9, nombre: 'Fútbol 11', icono: futbol11Icon },
  { id: 10, nombre: 'Pelota Paleta', icono: pelotaPaletaIcon },
];

const NOMBRES_DIAS_TURNO_FIJO = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/*
  Banners disponibles para mostrar en los laterales del dashboard.
  Se alternan de forma aleatoria para que no siempre aparezca la misma publicidad.
*/
const BANNERS_PUBLICITARIOS = [
  bannerImg1,
  bannerImg2,
  bannerImg3,
  bannerImg4,
  bannerImg5,
  bannerImg6,
];

/*
  Devuelve un banner aleatorio de la lista.
  Si por alguna razón no hay imágenes cargadas, devuelve null.
*/
const obtenerBannerAleatorio = () => {
  if (!BANNERS_PUBLICITARIOS.length) return null;

  const indiceAleatorio = Math.floor(Math.random() * BANNERS_PUBLICITARIOS.length);

  return BANNERS_PUBLICITARIOS[indiceAleatorio];
};


/*
  Horarios temporales.
  Más adelante deberían venir desde el backend según:
  deporte + club + cancha + fecha.
*/
const HORARIOS = [
  { hora: '09:00', disponible: true },
  { hora: '10:00', disponible: true },
  { hora: '11:00', disponible: true },
  { hora: '12:00', disponible: true },
  { hora: '13:00', disponible: true },
  { hora: '14:00', disponible: true },
  { hora: '15:00', disponible: true },
  { hora: '16:00', disponible: true },
  { hora: '17:00', disponible: true },
  { hora: '18:00', disponible: true },
  { hora: '19:00', disponible: true },
  { hora: '20:00', disponible: true },
  { hora: '21:00', disponible: true },
  { hora: '22:00', disponible: true },
];

/*
  Devuelve una fecha en formato dd/mm/yyyy.
  Es el formato visual que usamos en el dashboard del usuario.
*/
const formatearFecha = (fecha) => {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
};

/*
  Convierte una fecha en formato dd/mm/yyyy a Date.
  Se usa para comparar fechas, ordenar reservas y bloquear días pasados.
*/
const crearFechaDesdeTexto = (fechaTexto) => {
  if (!fechaTexto) return null;

  // Soporte para formato DD/MM/YYYY (frontend) y YYYY-MM-DD (backend/ISO)
  let dia, mes, anio;

  if (fechaTexto.includes('-')) {
    // Formato YYYY-MM-DD (posiblemente con tiempo T00:00...)
    const partes = fechaTexto.split('T')[0].split('-');
    anio = Number(partes[0]);
    mes = Number(partes[1]);
    dia = Number(partes[2]);
  } else if (fechaTexto.includes('/')) {
    // Formato DD/MM/YYYY
    const partes = fechaTexto.split('/');
    dia = Number(partes[0]);
    mes = Number(partes[1]);
    anio = Number(partes[2]);
  }

  if (!dia || !mes || !anio) return null;

  return new Date(anio, mes - 1, dia);
};

/*
  Normaliza una fecha a YYYY-MM-DD para poder comparar de forma segura
  el formato visual del frontend (DD/MM/YYYY) con el formato del backend.
*/
const normalizarFechaParaComparar = (fechaValor) => {
  if (!fechaValor) return '';

  const fecha =
    fechaValor instanceof Date
      ? fechaValor
      : crearFechaDesdeTexto(String(fechaValor).trim());

  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return '';

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

/*
  Normaliza horarios como 09:00, 09:00:00 o 9:00 al formato HH:mm.
*/
const normalizarHoraParaComparar = (horaValor) => {
  if (horaValor === null || horaValor === undefined) return '';

  const [horaTexto, minutosTexto = '0'] = String(horaValor).trim().split(':');
  const hora = Number(horaTexto);
  const minutos = Number(minutosTexto);

  if (Number.isNaN(hora) || Number.isNaN(minutos)) return '';

  return `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

/*
  Convierte una hora HH:mm o HH:mm:ss a minutos desde las 00:00.
  Permite comparar correctamente rangos completos de reservas y bloqueos.
*/
const convertirHoraAMinutos = (horaValor) => {
  const horaNormalizada = normalizarHoraParaComparar(horaValor);

  if (!horaNormalizada) return null;

  const [hora, minutos] = horaNormalizada.split(':').map(Number);

  if (Number.isNaN(hora) || Number.isNaN(minutos)) return null;

  return hora * 60 + minutos;
};

/*
  Convierte una fecha y una hora en un objeto Date completo.
  Se usa para ordenar reservas y detectar horarios vencidos.
*/
const crearFechaHoraDesdeReserva = (fechaTexto, horaTexto) => {
  const fecha = crearFechaDesdeTexto(fechaTexto);

  if (!fecha || !horaTexto) return null;

  const [hora, minutos] = horaTexto.split(':').map(Number);

  if (Number.isNaN(hora)) return null;

  fecha.setHours(hora, minutos || 0, 0, 0);

  return fecha;
};

/*
  Cantidad mínima de horas necesarias para poder gestionar una reserva.
  Si faltan menos de 2 horas para el turno, no se permite modificar ni cancelar.
*/
const HORAS_MINIMAS_PARA_GESTIONAR = 2;

/*
  Indica si una reserva todavía puede modificarse o eliminarse.
  La regla funcional es: se puede gestionar si faltan al menos 2 horas.
*/
const puedeGestionarPorAnticipacion = (fechaHoraDate) => {
  if (!(fechaHoraDate instanceof Date) || Number.isNaN(fechaHoraDate.getTime())) {
    return false;
  }

  const ahora = new Date();
  const diferenciaEnMs = fechaHoraDate.getTime() - ahora.getTime();
  const horasRestantes = diferenciaEnMs / (1000 * 60 * 60);

  return horasRestantes >= HORAS_MINIMAS_PARA_GESTIONAR;
};

/*
  Genera todos los días seleccionables del mes visible.
  - Si el mes visible es el mes actual, arranca desde hoy.
  - Si el mes visible es futuro, muestra el mes completo.
  - Nunca muestra días anteriores al día actual.
*/
const generarDiasDisponibles = (mesVisible) => {
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const base = mesVisible instanceof Date ? mesVisible : hoy;
  const primerDiaDelMes = new Date(base.getFullYear(), base.getMonth(), 1);
  const ultimoDiaDelMes = new Date(base.getFullYear(), base.getMonth() + 1, 0);

  const esMesActual =
    primerDiaDelMes.getMonth() === hoy.getMonth() &&
    primerDiaDelMes.getFullYear() === hoy.getFullYear();

  const diaInicio = esMesActual ? hoy.getDate() : 1;
  const cantidadDias = ultimoDiaDelMes.getDate() - diaInicio + 1;

  return Array.from({ length: cantidadDias }, (_, index) => {
    const fecha = new Date(base.getFullYear(), base.getMonth(), diaInicio + index);
    fecha.setHours(0, 0, 0, 0);

    return {
      dia: nombresDias[fecha.getDay()],
      numero: String(fecha.getDate()),
      fecha: formatearFecha(fecha),
      fechaDate: fecha,
    };
  });
};

/*
  Devuelve el nombre del mes en español.
  Se usa como título del selector de fechas.
*/
const obtenerTituloMes = (fechaBase) => {
  if (!(fechaBase instanceof Date) || Number.isNaN(fechaBase.getTime())) return '';

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  return `${meses[fechaBase.getMonth()]} ${fechaBase.getFullYear()}`;
};

/*
  Devuelve el mes abreviado en español.
  Se usa en las cards de reservas del panel derecho.
*/
const obtenerMesCorto = (fecha) => {
  const meses = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
  ];

  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return 'MES';

  return meses[fecha.getMonth()];
};

/*
  Devuelve el día de la semana abreviado.
  Se usa en la columna izquierda de cada reserva.
*/
const obtenerDiaSemanaCorto = (fecha) => {
  const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return 'RES';

  return dias[fecha.getDay()];
};

/*
  Indica si una fecha ya pasó.
  Compara solo día, mes y año, sin considerar la hora.
*/
const esFechaPasada = (fechaTexto) => {
  const fecha = crearFechaDesdeTexto(fechaTexto);

  if (!fecha) return true;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  fecha.setHours(0, 0, 0, 0);

  return fecha < hoy;
};

/*
  Indica si una fecha corresponde al día actual.
*/
const esFechaDeHoy = (fechaTexto) => {
  const fecha = crearFechaDesdeTexto(fechaTexto);

  if (!fecha) return false;

  const hoy = new Date();

  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
};

/*
  Indica si un horario ya pasó para la fecha seleccionada.
  Solo bloquea horarios pasados cuando la fecha elegida es hoy.
*/
const esHorarioPasado = (fechaTexto, horaTexto) => {
  if (!fechaTexto || !horaTexto) return false;

  if (!esFechaDeHoy(fechaTexto)) return false;

  const [hora, minutos] = horaTexto.split(':').map(Number);
  const ahora = new Date();

  const horario = new Date();
  horario.setHours(hora, minutos || 0, 0, 0);

  return horario <= ahora;
};

/*
  Busca un club por nombre dentro de una lista de clubes.
  Se usa para recuperar dirección y datos auxiliares del club.
*/
const buscarClubPorNombre = (nombreClub, listaClubes = []) => {
  if (!nombreClub || !Array.isArray(listaClubes)) return null;
  return listaClubes.find((club) => club.nombre === nombreClub) || null;
};

const normalizarTexto = (str) =>
  str ? str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';

/*
  Convierte el texto de servicios/amenidades del club en una lista legible.
  Acepta texto separado por saltos de línea, comas o punto y coma.
*/
const normalizarServiciosClub = (serviciosValor) => {
  if (!serviciosValor) return [];

  if (Array.isArray(serviciosValor)) {
    return serviciosValor
      .map((servicio) => String(servicio).trim())
      .filter(Boolean);
  }

  return String(serviciosValor)
    .split(/[\n,;]+/)
    .map((servicio) => servicio.trim())
    .filter(Boolean);
};

const obtenerServiciosCancha = (cancha) =>
  normalizarServiciosClub(
    cancha?.clubServicios ||
    cancha?.servicios ||
    cancha?.servicios_club ||
    ''
  );

const obtenerClaveCancha = (cancha) => {
  const idClub = cancha?.clubId ?? cancha?.id_club ?? 'club';
  const idCancha = cancha?.id ?? cancha?.id_cancha ?? cancha?.nombre ?? 'cancha';

  return `${idClub}-${idCancha}`;
};


/*
  Formatea una fecha de torneo sin pasar por UTC.
  Evita que una fecha YYYY-MM-DD se muestre con un día menos.
*/
const formatearFechaTorneo = (fechaValor) => {
  if (!fechaValor) return 'Fecha a confirmar';

  const fechaLimpia = String(fechaValor).slice(0, 10);
  const [anio, mes, dia] = fechaLimpia.split('-');

  if (!anio || !mes || !dia) return fechaLimpia;

  return `${dia}/${mes}/${anio}`;
};

/*
  Obtiene nombres desde las relaciones reales que devuelve el backend.
*/
const obtenerNombreClubTorneo = (torneo) =>
  torneo?.club?.nombre_club ||
  torneo?.nombre_club ||
  'Club organizador';

const obtenerNombreDeporteTorneo = (torneo) =>
  torneo?.deporte?.nombre_deporte ||
  torneo?.nombre_deporte ||
  '';

const torneoSigueVigente = (torneo) => {
  const fechaFin = String(torneo?.fecha_fin || '').slice(0, 10);

  if (!fechaFin) return true;

  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(hoy.getDate()).padStart(2, '0')}`;

  return fechaFin >= fechaHoy;
};

/*
  Devuelve la clase visual del estado de una reserva.
*/
const obtenerClaseEstadoReserva = (estado) => {
  if (estado === 'Confirmada') return 'status status--confirmed';
  if (estado === 'Pendiente') return 'status status--pending';

  return 'status status--blocked';
};

/*
  Normaliza el estado de pago que llega desde el backend.
  Mantiene separado el estado de la reserva del estado del pago.
*/
const normalizarEstadoPago = (estadoPago) => {
  const estado = normalizarTexto(estadoPago || 'pago_en_club');

  // Se conserva únicamente para reservas históricas que ya hayan quedado
  // registradas como pagadas antes de retirar Mercado Pago de DameCancha.
  if (
    estado === 'pagado' ||
    estado === 'approved' ||
    estado === 'approved_demo' ||
    estado === 'aprobado' ||
    estado === 'pagada online'
  ) {
    return 'pagado';
  }

  // Desde esta versión todas las reservas nuevas se abonan presencialmente.
  return 'pago_en_club';
};

const obtenerTextoEstadoPago = (estadoPago) =>
  normalizarEstadoPago(estadoPago) === 'pagado'
    ? 'Pago registrado'
    : 'Abonar en el club';

const reservaEstaPagada = (reserva) => {
  if (!reserva) return false;

  return normalizarEstadoPago(
    reserva.estado_pago || reserva.mercado_pago_status
  ) === 'pagado';
};

const puedeEliminarReserva = (reserva) => {
  if (!reserva) return false;

  // Las reservas históricas que ya fueron cobradas online se conservan sin
  // cancelación automática para no introducir un flujo de reembolso inexistente.
  if (reservaEstaPagada(reserva)) return false;

  return reserva.puedeGestionar || esReservaPasada(reserva);
};

const esReservaPasada = (reserva) => {
  const finTurno = reserva?.fechaHoraFinDate || reserva?.fechaHoraDate;
  if (!finTurno) return false;

  // La reserva deja de estar activa cuando termina el turno, no cuando empieza.
  return finTurno < new Date();
};

/*
  Normaliza una reserva para que el panel derecho pueda renderizarla.
  Soporta reservas nuevas generadas por este dashboard y futuras reservas
  que puedan venir del backend con un formato parecido.
*/
const normalizarReserva = (reserva, listaClubes = []) => {
  if (!reserva) return null;

  const fechaStr = reserva.fecha instanceof Date ? formatearFecha(reserva.fecha) : reserva.fecha;
  const horaNormalizada = reserva.hora || reserva.hora_inicio?.slice(0, 5) || '';
  const fechaDate = crearFechaDesdeTexto(fechaStr);
  const fechaHoraDate = crearFechaHoraDesdeReserva(fechaStr, horaNormalizada);
  const horaFinNormalizada =
    reserva.hora_fin?.slice?.(0, 5) ||
    reserva.horaFin?.slice?.(0, 5) ||
    '';
  let fechaHoraFinDate = horaFinNormalizada
    ? crearFechaHoraDesdeReserva(fechaStr, horaFinNormalizada)
    : null;

  // Compatibilidad con reservas históricas sin hora_fin: el turno dura 1 hora.
  if (!fechaHoraFinDate && fechaHoraDate) {
    fechaHoraFinDate = new Date(fechaHoraDate.getTime() + 60 * 60 * 1000);
  }

  const clubEncontrado = buscarClubPorNombre(reserva.club, listaClubes);
  const puedeGestionarCalculado = puedeGestionarPorAnticipacion(fechaHoraDate);
  const estadoPagoNormalizado = normalizarEstadoPago(reserva.estado_pago || reserva.mercado_pago_status);

  return {
    ...reserva,
    id: reserva.id || reserva.id_reserva || `${reserva.club}-${reserva.fecha}-${horaNormalizada}`,
    id_reserva: reserva.id_reserva || reserva.id,
    hora: horaNormalizada,
    estado_pago: estadoPagoNormalizado,
    fecha: fechaDate ? formatearFecha(fechaDate) : fechaStr,
    diaSemana:
      reserva.diaSemana || obtenerDiaSemanaCorto(fechaDate),
    dia:
      reserva.dia ||
      (fechaDate ? String(fechaDate.getDate()).padStart(2, '0') : '--'),
    mes:
      reserva.mes || obtenerMesCorto(fechaDate),
    estado:
      reserva.estado || 'Confirmada',
    puedeGestionar:
      fechaHoraDate ? puedeGestionarCalculado : (reserva.puedeGestionar ?? false),
    limite:
      reserva.limite || '2 hs antes del turno',
    direccion:
      reserva.direccion || clubEncontrado?.direccion || '',
    ciudad:
      reserva.ciudad || clubEncontrado?.ciudad || '',
    provincia:
      reserva.provincia || clubEncontrado?.provincia || '',
    ubicacionCompleta: construirUbicacionCompleta({
      club: reserva.club || clubEncontrado?.nombre,
      direccion: reserva.direccion || clubEncontrado?.direccion,
      ciudad: reserva.ciudad || clubEncontrado?.ciudad,
      provincia: reserva.provincia || clubEncontrado?.provincia,
    }),
    fechaDate,
    fechaHoraDate,
    fechaHoraFinDate,
  };
};


/*
  Muestra un modal de error personalizado con SweetAlert2.
  Reemplaza los alert() nativos para mantener la estética de DameCancha.
*/
const mostrarError = (titulo, texto) => {
  Swal.fire({
    icon: 'error',
    title: titulo,
    text: texto,
    confirmButtonText: 'Entendido',
    customClass: {
      popup: 'cy-alert-popup',
      title: 'cy-alert-title',
      htmlContainer: 'cy-alert-text',
      confirmButton: 'cy-alert-button cy-alert-button--error',
    },
  });
};

/*
  Muestra un modal de éxito personalizado.
  Se usa especialmente al cancelar/eliminar reservas correctamente.
*/
const mostrarExito = (titulo, texto) => {
  Swal.fire({
    icon: 'success',
    title: titulo,
    text: texto,
    confirmButtonText: 'Aceptar',
    customClass: {
      popup: 'cy-alert-popup',
      title: 'cy-alert-title',
      htmlContainer: 'cy-alert-text',
      confirmButton: 'cy-alert-button',
    },
  });
};

/*
  DashboardUsuario.
  Permite a un usuario común reservar una cancha en un flujo guiado:
  deporte → club → fecha → horario → confirmación.
  También muestra las reservas reales recibidas desde App.jsx.
*/
const gmailComposeUrl = CONTACT.email
  ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email)}`
  : '';

function DashboardUsuario({
  usuario,
  reservas = [],
  onLogout,
  onAddReserva,
  onUpdateReserva,
  onDeleteReserva,
  onRefreshReservas,
  onOpenBancoSuplentes,
}) {
  /*
    Estados principales del wizard.
    Cada selección habilita el paso siguiente.
  */
  const [deporteSeleccionado, setDeporteSeleccionado] = useState(null);
  const [clubSeleccionado, setClubSeleccionado] = useState(null);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [clubesActivos, setClubesActivos] = useState([]);



  /*
    Torneos publicados.
    Se cargan una sola vez y luego se filtran por el deporte elegido.
  */
  const [torneosPublicados, setTorneosPublicados] = useState([]);
  const [cargandoTorneos, setCargandoTorneos] = useState(false);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);

  /*
    Cartelera pública de los clubes.
    Solo llegan anuncios activos de clubes activos.
  */
  const [anunciosActivos, setAnunciosActivos] = useState([]);
  const [carteleraSeleccionada, setCarteleraSeleccionada] = useState(null);

  const canchasPasoDosRef = useRef(null);
  const [serviciosAbiertosPorCancha, setServiciosAbiertosPorCancha] = useState({});


  /*
    Carga todos los torneos publicados.
    El endpoint ya devuelve las relaciones club y deporte.
  */
  useEffect(() => {
    const controller = new AbortController();

    const cargarTorneosPublicados = async () => {
      setCargandoTorneos(true);

      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/torneo/publicados`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `No se pudieron cargar los torneos. Error HTTP ${response.status}.`
          );
        }

        const data = await response.json();
        setTorneosPublicados(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error al cargar torneos publicados:', error);
          setTorneosPublicados([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargandoTorneos(false);
        }
      }
    };

    cargarTorneosPublicados();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const cargarAnunciosActivos = async () => {
      try {
        const response = await fetch(
          apiUrl('/anuncio-club/activos'),
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar la cartelera. Error HTTP ${response.status}.`
          );
        }

        const data = await response.json();
        setAnunciosActivos(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error al cargar anuncios activos:', error);
          setAnunciosActivos([]);
        }
      }
    };

    cargarAnunciosActivos();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!carteleraSeleccionada) return undefined;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') {
        setCarteleraSeleccionada(null);
      }
    };

    window.addEventListener('keydown', cerrarConEscape);

    return () => {
      window.removeEventListener('keydown', cerrarConEscape);
      document.body.style.overflow = overflowAnterior;
    };
  }, [carteleraSeleccionada]);

  const construirUrlImagenAnuncio = (imagenUrl) => {
    if (!imagenUrl) return '';

    if (
      imagenUrl.startsWith('http://') ||
      imagenUrl.startsWith('https://')
    ) {
      return imagenUrl;
    }

    return mediaUrl(imagenUrl);
  };

  /*
    Horarios disponibles reales de la cancha seleccionada.
    Se cargan desde el backend cuando el usuario elige una cancha.
    Si la cancha no tiene horarios configurados, se muestran todos los del sistema.
  */
  const [horariosDeCancha, setHorariosDeCancha] = useState([]);
  const [horaFinPorInicio, setHoraFinPorInicio] = useState({});
  const [cargandoHorariosCancha, setCargandoHorariosCancha] = useState(false);

  /*
    Ocupaciones reales de la cancha y fecha recibidas desde el backend.
    Incluyen reservas normales y bloqueos creados por el dueño del club.
    No reemplazan las reservas del usuario que se muestran en el panel lateral.
  */
  const [reservasDelServidor, setReservasDelServidor] = useState([]);
  const [cargandoReservasDelServidor, setCargandoReservasDelServidor] =
    useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');

  const obtenerReservasDelServidor = async (signal) => {
    const idCancha =
      canchaSeleccionada?.id ?? canchaSeleccionada?.id_cancha ?? null;
    const fecha = normalizarFechaParaComparar(fechaSeleccionada);

    if (!idCancha || !fecha) return [];

    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/reserva/disponibilidad/${idCancha}/${fecha}?_=${Date.now()}`,
      {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error('No se pudieron consultar los horarios ocupados.');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  /*
    Cada vez que cambia la cancha o la fecha, vuelve a consultar al backend.
    La consulta SIEMPRE se hace por id de cancha + fecha: si un club tiene
    dos canchas del mismo deporte, una reserva en la cancha A no bloquea la B.

    Mientras el usuario permanece en la selección de horarios se refresca
    periódicamente para que un turno tomado por otra persona se pinte como
    ocupado sin esperar a que el usuario intente confirmarlo.
  */
  useEffect(() => {
    if (!canchaSeleccionada || !fechaSeleccionada) {
      setReservasDelServidor([]);
      setErrorDisponibilidad('');
      setCargandoReservasDelServidor(false);
      return undefined;
    }

    let activo = true;
    let controller = null;

    const cargarReservasOcupadas = async ({ silencioso = false } = {}) => {
      controller?.abort();
      controller = new AbortController();

      if (!silencioso) {
        setCargandoReservasDelServidor(true);
      }

      try {
        const data = await obtenerReservasDelServidor(controller.signal);

        if (!activo) return;

        setReservasDelServidor(data);
        setErrorDisponibilidad('');
      } catch (error) {
        if (!activo || error?.name === 'AbortError') return;

        console.error('Error al consultar horarios ocupados:', error);
        setReservasDelServidor([]);
        setErrorDisponibilidad(
          'No pudimos verificar la disponibilidad. Reintentá en unos segundos.'
        );
      } finally {
        if (activo && !silencioso) {
          setCargandoReservasDelServidor(false);
        }
      }
    };

    cargarReservasOcupadas();

    const intervalo = window.setInterval(() => {
      cargarReservasOcupadas({ silencioso: true });
    }, 10000);

    const actualizarAlVolver = () => {
      if (document.visibilityState === 'visible') {
        cargarReservasOcupadas({ silencioso: true });
      }
    };

    document.addEventListener('visibilitychange', actualizarAlVolver);

    return () => {
      activo = false;
      controller?.abort();
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', actualizarAlVolver);
    };
  }, [canchaSeleccionada, fechaSeleccionada]);

  /*
    Carga los turnos reales de la cancha seleccionada para el día elegido.

    horariosDeCancha conserva solamente la hora inicial para no modificar
    el resto del wizard.

    horaFinPorInicio guarda la hora final real de cada turno.

    Si la cancha todavía no tiene una configuración propia, mantiene el
    comportamiento histórico de DameCancha: turnos de 60 minutos desde
    las 09:00 hasta las 22:00.
  */
  useEffect(() => {
    if (!canchaSeleccionada || !fechaSeleccionada) {
      setHorariosDeCancha([]);
      setHoraFinPorInicio({});
      setCargandoHorariosCancha(false);
      return undefined;
    }

    const idCancha =
      canchaSeleccionada.id || canchaSeleccionada.id_cancha;

    if (!idCancha) {
      setHorariosDeCancha([]);
      setHoraFinPorInicio({});
      setCargandoHorariosCancha(false);
      return undefined;
    }

    let activo = true;
    const controller = new AbortController();

    const cargarHorariosPredeterminados = () => {
      const horas = HORARIOS.map((h) => h.hora);

      const fines = Object.fromEntries(
        horas.map((hora) => {
          const inicioMinutos = convertirHoraAMinutos(hora);
          const finMinutos = inicioMinutos + 60;

          const horasFin = Math.floor(finMinutos / 60);
          const minutosFin = finMinutos % 60;

          const horaFin = `${String(horasFin).padStart(2, '0')}:${String(
            minutosFin
          ).padStart(2, '0')}`;

          return [hora, horaFin];
        })
      );

      setHorariosDeCancha(horas);
      setHoraFinPorInicio(fines);
    };

    const cargarHorarios = async () => {
      setCargandoHorariosCancha(true);
      setHorariosDeCancha([]);
      setHoraFinPorInicio({});

      try {
        const token = localStorage.getItem('token');

        const response = await fetch(
          `${API_URL}/disponibilidad/cancha/${idCancha}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          cargarHorariosPredeterminados();
          return;
        }

        const disponibilidades = await response.json();

        /*
          Si la cancha nunca fue configurada, conserva los turnos
          tradicionales de una hora desde las 09:00.
        */
        if (
          !Array.isArray(disponibilidades) ||
          disponibilidades.length === 0
        ) {
          cargarHorariosPredeterminados();
          return;
        }

        /*
          Mismo criterio que el backend:
          0 = domingo ... 6 = sábado.
        */
        const fechaSQL = normalizarFechaParaComparar(fechaSeleccionada);

        if (!fechaSQL) {
          setHorariosDeCancha([]);
          setHoraFinPorInicio({});
          return;
        }

        const [anio, mes, dia] = fechaSQL.split('-').map(Number);
        const diaSemana = new Date(
          Date.UTC(anio, mes - 1, dia)
        ).getUTCDay();

        const disponibilidadesDelDia = disponibilidades.filter(
          (disponibilidad) =>
            Number(disponibilidad.dia_semana) === diaSemana
        );

        /*
          Si la cancha sí está configurada pero el día elegido no tiene
          turnos cargados, ese día está cerrado. No usamos el fallback.
        */
        if (disponibilidadesDelDia.length === 0) {
          setHorariosDeCancha([]);
          setHoraFinPorInicio({});
          return;
        }

        const turnos = new Map();

        disponibilidadesDelDia.forEach((disponibilidad) => {
          const horaInicio = normalizarHoraParaComparar(
            disponibilidad.hora_inicio
          );

          const horaFin = normalizarHoraParaComparar(
            disponibilidad.hora_fin
          );

          if (horaInicio && horaFin) {
            turnos.set(horaInicio, horaFin);
          }
        });

        const horasOrdenadas = [...turnos.keys()].sort();

        setHorariosDeCancha(horasOrdenadas);
        setHoraFinPorInicio(Object.fromEntries(turnos));
      } catch (error) {
        if (error?.name === 'AbortError') return;

        console.error('Error al cargar horarios de cancha:', error);
        cargarHorariosPredeterminados();
      } finally {
        if (activo) {
          setCargandoHorariosCancha(false);
        }
      }
    };

    cargarHorarios();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [canchaSeleccionada, fechaSeleccionada]);
  /*
    Banners laterales del dashboard.
    Se guardan en estado para poder cambiarlos automáticamente cada ciertos segundos.
  */
  const [bannerIzquierdo, setBannerIzquierdo] = useState(() => obtenerBannerAleatorio());
  const [bannerDerecho, setBannerDerecho] = useState(() => obtenerBannerAleatorio());

  /*
    Alterna los banners de manera aleatoria.
    Se ejecuta al montar el dashboard y luego cada 9 segundos.
    Intentamos que izquierda y derecha no usen la misma imagen al mismo tiempo.
  */
  useEffect(() => {
    const cambiarBanners = () => {
      const nuevoBannerIzquierdo = obtenerBannerAleatorio();
      let nuevoBannerDerecho = obtenerBannerAleatorio();

      if (BANNERS_PUBLICITARIOS.length > 1) {
        while (nuevoBannerDerecho === nuevoBannerIzquierdo) {
          nuevoBannerDerecho = obtenerBannerAleatorio();
        }
      }

      setBannerIzquierdo(nuevoBannerIzquierdo);
      setBannerDerecho(nuevoBannerDerecho);
    };

    cambiarBanners();

    const intervaloBanners = setInterval(cambiarBanners, 9000);

    return () => clearInterval(intervaloBanners);
  }, []);


  /*
    Mes que se muestra en el selector de fechas.
    Arranca siempre en el mes actual.
  */
  const [mesVisible, setMesVisible] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  useEffect(() => {
    const fetchClubes = async () => {
      try {
        const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
        const response = await fetch(apiUrl('/club/aceptados'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const activos = data
            .filter((c) => c.activo)
            .map((c) => {
              // deportes_club viene en "canchas" desde el backend.
              // Si está vacío, extraemos los deportes desde detallesCanchas
              // que contiene la relación real cancha → deporte.
              const deportesRegistrados = Array.isArray(c.canchas)
                ? c.canchas
                : [];

              const deportesDesdeCanchas = Array.isArray(c.detallesCanchas)
                ? c.detallesCanchas
                  .map((cancha) => cancha.deporte)
                  .filter(Boolean)
                : [];

              const deportes = [
                ...new Set([
                  ...deportesRegistrados,
                  ...deportesDesdeCanchas,
                ]),
              ];

              return {
                id: c.id,
                nombre: c.nombre || 'Club sin nombre',
                direccion: c.direccion || 'Sin dirección',
                ciudad: c.ciudad || '',
                provincia: c.provincia || '',
                email: c.email || 'No disponible',
                telefono: c.telefono || 'No disponible',
                distancia: 'A calcular',
                servicios: c.servicios || c.servicios_club || '',
                servicios_club: c.servicios_club || c.servicios || '',
                deportes,
                detallesCanchas: c.detallesCanchas || [],

                // Si el backend manda "/uploads/archivo.jpg",
                // armamos la URL completa para poder mostrarla en el navegador.
                logo: c.logo ? `${API_URL}${c.logo}` : null,
              };
            });
          setClubesActivos(activos);
        }
      } catch (error) {
        console.error('Error al cargar clubes en el dashboard:', error);
      }
    };

    fetchClubes();
  }, [usuario]);

  // Filtrar deportes que existen en los clubes activos
  const deportesDisponibles = useMemo(() => {
    if (clubesActivos.length === 0) return [];
    const setDeportes = new Set();
    clubesActivos.forEach(club => {
      if (Array.isArray(club.deportes)) {
        club.deportes.forEach(d => setDeportes.add(d));
      }
    });
    return DEPORTES.filter(d => setDeportes.has(d.nombre));
  }, [clubesActivos]);

  /*
    Estado del modal.
    mostrarModalReserva controla si el modal se ve.
    reservaConfirmada guarda los datos mostrados dentro del modal.
  */
  const [mostrarModalReserva, setMostrarModalReserva] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(null);

  /*
    Turnos fijos del usuario.
    Se consultan desde GET /turno-fijo/mios y se muestran sin mezclar
    esta información con las reservas normales.
  */
  const [turnosFijosUsuario, setTurnosFijosUsuario] = useState([]);
  const [cargandoTurnosFijosUsuario, setCargandoTurnosFijosUsuario] = useState(false);
  const [refrescoTurnosFijosUsuario, setRefrescoTurnosFijosUsuario] = useState(0);
  const [eliminandoTurnoFijoId, setEliminandoTurnoFijoId] = useState(null);

  useEffect(() => {
    if (!torneoSeleccionado) return undefined;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') {
        setTorneoSeleccionado(null);
      }
    };

    window.addEventListener('keydown', cerrarConEscape);

    return () => {
      window.removeEventListener('keydown', cerrarConEscape);
      document.body.style.overflow = overflowAnterior;
    };
  }, [torneoSeleccionado]);

  /*
    Carga el historial/estado de los turnos fijos del usuario autenticado.
    Incluye pendientes, activos y rechazados.
  */
  useEffect(() => {
    let activo = true;
    const controller = new AbortController();

    const cargarMisTurnosFijos = async () => {
      setCargandoTurnosFijosUsuario(true);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/turno-fijo/mios`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `No se pudieron cargar tus turnos fijos. Error HTTP ${response.status}.`
          );
        }

        const data = await response.json();

        if (activo) {
          setTurnosFijosUsuario(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error al cargar mis turnos fijos:', error);

          if (activo) {
            setTurnosFijosUsuario([]);
          }
        }
      } finally {
        if (activo) {
          setCargandoTurnosFijosUsuario(false);
        }
      }
    };

    cargarMisTurnosFijos();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [usuario, refrescoTurnosFijosUsuario]);

  /*
    Estados para el menú de los tres puntos de cada reserva.
    menuReservaAbierto guarda el id de la reserva cuyo menú está abierto.
    reservaEnEdicion guarda la reserva que el usuario está modificando.
    reservasEliminadas oculta del panel las reservas canceladas/eliminadas localmente.
  */
  const [menuReservaAbierto, setMenuReservaAbierto] = useState(null);
  const [menuReservaPosicion, setMenuReservaPosicion] = useState(null);
  const [reservaEnEdicion, setReservaEnEdicion] = useState(null);
  const [reservasEliminadas, setReservasEliminadas] = useState([]);
  const [enviandoReserva, setEnviandoReserva] = useState(false);
  const [ahoraPanel, setAhoraPanel] = useState(() => new Date());

  // Mantiene "Mis reservas" actualizado aunque el dashboard quede abierto.
  // Al finalizar un turno, deja de mostrarse sin necesitar recargar la página.
  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAhoraPanel(new Date());
    }, 60000);

    return () => window.clearInterval(intervalo);
  }, []);

  /*
    Referencia al carrusel de deportes.
    Permite desplazar horizontalmente la fila con los botones laterales.
  */
  const sportsCarouselRef = useRef(null);

  /*
    Días disponibles para reservar.
    Se generan según el mes visible y nunca muestran días anteriores a hoy.
  */
  const diasDisponibles = useMemo(
    () => generarDiasDisponibles(mesVisible),
    [mesVisible]
  );

  /*
    Título visible del selector de fecha.
  */
  const tituloMes = useMemo(
    () => obtenerTituloMes(mesVisible),
    [mesVisible]
  );

  /*
    Evita que el usuario navegue hacia meses anteriores al mes actual.
  */
  const puedeRetrocederMes = useMemo(() => {
    const hoy = new Date();
    const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesActualVisible = new Date(
      mesVisible.getFullYear(),
      mesVisible.getMonth(),
      1
    );

    return mesActualVisible > mesActual;
  }, [mesVisible]);

  /*
    Filtra los clubes disponibles según el deporte elegido.
    Si no hay deporte seleccionado, la lista queda vacía.
  */
  const clubesFiltrados = useMemo(() => {
    if (!deporteSeleccionado) return [];

    return clubesActivos.filter((club) =>
      club.deportes.includes(deporteSeleccionado)
    );
  }, [deporteSeleccionado, clubesActivos]);

  const canchasDisponibles = useMemo(() => {
    if (!deporteSeleccionado) return [];

    return clubesActivos.flatMap((club) =>
      (club.detallesCanchas || [])
        .filter((cancha) =>
          normalizarTexto(cancha.deporte) === normalizarTexto(deporteSeleccionado)
        )
        .map((cancha) => ({
          ...cancha,
          clubId: club.id,
          clubNombre: club.nombre,
          clubDireccion: club.direccion,
          clubTelefono: club.telefono,
          clubEmail: club.email,
          clubLogo: club.logo,
          clubServicios: club.servicios || club.servicios_club || '',
        }))
    );
  }, [clubesActivos, deporteSeleccionado]);


  const anunciosPorClub = useMemo(() => {
    const agrupados = new Map();

    anunciosActivos.forEach((anuncio) => {
      const idClub =
        anuncio?.club?.id_club ??
        anuncio?.club?.id ??
        anuncio?.id_club ??
        null;

      if (!idClub) return;

      const clave = String(idClub);
      const actuales = agrupados.get(clave) || [];
      agrupados.set(clave, [...actuales, anuncio]);
    });

    return agrupados;
  }, [anunciosActivos]);

  /*
    Solo muestra torneos publicados, vigentes y del deporte seleccionado.
    La comparación ignora mayúsculas y tildes: "Padel" coincide con "Pádel".
  */
  const torneosDelDeporteSeleccionado = useMemo(() => {
    if (!deporteSeleccionado) return [];

    return torneosPublicados.filter((torneo) => {
      const mismoDeporte =
        normalizarTexto(obtenerNombreDeporteTorneo(torneo)) ===
        normalizarTexto(deporteSeleccionado);

      return mismoDeporte && torneoSigueVigente(torneo);
    });
  }, [torneosPublicados, deporteSeleccionado]);

  const construirUrlFlyerTorneo = (flyerUrl) => {
    if (!flyerUrl) return '';

    if (/^https?:\/\//i.test(flyerUrl)) {
      return flyerUrl;
    }

    return `${API_URL}${flyerUrl}`;
  };

  const abrirDetalleTorneo = (torneo) => {
    setTorneoSeleccionado(torneo);
  };

  const cerrarDetalleTorneo = () => {
    setTorneoSeleccionado(null);
  };

  const seguirReservando = () => {
    canchasPasoDosRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  const alternarServiciosCancha = (cancha) => {
    const clave = obtenerClaveCancha(cancha);

    setServiciosAbiertosPorCancha((prev) => ({
      ...prev,
      [clave]: !prev[clave],
    }));
  };

  const estanServiciosAbiertos = (cancha) =>
    Boolean(serviciosAbiertosPorCancha[obtenerClaveCancha(cancha)]);

  const seleccionarCanchaDesdeBoton = (cancha) => {
    seleccionarCancha(cancha);
  };

  const contactarPorTorneo = async (torneo) => {
    const contacto = String(torneo?.contacto || '').trim();

    if (!contacto) {
      await Swal.fire({
        icon: 'info',
        title: 'Contacto a confirmar',
        text: 'El club todavía no informó un medio de contacto para este torneo.',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          htmlContainer: 'cy-alert-text',
          confirmButton: 'cy-alert-button',
        },
      });
      return;
    }

    if (/^https?:\/\//i.test(contacto)) {
      window.open(contacto, '_blank', 'noopener,noreferrer');
      return;
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto)) {
      window.location.href = `mailto:${contacto}?subject=${encodeURIComponent(
        `Inscripción a ${torneo?.titulo || 'torneo'}`
      )}`;
      return;
    }

    const soloNumeros = contacto.replace(/\D/g, '');

    if (soloNumeros.length >= 10) {
      window.open(
        `https://wa.me/${soloNumeros}?text=${encodeURIComponent(
          `Hola, quiero inscribirme en ${torneo?.titulo || 'el torneo'}.`
        )}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(contacto);

      await Swal.fire({
        icon: 'success',
        title: 'Contacto copiado',
        text: `${contacto} fue copiado al portapapeles.`,
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          htmlContainer: 'cy-alert-text',
          confirmButton: 'cy-alert-button',
        },
      });
    } catch {
      await Swal.fire({
        icon: 'info',
        title: 'Contacto del torneo',
        text: contacto,
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          htmlContainer: 'cy-alert-text',
          confirmButton: 'cy-alert-button',
        },
      });
    }
  };

  /*
    Busca el objeto completo del club seleccionado.
    Sirve para agregar dirección a la reserva confirmada.
  */
  const clubActual = useMemo(() => {
    if (!clubSeleccionado) return null;

    return clubesActivos.find((club) => club.nombre === clubSeleccionado) || null;
  }, [clubSeleccionado, clubesActivos]);

  /*
    Canchas reales del club elegido para el deporte seleccionado.
    Se mantiene para compatibilidad al modificar una reserva existente.
  */
  const canchasFiltradas = useMemo(() => {
    if (!clubActual || !deporteSeleccionado) return [];

    return (clubActual.detallesCanchas || []).filter((cancha) =>
      normalizarTexto(cancha.deporte) === normalizarTexto(deporteSeleccionado)
    );
  }, [clubActual, deporteSeleccionado]);

  const nombreCanchaSeleccionada = canchaSeleccionada?.nombre || '—';

  /*
    Normaliza y ordena las reservas reales recibidas desde App.jsx.
    Este bloque reemplaza el viejo RESERVAS_MOCK.
  */
  const reservasDelUsuario = useMemo(() => {
    const ahora = ahoraPanel;

    return reservas
      .map((reserva) => normalizarReserva(reserva, clubesActivos))
      .filter(Boolean)
      .filter((reserva) => !reservasEliminadas.includes(reserva.id))
      .filter((reserva) => {
        const estado = normalizarTexto(reserva.estado || '');
        const cancelada =
          estado.includes('cancelada') || estado.includes('cancelado');

        if (cancelada) return false;

        // En el panel mostramos el turno hasta su hora de finalización.
        // El histórico se conserva completo en la base para reportes,
        // cancelaciones y métricas del club.
        const finTurno = reserva.fechaHoraFinDate || reserva.fechaHoraDate;
        return finTurno ? finTurno >= ahora : false;
      })
      .sort((a, b) => {
        const fechaA = a.fechaHoraDate?.getTime?.() || 0;
        const fechaB = b.fechaHoraDate?.getTime?.() || 0;

        return fechaA - fechaB;
      });
  }, [reservas, clubesActivos, reservasEliminadas, ahoraPanel]);

  /*
    Calcula las reservas futuras.
    Se usan para mostrar correctamente la próxima reserva.
  */
  const reservasFuturas = useMemo(() => {
    return reservasDelUsuario.filter((reserva) => {
      if (!reserva.fechaHoraDate) return false;

      return reserva.fechaHoraDate >= ahoraPanel;
    });
  }, [reservasDelUsuario, ahoraPanel]);

  /*
    Obtiene la próxima reserva del usuario.
    Es la primera reserva futura ordenada por fecha y hora.
  */
  const proximaReserva = reservasFuturas[0] || null;

  /*
    Reserva cuyo menú está abierto.
    En desktop sigue usando el dropdown normal.
    En mobile usamos esta misma reserva para un popover anclado a los tres puntos.
  */
  const reservaMenuActiva =
    reservasDelUsuario.find((reserva) => reserva.id === menuReservaAbierto) || null;

  const reservaMenuActivaPasada = reservaMenuActiva
    ? esReservaPasada(reservaMenuActiva)
    : false;

  /*
    Calcula cuál es el paso activo.
    Esto controla qué línea está habilitada y cuál queda opaca.
  */
  const pasoActual = !deporteSeleccionado
    ? 1
    : !canchaSeleccionada
      ? 2
      : !fechaSeleccionada
        ? 3
        : !horarioSeleccionado
          ? 4
          : 5;

  /*
    Devuelve la clase visual de cada punto del indicador superior.
    active = paso actual
    done = paso ya completado
    waiting = paso pendiente.
  */
  const obtenerEstadoPaso = (numeroPaso) => {
    if (pasoActual === numeroPaso) return 'active';
    if (pasoActual > numeroPaso) return 'done';

    return 'waiting';
  };

  /*
    Arma las clases CSS de cada línea del wizard.
    Solo el paso activo queda con opacidad completa.
  */
  const obtenerClaseLinea = (numeroPaso, extra = '') => {
    const clases = ['booking-step'];

    if (extra) clases.push(extra);

    if (pasoActual === numeroPaso) {
      clases.push('is-active');
    } else {
      clases.push('is-inactive');
    }

    return clases.join(' ');
  };

  /*
    Cambia el mes visible del calendario.
    No permite volver a meses anteriores al mes actual.
  */
  const cambiarMes = (direccion) => {
    setMesVisible((mesAnterior) => {
      const nuevoMes = new Date(
        mesAnterior.getFullYear(),
        mesAnterior.getMonth() + direccion,
        1
      );

      const hoy = new Date();
      const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      if (nuevoMes < mesActual) return mesAnterior;

      return nuevoMes;
    });
  };

  /*
    Desplaza horizontalmente el carrusel de deportes.
    direction puede ser left o right.
  */
  const scrollSports = (direction) => {
    if (!sportsCarouselRef.current) return;

    const desplazamiento = 360;

    sportsCarouselRef.current.scrollBy({
      left: direction === 'left' ? -desplazamiento : desplazamiento,
      behavior: 'smooth',
    });
  };

  /*
    Selecciona deporte y reinicia las selecciones posteriores.
    Esto evita inconsistencias si el usuario cambia de deporte.
  */
  const seleccionarDeporte = (deporte) => {
    setDeporteSeleccionado(deporte.nombre);
    setClubSeleccionado(null);
    setCanchaSeleccionada(null);
    setFechaSeleccionada(null);
    setHorarioSeleccionado(null);
    setReservasDelServidor([]);
    setErrorDisponibilidad('');
  };

  /*
    Selecciona club solo cuando corresponde el paso 2.
    Luego limpia fecha y horario.
  */
  const seleccionarClub = (club) => {
    if (pasoActual !== 2) return;

    setClubSeleccionado(club.nombre);
    setCanchaSeleccionada(null);
    setFechaSeleccionada(null);
    setHorarioSeleccionado(null);
  };

  /*
    Selecciona una cancha real del club elegido.
    Luego limpia fecha y horario porque dependen de esa cancha.
  */
  const seleccionarCancha = (cancha) => {
    if (pasoActual !== 2) return;

    setClubSeleccionado(cancha.clubNombre || clubSeleccionado);
    setCanchaSeleccionada(cancha);
    setFechaSeleccionada(null);
    setHorarioSeleccionado(null);
    setReservasDelServidor([]);
    setErrorDisponibilidad('');
  };

  /*
    Selecciona fecha solo cuando corresponde el paso 3.
    No permite seleccionar fechas pasadas.
    Luego limpia el horario porque depende del día elegido.
  */
  const seleccionarFecha = (fecha) => {
    if (pasoActual !== 3) return;
    if (esFechaPasada(fecha)) return;

    // Bloquea los horarios desde el primer render hasta consultar el servidor.
    setReservasDelServidor([]);
    setErrorDisponibilidad('');
    setCargandoReservasDelServidor(true);
    setFechaSeleccionada(fecha);
    setHorarioSeleccionado(null);
  };


  const obtenerHoraFinTurno = (horaInicio) => {
    const horaFinConfigurada = horaFinPorInicio[horaInicio];

    if (horaFinConfigurada) {
      return horaFinConfigurada;
    }

    const inicioMinutos = convertirHoraAMinutos(horaInicio);

    if (inicioMinutos === null) {
      return null;
    }

    const finMinutos = inicioMinutos + 60;
    const horasFin = Math.floor(finMinutos / 60);
    const minutosFin = finMinutos % 60;

    return `${String(horasFin).padStart(2, '0')}:${String(
      minutosFin
    ).padStart(2, '0')}`;
  };

  /*
    Indica si una ocupación del backend se superpone con el turno seleccionado.

    El endpoint de disponibilidad devuelve tanto reservas como bloqueos.
    Por eso no alcanza con comparar únicamente la hora de inicio: un bloqueo
    de 17:00 a 22:00 debe deshabilitar 17:00, 18:00, 19:00, 20:00 y 21:00.
  */
  const ocupacionBloqueaTurnoSeleccionado = (ocupacion, hora) => {
    if (!ocupacion || !hora) {
      return false;
    }

    const esBloqueo =
      ocupacion.tipo_ocupacion === 'bloqueo' ||
      (ocupacion.id_bloqueo !== null && ocupacion.id_bloqueo !== undefined);

    const idReserva = ocupacion.id_reserva ?? ocupacion.id ?? null;
    const idReservaEnEdicion =
      reservaEnEdicion?.id_reserva ?? reservaEnEdicion?.id ?? null;

    /*
      Este listado YA viene filtrado por el backend usando id_cancha + fecha.
      No volvemos a comparar fecha/cancha en el navegador porque distintos
      formatos de serialización podían hacer que un turno realmente ocupado
      pareciera disponible. Así, si la API devolvió una ocupación, solo resta
      comprobar el solapamiento horario.

      Al modificar una reserva, la reserva original no debe bloquearse a sí
      misma. Esta excepción nunca se aplica a un bloqueo del club.
    */
    if (
      !esBloqueo &&
      idReserva !== null &&
      idReservaEnEdicion !== null &&
      String(idReserva) === String(idReservaEnEdicion)
    ) {
      return false;
    }

    const estadoOcupacion = normalizarTexto(ocupacion.estado || '');

    if (
      !esBloqueo &&
      (estadoOcupacion.includes('cancelada') ||
        estadoOcupacion.includes('cancelado'))
    ) {
      return false;
    }

    const inicioTurno = convertirHoraAMinutos(hora);
    const horaFinTurno = obtenerHoraFinTurno(hora);
    const finTurno = convertirHoraAMinutos(horaFinTurno);

    const inicioOcupacion = convertirHoraAMinutos(
      ocupacion.hora ?? ocupacion.hora_inicio
    );

    /*
      Las reservas locales más antiguas pueden no traer hora_fin.
      En ese caso se considera que duran una hora, igual que los turnos
      seleccionables del dashboard.
    */
    const finOcupacionExplicito = convertirHoraAMinutos(ocupacion.hora_fin);
    const finOcupacion =
      finOcupacionExplicito ??
      (inicioOcupacion === null ? null : inicioOcupacion + 60);

    if (
      inicioTurno === null ||
      finTurno === null ||
      inicioOcupacion === null ||
      finOcupacion === null
    ) {
      return false;
    }

    return inicioTurno < finOcupacion && finTurno > inicioOcupacion;
  };

  /*
    Combina las reservas del usuario con todas las ocupaciones consultadas
    al backend. Estas ocupaciones pueden ser reservas o bloqueos del club.
  */
  const esHorarioOcupado = (hora) => {
    return reservasDelServidor.some((ocupacion) =>
      ocupacionBloqueaTurnoSeleccionado(ocupacion, hora)
    );
  };

  // Si otra persona ocupa un horario ya seleccionado, el wizard vuelve al
  // paso 4 en cuanto llega la actualización del servidor.
  useEffect(() => {
    if (!horarioSeleccionado || cargandoReservasDelServidor) return;

    const ahoraOcupado = reservasDelServidor.some((ocupacion) =>
      ocupacionBloqueaTurnoSeleccionado(ocupacion, horarioSeleccionado)
    );

    if (ahoraOcupado) {
      setHorarioSeleccionado(null);
    }
  }, [
    reservasDelServidor,
    horarioSeleccionado,
    cargandoReservasDelServidor,
    fechaSeleccionada,
    canchaSeleccionada,
    reservaEnEdicion,
  ]);

  /*
    Hace una última comprobación contra el backend inmediatamente antes del POST.
    Evita confirmar utilizando información desactualizada del selector.
  */
  const verificarHorarioOcupadoEnServidor = async (hora) => {
    const ocupacionesActuales = await obtenerReservasDelServidor();
    setReservasDelServidor(ocupacionesActuales);

    return ocupacionesActuales.some((ocupacion) =>
      ocupacionBloqueaTurnoSeleccionado(ocupacion, hora)
    );
  };

  /*
    Selecciona horario solo cuando corresponde el paso 4.
    No permite seleccionar horarios pasados ni horarios ya reservados.
  */
  const seleccionarHorario = async (hora) => {
    if (pasoActual !== 4) return;
    if (cargandoReservasDelServidor || errorDisponibilidad) return;
    if (esHorarioPasado(fechaSeleccionada, hora)) return;
    if (esHorarioOcupado(hora)) return;

    // Revalidación silenciosa justo al tocar un horario aparentemente libre.
    try {
      const ocupadoAhora = await verificarHorarioOcupadoEnServidor(hora);
      if (ocupadoAhora) {
        setHorarioSeleccionado(null);
        return;
      }
    } catch (error) {
      console.error('No se pudo revalidar el horario:', error);
      setErrorDisponibilidad(
        'No pudimos verificar la disponibilidad. Reintentá en unos segundos.'
      );
      return;
    }

    setHorarioSeleccionado(hora);
  };

  const obtenerTextoEstadoTurnoFijo = (estado) => {
    if (estado === 'activo') return 'Activo';
    if (estado === 'pendiente') return 'Pendiente';
    if (estado === 'rechazado') return 'Rechazado';
    if (estado === 'cancelado') return 'Cancelado';

    return estado || 'Sin estado';
  };

  const obtenerClaseEstadoTurnoFijo = (estado) => {
    if (estado === 'activo') return 'status status--confirmed';
    if (estado === 'pendiente') return 'status status--pending';

    return 'status status--blocked';
  };

  const verDetalleTurnoFijo = async (turno) => {
    if (!turno) return;

    const dia = NOMBRES_DIAS_TURNO_FIJO[Number(turno.dia_semana)] || 'Día';
    const horaInicio = normalizarHoraParaComparar(turno.hora_inicio) || '—';
    const horaFin = turno.hora_fin
      ? normalizarHoraParaComparar(turno.hora_fin)
      : null;

    const alternativas = Array.isArray(turno.alternativas)
      ? turno.alternativas
      : [];

    const alternativasHtml = alternativas.length
      ? `
        <div style="margin-top:16px;text-align:left;">
          <strong>Alternativas propuestas</strong>
          <ul style="margin:8px 0 0;padding-left:20px;">
            ${alternativas
              .map((alternativa) => {
                const nombreDia =
                  NOMBRES_DIAS_TURNO_FIJO[
                    Number(alternativa.dia_semana)
                  ] || 'Día';

                const inicio =
                  normalizarHoraParaComparar(alternativa.hora_inicio) || '—';

                const fin =
                  normalizarHoraParaComparar(alternativa.hora_fin) || '—';

                return `<li>${nombreDia}: ${inicio} a ${fin} hs</li>`;
              })
              .join('')}
          </ul>
        </div>
      `
      : '';

    const motivoHtml = turno.motivo_rechazo
      ? `
        <div style="margin-top:16px;text-align:left;">
          <strong>Motivo</strong>
          <p style="margin:6px 0 0;">${String(turno.motivo_rechazo)}</p>
        </div>
      `
      : '';

    await Swal.fire({
      icon:
        turno.estado === 'activo'
          ? 'success'
          : turno.estado === 'rechazado'
            ? 'info'
            : 'question',
      title: 'Turno fijo',
      html: `
        <div style="text-align:left;line-height:1.5;">
          <p style="margin:0 0 6px;"><strong>${turno.deporte?.nombre_deporte || 'Deporte'}</strong></p>
          <p style="margin:0 0 6px;">${turno.club?.nombre_club || 'Club'}</p>
          <p style="margin:0 0 6px;">
            ${dia} · ${horaInicio}${horaFin ? ` a ${horaFin}` : ''} hs
          </p>
          ${
            turno.cancha?.nombre_cancha
              ? `<p style="margin:0;">${turno.cancha.nombre_cancha}</p>`
              : '<p style="margin:0;">Cancha a asignar por el club</p>'
          }
          ${motivoHtml}
          ${alternativasHtml}
        </div>
      `,
      confirmButtonText: 'Aceptar',
      customClass: {
        popup: 'cy-alert-popup',
        title: 'cy-alert-title',
        htmlContainer: 'cy-alert-text',
        confirmButton: 'cy-alert-button',
      },
    });
  };

  const eliminarTurnoFijoRechazado = async (turno) => {
    if (!turno?.id_turno_fijo || turno.estado !== 'rechazado') return;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar solicitud rechazada',
      text: 'La solicitud desaparecerá de Mis turnos fijos. Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Volver',
      reverseButtons: true,
      customClass: {
        popup: 'cy-alert-popup',
        title: 'cy-alert-title',
        htmlContainer: 'cy-alert-text',
        confirmButton: 'cy-alert-button cy-alert-button--error',
      },
    });

    if (!confirmacion.isConfirmed) return;

    setEliminandoTurnoFijoId(turno.id_turno_fijo);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/turno-fijo/${turno.id_turno_fijo}/rechazado`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const mensaje = Array.isArray(data?.message)
          ? data.message.join(' ')
          : data?.message ||
            'No pudimos eliminar la solicitud rechazada.';

        throw new Error(mensaje);
      }

      setTurnosFijosUsuario((prev) =>
        prev.filter(
          (item) =>
            Number(item.id_turno_fijo) !==
            Number(turno.id_turno_fijo)
        )
      );

      await Swal.fire({
        icon: 'success',
        title: 'Solicitud eliminada',
        text: 'La solicitud rechazada fue quitada de tu listado.',
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          htmlContainer: 'cy-alert-text',
          confirmButton: 'cy-alert-button',
        },
      });
    } catch (error) {
      console.error(
        'Error al eliminar turno fijo rechazado:',
        error
      );

      mostrarError(
        'No pudimos eliminar la solicitud',
        error?.message ||
          'Ocurrió un error al eliminar el turno fijo rechazado.'
      );
    } finally {
      setEliminandoTurnoFijoId(null);
    }
  };

  /*
    Resuelve el id real del deporte para solicitar un turno fijo.
    Priorizamos los datos reales de la cancha/club recibidos del backend.
    Si esos objetos no traen el id, intentamos consultar el catálogo de deportes.
    No usamos a ciegas el id de la constante visual DEPORTES.
  */
  const resolverIdDeporteTurnoFijo = async () => {
    const idCanchaSeleccionada =
      canchaSeleccionada?.id ?? canchaSeleccionada?.id_cancha ?? null;

    const canchaReal = clubActual?.detallesCanchas?.find((cancha) => {
      const idCancha = cancha?.id ?? cancha?.id_cancha ?? null;

      return (
        idCanchaSeleccionada !== null &&
        idCancha !== null &&
        String(idCancha) === String(idCanchaSeleccionada)
      );
    });

    const candidatos = [
      canchaSeleccionada?.id_deporte,
      canchaSeleccionada?.idDeporte,
      canchaSeleccionada?.deporteId,
      canchaSeleccionada?.deporte?.id_deporte,
      canchaSeleccionada?.deporte?.id,
      canchaReal?.id_deporte,
      canchaReal?.idDeporte,
      canchaReal?.deporteId,
      canchaReal?.deporte?.id_deporte,
      canchaReal?.deporte?.id,
    ];

    const idDirecto = candidatos
      .map((valor) => Number(valor))
      .find((valor) => Number.isInteger(valor) && valor > 0);

    if (idDirecto) return idDirecto;

    const token = localStorage.getItem('token');
    const rutasCatalogo = ['/deporte', '/deportes'];

    for (const ruta of rutasCatalogo) {
      try {
        const response = await fetch(apiUrl(ruta), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) continue;

        const data = await response.json();
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.deportes)
            ? data.deportes
            : [];

        const deporteEncontrado = lista.find((deporte) => {
          const nombre =
            deporte?.nombre_deporte ??
            deporte?.nombre ??
            deporte?.deporte ??
            '';

          return (
            normalizarTexto(nombre) ===
            normalizarTexto(deporteSeleccionado)
          );
        });

        const idEncontrado = Number(
          deporteEncontrado?.id_deporte ??
          deporteEncontrado?.id ??
          deporteEncontrado?.idDeporte
        );

        if (Number.isInteger(idEncontrado) && idEncontrado > 0) {
          return idEncontrado;
        }
      } catch (error) {
        console.warn(
          `No se pudo consultar el catálogo de deportes en ${ruta}:`,
          error
        );
      }
    }

    return null;
  };

  /*
    Carga todos los turnos configurados de la cancha seleccionada para poder
    ofrecer días y horarios válidos al solicitar un turno fijo.

    Si la cancha nunca tuvo configuración propia, conserva el comportamiento
    histórico: todos los días, de 09:00 a 22:00, con turnos de 60 minutos.
  */
  const cargarOpcionesTurnoFijo = async () => {
    const idCancha =
      canchaSeleccionada?.id ?? canchaSeleccionada?.id_cancha ?? null;

    if (!idCancha) {
      throw new Error('No pudimos identificar la cancha seleccionada.');
    }

    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/disponibilidad/cancha/${idCancha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        'No pudimos consultar los horarios habilitados para esta cancha.'
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return Array.from({ length: 7 }, (_, diaSemana) =>
        HORARIOS.map((turno) => {
          const horaInicio = turno.hora;
          const inicioMinutos = convertirHoraAMinutos(horaInicio);
          const finMinutos = inicioMinutos + 60;
          const horasFin = Math.floor(finMinutos / 60);
          const minutosFin = finMinutos % 60;

          return {
            dia_semana: diaSemana,
            hora_inicio: horaInicio,
            hora_fin: `${String(horasFin).padStart(2, '0')}:${String(
              minutosFin
            ).padStart(2, '0')}`,
          };
        })
      ).flat();
    }

    return data
      .map((item) => ({
        dia_semana: Number(item?.dia_semana),
        hora_inicio: normalizarHoraParaComparar(item?.hora_inicio),
        hora_fin: normalizarHoraParaComparar(item?.hora_fin),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.dia_semana) &&
          item.dia_semana >= 0 &&
          item.dia_semana <= 6 &&
          item.hora_inicio
      );
  };

  /*
    Abre el flujo de solicitud de turno fijo sin alterar el wizard normal.
    El usuario elige día + hora; la cancha definitiva la asignará el club
    cuando apruebe la solicitud.
  */
  const solicitarTurnoFijo = async () => {
    if (!canchaSeleccionada || !clubActual || !deporteSeleccionado) {
      mostrarError(
        'Faltan datos',
        'Primero elegí el deporte y una cancha para continuar.'
      );
      return;
    }

    const idClub = Number(
      canchaSeleccionada?.clubId ??
      canchaSeleccionada?.id_club ??
      clubActual?.id ??
      clubActual?.id_club
    );

    if (!Number.isInteger(idClub) || idClub <= 0) {
      mostrarError(
        'Club inválido',
        'No pudimos identificar el club seleccionado.'
      );
      return;
    }

    Swal.fire({
      title: 'Preparando turnos disponibles...',
      text: 'Estamos consultando los días y horarios habilitados.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        popup: 'cy-alert-popup',
        title: 'cy-alert-title',
        htmlContainer: 'cy-alert-text',
      },
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const [idDeporte, opciones] = await Promise.all([
        resolverIdDeporteTurnoFijo(),
        cargarOpcionesTurnoFijo(),
      ]);

      if (!idDeporte) {
        throw new Error(
          'No pudimos identificar el deporte seleccionado. Reintentá en unos segundos.'
        );
      }

      if (!opciones.length) {
        Swal.close();
        mostrarError(
          'Sin horarios habilitados',
          'La cancha seleccionada no tiene días ni horarios habilitados para solicitar un turno fijo.'
        );
        return;
      }

      const diasDisponiblesTurnoFijo = [
        ...new Set(opciones.map((item) => Number(item.dia_semana))),
      ].sort((a, b) => a - b);

      const opcionesDiasHtml = diasDisponiblesTurnoFijo
        .map(
          (dia) =>
            `<option value="${dia}">${NOMBRES_DIAS_TURNO_FIJO[dia]}</option>`
        )
        .join('');

      const resultado = await Swal.fire({
        icon: 'question',
        title: 'Solicitar turno fijo',
        html: `
          <div style="text-align:left;">
            <p style="margin:0 0 14px;">
              Elegí el día y horario que te gustaría mantener todas las semanas.
            </p>

            <label for="turno-fijo-dia" style="display:block;font-weight:700;margin-bottom:6px;">
              Día de la semana
            </label>
            <select
              id="turno-fijo-dia"
              class="swal2-select"
              style="display:block;width:100%;margin:0 0 16px;"
            >
              ${opcionesDiasHtml}
            </select>

            <label for="turno-fijo-hora" style="display:block;font-weight:700;margin-bottom:6px;">
              Horario
            </label>
            <select
              id="turno-fijo-hora"
              class="swal2-select"
              style="display:block;width:100%;margin:0;"
            ></select>

            <small style="display:block;margin-top:14px;line-height:1.45;">
              La cancha definitiva será asignada por el club cuando apruebe la solicitud.
            </small>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Enviar solicitud',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          htmlContainer: 'cy-alert-text',
          confirmButton: 'cy-alert-button',
        },
        didOpen: () => {
          const popup = Swal.getPopup();
          const selectDia = popup?.querySelector('#turno-fijo-dia');
          const selectHora = popup?.querySelector('#turno-fijo-hora');

          const actualizarHorarios = () => {
            if (!selectDia || !selectHora) return;

            const diaSeleccionado = Number(selectDia.value);
            const horariosDelDia = [
              ...new Set(
                opciones
                  .filter(
                    (item) =>
                      Number(item.dia_semana) === diaSeleccionado
                  )
                  .map((item) => item.hora_inicio)
                  .filter(Boolean)
              ),
            ].sort();

            selectHora.innerHTML = horariosDelDia
              .map(
                (hora) =>
                  `<option value="${hora}">${hora} hs</option>`
              )
              .join('');
          };

          actualizarHorarios();
          selectDia?.addEventListener('change', actualizarHorarios);
        },
        preConfirm: () => {
          const popup = Swal.getPopup();
          const selectDia = popup?.querySelector('#turno-fijo-dia');
          const selectHora = popup?.querySelector('#turno-fijo-hora');

          const diaSemana = Number(selectDia?.value);
          const horaInicio = String(selectHora?.value || '').trim();

          if (
            !Number.isInteger(diaSemana) ||
            diaSemana < 0 ||
            diaSemana > 6 ||
            !horaInicio
          ) {
            Swal.showValidationMessage(
              'Seleccioná un día y un horario válidos.'
            );
            return false;
          }

          return {
            dia_semana: diaSemana,
            hora_inicio: horaInicio,
          };
        },
      });

      if (!resultado.isConfirmed || !resultado.value) return;

      Swal.fire({
        title: 'Enviando solicitud...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          htmlContainer: 'cy-alert-text',
        },
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/turno-fijo/solicitudes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_club: idClub,
            id_deporte: idDeporte,
            dia_semana: resultado.value.dia_semana,
            hora_inicio: resultado.value.hora_inicio,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const mensaje = Array.isArray(data?.message)
          ? data.message.join(' ')
          : data?.message ||
            'No pudimos enviar la solicitud de turno fijo.';

        throw new Error(mensaje);
      }

      setRefrescoTurnosFijosUsuario((valor) => valor + 1);

      await Swal.fire({
        icon: 'success',
        title: 'Solicitud enviada',
        text:
          'El club recibió tu solicitud de turno fijo. Podrás consultar su estado en Mis turnos fijos.',
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'cy-alert-popup',
          title: 'cy-alert-title',
          htmlContainer: 'cy-alert-text',
          confirmButton: 'cy-alert-button',
        },
      });
    } catch (error) {
      Swal.close();

      console.error(
        'Error al solicitar turno fijo:',
        error
      );

      mostrarError(
        'No pudimos enviar la solicitud',
        error?.message ||
          'Ocurrió un error al solicitar el turno fijo.'
      );
    }
  };

  /*
    Reinicia el wizard completo.
    Vuelve al paso 1.
  */
  const reiniciarReserva = () => {
    setDeporteSeleccionado(null);
    setClubSeleccionado(null);
    setCanchaSeleccionada(null);
    setFechaSeleccionada(null);
    setHorarioSeleccionado(null);
    setReservaEnEdicion(null);
    setMenuReservaAbierto(null);
  };

  /*
    Abre o cierra el menú de tres puntos de una reserva.
    Si la reserva ya no puede gestionarse, no abre el menú.
  */
  const alternarMenuReserva = (reserva, event) => {
    const puedeAbrirMenu =
      reserva.puedeGestionar ||
      esReservaPasada(reserva) ||
      puedeEliminarReserva(reserva);

    if (!puedeAbrirMenu) return;

    // Segundo toque sobre la misma reserva: cerrar.
    if (menuReservaAbierto === reserva.id) {
      setMenuReservaAbierto(null);
      setMenuReservaPosicion(null);
      return;
    }

    const esMobile = window.matchMedia('(max-width: 760px)').matches;

    if (esMobile && event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();

      const anchoMenu = 172;
      const cantidadAcciones =
        (!esReservaPasada(reserva) && reserva.puedeGestionar ? 1 : 0) +
        (puedeEliminarReserva(reserva) ? 1 : 0);

      const altoMenu = Math.max(54, cantidadAcciones * 44 + 14);
      const margen = 6;

      // Alineado al borde derecho del botón ⋮.
      const left = Math.min(
        Math.max(10, rect.right - anchoMenu),
        window.innerWidth - anchoMenu - 10
      );

      // Si no entra debajo del botón, se abre arriba.
      const espacioDebajo = window.innerHeight - rect.bottom;
      const top =
        espacioDebajo >= altoMenu + margen
          ? rect.bottom + margen
          : Math.max(10, rect.top - altoMenu - margen);

      setMenuReservaPosicion({
        top,
        left,
        width: anchoMenu,
      });
    } else {
      setMenuReservaPosicion(null);
    }

    setMenuReservaAbierto(reserva.id);
  };

  /*
    Carga una reserva existente dentro del wizard para modificarla.
    La reserva solo puede editarse si faltan al menos 2 horas para el turno.
  */
  const iniciarModificacionReserva = (reserva) => {
    if (!reserva.puedeGestionar) return;

    // Guardamos la reserva original para eliminarla al confirmar la nueva
    setReservaEnEdicion(reserva);

    // Mantenemos deporte, club y cancha seleccionados
    setDeporteSeleccionado(reserva.deporte || null);
    setClubSeleccionado(reserva.club || null);
    const clubDeLaReserva = buscarClubPorNombre(reserva.club, clubesActivos);
    const canchaDeLaReserva = clubDeLaReserva?.detallesCanchas?.find((cancha) =>
      reserva.id_cancha
        ? cancha.id === reserva.id_cancha
        : cancha.nombre === reserva.cancha
    );
    setCanchaSeleccionada(canchaDeLaReserva || null);

    // Limpiamos fecha y hora para que el usuario elija nuevos
    setFechaSeleccionada(null);
    setHorarioSeleccionado(null);

    setMenuReservaAbierto(null);

    // Llevamos al usuario al panel de selección
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /*
    Elimina o cancela una reserva existente.
    Antes de borrar muestra una confirmación visual con SweetAlert2.
    Solo se permite cancelar si faltan al menos 2 horas para el turno.
  */
  const eliminarReserva = async (reserva) => {
    const reservaPasada = esReservaPasada(reserva);

    if (!reserva.puedeGestionar && !reservaPasada) {
      mostrarError(
        'No se puede cancelar',
        'Las reservas solo pueden cancelarse o modificarse con al menos 2 horas de anticipación.'
      );
      return;
    }

    const resultado = await Swal.fire({
      icon: 'warning',
      title: reservaPasada ? '¿Borrar reserva del panel?' : '¿Cancelar reserva?',
      text: `Vas a ${reservaPasada ? 'borrar del panel' : 'cancelar'} la reserva de ${reserva.club}, del ${reserva.fecha} a las ${reserva.hora} hs. Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: reservaPasada ? 'Sí, borrar' : 'Sí, cancelar',
      cancelButtonText: 'Volver',
      reverseButtons: true,
      customClass: {
        popup: 'cy-alert-popup',
        title: 'cy-alert-title',
        htmlContainer: 'cy-alert-text',
        confirmButton: 'cy-alert-button cy-alert-button--danger',
        cancelButton: 'cy-alert-cancel',
      },
    });

    if (!resultado.isConfirmed) return;

    try {
      const token = localStorage.getItem('token'); // Asegúrate de que el token esté almacenado en localStorage
      const response = await fetch(apiUrl(`/reserva/${reserva.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar la reserva en el servidor.');
      }

      if (usuario?.email) {
        try {
          const responseMail = await fetch(apiUrl('/contact/reserva'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              nombre: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim(),
              email: usuario.email,
              subject: 'Reserva cancelada',
              razonSocial: '',
              message: `Tu reserva en ${reserva.club} (${reserva.cancha}) para el ${reserva.fecha} a las ${reserva.hora} hs fue cancelada.`,
              fecha: normalizarFechaParaComparar(reserva.fecha),
              hora: reserva.hora,
              cancha: reserva.cancha,
              club: reserva.club,
            }),
          });

          if (!responseMail.ok) {
            const errorText = await responseMail.text();
            console.error('Error al enviar el correo de cancelación:', responseMail.status, errorText);
          }
        } catch (mailError) {
          console.warn('El correo de cancelación no se pudo enviar:', mailError);
        }
      }

      // Libera inmediatamente el horario también en el estado local de
      // disponibilidad. El backend ya marca la reserva como cancelada, y con
      // esto el usuario no necesita cambiar de fecha/cancha para verla libre.
      setReservasDelServidor((prev) =>
        prev.filter(
          (item) =>
            Number(item?.id_reserva ?? item?.id) !==
            Number(reserva.id_reserva ?? reserva.id)
        )
      );

      setReservasEliminadas((prev) => [...prev, reserva.id]);
      onDeleteReserva?.(reserva.id);
      if (onRefreshReservas) {
        onRefreshReservas();
      }
      setMenuReservaAbierto(null);

      mostrarExito(
        reservaPasada ? 'Reserva borrada' : 'Reserva cancelada',
        reservaPasada
          ? 'La reserva fue quitada del panel correctamente.'
          : 'La reserva fue cancelada correctamente.'
      );
    } catch (error) {
      console.error('Error al eliminar reserva:', error);
      mostrarError(
        'No se pudo cancelar',
        error.message || 'Hubo un problema al cancelar la reserva. Intentá nuevamente.'
      );
    }
  };

  /*
    Confirma la reserva.
    Envía la nueva reserva hacia App.jsx mediante onAddReserva
    y abre el modal de confirmación visual.
  */
  const confirmarReserva = async () => {
    if (pasoActual !== 5) return;
    if (enviandoReserva) return;

    if (esFechaPasada(fechaSeleccionada)) return;
    if (esHorarioPasado(fechaSeleccionada, horarioSeleccionado)) return;

    if (esHorarioOcupado(horarioSeleccionado)) {
      mostrarError(
        'Horario no disponible',
        'Ese horario no está disponible porque ya fue reservado o bloqueado por el club.'
      );
      setHorarioSeleccionado(null);
      return;
    }

    if (!canchaSeleccionada) {
      mostrarError(
        'No hay cancha disponible',
        'No se encontró una cancha disponible para este deporte en el club seleccionado.'
      );
      return;
    }

    const confirmacionTurno = await Swal.fire({
      icon: 'info',
      title: 'Confirmar turno',
      text: 'El turno deberá abonarse en su totalidad en el club antes de disputar el partido. Si realizás una transferencia, enviá el comprobante al WhatsApp de la cancha.',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar reserva',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#087bff',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      customClass: {
        popup: 'cy-alert-popup',
        title: 'cy-alert-title',
        htmlContainer: 'cy-alert-text',
        confirmButton: 'cy-alert-button',
        cancelButton: 'cy-alert-cancel',
      },
    });

    if (!confirmacionTurno.isConfirmed) return;

    // Snapshot del estado de edición ANTES de cualquier await.
    const reservaEnEdicionSnapshot = reservaEnEdicion;
    const estaModificando = Boolean(reservaEnEdicionSnapshot?.id);

    const estadoPagoAnterior = normalizarEstadoPago(
      reservaEnEdicionSnapshot?.estado_pago
    );
    const debeConservarPagoAnterior = estadoPagoAnterior === 'pagado';

    const fechaSQL = normalizarFechaParaComparar(fechaSeleccionada);

    const horaFinSeleccionada = obtenerHoraFinTurno(horarioSeleccionado);

    if (!horaFinSeleccionada) {
      mostrarError(
        'Horario inválido',
        'No pudimos determinar la hora de finalización de este turno.'
      );
      return;
    }

    const reservaDTO = {
      id_usuario: usuario.id_usuario,
      id_cancha: canchaSeleccionada.id ?? canchaSeleccionada.id_cancha,
      fecha: fechaSQL,
      hora_inicio: `${horarioSeleccionado}:00`,
      hora_fin: `${horaFinSeleccionada}:00`,
      monto_total: canchaSeleccionada.precio || 0,
      estado: 'confirmada',
    };

    setEnviandoReserva(true);

    try {
      const token = localStorage.getItem('token');

      const horarioOcupadoEnServidor =
        await verificarHorarioOcupadoEnServidor(horarioSeleccionado);

      if (horarioOcupadoEnServidor) {
        mostrarError(
          'Horario no disponible',
          'Ese horario acaba de quedar ocupado o fue bloqueado por el club. Elegí otro turno.'
        );
        setHorarioSeleccionado(null);
        return;
      }

      const endpointReserva = estaModificando
        ? apiUrl(`/reserva/${reservaEnEdicionSnapshot.id}`)
        : apiUrl('/reserva');

      const response = await fetch(endpointReserva, {
        method: estaModificando ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reservaDTO),
      });

      if (!response.ok) {
        let detalleError = null;

        try {
          detalleError = await response.json();
        } catch {
          detalleError = null;
        }

        if (response.status === 409) {
          setHorarioSeleccionado(null);
          mostrarError(
            'Horario no disponible',
            detalleError?.message ||
            'Ese horario no está disponible porque ya fue reservado o bloqueado por el club.'
          );
          return;
        }

        mostrarError(
          estaModificando ? 'No se pudo modificar' : 'No se pudo reservar',
          detalleError?.message ||
          (estaModificando
            ? 'Hubo un problema al modificar la reserva. La reserva original se conservó sin cambios.'
            : 'Hubo un problema al procesar la reserva en el servidor.')
        );
        return;
      }

      const guardada = await response.json();
      setReservasDelServidor((prev) =>
        estaModificando
          ? prev.map((item) =>
            Number(item?.id_reserva || item?.id) ===
              Number(reservaEnEdicionSnapshot.id)
              ? guardada
              : item
          )
          : [...prev, guardada]
      );

      // El backend modifica la misma reserva de forma atómica. Solo limpiamos
      // la copia anterior del estado local para evitar una tarjeta duplicada.
      if (estaModificando && onDeleteReserva) {
        onDeleteReserva(reservaEnEdicionSnapshot.id);
      }

      const nuevaReserva = {
        id: guardada?.id_reserva || Date.now(),
        id_reserva: guardada?.id_reserva || null,
        id_cancha: canchaSeleccionada.id ?? canchaSeleccionada.id_cancha,
        deporte: deporteSeleccionado,
        club: clubSeleccionado,
        cancha: canchaSeleccionada.nombre,
        fecha: fechaSeleccionada,
        hora: horarioSeleccionado,
        estado: 'Confirmada',
        estado_pago: debeConservarPagoAnterior
          ? estadoPagoAnterior
          : normalizarEstadoPago(guardada?.estado_pago || 'pago_en_club'),
        monto_total: guardada?.monto_total || canchaSeleccionada.precio || canchaSeleccionada.precio_por_hora || 0,
        puedeGestionar: puedeGestionarPorAnticipacion(
          crearFechaHoraDesdeReserva(fechaSeleccionada, horarioSeleccionado)
        ),
        limite: '2 hs antes del turno',
        direccion: clubActual?.direccion || '',
        ciudad: clubActual?.ciudad || '',
        provincia: clubActual?.provincia || '',
        accion: estaModificando ? 'modificada' : 'confirmada',
      };

      if (onAddReserva) {
        onAddReserva(nuevaReserva);
      }

      // ÚNICO MAIL PARA RESERVA CONFIRMADA O MODIFICADA.
      if (usuario?.email) {
        try {
          const subject = estaModificando
            ? 'Reserva modificada'
            : 'Reserva confirmada';

          const message = estaModificando
            ? `Tu reserva fue modificada correctamente para ${canchaSeleccionada?.nombre || ''} en ${clubSeleccionado || ''} el ${fechaSeleccionada} a las ${horarioSeleccionado} hs. Recordá que el turno debe abonarse en su totalidad en el club antes de disputar el partido.`
            : `Tu reserva fue confirmada correctamente para ${canchaSeleccionada?.nombre || ''} en ${clubSeleccionado || ''} el ${fechaSeleccionada} a las ${horarioSeleccionado} hs. Recordá que el turno debe abonarse en su totalidad en el club antes de disputar el partido.`;

          const responseMail = await fetch(apiUrl('/contact/reserva'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              nombre: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim(),
              email: usuario.email,
              subject,
              razonSocial: '',
              message,
              fecha: fechaSQL,
              hora: horarioSeleccionado,
              cancha: canchaSeleccionada?.nombre || '',
              club: clubSeleccionado || '',
            }),
          });

          if (!responseMail.ok) {
            const errorText = await responseMail.text();
            console.error(
              'Error al enviar el correo de reserva:',
              responseMail.status,
              errorText
            );
          }
        } catch (mailError) {
          console.warn('El correo de reserva no se pudo enviar:', mailError);
        }
      }

      if (onRefreshReservas) {
        await onRefreshReservas();
      }

      setReservaConfirmada(nuevaReserva);
      setMostrarModalReserva(true);
      setReservaEnEdicion(null);
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      mostrarError(
        'Error de conexión',
        'No se pudo conectar con el servidor. Revisá que el backend esté levantado e intentá nuevamente.'
      );
    } finally {
      setEnviandoReserva(false);
    }
  };

  /*
    Cierra el modal de confirmación y reinicia el formulario.
    La reserva no se pierde porque ya fue enviada a App.jsx.
  */
  const cerrarModalReserva = () => {
    setMostrarModalReserva(false);
    setReservaConfirmada(null);
    reiniciarReserva();
  };

  /*
    Permite volver a pasos anteriores desde la columna izquierda.
    Si el usuario vuelve a un paso, se limpian las selecciones posteriores
    para evitar reservas con datos mezclados.
  */
  const irAlPaso = (numeroPaso) => {
    if (numeroPaso > pasoActual) return;

    if (numeroPaso === 1) {
      setDeporteSeleccionado(null);
      setClubSeleccionado(null);
      setCanchaSeleccionada(null);
      setFechaSeleccionada(null);
      setHorarioSeleccionado(null);
      setMenuReservaAbierto(null);
      return;
    }

    if (numeroPaso === 2) {
      setClubSeleccionado(null);
      setCanchaSeleccionada(null);
      setFechaSeleccionada(null);
      setHorarioSeleccionado(null);
      return;
    }

    if (numeroPaso === 3) {
      setFechaSeleccionada(null);
      setHorarioSeleccionado(null);
      return;
    }

    if (numeroPaso === 4) {
      setHorarioSeleccionado(null);
    }
  };

  /*
    Devuelve las clases del menú lateral de pasos.
    Activo = paso actual, completo = paso ya elegido, bloqueado = todavía no disponible.
  */
  const obtenerClasePasoLateral = (numeroPaso) => {
    const clases = ['booking-side-step'];

    if (pasoActual === numeroPaso) clases.push('active');
    if (pasoActual > numeroPaso) clases.push('done');
    if (pasoActual < numeroPaso) clases.push('locked');

    return clases.join(' ');
  };

  return (
    <main className="dashboard-usuario">
      {/*
        Banners laterales exclusivos del DashboardUsuario.
        No usan clases globales como .banner-vertical para no romper el login ni otras pantallas.
      */}
      {bannerIzquierdo && (
        <aside
          className="dashboard-banner dashboard-banner--left"
          aria-label="Publicidad izquierda"
          style={{ '--banner-img': `url(${bannerIzquierdo})` }}
        />
      )}

      {bannerDerecho && (
        <aside
          className="dashboard-banner dashboard-banner--right"
          aria-label="Publicidad derecha"
          style={{ '--banner-img': `url(${bannerDerecho})` }}
        />
      )}
      <div className="dashboard-usuario__overlay">
        <div className="dashboard-shell">
          <section className="dashboard-shell__main">
            <header className="dashboard-header">
              <div className="dashboard-header__brand">
                <img
                  src={logoDameCancha}
                  alt="DameCancha"
                  className="dashboard-header__logo-img"
                />
              </div>

              <nav className="dashboard-header__social">
                {gmailComposeUrl && (
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Email"
                  >
                    <i className="bi bi-envelope-fill" aria-hidden="true"></i>
                  </a>
                )}

                {CONTACT.instagramUrl && (
                  <a
                    href={CONTACT.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <i className="bi bi-instagram" aria-hidden="true"></i>
                  </a>
                )}

                {CONTACT.facebookUrl && (
                  <a
                    href={CONTACT.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <i className="bi bi-facebook" aria-hidden="true"></i>
                  </a>
                )}
              </nav>

              <div className="dashboard-header__user">
                <span>Hola, {usuario?.nombre || 'Anonimo'} 👋</span>

                <div className="dashboard-header__avatar">
                  {(usuario?.nombre?.[0] || 'A').toUpperCase()}
                </div>

                {onLogout && (
                  <button
                    type="button"
                    className="dashboard-header__logout"
                    onClick={onLogout}
                  >
                    Salir
                  </button>
                )}
              </div>
            </header>

            <section className="dashboard-layout">
              <section className="booking-panel booking-panel--expanded">
                <div className="booking-panel__top">
                  <div>
                    <h1>Reservá tu cancha</h1>
                    <p>Elegí tu deporte, cancha, fecha y horario en pocos pasos</p>
                  </div>

                  <div className="steps-indicator">
                    <div className={`step ${obtenerEstadoPaso(1)}`}>
                      <span>1</span>
                      <small>Deporte</small>
                    </div>

                    <div className={`step ${obtenerEstadoPaso(2)}`}>
                      <span>2</span>
                      <small>Cancha</small>
                    </div>

                    <div className={`step ${obtenerEstadoPaso(3)}`}>
                      <span>3</span>
                      <small>Fecha</small>
                    </div>

                    <div className={`step ${obtenerEstadoPaso(4)}`}>
                      <span>4</span>
                      <small>Horario</small>
                    </div>

                    <div className={`step ${obtenerEstadoPaso(5)}`}>
                      <span>5</span>
                      <small>Confirmar</small>
                    </div>
                  </div>
                </div>

                <div className="booking-wizard">
                  {/* Menú lateral del wizard: muestra el progreso y permite volver a pasos anteriores. */}
                  <aside className="booking-sidebar" aria-label="Pasos de la reserva">
                    <button
                      type="button"
                      className={obtenerClasePasoLateral(1)}
                      onClick={() => irAlPaso(1)}
                    >
                      <span>1</span>
                      <div>
                        <strong>Deporte</strong>
                        <small>{deporteSeleccionado || 'Seleccioná el deporte'}</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={obtenerClasePasoLateral(2)}
                      onClick={() => irAlPaso(2)}
                      disabled={pasoActual < 2}
                    >
                      <span>2</span>
                      <div>
                        <strong>Cancha</strong>
                        <small>{nombreCanchaSeleccionada !== '—' ? nombreCanchaSeleccionada : 'Elegí la cancha'}</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={obtenerClasePasoLateral(3)}
                      onClick={() => irAlPaso(3)}
                      disabled={pasoActual < 3}
                    >
                      <span>3</span>
                      <div>
                        <strong>Fecha</strong>
                        <small>{fechaSeleccionada || 'Elegí el día'}</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={obtenerClasePasoLateral(4)}
                      onClick={() => irAlPaso(4)}
                      disabled={pasoActual < 4}
                    >
                      <span>4</span>
                      <div>
                        <strong>Horario</strong>
                        <small>{horarioSeleccionado ? `${horarioSeleccionado} hs` : 'Elegí el horario'}</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={obtenerClasePasoLateral(5)}
                      onClick={() => irAlPaso(5)}
                      disabled={pasoActual < 5}
                    >
                      <span>5</span>
                      <div>
                        <strong>Confirmar</strong>
                        <small>Revisá tu reserva</small>
                      </div>
                    </button>
                  </aside>

                  {/* Card principal: cambia el contenido según el paso activo. */}
                  <section className="booking-stage">
                    {pasoActual === 1 && (
                      <div className="stage-content stage-content--sports">
                        <div className="stage-heading">
                          <span className="stage-kicker">Paso 1</span>
                          <h2>Elegí el deporte</h2>
                          <p>Seleccioná qué querés jugar para mostrarte clubes compatibles.</p>
                        </div>

                        <div className="sports-grid sports-grid--large">
                          {deportesDisponibles.length > 0 ? (
                            deportesDisponibles.map((deporte) => (
                              <button
                                key={deporte.id}
                                type="button"
                                className={
                                  deporteSeleccionado === deporte.nombre
                                    ? 'sport-card sport-card--large selected'
                                    : 'sport-card sport-card--large'
                                }
                                onClick={() => seleccionarDeporte(deporte)}
                              >
                                <span className="sport-card__icon">
                                  <img
                                    src={deporte.icono}
                                    alt={deporte.nombre}
                                    className="sport-card__image"
                                  />
                                </span>

                                <strong>{deporte.nombre}</strong>
                              </button>
                            ))
                          ) : (
                            <div className="empty-clubs-message">
                              No hay deportes disponibles en este momento.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {pasoActual === 2 && (
                      <div className="stage-content stage-content--clubs">
                        <div className="stage-heading">
                          <span className="stage-kicker">Paso 2</span>
                          <h2>Elegí la cancha</h2>
                          <p>
                            Estas son todas las canchas de {deporteSeleccionado || 'el deporte seleccionado'} disponibles.
                          </p>
                        </div>

                        {cargandoTorneos && (
                          <div className="tournament-context-loading">
                            <i className="bi bi-arrow-repeat"></i>
                            Buscando torneos de {deporteSeleccionado}...
                          </div>
                        )}

                        {!cargandoTorneos &&
                          torneosDelDeporteSeleccionado.length > 0 && (
                            <section
                              className="tournament-context"
                              aria-label={`Torneos disponibles de ${deporteSeleccionado}`}
                            >
                              <div className="tournament-context__header">
                                <div>
                                  <span className="tournament-context__eyebrow">
                                    <i className="bi bi-trophy-fill"></i>
                                    Oportunidad especial
                                  </span>
                                  <h3>
                                    {torneosDelDeporteSeleccionado.length === 1
                                      ? `Hay un torneo de ${deporteSeleccionado}`
                                      : `Hay ${torneosDelDeporteSeleccionado.length} torneos de ${deporteSeleccionado}`}
                                  </h3>
                                  <p>
                                    Podés inscribirte o continuar normalmente con tu reserva.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="tournament-context__continue"
                                  onClick={seguirReservando}
                                >
                                  Seguir reservando
                                  <i className="bi bi-arrow-down"></i>
                                </button>
                              </div>

                              <div className="tournament-context__list">
                                {torneosDelDeporteSeleccionado.map((torneo) => {
                                  const nombreClub =
                                    obtenerNombreClubTorneo(torneo);
                                  const flyerUrl =
                                    construirUrlFlyerTorneo(torneo.flyer_url);

                                  return (
                                    <article
                                      key={torneo.id_torneo}
                                      className="tournament-context-card"
                                    >
                                      <button
                                        type="button"
                                        className="tournament-context-card__media"
                                        onClick={() => abrirDetalleTorneo(torneo)}
                                        aria-label={`Ver detalles de ${torneo.titulo}`}
                                      >
                                        {flyerUrl ? (
                                          <img
                                            src={flyerUrl}
                                            alt={`Flyer de ${torneo.titulo}`}
                                          />
                                        ) : (
                                          <span>
                                            <i className="bi bi-trophy-fill"></i>
                                          </span>
                                        )}
                                      </button>

                                      <div className="tournament-context-card__body">
                                        <span className="tournament-context-card__sport">
                                          {obtenerNombreDeporteTorneo(torneo)}
                                        </span>

                                        <h4>{torneo.titulo}</h4>

                                        <p className="tournament-context-card__club">
                                          <i className="bi bi-geo-alt-fill"></i>
                                          {nombreClub}
                                        </p>

                                        <p className="tournament-context-card__date">
                                          <i className="bi bi-calendar-event"></i>
                                          {formatearFechaTorneo(torneo.fecha_inicio)}
                                          {torneo.fecha_fin &&
                                            torneo.fecha_fin !== torneo.fecha_inicio
                                            ? ` al ${formatearFechaTorneo(
                                              torneo.fecha_fin
                                            )}`
                                            : ''}
                                        </p>

                                        <div className="tournament-context-card__actions">
                                          <button
                                            type="button"
                                            className="tournament-context-card__details"
                                            onClick={() =>
                                              abrirDetalleTorneo(torneo)
                                            }
                                          >
                                            Ver torneo
                                          </button>

                                          <button
                                            type="button"
                                            className="tournament-context-card__join"
                                            onClick={() =>
                                              abrirDetalleTorneo(torneo)
                                            }
                                          >
                                            Inscribirme ahora
                                          </button>
                                        </div>
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </section>
                          )}

                        <div
                          ref={canchasPasoDosRef}
                          className="clubs-selection-section"
                        >
                          {torneosDelDeporteSeleccionado.length > 0 && (
                            <div className="clubs-selection-section__heading">
                              <span>¿Preferís reservar un turno?</span>
                              <strong>Elegí una cancha y continuá</strong>
                            </div>
                          )}

                          <div className="clubs-grid clubs-grid--large">
                            {canchasDisponibles.length > 0 ? (
                              canchasDisponibles.map((cancha) => {
                                const servicios = obtenerServiciosCancha(cancha);
                                const serviciosAbiertos = estanServiciosAbiertos(cancha);
                                const canchaId =
                                  cancha.id ?? cancha.id_cancha ?? obtenerClaveCancha(cancha);
                                const canchaSeleccionadaId =
                                  canchaSeleccionada?.id ??
                                  canchaSeleccionada?.id_cancha ??
                                  null;
                                const anunciosCancha =
                                  anunciosPorClub.get(String(cancha.clubId)) || [];

                                return (
                                  <article
                                    key={`${cancha.clubId}-${canchaId}`}
                                    className={
                                      String(canchaSeleccionadaId) === String(canchaId)
                                        ? 'club-card club-card--large selected'
                                        : 'club-card club-card--large'
                                    }
                                  >
                                    <button
                                      type="button"
                                      className="club-card__summary"
                                      onClick={() => alternarServiciosCancha(cancha)}
                                      aria-expanded={serviciosAbiertos}
                                      aria-label={`Ver servicios disponibles de ${cancha.clubNombre}`}
                                    >
                                      <div className="club-card__logo">
                                        {cancha.clubLogo ? (
                                          <img
                                            src={cancha.clubLogo}
                                            alt={`Logo de ${cancha.clubNombre}`}
                                            className="club-card__logo-img"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.parentElement.textContent =
                                                cancha.clubNombre
                                                  .split(' ')
                                                  .filter(Boolean)
                                                  .slice(0, 2)
                                                  .map((palabra) => palabra[0])
                                                  .join('')
                                                  .toUpperCase();
                                            }}
                                          />
                                        ) : (
                                          cancha.clubNombre
                                            .split(' ')
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((palabra) => palabra[0])
                                            .join('')
                                            .toUpperCase()
                                        )}
                                      </div>

                                      <strong>{cancha.clubNombre}</strong>
                                      <small>
                                        {cancha.deporte || deporteSeleccionado}
                                      </small>
                                      <small>{cancha.clubDireccion}</small>
                                      <span className="club-card__price">
                                        {cancha.precio || cancha.precio_por_hora
                                          ? `$${Number(
                                            cancha.precio ||
                                            cancha.precio_por_hora
                                          ).toLocaleString('es-AR')}/hora`
                                          : 'Precio a confirmar'}
                                      </span>

                                      <span className="club-card__services-hint">
                                        <i className="bi bi-stars"></i>
                                        {servicios.length > 0
                                          ? `${servicios.length} servicio${servicios.length === 1 ? '' : 's'} disponible${servicios.length === 1 ? '' : 's'}`
                                          : 'Servicios a confirmar'}
                                      </span>
                                    </button>

                                    {anunciosCancha.length > 0 && (
                                      <button
                                        type="button"
                                        className="club-card__bulletin"
                                        onClick={() =>
                                          setCarteleraSeleccionada({
                                            clubId: cancha.clubId,
                                            clubNombre: cancha.clubNombre,
                                            anuncios: anunciosCancha,
                                          })
                                        }
                                      >
                                        <i className="bi bi-pin-angle-fill"></i>
                                        <span>
                                          {anunciosCancha.length} anuncio
                                          {anunciosCancha.length === 1 ? '' : 's'} en cartelera
                                        </span>
                                        <i className="bi bi-chevron-right"></i>
                                      </button>
                                    )}

                                    {serviciosAbiertos && (
                                      <div className="club-card__amenities">
                                        <h4>Servicios disponibles</h4>

                                        {servicios.length > 0 ? (
                                          <ul>
                                            {servicios.map((servicio) => (
                                              <li key={servicio}>
                                                <i className="bi bi-check-circle-fill"></i>
                                                {servicio}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p>
                                            Este club todavía no informó sus servicios
                                            o amenidades.
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    <div className="club-card__actions">
                                      <button
                                        type="button"
                                        className="club-card__services-toggle"
                                        onClick={() => alternarServiciosCancha(cancha)}
                                        aria-expanded={serviciosAbiertos}
                                      >
                                        <i className="bi bi-info-circle"></i>
                                        {serviciosAbiertos
                                          ? 'Ocultar servicios'
                                          : 'Ver servicios'}
                                      </button>

                                      <button
                                        type="button"
                                        className="club-card__select"
                                        onClick={() => seleccionarCanchaDesdeBoton(cancha)}
                                      >
                                        Elegir cancha
                                      </button>
                                    </div>
                                  </article>
                                );
                              })
                            ) : (
                              <div className="empty-clubs-message">
                                {deporteSeleccionado
                                  ? `No hay canchas disponibles para ${deporteSeleccionado}`
                                  : 'Primero elegí un deporte'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {pasoActual === 3 && (
                      <div className="stage-content stage-content--dates">
                        <div className="stage-heading">
                          <span className="stage-kicker">Paso 3</span>
                          <h2>Elegí la fecha</h2>
                          <p>
                            Seleccioná un día disponible para jugar en {nombreCanchaSeleccionada}.
                          </p>
                        </div>

                        {!reservaEnEdicion && (
                          <section
                            className="tournament-context"
                            aria-label="Solicitud de turno fijo"
                          >
                            <div className="tournament-context__header">
                              <div>
                                <span className="stage-kicker">Turno fijo</span>
                                <h3>¿Querés solicitar un turno fijo?</h3>
                                <p>
                                  Elegí un día y horario semanal. El club revisará
                                  tu solicitud y asignará la cancha al aprobarla.
                                </p>
                              </div>

                              <button
                                type="button"
                                className="club-card__select"
                                onClick={solicitarTurnoFijo}
                              >
                                Solicitar turno fijo
                              </button>
                            </div>
                          </section>
                        )}

                        <div className="date-selector date-selector--large">
                          <div className="date-selector__month">
                            <button
                              type="button"
                              onClick={() => cambiarMes(-1)}
                              disabled={!puedeRetrocederMes}
                              aria-label="Ver mes anterior"
                            >
                              ‹
                            </button>

                            <strong>{tituloMes}</strong>

                            <button
                              type="button"
                              onClick={() => cambiarMes(1)}
                              aria-label="Ver mes siguiente"
                            >
                              ›
                            </button>
                          </div>

                          <div className="date-selector__days date-selector__days--large">
                            {diasDisponibles.map((dia) => {
                              const fechaBloqueada = esFechaPasada(dia.fecha);

                              return (
                                <button
                                  key={dia.fecha}
                                  type="button"
                                  className={
                                    fechaSeleccionada === dia.fecha
                                      ? 'day-card day-card--large selected'
                                      : fechaBloqueada
                                        ? 'day-card day-card--large disabled'
                                        : 'day-card day-card--large'
                                  }
                                  onClick={() => seleccionarFecha(dia.fecha)}
                                  disabled={fechaBloqueada}
                                >
                                  <small>{dia.dia}</small>
                                  <strong>{dia.numero}</strong>
                                  <em>{dia.fecha}</em>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {pasoActual === 4 && (
                      <div className="stage-content stage-content--times">
                        <div className="stage-heading">
                          <span className="stage-kicker">Paso 4</span>
                          <h2>Elegí el horario</h2>
                          <p>
                            Horarios disponibles para el {fechaSeleccionada} en {nombreCanchaSeleccionada}.
                          </p>
                        </div>

                        {errorDisponibilidad && (
                          <div className="availability-inline-error" role="status">
                            <i className="bi bi-exclamation-circle"></i>
                            <span>{errorDisponibilidad}</span>
                          </div>
                        )}

                        <div className="time-grid time-grid--large">
                          {cargandoHorariosCancha ? (
                            <div className="empty-clubs-message">
                              Cargando horarios disponibles...
                            </div>
                          ) : horariosDeCancha.length > 0 ? (
                            <>
                              {horariosDeCancha.map((hora) => {
                                const horarioPasado = esHorarioPasado(
                                  fechaSeleccionada,
                                  hora
                                );
                                const horarioOcupado = esHorarioOcupado(hora);
                                const horarioBloqueado =
                                  cargandoReservasDelServidor ||
                                  Boolean(errorDisponibilidad) ||
                                  horarioPasado ||
                                  horarioOcupado;

                                const textoDisponibilidad = cargandoReservasDelServidor
                                  ? 'Verificando'
                                  : errorDisponibilidad
                                    ? 'Sin verificar'
                                    : horarioOcupado
                                      ? 'No disponible'
                                      : horarioPasado
                                        ? 'No disponible'
                                        : '';

                                const claseEstadoHorario = horarioOcupado
                                  ? ' time-card--occupied'
                                  : horarioPasado
                                    ? ' time-card--past'
                                    : errorDisponibilidad
                                      ? ' time-card--verification-error'
                                      : cargandoReservasDelServidor
                                        ? ' time-card--checking'
                                        : '';

                                return (
                                  <button
                                    key={hora}
                                    type="button"
                                    disabled={horarioBloqueado}
                                    className={
                                      horarioSeleccionado === hora
                                        ? 'time-card time-card--large selected'
                                        : `time-card time-card--large${claseEstadoHorario}`
                                    }
                                    onClick={() => seleccionarHorario(hora)}
                                    aria-label={
                                      textoDisponibilidad
                                        ? `${hora} - ${textoDisponibilidad}`
                                        : `${hora} - disponible`
                                    }
                                  >
                                    <span className="time-card__hour">{hora}</span>
                                    {textoDisponibilidad && (
                                      <small className="time-card__status">
                                        {textoDisponibilidad}
                                      </small>
                                    )}
                                  </button>
                                );
                              })}

                              <div className="time-grid__legend">
                                <span>
                                  <i className="legend-dot available" />
                                  Disponible
                                </span>

                                <span>
                                  <i className="legend-dot unavailable" />
                                  No disponible
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="empty-clubs-message">
                              No hay turnos habilitados para este día.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {pasoActual === 5 && (
                      <div className="stage-content stage-content--confirm">
                        <div className="stage-heading">
                          <span className="stage-kicker">Paso 5</span>
                          <h2>Confirmá tu reserva</h2>
                          <p>Revisá que los datos estén correctos antes de confirmar.</p>
                        </div>

                        <div className="booking-summary booking-summary--large">
                          <div className="summary-item">
                            <span>⚽</span>
                            <small>Deporte</small>
                            <strong>{deporteSeleccionado || '—'}</strong>
                          </div>

                          <div className="summary-item">
                            <span>🛡️</span>
                            <small>Club</small>
                            <strong>{clubSeleccionado || '—'}</strong>
                          </div>

                          <div className="summary-item">
                            <span>🏟️</span>
                            <small>Cancha</small>
                            <strong>{nombreCanchaSeleccionada}</strong>
                          </div>

                          <div className="summary-item">
                            <span>📅</span>
                            <small>Fecha</small>
                            <strong>{fechaSeleccionada || '—'}</strong>
                          </div>

                          <div className="summary-item">
                            <span>🕒</span>
                            <small>Horario</small>
                            <strong>{horarioSeleccionado || '—'}</strong>
                          </div>
                        </div>

                        <div className="confirm-actions confirm-actions--large">
                          <button
                            type="button"
                            className="confirm-button"
                            onClick={confirmarReserva}
                            disabled={pasoActual !== 5 || enviandoReserva}
                          >
                            {enviandoReserva
                              ? 'Procesando...'
                              : reservaEnEdicion
                                ? '✓ Guardar cambios'
                                : '✓ Confirmar reserva'}
                          </button>

                          <button
                            type="button"
                            className="reset-button"
                            onClick={reiniciarReserva}
                            disabled={enviandoReserva}
                          >
                            {reservaEnEdicion ? 'Cancelar modificación' : 'Reiniciar selección'}
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                <div className="booking-warning">
                  ℹ️ Recordá: las cancelaciones o modificaciones deben realizarse
                  con al menos 2 horas de anticipación.
                </div>
              </section>

              <aside className="reservations-panel">
                <BancoSuplentesCard onOpen={onOpenBancoSuplentes} />
                <div className="reservations-panel__header">
                  <h2>Mis Reservas</h2>
                </div>

                {proximaReserva ? (
                  <div className="next-reservation">
                    <div>
                      <h3>Próxima reserva</h3>
                      <span className={obtenerClaseEstadoReserva(proximaReserva.estado)}>
                        {proximaReserva.estado}
                      </span>
                    </div>

                    <div className="next-reservation__body">
                      <div className="next-reservation__logo">
                        {proximaReserva.club?.slice(0, 2).toUpperCase() || 'CY'}
                      </div>

                      <div>
                        <strong>
                          {proximaReserva.fecha} · {proximaReserva.hora} hs
                        </strong>
                        <p>
                          {proximaReserva.deporte} · {proximaReserva.cancha}
                        </p>
                        <small>
                          📍 {proximaReserva.club}
                          {proximaReserva.direccion
                            ? `, ${proximaReserva.direccion}`
                            : ''}
                        </small>
                      </div>
                    </div>

                    <ClubUbicacionMapa
                      club={proximaReserva.club}
                      direccion={proximaReserva.direccion}
                      ciudad={proximaReserva.ciudad}
                      provincia={proximaReserva.provincia}
                      titulo="Cómo llegar"
                    />
                  </div>
                ) : (
                  <div className="next-reservation next-reservation--empty">
                    <div>
                      <h3>Próxima reserva</h3>
                    </div>

                    <p>Todavía no tenés reservas activas.</p>
                  </div>
                )}

                <h3 className="reservations-panel__subtitle">
                  Reservas activas
                </h3>

                <div className="reservations-list">
                  {reservasDelUsuario.length > 0 ? (
                    reservasDelUsuario.map((reserva) => {
                      const reservaPasada = esReservaPasada(reserva);

                      return (
                        <article
                          key={reserva.id}
                          className={`reservation-card ${menuReservaAbierto === reserva.id
                            ? 'reservation-card--menu-open'
                            : ''
                            }`}
                        >
                          <div className="reservation-card__date">
                            <small>{reserva.diaSemana}</small>
                            <strong>{reserva.dia}</strong>
                            <small>{reserva.mes}</small>
                          </div>

                          <div className="reservation-card__info">
                            <strong>{reserva.hora} hs</strong>
                            <p>
                              {reserva.deporte} · {reserva.club}
                            </p>
                            <small>{reserva.cancha}</small>
                          </div>

                          <div className="reservation-card__actions">
                            {normalizarTexto(reserva.estado) !== 'pendiente' && (
                              <span className={obtenerClaseEstadoReserva(reserva.estado)}>
                                {reserva.estado}
                              </span>
                            )}

                            {reservaPasada ? (
                              <small>Turno finalizado</small>
                            ) : reserva.puedeGestionar ? (
                              <small>
                                Podés cancelar o modificar hasta {reserva.limite}
                              </small>
                            ) : (
                              <small>Menos de 2 hs de anticipación</small>
                            )}

                            <div className="reservation-card__menu">
                              <button
                                type="button"
                                className="reservation-card__menu-button"
                                onClick={(event) => alternarMenuReserva(reserva, event)}
                                disabled={
                                  !reserva.puedeGestionar &&
                                  !puedeEliminarReserva(reserva)
                                }
                                title={
                                  reservaPasada
                                    ? 'Borrar del panel'
                                    : reserva.puedeGestionar
                                      ? 'Gestionar reserva'
                                      : 'No se puede gestionar con menos de 2 horas'
                                }
                              >
                                ⋮
                              </button>

                              {menuReservaAbierto === reserva.id &&
                                (reserva.puedeGestionar || puedeEliminarReserva(reserva)) && (
                                  <div className="reservation-card__dropdown">
                                    {!reservaPasada && reserva.puedeGestionar && (
                                      <button
                                        type="button"
                                        onClick={() => iniciarModificacionReserva(reserva)}
                                      >
                                        <i className="bi bi-pencil-square"></i>
                                        Modificar
                                      </button>
                                    )}

                                    {puedeEliminarReserva(reserva) && (
                                      <button
                                        type="button"
                                        className="reservation-card__dropdown-danger"
                                        onClick={() => eliminarReserva(reserva)}
                                      >
                                        <i className="bi bi-trash3"></i>
                                        {reservaPasada ? 'Borrar del panel' : 'Eliminar'}
                                      </button>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="reservations-empty">
                      <strong>No tenés reservas activas</strong>
                      <small>
                        Cuando confirmes un nuevo turno, va a aparecer acá.
                      </small>
                    </div>
                  )}
                </div>

                <h3 className="reservations-panel__subtitle">
                  Mis turnos fijos
                </h3>

                <div className="reservations-list">
                  {cargandoTurnosFijosUsuario ? (
                    <div className="reservations-empty">
                      <strong>Cargando turnos fijos...</strong>
                    </div>
                  ) : turnosFijosUsuario.length > 0 ? (
                    turnosFijosUsuario.map((turno) => {
                      const nombreDia =
                        NOMBRES_DIAS_TURNO_FIJO[
                          Number(turno.dia_semana)
                        ] || 'Día';

                      const horaInicio =
                        normalizarHoraParaComparar(
                          turno.hora_inicio
                        ) || '—';

                      const horaFin = turno.hora_fin
                        ? normalizarHoraParaComparar(
                            turno.hora_fin
                          )
                        : null;

                      return (
                        <article
                          key={`turno-fijo-${turno.id_turno_fijo}`}
                          className="reservation-card"
                        >
                          <div className="reservation-card__date">
                            <small>FIJO</small>
                            <strong>
                              {nombreDia.slice(0, 3).toUpperCase()}
                            </strong>
                            <small>
                              {horaInicio}
                            </small>
                          </div>

                          <div className="reservation-card__info">
                            <strong>
                              {horaInicio}
                              {horaFin ? ` a ${horaFin}` : ' hs'}
                            </strong>
                            <p>
                              {turno.deporte?.nombre_deporte || 'Deporte'} ·{' '}
                              {turno.club?.nombre_club || 'Club'}
                            </p>
                            <small>
                              {turno.cancha?.nombre_cancha ||
                                'Cancha a asignar'}
                            </small>
                          </div>

                          <div className="reservation-card__actions">
                            <span
                              className={obtenerClaseEstadoTurnoFijo(
                                turno.estado
                              )}
                            >
                              {obtenerTextoEstadoTurnoFijo(
                                turno.estado
                              )}
                            </span>

                            {turno.estado === 'pendiente' && (
                              <small>
                                Esperando respuesta del club
                              </small>
                            )}

                            {turno.estado === 'activo' && (
                              <small>
                                Se repite todas las semanas
                              </small>
                            )}

                            {turno.estado === 'rechazado' && (
                              <small>
                                El club respondió tu solicitud
                              </small>
                            )}

                            <button
                              type="button"
                              className="reservation-card__menu-button"
                              onClick={() =>
                                verDetalleTurnoFijo(turno)
                              }
                              title="Ver detalle del turno fijo"
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            {turno.estado === 'rechazado' && (
                              <button
                                type="button"
                                className="reservation-card__menu-button"
                                onClick={() =>
                                  eliminarTurnoFijoRechazado(turno)
                                }
                                disabled={
                                  Number(eliminandoTurnoFijoId) ===
                                  Number(turno.id_turno_fijo)
                                }
                                title="Eliminar solicitud rechazada"
                                aria-label="Eliminar solicitud rechazada"
                              >
                                <i
                                  className={
                                    Number(eliminandoTurnoFijoId) ===
                                    Number(turno.id_turno_fijo)
                                      ? 'bi bi-arrow-repeat'
                                      : 'bi bi-trash'
                                  }
                                ></i>
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="reservations-empty">
                      <strong>No tenés turnos fijos</strong>
                      <small>
                        Las solicitudes que hagas van a aparecer acá.
                      </small>
                    </div>
                  )}
                </div>

              </aside>
            </section>

            <footer className="dashboard-benefits">
              <div>
                <span>⚡</span>
                <strong>Reserva fácil y rápida</strong>
                <small>En pocos pasos y desde cualquier dispositivo</small>
              </div>

              <div>
                <span>🕒</span>
                <strong>Cancelá o modificá</strong>
                <small>Hasta 2 horas antes del turno</small>
              </div>

              <div>
                <span>🎧</span>
                <strong>Soporte siempre</strong>
                <small>Estamos para ayudarte</small>
              </div>
            </footer>
          </section>
        </div>
      </div>

      {carteleraSeleccionada && (
        <div
          className="bulletin-detail-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCarteleraSeleccionada(null);
            }
          }}
        >
          <section
            className="bulletin-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulletin-detail-title"
          >
            <button
              type="button"
              className="bulletin-detail-modal__close"
              onClick={() => setCarteleraSeleccionada(null)}
              aria-label="Cerrar cartelera"
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <div className="bulletin-detail-modal__header">
              <span>
                <i className="bi bi-pin-angle-fill"></i>
                CARTELERA DEL CLUB
              </span>
              <h2 id="bulletin-detail-title">
                {carteleraSeleccionada.clubNombre}
              </h2>
              <p>
                {carteleraSeleccionada.anuncios.length} anuncio
                {carteleraSeleccionada.anuncios.length === 1 ? '' : 's'} publicado
                {carteleraSeleccionada.anuncios.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="bulletin-detail-modal__list">
              {carteleraSeleccionada.anuncios.map((anuncio) => {
                const imagenUrl = construirUrlImagenAnuncio(
                  anuncio.imagen_url
                );

                return (
                  <article
                    className="bulletin-detail-card"
                    key={anuncio.id_anuncio}
                  >
                    {imagenUrl && (
                      <div className="bulletin-detail-card__image">
                        <img
                          src={imagenUrl}
                          alt={
                            anuncio.titulo
                              ? `Flyer de ${anuncio.titulo}`
                              : 'Flyer del anuncio'
                          }
                        />
                      </div>
                    )}

                    <div className="bulletin-detail-card__content">
                      <span className="bulletin-detail-card__badge">
                        <i className="bi bi-megaphone-fill"></i>
                        Anuncio
                      </span>

                      <h3>{anuncio.titulo || 'Novedad del club'}</h3>
                      <p>{anuncio.contenido}</p>

                      {anuncio.created_at && (
                        <small>
                          Publicado el{' '}
                          {new Date(anuncio.created_at).toLocaleDateString(
                            'es-AR'
                          )}
                        </small>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {torneoSeleccionado && (
        <div
          className="tournament-detail-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarDetalleTorneo();
            }
          }}
        >
          <article
            className="tournament-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tournament-detail-title"
          >
            <button
              type="button"
              className="tournament-detail-modal__close"
              onClick={cerrarDetalleTorneo}
              aria-label="Cerrar detalle del torneo"
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <div className="tournament-detail-modal__flyer">
              {construirUrlFlyerTorneo(torneoSeleccionado.flyer_url) ? (
                <img
                  src={construirUrlFlyerTorneo(
                    torneoSeleccionado.flyer_url
                  )}
                  alt={`Flyer de ${torneoSeleccionado.titulo}`}
                />
              ) : (
                <div className="tournament-detail-modal__flyer-empty">
                  <i className="bi bi-trophy-fill"></i>
                </div>
              )}
            </div>

            <div className="tournament-detail-modal__content">
              <span className="tournament-detail-modal__badge">
                <i className="bi bi-trophy-fill"></i>
                {obtenerNombreDeporteTorneo(torneoSeleccionado)}
              </span>

              <h2 id="tournament-detail-title">
                {torneoSeleccionado.titulo}
              </h2>

              <div className="tournament-detail-modal__meta">
                <p>
                  <i className="bi bi-building"></i>
                  <span>
                    <small>Organiza</small>
                    <strong>
                      {obtenerNombreClubTorneo(torneoSeleccionado)}
                    </strong>
                  </span>
                </p>

                <p>
                  <i className="bi bi-calendar-event"></i>
                  <span>
                    <small>Fecha</small>
                    <strong>
                      {formatearFechaTorneo(
                        torneoSeleccionado.fecha_inicio
                      )}
                      {torneoSeleccionado.fecha_fin &&
                        torneoSeleccionado.fecha_fin !==
                        torneoSeleccionado.fecha_inicio
                        ? ` al ${formatearFechaTorneo(
                          torneoSeleccionado.fecha_fin
                        )}`
                        : ''}
                    </strong>
                  </span>
                </p>

                <p>
                  <i className="bi bi-chat-dots"></i>
                  <span>
                    <small>Contacto</small>
                    <strong>
                      {torneoSeleccionado.contacto ||
                        'A confirmar por el club'}
                    </strong>
                  </span>
                </p>
              </div>

              <div className="tournament-detail-modal__description">
                <h3>Información del torneo</h3>
                <p>{torneoSeleccionado.descripcion}</p>
              </div>

              <div className="tournament-detail-modal__notice">
                <i className="bi bi-info-circle-fill"></i>
                <p>
                  La inscripción se coordina directamente con el club
                  organizador. Tu flujo de reserva permanece disponible.
                </p>
              </div>

              <div className="tournament-detail-modal__actions">
                <button
                  type="button"
                  className="tournament-detail-modal__secondary"
                  onClick={() => {
                    cerrarDetalleTorneo();
                    seguirReservando();
                  }}
                >
                  Seguir reservando
                </button>

                <button
                  type="button"
                  className="tournament-detail-modal__primary"
                  onClick={() => contactarPorTorneo(torneoSeleccionado)}
                >
                  <i className="bi bi-send-fill"></i>
                  Contactar para inscribirme
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {reservaMenuActiva && menuReservaPosicion && (
        <div
          className="reservation-mobile-menu-layer"
          role="presentation"
          onClick={() => {
            setMenuReservaAbierto(null);
            setMenuReservaPosicion(null);
          }}
        >
          <div
            className="reservation-mobile-menu"
            role="menu"
            aria-label="Acciones de la reserva"
            style={{
              top: `${menuReservaPosicion.top}px`,
              left: `${menuReservaPosicion.left}px`,
              width: `${menuReservaPosicion.width}px`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {!reservaMenuActivaPasada && reservaMenuActiva.puedeGestionar && (
              <button
                type="button"
                className="reservation-mobile-menu__button reservation-mobile-menu__button--edit"
                onClick={() => {
                  setMenuReservaPosicion(null);
                  iniciarModificacionReserva(reservaMenuActiva);
                }}
              >
                <i className="bi bi-pencil-square"></i>
                Modificar
              </button>
            )}

            {puedeEliminarReserva(reservaMenuActiva) && (
              <button
                type="button"
                className="reservation-mobile-menu__button reservation-mobile-menu__button--delete"
                onClick={() => {
                  const reservaAEliminar = reservaMenuActiva;
                  setMenuReservaAbierto(null);
                  setMenuReservaPosicion(null);
                  eliminarReserva(reservaAEliminar);
                }}
              >
                <i className="bi bi-trash3"></i>
                {reservaMenuActivaPasada ? 'Borrar del panel' : 'Eliminar'}
              </button>
            )}
          </div>
        </div>
      )}

      {mostrarModalReserva && reservaConfirmada && (
        <div className="reserva-modal-overlay">
          <div className="reserva-modal">
            <div className="reserva-modal__icon">✓</div>

            <h2>
              {reservaConfirmada.accion === 'modificada'
                ? '¡Reserva modificada!'
                : '¡Reserva confirmada!'}
            </h2>

            <p className="reserva-modal__subtitle">
              {reservaConfirmada.accion === 'modificada'
                ? 'Los cambios de tu turno fueron guardados correctamente.'
                : 'Tu turno fue registrado correctamente.'}
            </p>

            <div className="reserva-modal__details">
              <div>
                <span>Deporte</span>
                <strong>{reservaConfirmada.deporte}</strong>
              </div>

              <div>
                <span>Club</span>
                <strong>{reservaConfirmada.club}</strong>
              </div>

              <div>
                <span>Cancha</span>
                <strong>{reservaConfirmada.cancha}</strong>
              </div>

              <div>
                <span>Fecha</span>
                <strong>{reservaConfirmada.fecha}</strong>
              </div>

              <div>
                <span>Horario</span>
                <strong>{reservaConfirmada.hora}</strong>
              </div>

              <div>
                <span>Pago</span>
                <strong>{obtenerTextoEstadoPago(reservaConfirmada.estado_pago)}</strong>
              </div>
            </div>

            <div className="reserva-modal__actions">
              <button
                type="button"
                className="reserva-modal__button"
                onClick={cerrarModalReserva}
              >
                Nueva reserva
              </button>

              <button
                type="button"
                className="reserva-modal__button reserva-modal__button--secondary"
                onClick={cerrarModalReserva}
              >
                Ver mis reservas
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default DashboardUsuario;
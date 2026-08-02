import { API_URL, apiUrl, mediaUrl } from '../../config/api';
import { CONTACT, emailHref } from '../../config/contact';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './DashboardUsuario.css';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
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

const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, {
    locale: 'es-AR',
  });
}

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
  Obtiene el id de cancha sin depender de una única forma de respuesta.
  Soporta reservas aplanadas y reservas con la relación cancha anidada.
*/
const obtenerIdCanchaReserva = (reserva) =>
  reserva?.id_cancha ??
  reserva?.cancha_id ??
  reserva?.cancha?.id_cancha ??
  reserva?.cancha?.id ??
  null;

const obtenerNombreCanchaReserva = (reserva) => {
  if (typeof reserva?.cancha === 'string') return reserva.cancha;

  return (
    reserva?.cancha?.nombre ||
    reserva?.cancha?.nombre_cancha ||
    reserva?.nombre_cancha ||
    ''
  );
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
  Si faltan 24 horas o menos para el turno, no se permite modificar ni eliminar.
*/
const HORAS_MINIMAS_PARA_GESTIONAR = 24;

/*
  Indica si una reserva todavía puede modificarse o eliminarse.
  La regla funcional es: solo se puede gestionar si faltan más de 24 horas.
*/
const puedeGestionarPorAnticipacion = (fechaHoraDate) => {
  if (!(fechaHoraDate instanceof Date) || Number.isNaN(fechaHoraDate.getTime())) {
    return false;
  }

  const ahora = new Date();
  const diferenciaEnMs = fechaHoraDate.getTime() - ahora.getTime();
  const horasRestantes = diferenciaEnMs / (1000 * 60 * 60);

  return horasRestantes > HORAS_MINIMAS_PARA_GESTIONAR;
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
  const estado = normalizarTexto(estadoPago || 'pendiente');

  if (
    estado === 'pagado' ||
    estado === 'approved' ||
    estado === 'approved_demo' ||
    estado === 'aprobado' ||
    estado === 'pagada online'
  ) {
    return 'pagado';
  }

  if (
    estado === 'pago_en_club' ||
    estado === 'pago en club' ||
    estado === 'paid_on_site'
  ) {
    return 'pago_en_club';
  }

  if (
    estado === 'rechazado' ||
    estado === 'rejected' ||
    estado === 'rejected_demo' ||
    estado === 'failure'
  ) {
    return 'rechazado';
  }

  return 'pendiente';
};

const obtenerTextoEstadoPago = (estadoPago) => {
  const estado = normalizarEstadoPago(estadoPago);

  if (estado === 'pagado') return 'Pagada online';
  if (estado === 'pago_en_club') return 'Pago en club';
  if (estado === 'rechazado') return 'Pago rechazado';

  return 'Pago pendiente';
};

const obtenerClaseEstadoPago = (estadoPago) => {
  const estado = normalizarEstadoPago(estadoPago);

  if (estado === 'pagado' || estado === 'pago_en_club') {
    return 'status status--confirmed';
  }

  if (estado === 'rechazado') {
    return 'status status--blocked';
  }

  return 'status status--pending';
};

const reservaEstaPagada = (reserva) => {
  if (!reserva) return false;

  const estadoPago = normalizarEstadoPago(
    reserva.estado_pago || reserva.mercado_pago_status
  );

  return ['pagado', 'pago_en_club'].includes(estadoPago);
};

const puedePagarReserva = (reserva) => {
  if (!reserva) return false;
  if (esReservaPasada(reserva)) return false;

  const estadoReserva = normalizarTexto(reserva.estado || '');

  if (estadoReserva.includes('cancelada') || estadoReserva.includes('cancelado')) {
    return false;
  }

  return !reservaEstaPagada(reserva);
};

const puedeEliminarReserva = (reserva) => {
  if (!reserva) return false;

  /*
    Regla de negocio:
    si la reserva ya está pagada, no se puede eliminar/cancelar desde el usuario.
    Solo se permite modificarla mientras cumpla la regla de anticipación.
  */
  if (reservaEstaPagada(reserva)) return false;

  return reserva.puedeGestionar || esReservaPasada(reserva);
};

const esReservaPasada = (reserva) => {
  if (!reserva?.fechaHoraDate) return false;

  return reserva.fechaHoraDate < new Date();
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
      reserva.limite || '24 hs antes del turno',
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
        const response = await fetch(`${API_URL}/torneo/publicados`, {
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

  /*
    Horarios disponibles reales de la cancha seleccionada.
    Se cargan desde el backend cuando el usuario elige una cancha.
    Si la cancha no tiene horarios configurados, se muestran todos los del sistema.
  */
  const [horariosDeCancha, setHorariosDeCancha] = useState([]);

  /*
    Ocupaciones reales de la cancha y fecha recibidas desde el backend.
    Incluyen reservas normales y bloqueos creados por el dueño del club.
    No reemplazan las reservas del usuario que se muestran en el panel lateral.
  */
  const [reservasDelServidor, setReservasDelServidor] = useState([]);
  const [cargandoReservasDelServidor, setCargandoReservasDelServidor] =
    useState(false);

  const obtenerReservasDelServidor = async (signal) => {
    const idCancha =
      canchaSeleccionada?.id ?? canchaSeleccionada?.id_cancha ?? null;
    const fecha = normalizarFechaParaComparar(fechaSeleccionada);

    if (!idCancha || !fecha) return [];

    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/reserva/disponibilidad/${idCancha}/${fecha}`,
      {
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
    De esta forma, el selector no depende solamente del estado local del usuario
    y también reconoce reservas creadas por otras personas.
  */
  useEffect(() => {
    if (!canchaSeleccionada || !fechaSeleccionada) {
      setReservasDelServidor([]);
      return undefined;
    }

    const controller = new AbortController();

    const cargarReservasOcupadas = async () => {
      setCargandoReservasDelServidor(true);

      try {
        const data = await obtenerReservasDelServidor(controller.signal);
        setReservasDelServidor(data);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error al consultar horarios ocupados:', error);
          setReservasDelServidor([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargandoReservasDelServidor(false);
        }
      }
    };

    cargarReservasOcupadas();

    return () => controller.abort();
  }, [canchaSeleccionada, fechaSeleccionada]);

  /*
    Carga los horarios disponibles de la cancha seleccionada desde el backend.
    Si la cancha no tiene disponibilidad configurada, usa todos los horarios del sistema.
  */
  useEffect(() => {
    if (!canchaSeleccionada) {
      setHorariosDeCancha([]);
      return;
    }

    const idCancha = canchaSeleccionada.id || canchaSeleccionada.id_cancha;
    if (!idCancha) return;

    const cargarHorarios = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_URL}/disponibilidad/cancha/${idCancha}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) {
          // Si no hay disponibilidad configurada, usar todos los horarios
          setHorariosDeCancha(HORARIOS.map((h) => h.hora));
          return;
        }

        const disponibilidades = await response.json();

        if (!Array.isArray(disponibilidades) || disponibilidades.length === 0) {
          // Sin configuración → mostrar todos
          setHorariosDeCancha(HORARIOS.map((h) => h.hora));
          return;
        }

        // Extraer horas únicas desde las disponibilidades
        const horasUnicas = new Set();
        disponibilidades.forEach((d) => {
          const horaCorta = d.hora_inicio?.slice(0, 5);
          if (horaCorta) horasUnicas.add(horaCorta);
        });

        // Ordenar las horas
        const horasOrdenadas = [...horasUnicas].sort();
        setHorariosDeCancha(horasOrdenadas);
      } catch (error) {
        console.error('Error al cargar horarios de cancha:', error);
        // Fallback: mostrar todos los horarios
        setHorariosDeCancha(HORARIOS.map((h) => h.hora));
      }
    };

    cargarHorarios();
  }, [canchaSeleccionada]);

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
              let deportes = c.canchas || [];
              if ((!deportes || deportes.length === 0) && Array.isArray(c.detallesCanchas)) {
                const deportesDesdeCancha = c.detallesCanchas
                  .map((cancha) => cancha.deporte)
                  .filter(Boolean);
                deportes = [...new Set(deportesDesdeCancha)];
              }

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
  const [mercadoPagoPreferenceId, setMercadoPagoPreferenceId] = useState(null);
  const [preparandoMercadoPago, setPreparandoMercadoPago] = useState(false);
  const preferenciaSolicitadaParaReservaRef = useRef(null);


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
    Estados para el menú de los tres puntos de cada reserva.
    menuReservaAbierto guarda el id de la reserva cuyo menú está abierto.
    reservaEnEdicion guarda la reserva que el usuario está modificando.
    reservasEliminadas oculta del panel las reservas canceladas/eliminadas localmente.
  */
  const [menuReservaAbierto, setMenuReservaAbierto] = useState(null);
  const [reservaEnEdicion, setReservaEnEdicion] = useState(null);
  const [reservasEliminadas, setReservasEliminadas] = useState([]);
  const [enviandoReserva, setEnviandoReserva] = useState(false);

  /*
    Guarda cambios locales de estado de pago después de simular o completar un pago.
    Esto evita que la UI quede mostrando "Pago pendiente" mientras el backend ya marcó la reserva como pagada.
  */
  const [estadoPagoLocalPorReserva, setEstadoPagoLocalPorReserva] = useState({});

  const actualizarEstadoPagoLocal = (reservaId, datosPago = {}) => {
    if (!reservaId) return;

    setEstadoPagoLocalPorReserva((prev) => ({
      ...prev,
      [String(reservaId)]: {
        ...(prev[String(reservaId)] || {}),
        ...datosPago,
      },
    }));
  };

  /*
    Al volver de Checkout Pro, consulta el backend hasta que el webhook
    haya persistido el resultado. Así el frontend nunca confía únicamente
    en los parámetros de retorno enviados por el navegador.
  */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');
    const reservaId = params.get('reservaId');

    if (!paymentResult || !reservaId) return;

    let cancelado = false;

    const limpiarParametrosPago = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('reservaId');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const esperar = (milisegundos) =>
      new Promise((resolve) => setTimeout(resolve, milisegundos));

    const consultarResultado = async () => {
      const token = localStorage.getItem('token');
      let ultimoEstado = 'pendiente';
      let ultimoResultado = null;

      try {
        for (let intento = 0; intento < 6; intento += 1) {
          const response = await fetch(
            `${API_URL}/pago/mercadopago/status/${reservaId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                'No se pudo consultar el estado del pago.'
            );
          }

          ultimoResultado = data;
          ultimoEstado = normalizarEstadoPago(
            data.estado_pago || data.mercado_pago_status
          );

          if (
            ultimoEstado === 'pagado' ||
            ultimoEstado === 'rechazado'
          ) {
            break;
          }

          if (intento < 5) {
            await esperar(1500);
          }
        }

        if (cancelado) return;

        actualizarEstadoPagoLocal(reservaId, {
          estado_pago: ultimoEstado,
          mercado_pago_status:
            ultimoResultado?.mercado_pago_status || null,
          mercado_pago_payment_id:
            ultimoResultado?.mercado_pago_payment_id || null,
          monto_pagado:
            ultimoResultado?.monto_pagado || null,
          fecha_pago:
            ultimoResultado?.fecha_pago || null,
        });

        if (onRefreshReservas) {
          await onRefreshReservas();
        }

        setMostrarModalReserva(false);
        setReservaConfirmada(null);
        setMenuReservaAbierto(null);
        reiniciarReserva();

        if (ultimoEstado === 'pagado') {
          mostrarExito(
            'Pago aprobado',
            'Tu reserva fue pagada correctamente con Mercado Pago.'
          );
        } else if (
          ultimoEstado === 'rechazado' ||
          paymentResult === 'failure'
        ) {
          mostrarError(
            'Pago rechazado',
            'Mercado Pago no pudo aprobar el pago. Podés intentarlo nuevamente.'
          );
        } else {
          await Swal.fire({
            icon: 'info',
            title: 'Pago pendiente',
            text: 'Mercado Pago todavía está procesando el pago. El estado se actualizará automáticamente.',
            confirmButtonText: 'Aceptar',
            customClass: {
              popup: 'cy-alert-popup',
              title: 'cy-alert-title',
              htmlContainer: 'cy-alert-text',
              confirmButton: 'cy-alert-button',
            },
          });
        }
      } catch (error) {
        console.error(
          'Error al verificar el retorno de Mercado Pago:',
          error
        );

        mostrarError(
          'No se pudo verificar el pago',
          error.message ||
            'La reserva seguirá visible y podrás consultar su estado nuevamente.'
        );
      } finally {
        limpiarParametrosPago();
      }
    };

    consultarResultado();

    return () => {
      cancelado = true;
    };
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
    return reservas
      .map((reserva) => normalizarReserva(reserva, clubesActivos))
      .filter(Boolean)
      .map((reserva) => {
        const pagoLocal =
          estadoPagoLocalPorReserva[String(reserva.id)] ||
          estadoPagoLocalPorReserva[String(reserva.id_reserva)] ||
          null;

        return pagoLocal
          ? {
              ...reserva,
              ...pagoLocal,
              estado_pago: normalizarEstadoPago(
                pagoLocal.estado_pago || reserva.estado_pago || reserva.mercado_pago_status
              ),
            }
          : reserva;
      })
      .filter((reserva) => !reservasEliminadas.includes(reserva.id))
      .sort((a, b) => {
        const fechaA = a.fechaHoraDate?.getTime?.() || 0;
        const fechaB = b.fechaHoraDate?.getTime?.() || 0;

        return fechaA - fechaB;
      });
  }, [reservas, clubesActivos, reservasEliminadas, estadoPagoLocalPorReserva]);

  /*
    Calcula las reservas futuras.
    Se usan para mostrar correctamente la próxima reserva.
  */
  const reservasFuturas = useMemo(() => {
    const ahora = new Date();

    return reservasDelUsuario.filter((reserva) => {
      if (!reserva.fechaHoraDate) return false;

      return reserva.fechaHoraDate >= ahora;
    });
  }, [reservasDelUsuario]);

  /*
    Obtiene la próxima reserva del usuario.
    Es la primera reserva futura ordenada por fecha y hora.
  */
  const proximaReserva = reservasFuturas[0] || null;

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
  };

  /*
    Selecciona fecha solo cuando corresponde el paso 3.
    No permite seleccionar fechas pasadas.
    Luego limpia el horario porque depende del día elegido.
  */
  const seleccionarFecha = (fecha) => {
    if (pasoActual !== 3) return;
    if (esFechaPasada(fecha)) return;

    setFechaSeleccionada(fecha);
    setHorarioSeleccionado(null);
  };

  /*
    Indica si una ocupación del backend se superpone con el turno seleccionado.

    El endpoint de disponibilidad devuelve tanto reservas como bloqueos.
    Por eso no alcanza con comparar únicamente la hora de inicio: un bloqueo
    de 17:00 a 22:00 debe deshabilitar 17:00, 18:00, 19:00, 20:00 y 21:00.
  */
  const ocupacionBloqueaTurnoSeleccionado = (ocupacion, hora) => {
    if (!ocupacion || !fechaSeleccionada || !canchaSeleccionada || !hora) {
      return false;
    }

    const esBloqueo =
      ocupacion.tipo_ocupacion === 'bloqueo' ||
      ocupacion.id_bloqueo !== null && ocupacion.id_bloqueo !== undefined;

    const idReserva = ocupacion.id_reserva ?? ocupacion.id ?? null;
    const idReservaEnEdicion =
      reservaEnEdicion?.id_reserva ?? reservaEnEdicion?.id ?? null;

    /*
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
      (
        estadoOcupacion.includes('cancelada') ||
        estadoOcupacion.includes('cancelado')
      )
    ) {
      return false;
    }

    const fechaObjetivo = normalizarFechaParaComparar(fechaSeleccionada);
    const idCanchaSeleccionada =
      canchaSeleccionada.id ?? canchaSeleccionada.id_cancha ?? null;
    const nombreCanchaActual =
      canchaSeleccionada.nombre ?? canchaSeleccionada.nombre_cancha ?? '';

    const mismaFecha =
      normalizarFechaParaComparar(ocupacion.fecha) === fechaObjetivo;

    const idCanchaOcupacion = obtenerIdCanchaReserva(ocupacion);
    const mismaCancha =
      idCanchaSeleccionada !== null && idCanchaOcupacion !== null
        ? String(idCanchaOcupacion) === String(idCanchaSeleccionada)
        : normalizarTexto(obtenerNombreCanchaReserva(ocupacion)) ===
          normalizarTexto(nombreCanchaActual);

    if (!mismaFecha || !mismaCancha) return false;

    const inicioTurno = convertirHoraAMinutos(hora);
    const finTurno = inicioTurno === null ? null : inicioTurno + 60;

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
    const ocupacionesParaValidar = [...reservas, ...reservasDelServidor];

    return ocupacionesParaValidar.some((ocupacion) =>
      ocupacionBloqueaTurnoSeleccionado(ocupacion, hora)
    );
  };

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
  const seleccionarHorario = (hora) => {
    if (pasoActual !== 4) return;
    if (cargandoReservasDelServidor) return;
    if (esHorarioPasado(fechaSeleccionada, hora)) return;
    if (esHorarioOcupado(hora)) return;

    setHorarioSeleccionado(hora);
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
  const alternarMenuReserva = (reserva) => {
    const puedeAbrirMenu =
      reserva.puedeGestionar ||
      esReservaPasada(reserva) ||
      puedePagarReserva(reserva);

    if (!puedeAbrirMenu) return;

    setMenuReservaAbierto((idActual) =>
      idActual === reserva.id ? null : reserva.id
    );
  };

  /*
    Carga una reserva existente dentro del wizard para modificarla.
    La reserva solo puede editarse si faltan más de 24 horas para el turno.
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
    Inicia el pago online de una reserva.
    Para demo local:
    - Si el backend no tiene MERCADOPAGO_ACCESS_TOKEN, permite simular aprobado/rechazado/pendiente.
    - Si el backend devuelve init_point real de Mercado Pago, redirige al checkout.
  */
  const prepararPagoConMercadoPago = async (reserva) => {
    if (!MERCADOPAGO_PUBLIC_KEY) {
      mostrarError(
        'Falta configurar Mercado Pago',
        'Creá un archivo .env en el frontend y agregá VITE_MERCADOPAGO_PUBLIC_KEY con tu Public Key de prueba.'
      );
      return;
    }

    if (!reserva?.id) {
      mostrarError(
        'Reserva no disponible',
        'No se pudo identificar la reserva para iniciar el pago.'
      );
      return;
    }

    if (!puedePagarReserva(reserva)) {
      mostrarError(
        'La reserva no se puede pagar',
        'Esta reserva ya fue pagada o no se encuentra disponible para pago online.'
      );
      return;
    }

    try {
      setPreparandoMercadoPago(true);
      setMercadoPagoPreferenceId(null);

      /*
        Cuando el pago se inicia desde el menú de una reserva existente,
        abrimos el mismo modal para mostrar allí el botón oficial.
      */
      setReservaConfirmada(reserva);
      setMostrarModalReserva(true);
      setMenuReservaAbierto(null);

      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/pago/mercadopago/preference/${reserva.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const mensajeError =
          data?.message || 'No se pudo preparar el pago.';

        if (normalizarTexto(mensajeError).includes('pagada')) {
          actualizarEstadoPagoLocal(reserva.id, {
            estado_pago: 'pagado',
            mercado_pago_status: 'approved',
          });

          setMostrarModalReserva(false);
          setReservaConfirmada(null);

          if (onRefreshReservas) {
            await onRefreshReservas();
          }
        }

        throw new Error(mensajeError);
      }

      const preferenceId =
        data.preferenceId ||
        data.preference_id ||
        data.id ||
        data.preference?.id;

      if (!preferenceId) {
        throw new Error(
          'El backend creó la operación, pero no devolvió el ID de la preferencia.'
        );
      }

      setMercadoPagoPreferenceId(String(preferenceId));
    } catch (error) {
      console.error(
        'Error al preparar pago con Mercado Pago:',
        error
      );

      mostrarError(
        'No se pudo iniciar el pago',
        error.message ||
          'Hubo un problema al conectar con Mercado Pago.'
      );
    } finally {
      setPreparandoMercadoPago(false);
    }
  };

  /*
    Cuando el modal de una reserva pendiente se abre, crea automáticamente
    la preferencia. Así el usuario ve directamente el botón oficial de
    Mercado Pago, sin un botón intermedio personalizado.
  */
  useEffect(() => {
    if (!mostrarModalReserva) {
      preferenciaSolicitadaParaReservaRef.current = null;
      return;
    }

    if (
      !reservaConfirmada?.id ||
      mercadoPagoPreferenceId ||
      preparandoMercadoPago ||
      !puedePagarReserva(reservaConfirmada)
    ) {
      return;
    }

    const idReserva = String(reservaConfirmada.id);

    if (preferenciaSolicitadaParaReservaRef.current === idReserva) {
      return;
    }

    preferenciaSolicitadaParaReservaRef.current = idReserva;
    prepararPagoConMercadoPago(reservaConfirmada);
  }, [
    mostrarModalReserva,
    reservaConfirmada?.id,
    mercadoPagoPreferenceId,
    preparandoMercadoPago,
  ]);


  /*
    Elimina o cancela una reserva existente.
    Antes de borrar muestra una confirmación visual con SweetAlert2.
    Solo se permite cancelar si faltan más de 24 horas para el turno.
  */
  const eliminarReserva = async (reserva) => {
    const reservaPasada = esReservaPasada(reserva);

    if (!reserva.puedeGestionar && !reservaPasada) {
      mostrarError(
        'No se puede cancelar',
        'Las reservas solo pueden cancelarse o modificarse con más de 24 horas de anticipación.'
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
              fecha: reserva.fecha,
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

    // Snapshot del estado de edición ANTES de cualquier await.
    const reservaEnEdicionSnapshot = reservaEnEdicion;
    const estaModificando = Boolean(reservaEnEdicionSnapshot?.id);

    const estadoPagoAnterior = reservaEnEdicionSnapshot?.estado_pago || 'pendiente';
    const debeConservarPagoAnterior = ['pagado', 'pago_en_club'].includes(estadoPagoAnterior);

    const [dia, mes, anio] = fechaSeleccionada.split('/');
    const fechaSQL = `${anio}-${mes}-${dia}`;

    const reservaDTO = {
      id_usuario: usuario.id_usuario,
      id_cancha: canchaSeleccionada.id ?? canchaSeleccionada.id_cancha,
      fecha: fechaSQL,
      hora_inicio: `${horarioSeleccionado}:00`,
      hora_fin: `${parseInt(horarioSeleccionado.split(':')[0]) + 1}:00:00`,
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
          : guardada?.estado_pago || 'pendiente',
        monto_total: guardada?.monto_total || canchaSeleccionada.precio || canchaSeleccionada.precio_por_hora || 0,
        puedeGestionar: puedeGestionarPorAnticipacion(
          crearFechaHoraDesdeReserva(fechaSeleccionada, horarioSeleccionado)
        ),
        limite: '24 hs antes del turno',
        direccion: clubActual?.direccion || '',
        ciudad: clubActual?.ciudad || '',
        provincia: clubActual?.provincia || '',
        accion: estaModificando ? 'modificada' : 'confirmada',
      };

      if (onAddReserva) {
        onAddReserva(nuevaReserva);
      }

      actualizarEstadoPagoLocal(nuevaReserva.id, {
        estado_pago: nuevaReserva.estado_pago,
      });

      // ÚNICO MAIL PARA RESERVA CONFIRMADA O MODIFICADA.
      if (usuario?.email) {
        try {
          const subject = estaModificando
            ? 'Reserva modificada'
            : 'Reserva confirmada';

          const message = estaModificando
            ? `Tu reserva fue modificada correctamente para ${canchaSeleccionada?.nombre || ''} en ${clubSeleccionado || ''} el ${fechaSeleccionada} a las ${horarioSeleccionado} hs.`
            : `Tu reserva fue confirmada correctamente para ${canchaSeleccionada?.nombre || ''} en ${clubSeleccionado || ''} el ${fechaSeleccionada} a las ${horarioSeleccionado} hs.`;

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
              fecha: fechaSeleccionada,
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
        onRefreshReservas();
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
    setMercadoPagoPreferenceId(null);
    setPreparandoMercadoPago(false);
    preferenciaSolicitadaParaReservaRef.current = null;
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
                {emailHref && (
                  <a href={emailHref} aria-label="Email">
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

                        <div className="time-grid time-grid--large">
                          {horariosDeCancha.length > 0 ? (
                            horariosDeCancha.map((hora) => {
                              const horarioBloqueado =
                                cargandoReservasDelServidor ||
                                esHorarioPasado(fechaSeleccionada, hora) ||
                                esHorarioOcupado(hora);

                              return (
                                <button
                                  key={hora}
                                  type="button"
                                  disabled={horarioBloqueado}
                                  className={
                                    horarioSeleccionado === hora
                                      ? 'time-card time-card--large selected'
                                      : horarioBloqueado
                                        ? 'time-card time-card--large disabled'
                                        : 'time-card time-card--large'
                                  }
                                  onClick={() => seleccionarHorario(hora)}
                                >
                                  {hora}
                                </button>
                              );
                            })
                          ) : (
                            <div className="empty-clubs-message">
                              Cargando horarios disponibles...
                            </div>
                          )}

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
                  con al menos 24 horas de anticipación.
                </div>
              </section>

              <aside className="reservations-panel">
                <BancoSuplentesCard onOpen={onOpenBancoSuplentes} />
                <div className="reservations-panel__header">
                  <h2>Mis Reservas</h2>
                  <button type="button">Ver historial</button>
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
                  Todas mis reservas
                </h3>

                <div className="reservations-list">
                  {reservasDelUsuario.length > 0 ? (
                    reservasDelUsuario.map((reserva) => {
                      const reservaPasada = esReservaPasada(reserva);

                      return (
                      <article key={reserva.id} className="reservation-card">
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
                          <span className={obtenerClaseEstadoReserva(reserva.estado)}>
                            {reserva.estado}
                          </span>

                          <span className={obtenerClaseEstadoPago(reserva.estado_pago)}>
                            {obtenerTextoEstadoPago(reserva.estado_pago)}
                          </span>

                          {reservaPasada ? (
                            <small>Turno finalizado</small>
                          ) : reserva.puedeGestionar ? (
                            <small>
                              Podés cancelar o modificar hasta {reserva.limite}
                            </small>
                          ) : (
                            <small>Menos de 24hs de anticipación</small>
                          )}

                          <div className="reservation-card__menu">
                            <button
                              type="button"
                              className="reservation-card__menu-button"
                              onClick={() => alternarMenuReserva(reserva)}
                              disabled={
                                !reserva.puedeGestionar &&
                                !puedePagarReserva(reserva) &&
                                !puedeEliminarReserva(reserva)
                              }
                              title={
                                reservaPasada
                                  ? 'Borrar del panel'
                                  : reservaEstaPagada(reserva) && reserva.puedeGestionar
                                    ? 'Modificar reserva'
                                    : puedePagarReserva(reserva)
                                      ? 'Pagar o gestionar reserva'
                                      : reserva.puedeGestionar
                                        ? 'Gestionar reserva'
                                        : 'No se puede gestionar con menos de 24 horas'
                              }
                            >
                              ⋮
                            </button>

                            {menuReservaAbierto === reserva.id &&
                              (reserva.puedeGestionar || puedePagarReserva(reserva) || puedeEliminarReserva(reserva)) && (
                              <div className="reservation-card__dropdown">
                                {puedePagarReserva(reserva) && (
                                  <button
                                    type="button"
                                    onClick={() => prepararPagoConMercadoPago(reserva)}
                                  >
                                    <i className="bi bi-credit-card"></i>
                                    Pagar reserva
                                  </button>
                                )}

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
                      <strong>No tenés reservas todavía</strong>
                      <small>
                        Cuando confirmes una reserva, va a aparecer acá.
                      </small>
                    </div>
                  )}
                </div>

                <button type="button" className="see-all-button">
                  Ver todas mis reservas
                </button>
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
                <small>Hasta 24 horas antes del turno</small>
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

            {puedePagarReserva(reservaConfirmada) && (
              <div
                className="reserva-modal__wallet"
                style={{ width: '100%', marginTop: '12px', minHeight: '48px' }}
              >
                {!mercadoPagoPreferenceId && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#334155',
                      fontWeight: 700,
                    }}
                  >
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                    Preparando Mercado Pago...
                  </div>
                )}

                {mercadoPagoPreferenceId && (
                  <Wallet
                    initialization={{
                      preferenceId: mercadoPagoPreferenceId,
                      redirectMode: 'self',
                    }}
                    customization={{
                      texts: {
                        valueProp: 'smart_option',
                      },
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default DashboardUsuario;
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiUrl } from '../../config/api';

const CATEGORIAS = [
  { value: 'buffet', label: 'Buffet / cantina' },
  {
    value: 'alquiler_equipamiento',
    label: 'Alquiler de equipamiento',
  },
  { value: 'evento', label: 'Evento' },
  { value: 'clase', label: 'Clase' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'otro', label: 'Otro' },
];

const obtenerHoyArgentina = () => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes
      .filter((parte) => parte.type !== 'literal')
      .map((parte) => [parte.type, parte.value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
};

const IngresosManualesClub = ({
  idClub,
  anio,
  mes,
  onCambio,
}) => {
  const hoyArgentina = obtenerHoyArgentina();

  const [anioActual, mesActual] = hoyArgentina
    .split('-')
    .map(Number);

  const periodoEditable =
    Number(anio) === anioActual &&
    Number(mes) === mesActual;

  const inicioMesActual = `${anioActual}-${String(
    mesActual
  ).padStart(2, '0')}-01`;

  const [ingresos, setIngresos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [form, setForm] = useState({
    fecha: hoyArgentina,
    categoria: 'buffet',
    concepto: '',
    monto: '',
    observaciones: '',
  });

  const formatearDinero = (valor) =>
    Number(valor || 0).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });

  const formatearFecha = (fecha) => {
    if (
      !fecha ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))
    ) {
      return fecha || '-';
    }

    const [anioFecha, mesFecha, diaFecha] =
      String(fecha).split('-');

    return `${diaFecha}/${mesFecha}/${anioFecha}`;
  };

  const obtenerCategoria = (valor) =>
    CATEGORIAS.find(
      (categoria) => categoria.value === valor
    )?.label ||
    valor ||
    'Sin categoría';

  const obtenerMensajeError = (data, fallback) => {
    if (Array.isArray(data?.message)) {
      return data.message.join(' ');
    }

    return data?.message || data?.error || fallback;
  };

  const resetearFormulario = () => {
    setForm({
      fecha: hoyArgentina,
      categoria: 'buffet',
      concepto: '',
      monto: '',
      observaciones: '',
    });

    setEditandoId(null);
    setMostrarFormulario(false);
  };

  const abrirNuevoIngreso = () => {
    setForm({
      fecha: hoyArgentina,
      categoria: 'buffet',
      concepto: '',
      monto: '',
      observaciones: '',
    });

    setEditandoId(null);
    setMostrarFormulario(true);
    setError('');
    setMensaje('');
  };

  const abrirEdicion = (ingreso) => {
    if (!periodoEditable) return;

    setEditandoId(
      Number(ingreso.id_ingreso_manual)
    );

    setForm({
      fecha: ingreso.fecha || hoyArgentina,
      categoria: ingreso.categoria || 'buffet',
      concepto: ingreso.concepto || '',
      monto:
        ingreso.monto === null ||
        ingreso.monto === undefined
          ? ''
          : String(ingreso.monto),
      observaciones:
        ingreso.observaciones || '',
    });

    setMostrarFormulario(true);
    setError('');
    setMensaje('');
  };

  const cargarIngresos = async () => {
    if (!idClub) {
      setIngresos([]);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(
        apiUrl(
          `/ingreso-manual/club/${idClub}?anio=${anio}&mes=${mes}`
        ),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudieron cargar los ingresos manuales. Error HTTP ${response.status}.`
          )
        );
      }

      setIngresos(
        Array.isArray(data?.ingresos)
          ? data.ingresos
          : []
      );
    } catch (errorCarga) {
      console.error(
        'Error al cargar ingresos manuales:',
        errorCarga
      );

      setIngresos([]);

      setError(
        errorCarga instanceof Error
          ? errorCarga.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarIngresos();

    setMostrarFormulario(false);
    setEditandoId(null);
    setMensaje('');
    setError('');

    setForm({
      fecha: hoyArgentina,
      categoria: 'buffet',
      concepto: '',
      monto: '',
      observaciones: '',
    });
  }, [idClub, anio, mes]);

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!periodoEditable) {
      setError(
        'Solo se pueden cargar o modificar ingresos manuales correspondientes al mes actual.'
      );
      return;
    }

    const concepto = String(
      form.concepto || ''
    ).trim();

    const monto = Number(form.monto);

    const observaciones = String(
      form.observaciones || ''
    ).trim();

    if (concepto.length < 2) {
      setError(
        'El concepto debe tener al menos 2 caracteres.'
      );
      return;
    }

    if (
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      setError(
        'Ingresá un monto mayor a $0.'
      );
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const editando = Boolean(editandoId);

      const url = editando
        ? apiUrl(`/ingreso-manual/${editandoId}`)
        : apiUrl('/ingreso-manual');

      const body = editando
        ? {
            fecha: form.fecha,
            categoria: form.categoria,
            concepto,
            monto,
            observaciones:
              observaciones || null,
          }
        : {
            id_club: Number(idClub),
            fecha: form.fecha,
            categoria: form.categoria,
            concepto,
            monto,
            observaciones:
              observaciones || null,
          };

      const response = await fetch(url, {
        method: editando ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            editando
              ? `No se pudo actualizar el ingreso. Error HTTP ${response.status}.`
              : `No se pudo registrar el ingreso. Error HTTP ${response.status}.`
          )
        );
      }

      resetearFormulario();

      setMensaje(
        data?.message ||
          (editando
            ? 'Ingreso manual actualizado correctamente.'
            : 'Ingreso manual registrado correctamente.')
      );

      await cargarIngresos();

      if (typeof onCambio === 'function') {
        await onCambio();
      }
    } catch (errorGuardado) {
      console.error(
        editandoId
          ? 'Error al actualizar ingreso manual:'
          : 'Error al registrar ingreso manual:',
        errorGuardado
      );

      setError(
        errorGuardado instanceof Error
          ? errorGuardado.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (ingreso) => {
    if (
      !periodoEditable ||
      !ingreso?.id_ingreso_manual
    ) {
      return;
    }

    const resultado = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar ingreso',
      html: `
        <div style="text-align:left; line-height:1.5;">
          <p>
            Vas a eliminar el ingreso:
          </p>

          <p style="margin-bottom:4px;">
            <strong>${ingreso.concepto || 'Ingreso manual'}</strong>
          </p>

          <p style="margin:0;">
            ${formatearDinero(ingreso.monto)}
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!resultado.isConfirmed) {
      return;
    }

    const idIngreso = Number(
      ingreso.id_ingreso_manual
    );

    setEliminandoId(idIngreso);
    setError('');
    setMensaje('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
        );
      }

      const response = await fetch(
        apiUrl(`/ingreso-manual/${idIngreso}`),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          obtenerMensajeError(
            data,
            `No se pudo eliminar el ingreso. Error HTTP ${response.status}.`
          )
        );
      }

      if (
        Number(editandoId) === idIngreso
      ) {
        resetearFormulario();
      }

      setMensaje(
        data?.message ||
          'Ingreso manual eliminado correctamente.'
      );

      await cargarIngresos();

      if (typeof onCambio === 'function') {
        await onCambio();
      }
    } catch (errorEliminacion) {
      console.error(
        'Error al eliminar ingreso manual:',
        errorEliminacion
      );

      setError(
        errorEliminacion instanceof Error
          ? errorEliminacion.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div
      className="pdc-panel"
      style={{
        marginTop: '20px',
      }}
    >
      <div className="pdc-panel-header">
        <div>
          <h3>Ingresos manuales declarados</h3>

          <small>
            Registrá ingresos que no pasan por una
            reserva de DameCancha, como buffet,
            alquileres, eventos, clases o sponsors.
          </small>
        </div>

        {periodoEditable &&
          !mostrarFormulario && (
            <button
              type="button"
              className="pdc-light-button"
              onClick={abrirNuevoIngreso}
            >
              <i className="bi bi-plus-circle"></i>
              Agregar ingreso
            </button>
          )}
      </div>

      {!periodoEditable && (
        <p
          className="pdc-alert pdc-alert-info"
          style={{ marginTop: '16px' }}
        >
          Este período es histórico y queda en modo
          consulta. Los ingresos manuales solo pueden
          cargarse, editarse o eliminarse durante el
          mes actual.
        </p>
      )}

      {mostrarFormulario &&
        periodoEditable && (
          <form
            onSubmit={handleGuardar}
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '16px',
              padding: '14px',
              border:
                '1px solid rgba(255,255,255,0.18)',
              borderRadius: '10px',
            }}
          >
            <div
              style={{
                gridColumn: '1 / -1',
              }}
            >
              <strong>
                {editandoId
                  ? 'Editar ingreso'
                  : 'Nuevo ingreso'}
              </strong>
            </div>

            <div className="pdc-form-group">
              <label htmlFor="ingreso-fecha">
                Fecha
              </label>

              <input
                id="ingreso-fecha"
                type="date"
                min={inicioMesActual}
                max={hoyArgentina}
                value={form.fecha}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fecha: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="pdc-form-group">
              <label htmlFor="ingreso-categoria">
                Categoría
              </label>

              <select
                id="ingreso-categoria"
                value={form.categoria}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categoria: e.target.value,
                  }))
                }
              >
                {CATEGORIAS.map(
                  (categoria) => (
                    <option
                      key={categoria.value}
                      value={categoria.value}
                    >
                      {categoria.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="pdc-form-group">
              <label htmlFor="ingreso-concepto">
                Concepto
              </label>

              <input
                id="ingreso-concepto"
                type="text"
                maxLength={180}
                placeholder="Ej: Ventas de cantina"
                value={form.concepto}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    concepto: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="pdc-form-group">
              <label htmlFor="ingreso-monto">
                Monto ($)
              </label>

              <input
                id="ingreso-monto"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ej: 15000"
                value={form.monto}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    monto: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div
              className="pdc-form-group"
              style={{
                gridColumn: '1 / -1',
              }}
            >
              <label htmlFor="ingreso-observaciones">
                Observaciones (opcional)
              </label>

              <input
                id="ingreso-observaciones"
                type="text"
                maxLength={500}
                placeholder="Ej: Recaudación del torneo del sábado"
                value={form.observaciones}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    observaciones:
                      e.target.value,
                  }))
                }
              />
            </div>

            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="submit"
                className="pdc-light-button"
                disabled={guardando}
              >
                <i className="bi bi-check-circle"></i>

                {guardando
                  ? 'Guardando...'
                  : editandoId
                    ? 'Guardar cambios'
                    : 'Guardar ingreso'}
              </button>

              <button
                type="button"
                className="pdc-light-button"
                disabled={guardando}
                onClick={() => {
                  resetearFormulario();
                  setError('');
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

      {mensaje && (
        <p
          style={{
            marginTop: '14px',
            color: '#86efac',
            fontWeight: 700,
          }}
        >
          {mensaje}
        </p>
      )}

      {error && (
        <p
          className="pdc-alert pdc-alert-info"
          style={{ marginTop: '14px' }}
        >
          {error}
        </p>
      )}

      {cargando ? (
        <p
          className="pdc-alert pdc-alert-info"
          style={{ marginTop: '16px' }}
        >
          Cargando ingresos manuales...
        </p>
      ) : ingresos.length === 0 ? (
        <p
          className="pdc-alert pdc-alert-info"
          style={{ marginTop: '16px' }}
        >
          No hay ingresos manuales registrados en
          este período.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '10px',
            marginTop: '16px',
          }}
        >
          {ingresos.map((ingreso) => {
            const procesandoEliminacion =
              Number(eliminandoId) ===
              Number(
                ingreso.id_ingreso_manual
              );

            return (
              <div
                key={ingreso.id_ingreso_manual}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px 14px',
                  border:
                    '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '9px',
                }}
              >
                <span
                  style={{
                    minWidth: '105px',
                  }}
                >
                  {formatearFecha(ingreso.fecha)}
                </span>

                <span
                  style={{
                    minWidth: '150px',
                  }}
                >
                  {obtenerCategoria(
                    ingreso.categoria
                  )}
                </span>

                <div
                  style={{
                    flex: '1 1 220px',
                    minWidth: '180px',
                  }}
                >
                  <strong>
                    {ingreso.concepto}
                  </strong>

                  {ingreso.observaciones && (
                    <small
                      style={{
                        display: 'block',
                        marginTop: '3px',
                      }}
                    >
                      {ingreso.observaciones}
                    </small>
                  )}
                </div>

                <strong
                  style={{
                    minWidth: '100px',
                    textAlign: 'right',
                  }}
                >
                  {formatearDinero(
                    ingreso.monto
                  )}
                </strong>

                {periodoEditable && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '7px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className="pdc-light-button"
                      onClick={() =>
                        abrirEdicion(ingreso)
                      }
                      disabled={
                        procesandoEliminacion ||
                        guardando
                      }
                      title="Editar ingreso"
                    >
                      <i className="bi bi-pencil"></i>
                      Editar
                    </button>

                    <button
                      type="button"
                      className="pdc-light-button"
                      onClick={() =>
                        handleEliminar(ingreso)
                      }
                      disabled={
                        procesandoEliminacion ||
                        guardando
                      }
                      title="Eliminar ingreso"
                      style={{
                        color: '#fca5a5',
                        borderColor: '#ef4444',
                      }}
                    >
                      <i className="bi bi-trash3"></i>

                      {procesandoEliminacion
                        ? 'Eliminando...'
                        : 'Eliminar'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IngresosManualesClub;
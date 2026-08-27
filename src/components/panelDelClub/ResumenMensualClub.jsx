import React, { useState } from 'react';
import { apiUrl } from '../../config/api';
import IngresosManualesClub from './IngresosManualesClub';
import generarResumenMensualPdf from './generarResumenMensualPdf';

const ResumenMensualClub = ({ idClub }) => {
    const MESES = [
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

    const hoy = new Date();

    const [anioSeleccionado, setAnioSeleccionado] = useState(
        hoy.getFullYear()
    );

    const [mesSeleccionado, setMesSeleccionado] = useState(
        hoy.getMonth() + 1
    );

    const [resumen, setResumen] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const formatearDinero = (valor) => {
        const numero = Number(valor || 0);

        return numero.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        });
    };

    const consultarResumen = async () => {
        if (!idClub) {
            setError('No se pudo identificar el club.');
            setResumen(null);
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

            const anioActual = hoy.getFullYear();
            const mesActual = hoy.getMonth() + 1;

            const periodoCerrado =
                anioSeleccionado < anioActual ||
                (
                    anioSeleccionado === anioActual &&
                    mesSeleccionado < mesActual
                );

            const endpoint = periodoCerrado
                ? `/resumen-mensual/club/${idClub}?anio=${anioSeleccionado}&mes=${mesSeleccionado}`
                : `/resumen-mensual/club/${idClub}/preview?anio=${anioSeleccionado}&mes=${mesSeleccionado}`;

            const response = await fetch(
                apiUrl(endpoint),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const mensaje = Array.isArray(data?.message)
                    ? data.message.join(' ')
                    : data?.message;

                throw new Error(
                    mensaje ||
                    `No se pudo consultar el resumen. Error HTTP ${response.status}.`
                );
            }

            if (periodoCerrado) {
                /*
                    El snapshot guardado tiene el período en formato plano
                    (anio, mes, periodo_inicio...), mientras que el preview
                    lo devuelve dentro de "periodo".

                    Lo normalizamos acá para que el resto de la pantalla
                    siga trabajando exactamente igual.
                */
                setResumen({
                    ...data,

                    periodo: {
                        anio: data.anio ?? anioSeleccionado,
                        mes: data.mes ?? mesSeleccionado,
                        inicio: data.periodo_inicio ?? null,
                        fin_exclusivo:
                            data.periodo_fin_exclusivo ?? null,

                        /*
                            El snapshot ya conserva los cálculos definitivos,
                            pero actualmente no guarda ocupacion_desde
                            como campo separado.
                        */
                        ocupacion_desde: null,
                    },

                    aclaraciones:
                        Array.isArray(data.aclaraciones)
                            ? data.aclaraciones
                            : [
                                'Los importes de reservas corresponden exclusivamente a operaciones registradas en DameCancha.',
                                'Los ingresos manuales son información declarada por el club y no son verificados por DameCancha.',
                                'La ocupación se estima según la disponibilidad configurada al momento del cálculo; los bloqueos activos se excluyen de los turnos ofrecidos.',
                                'En el primer mes del club, la ocupación se calcula únicamente desde su fecha de alta en DameCancha.',
                            ],

                    es_snapshot: true,
                });
            } else {
                setResumen({
                    ...data,
                    es_snapshot: false,
                });
            }
        } catch (errorConsulta) {
            console.error(
                'Error al consultar resumen mensual:',
                errorConsulta
            );

            setResumen(null);

            setError(
                errorConsulta instanceof Error
                    ? errorConsulta.message
                    : 'Ocurrió un error inesperado.'
            );
        } finally {
            setCargando(false);
        }
    };

    const aniosDisponibles = Array.from(
        { length: hoy.getFullYear() - 2025 + 1 },
        (_, index) => hoy.getFullYear() - index
    );


    const descargarPdf = () => {
        if (!resumen?.es_snapshot) {
            return;
        }

        try {
            generarResumenMensualPdf({
                resumen,
                nombreClub:
                    resumen?.club?.nombre_club ||
                    'Club',
            });
        } catch (errorPdf) {
            console.error(
                'Error al generar PDF:',
                errorPdf
            );

            setError(
                errorPdf instanceof Error
                    ? errorPdf.message
                    : 'No se pudo generar el PDF.'
            );
        }
    };

    return (
        <section className="pdc-panel">
            <div className="pdc-panel-header">
                <div>
                    <h3>Resumen mensual</h3>

                    <small>
                        Consultá la actividad, ocupación e ingresos registrados
                        para cada período.
                    </small>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                    marginTop: '20px',
                }}
            >
                <div className="pdc-form-group">
                    <label htmlFor="resumen-mes">Mes</label>

                    <select
                        id="resumen-mes"
                        value={mesSeleccionado}
                        onChange={(e) =>
                            setMesSeleccionado(Number(e.target.value))
                        }
                    >
                        {MESES.map((nombreMes, index) => (
                            <option
                                key={nombreMes}
                                value={index + 1}
                            >
                                {nombreMes}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="pdc-form-group">
                    <label htmlFor="resumen-anio">Año</label>

                    <select
                        id="resumen-anio"
                        value={anioSeleccionado}
                        onChange={(e) =>
                            setAnioSeleccionado(Number(e.target.value))
                        }
                    >
                        {aniosDisponibles.map((anio) => (
                            <option key={anio} value={anio}>
                                {anio}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    className="pdc-light-button"
                    onClick={consultarResumen}
                    disabled={cargando}
                >
                    <i className="bi bi-bar-chart-line"></i>

                    {cargando
                        ? 'Consultando...'
                        : 'Consultar'}
                </button>

                {resumen && (
                    <button
                        type="button"
                        className="pdc-light-button"
                        onClick={descargarPdf}
                        disabled={!resumen.es_snapshot}
                        title={
                            resumen.es_snapshot
                                ? 'Descargar resumen mensual en PDF'
                                : 'El PDF estará disponible cuando cierre el mes'
                        }
                    >
                        <i className="bi bi-file-earmark-pdf"></i>

                        Descargar PDF
                    </button>
                )}
            </div>

            {error && (
                <p
                    className="pdc-alert pdc-alert-info"
                    style={{
                        marginTop: '20px',
                    }}
                >
                    {error}
                </p>
            )}

            {!resumen && !error && !cargando && (
                <p
                    className="pdc-alert pdc-alert-info"
                    style={{
                        marginTop: '20px',
                    }}
                >
                    Seleccioná un período para consultar el resumen del club.
                </p>
            )}

            {resumen && (
                <div style={{ marginTop: '24px' }}>
                    <div style={{ marginBottom: '18px' }}>
                        <h3>
                            {MESES[Number(resumen?.periodo?.mes || mesSeleccionado) - 1]}{' '}
                            {resumen?.periodo?.anio || anioSeleccionado}
                        </h3>

                        {resumen?.periodo?.ocupacion_desde && (
                            <small>
                                Ocupación calculada desde:{' '}
                                {resumen.periodo.ocupacion_desde}
                            </small>
                        )}
                    </div>

                    <section className="pdc-stats-grid">
                        <div className="pdc-stat-card">
                            <div className="pdc-stat-icon pdc-blue">
                                <i className="bi bi-calendar-check"></i>
                            </div>

                            <div>
                                <p>Reservas</p>
                                <h3>{resumen.total_reservas ?? 0}</h3>
                                <span>Total del período</span>
                            </div>
                        </div>

                        <div className="pdc-stat-card">
                            <div className="pdc-stat-icon pdc-green">
                                <i className="bi bi-people"></i>
                            </div>

                            <div>
                                <p>Usuarios únicos</p>
                                <h3>{resumen.usuarios_unicos ?? 0}</h3>
                                <span>Clientes registrados</span>
                            </div>
                        </div>

                        <div className="pdc-stat-card">
                            <div className="pdc-stat-icon pdc-purple">
                                <i className="bi bi-cash-stack"></i>
                            </div>

                            <div>
                                <p>Reservas DameCancha</p>

                                <h3>
                                    {formatearDinero(
                                        resumen.monto_reservas_validas
                                    )}
                                </h3>

                                <span>Reservas no canceladas</span>
                            </div>
                        </div>

                        <div className="pdc-stat-card">
                            <div className="pdc-stat-icon pdc-orange">
                                <i className="bi bi-wallet2"></i>
                            </div>

                            <div>
                                <p>Ingresos manuales</p>

                                <h3>
                                    {formatearDinero(
                                        resumen.ingresos_manuales_total
                                    )}
                                </h3>

                                <span>Declarados por el club</span>
                            </div>
                        </div>

                        <div className="pdc-stat-card">
                            <div className="pdc-stat-icon pdc-purple">
                                <i className="bi bi-graph-up-arrow"></i>
                            </div>

                            <div>
                                <p>Total consolidado</p>

                                <h3>
                                    {formatearDinero(
                                        resumen.total_consolidado_informado
                                    )}
                                </h3>

                                <span>Reservas + ingresos manuales</span>
                            </div>
                        </div>

                        <div className="pdc-stat-card">
                            <div className="pdc-stat-icon pdc-blue">
                                <i className="bi bi-arrow-repeat"></i>
                            </div>

                            <div>
                                <p>Turnos fijos</p>

                                <h3>
                                    {resumen.turnos_fijos_vigentes ?? 0}
                                </h3>

                                <span>
                                    {resumen.ocurrencias_turnos_fijos_mes ?? 0}{' '}
                                    ocurrencias
                                </span>
                            </div>
                        </div>
                    </section>

                    <IngresosManualesClub
                        idClub={idClub}
                        anio={
                            resumen?.periodo?.anio ||
                            anioSeleccionado
                        }
                        mes={
                            resumen?.periodo?.mes ||
                            mesSeleccionado
                        }
                        onCambio={consultarResumen}
                    />

                    <div
                        className="pdc-panel"
                        style={{
                            marginTop: '20px',
                        }}
                    >
                        <div className="pdc-panel-header">
                            <h3>Estado de reservas</h3>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '12px',
                                marginTop: '16px',
                            }}
                        >
                            <div>
                                <small>Pendientes</small>
                                <strong style={{ display: 'block' }}>
                                    {resumen.reservas_pendientes ?? 0}
                                </strong>
                            </div>

                            <div>
                                <small>Confirmadas</small>
                                <strong style={{ display: 'block' }}>
                                    {resumen.reservas_confirmadas ?? 0}
                                </strong>
                            </div>

                            <div>
                                <small>Completadas</small>
                                <strong style={{ display: 'block' }}>
                                    {resumen.reservas_completadas ?? 0}
                                </strong>
                            </div>

                            <div>
                                <small>Canceladas</small>
                                <strong style={{ display: 'block' }}>
                                    {resumen.reservas_canceladas ?? 0}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {resumen.destacados && (
                        <div
                            className="pdc-panel"
                            style={{
                                marginTop: '20px',
                            }}
                        >
                            <div className="pdc-panel-header">
                                <div>
                                    <h3>Destacados del mes</h3>

                                    <small>
                                        Una mirada rápida a los datos más relevantes
                                        del período.
                                    </small>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fit, minmax(220px, 1fr))',
                                    gap: '12px',
                                    marginTop: '16px',
                                }}
                            >
                                <div className="pdc-stat-card">
                                    <div className="pdc-stat-icon pdc-orange">
                                        <i className="bi bi-trophy"></i>
                                    </div>

                                    <div>
                                        <p>Cancha más utilizada</p>

                                        <h3>
                                            {resumen.destacados
                                                .cancha_mas_utilizada
                                                ?.nombre_cancha || 'Sin datos'}
                                        </h3>

                                        <span>
                                            {resumen.destacados
                                                .cancha_mas_utilizada
                                                ?.reservas_total ?? 0}{' '}
                                            {Number(
                                                resumen.destacados
                                                    .cancha_mas_utilizada
                                                    ?.reservas_total ?? 0
                                            ) === 1
                                                ? 'reserva'
                                                : 'reservas'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pdc-stat-card">
                                    <div className="pdc-stat-icon pdc-green">
                                        <i className="bi bi-dribbble"></i>
                                    </div>

                                    <div>
                                        <p>Deporte más reservado</p>

                                        <h3>
                                            {resumen.destacados
                                                .deporte_mas_reservado
                                                ?.nombre_deporte || 'Sin datos'}
                                        </h3>

                                        <span>
                                            {resumen.destacados
                                                .deporte_mas_reservado
                                                ?.reservas_total ?? 0}{' '}
                                            {Number(
                                                resumen.destacados
                                                    .deporte_mas_reservado
                                                    ?.reservas_total ?? 0
                                            ) === 1
                                                ? 'reserva'
                                                : 'reservas'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pdc-stat-card">
                                    <div className="pdc-stat-icon pdc-blue">
                                        <i className="bi bi-calendar-week"></i>
                                    </div>

                                    <div>
                                        <p>Día más demandado</p>

                                        <h3>
                                            {resumen.destacados
                                                .dia_mas_demandado
                                                ?.nombre_dia || 'Sin datos'}
                                        </h3>

                                        <span>
                                            {resumen.destacados
                                                .dia_mas_demandado
                                                ?.reservas_total ?? 0}{' '}
                                            {Number(
                                                resumen.destacados
                                                    .dia_mas_demandado
                                                    ?.reservas_total ?? 0
                                            ) === 1
                                                ? 'reserva'
                                                : 'reservas'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pdc-stat-card">
                                    <div className="pdc-stat-icon pdc-purple">
                                        <i className="bi bi-clock-history"></i>
                                    </div>

                                    <div>
                                        <p>Horario más demandado</p>

                                        <h3>
                                            {resumen.destacados
                                                .hora_mas_demandada
                                                ?.hora_inicio
                                                ? `${String(
                                                    resumen.destacados
                                                        .hora_mas_demandada
                                                        .hora_inicio
                                                ).slice(0, 5)} hs`
                                                : 'Sin datos'}
                                        </h3>

                                        <span>
                                            {resumen.destacados
                                                .hora_mas_demandada
                                                ?.reservas_total ?? 0}{' '}
                                            {Number(
                                                resumen.destacados
                                                    .hora_mas_demandada
                                                    ?.reservas_total ?? 0
                                            ) === 1
                                                ? 'reserva'
                                                : 'reservas'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {Array.isArray(resumen.detalle_canchas) &&
                        resumen.detalle_canchas.length > 0 && (
                            <div
                                className="pdc-panel"
                                style={{
                                    marginTop: '20px',
                                }}
                            >
                                <div className="pdc-panel-header">
                                    <div>
                                        <h3>Ocupación por cancha</h3>

                                        <small>
                                            Relación entre los turnos ofrecidos y los turnos ocupados
                                            durante el período.
                                        </small>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fit, minmax(220px, 1fr))',
                                        gap: '12px',
                                        marginTop: '16px',
                                    }}
                                >
                                    {resumen.detalle_canchas.map((cancha) => {
                                        const porcentaje =
                                            cancha.ocupacion_porcentaje === null ||
                                                cancha.ocupacion_porcentaje === undefined
                                                ? null
                                                : Number(cancha.ocupacion_porcentaje);

                                        return (
                                            <div
                                                key={cancha.id_cancha}
                                                className="pdc-stat-card"
                                            >
                                                <div className="pdc-stat-icon pdc-blue">
                                                    <i className="bi bi-percent"></i>
                                                </div>

                                                <div>
                                                    <p>
                                                        {cancha.nombre_cancha ||
                                                            `Cancha ${cancha.id_cancha}`}
                                                    </p>

                                                    <h3>
                                                        {porcentaje === null
                                                            ? 'Sin datos'
                                                            : `${porcentaje.toLocaleString('es-AR', {
                                                                maximumFractionDigits: 2,
                                                            })}%`}
                                                    </h3>

                                                    <span>
                                                        {cancha.turnos_ocupados ?? 0} ocupados de{' '}
                                                        {cancha.turnos_disponibles ?? 0} ofrecidos
                                                    </span>

                                                    {cancha.nombre_deporte && (
                                                        <small
                                                            style={{
                                                                display: 'block',
                                                                marginTop: '4px',
                                                            }}
                                                        >
                                                            {cancha.nombre_deporte}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    {Array.isArray(resumen.aclaraciones) &&
                        resumen.aclaraciones.length > 0 && (
                            <div
                                className="pdc-alert pdc-alert-info"
                                style={{
                                    marginTop: '20px',
                                }}
                            >
                                <strong>Aclaraciones</strong>

                                <ul style={{ marginBottom: 0 }}>
                                    {resumen.aclaraciones.map(
                                        (aclaracion, index) => (
                                            <li key={index}>
                                                {aclaracion}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        )}
                </div>
            )}
        </section>
    );
};

export default ResumenMensualClub;
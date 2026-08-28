import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';
import IngresosManualesClub from './IngresosManualesClub';
import generarResumenMensualPdf from './generarResumenMensualPdf';

const obtenerPeriodoActualArgentina = () => {
    const partes = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(new Date());

    const valores = Object.fromEntries(
        partes
            .filter((parte) => parte.type !== 'literal')
            .map((parte) => [parte.type, parte.value])
    );

    return {
        anio: Number(valores.year),
        mes: Number(valores.month),
    };
};

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

    const periodoActual = obtenerPeriodoActualArgentina();
    const anioActual = periodoActual.anio;
    const mesActual = periodoActual.mes;

    const periodoPdfInicial =
        mesActual === 1
            ? {
                anio: anioActual - 1,
                mes: 12,
            }
            : {
                anio: anioActual,
                mes: mesActual - 1,
            };

    /*
        El resumen que se ve en pantalla corresponde SIEMPRE
        al mes actual. Estos dos estados son exclusivamente
        para elegir qué snapshot histórico descargar en PDF.
    */
    const [anioPdf, setAnioPdf] = useState(
        periodoPdfInicial.anio
    );

    const [mesPdf, setMesPdf] = useState(
        periodoPdfInicial.mes
    );

    const [resumen, setResumen] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [descargandoPdf, setDescargandoPdf] = useState(false);

    const [error, setError] = useState('');
    const [errorPdf, setErrorPdf] = useState('');

    const formatearDinero = (valor) => {
        const numero = Number(valor || 0);

        return numero.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        });
    };

    const obtenerMensajeError = (data, fallback) => {
        if (Array.isArray(data?.message)) {
            return data.message.join(' ');
        }

        return data?.message || data?.error || fallback;
    };

    const normalizarSnapshot = (
        data,
        anio,
        mes
    ) => ({
        ...data,

        periodo: {
            anio: data?.anio ?? anio,
            mes: data?.mes ?? mes,
            inicio:
                data?.periodo_inicio ?? null,
            fin_exclusivo:
                data?.periodo_fin_exclusivo ?? null,
            ocupacion_desde: null,
        },

        aclaraciones:
            Array.isArray(data?.aclaraciones)
                ? data.aclaraciones
                : [
                    'Los importes de reservas corresponden exclusivamente a operaciones registradas en DameCancha.',
                    'Los ingresos manuales son información declarada por el club y no son verificados por DameCancha.',
                    'La ocupación se estima según la disponibilidad configurada al momento del cálculo; los bloqueos activos se excluyen de los turnos ofrecidos.',
                    'En el primer mes del club, la ocupación se calcula únicamente desde su fecha de alta en DameCancha.',
                ],

        es_snapshot: true,
    });

    const cargarResumenActual = async () => {
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

            const response = await fetch(
                apiUrl(
                    `/resumen-mensual/club/${idClub}/preview?anio=${anioActual}&mes=${mesActual}`
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
                        `No se pudo cargar el resumen mensual. Error HTTP ${response.status}.`
                    )
                );
            }

            setResumen({
                ...data,
                es_snapshot: false,
            });
        } catch (errorConsulta) {
            console.error(
                'Error al cargar resumen mensual actual:',
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

    useEffect(() => {
        cargarResumenActual();
        // El período visible siempre es el actual.
        // Se vuelve a cargar cuando cambia el club.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idClub]);

    const aniosDisponibles = Array.from(
        {
            length:
                Math.max(
                    anioActual - 2025 + 1,
                    1
                ),
        },
        (_, index) => anioActual - index
    );

    const periodoPdfCerrado =
        anioPdf < anioActual ||
        (
            anioPdf === anioActual &&
            mesPdf < mesActual
        );

    const handleCambiarAnioPdf = (nuevoAnio) => {
        const anio = Number(nuevoAnio);

        setAnioPdf(anio);
        setErrorPdf('');

        /*
            Si se vuelve al año actual y estaba elegido
            un mes todavía abierto/futuro, lo acomodamos
            automáticamente al último mes cerrado.
        */
        if (
            anio === anioActual &&
            mesPdf >= mesActual
        ) {
            setMesPdf(
                mesActual === 1
                    ? 1
                    : mesActual - 1
            );
        }
    };

    const descargarPdf = async () => {
        if (!idClub || !periodoPdfCerrado) {
            return;
        }

        setDescargandoPdf(true);
        setErrorPdf('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error(
                    'La sesión no está disponible. Cerrá sesión e ingresá nuevamente.'
                );
            }

            const response = await fetch(
                apiUrl(
                    `/resumen-mensual/club/${idClub}?anio=${anioPdf}&mes=${mesPdf}`
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
                        `No se pudo obtener el resumen cerrado. Error HTTP ${response.status}.`
                    )
                );
            }

            const resumenPdf =
                normalizarSnapshot(
                    data,
                    anioPdf,
                    mesPdf
                );

            generarResumenMensualPdf({
                resumen: resumenPdf,
                nombreClub:
                    resumenPdf?.club?.nombre_club ||
                    resumen?.club?.nombre_club ||
                    'Club',
            });
        } catch (errorDescarga) {
            console.error(
                'Error al generar PDF:',
                errorDescarga
            );

            setErrorPdf(
                errorDescarga instanceof Error
                    ? errorDescarga.message
                    : 'No se pudo generar el PDF.'
            );
        } finally {
            setDescargandoPdf(false);
        }
    };

    return (
        <section className="pdc-panel">
            <div className="pdc-panel-header">
                <div>
                    <h3>Resumen mensual</h3>

                    <small>
                        Actividad, ocupación e ingresos registrados del mes actual.
                    </small>
                </div>
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

            {!resumen && !error && cargando && (
                <p
                    className="pdc-alert pdc-alert-info"
                    style={{
                        marginTop: '20px',
                    }}
                >
                    Cargando resumen mensual...
                </p>
            )}

            {resumen && (
                <div style={{ marginTop: '24px' }}>
                    <div style={{ marginBottom: '18px' }}>
                        <h3>
                            {MESES[Number(resumen?.periodo?.mes || mesActual) - 1]}{' '}
                            {resumen?.periodo?.anio || anioActual}
                        </h3>

                        {resumen?.periodo?.ocupacion_desde && (
                            <small>
                                Ocupación calculada desde:{' '}
                                {resumen.periodo.ocupacion_desde}
                            </small>
                        )}
                    </div>

                    <section
                        className="pdc-stats-grid"
                        style={{
                            gridTemplateColumns:
                                'repeat(3, minmax(0, 1fr))',
                            width: '100%',
                        }}
                    >
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

                    <section
                        className="pdc-stats-grid"
                        style={{
                            gridTemplateColumns:
                                'repeat(3, minmax(0, 1fr))',
                            width: '100%',
                            marginTop: '12px',
                        }}
                    >
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

                                <div
                                    style={{
                                        marginTop: '10px',
                                        paddingTop: '9px',
                                        borderTop:
                                            '1px solid rgba(255,255,255,0.28)',
                                        fontSize: '0.82rem',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    <div>
                                        <strong>Cobrado:</strong>{' '}
                                        {formatearDinero(
                                            resumen.monto_cobrado_total
                                        )}
                                    </div>

                                    <div>
                                        <i className="bi bi-cash me-1"></i>
                                        Efectivo:{' '}
                                        <strong>
                                            {formatearDinero(
                                                resumen.monto_cobrado_efectivo
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <i className="bi bi-bank me-1"></i>
                                        Transferencia / electrónico:{' '}
                                        <strong>
                                            {formatearDinero(
                                                resumen.monto_cobrado_electronico
                                            )}
                                        </strong>
                                    </div>
                                </div>
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

                                <div
                                    style={{
                                        marginTop: '10px',
                                        paddingTop: '9px',
                                        borderTop:
                                            '1px solid rgba(255,255,255,0.28)',
                                        fontSize: '0.82rem',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    <div>
                                        <i className="bi bi-cash me-1"></i>
                                        Efectivo:{' '}
                                        <strong>
                                            {formatearDinero(
                                                resumen.ingresos_manuales_efectivo
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <i className="bi bi-bank me-1"></i>
                                        Transferencia / electrónico:{' '}
                                        <strong>
                                            {formatearDinero(
                                                resumen.ingresos_manuales_electronico
                                            )}
                                        </strong>
                                    </div>

                                    {Number(
                                        resumen.ingresos_manuales_sin_clasificar || 0
                                    ) > 0 && (
                                        <div>
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            Sin clasificar:{' '}
                                            <strong>
                                                {formatearDinero(
                                                    resumen.ingresos_manuales_sin_clasificar
                                                )}
                                            </strong>
                                        </div>
                                    )}
                                </div>
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

                                <div
                                    style={{
                                        marginTop: '10px',
                                        paddingTop: '9px',
                                        borderTop:
                                            '1px solid rgba(255,255,255,0.28)',
                                        fontSize: '0.82rem',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    <div>
                                        <strong>Registrado:</strong>{' '}
                                        {formatearDinero(
                                            resumen.ingresos_totales_registrados
                                        )}
                                    </div>

                                    <div>
                                        <i className="bi bi-cash me-1"></i>
                                        Efectivo:{' '}
                                        <strong>
                                            {formatearDinero(
                                                resumen.ingresos_totales_efectivo
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <i className="bi bi-bank me-1"></i>
                                        Transferencia / electrónico:{' '}
                                        <strong>
                                            {formatearDinero(
                                                resumen.ingresos_totales_electronico
                                            )}
                                        </strong>
                                    </div>

                                    {Number(
                                        resumen.ingresos_totales_sin_clasificar || 0
                                    ) > 0 && (
                                        <div>
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            Sin clasificar:{' '}
                                            <strong>
                                                {formatearDinero(
                                                    resumen.ingresos_totales_sin_clasificar
                                                )}
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <IngresosManualesClub
                        idClub={idClub}
                        anio={
                            resumen?.periodo?.anio ||
                            anioActual
                        }
                        mes={
                            resumen?.periodo?.mes ||
                            mesActual
                        }
                        onCambio={cargarResumenActual}
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

                    <div
                        style={{
                            marginTop: '20px',
                            padding: '14px 16px',
                            border:
                                '1px solid rgba(255,255,255,0.16)',
                            borderRadius: '10px',
                        }}
                    >
                        <div
                            style={{
                                marginBottom: '12px',
                            }}
                        >
                            <strong>
                                Descargar resumen en PDF
                            </strong>

                            <small
                                style={{
                                    display: 'block',
                                    marginTop: '3px',
                                }}
                            >
                                Elegí un mes ya cerrado. Esta selección no modifica
                                la información que ves en pantalla.
                            </small>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                flexWrap: 'wrap',
                                alignItems: 'flex-end',
                            }}
                        >
                            <div className="pdc-form-group">
                                <label htmlFor="resumen-pdf-mes">
                                    Mes
                                </label>

                                <select
                                    id="resumen-pdf-mes"
                                    value={mesPdf}
                                    onChange={(e) => {
                                        setMesPdf(
                                            Number(e.target.value)
                                        );
                                        setErrorPdf('');
                                    }}
                                >
                                    {MESES.map(
                                        (nombreMes, index) => {
                                            const numeroMes =
                                                index + 1;

                                            const mesNoCerrado =
                                                anioPdf === anioActual &&
                                                numeroMes >= mesActual;

                                            return (
                                                <option
                                                    key={nombreMes}
                                                    value={numeroMes}
                                                    disabled={mesNoCerrado}
                                                >
                                                    {nombreMes}
                                                </option>
                                            );
                                        }
                                    )}
                                </select>
                            </div>

                            <div className="pdc-form-group">
                                <label htmlFor="resumen-pdf-anio">
                                    Año
                                </label>

                                <select
                                    id="resumen-pdf-anio"
                                    value={anioPdf}
                                    onChange={(e) =>
                                        handleCambiarAnioPdf(
                                            e.target.value
                                        )
                                    }
                                >
                                    {aniosDisponibles.map((anio) => (
                                        <option
                                            key={anio}
                                            value={anio}
                                        >
                                            {anio}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                className="pdc-light-button"
                                onClick={descargarPdf}
                                disabled={
                                    descargandoPdf ||
                                    !periodoPdfCerrado
                                }
                                title={
                                    periodoPdfCerrado
                                        ? 'Descargar resumen mensual cerrado en PDF'
                                        : 'El PDF está disponible únicamente para meses cerrados'
                                }
                            >
                                <i className="bi bi-file-earmark-pdf"></i>

                                {descargandoPdf
                                    ? 'Preparando PDF...'
                                    : 'Descargar PDF'}
                            </button>
                        </div>

                        {errorPdf && (
                            <p
                                className="pdc-alert pdc-alert-info"
                                style={{
                                    marginTop: '12px',
                                    marginBottom: 0,
                                }}
                            >
                                {errorPdf}
                            </p>
                        )}
                    </div>

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
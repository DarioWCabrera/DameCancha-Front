import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const CATEGORIAS_INGRESOS = {
  buffet: 'Buffet / cantina',
  alquiler_equipamiento: 'Alquiler de equipamiento',
  evento: 'Evento',
  clase: 'Clase',
  sponsor: 'Sponsor',
  otro: 'Otro',
};

const ACLARACIONES_DEFAULT = [
  'Los importes de reservas corresponden exclusivamente a operaciones registradas en DameCancha.',
  'Los ingresos manuales son información declarada por el club y no son verificados por DameCancha.',
  'La ocupación se estima según la disponibilidad configurada al momento del cálculo; los bloqueos activos se excluyen de los turnos ofrecidos.',
  'En el primer mes del club, la ocupación se calcula únicamente desde su fecha de alta en DameCancha.',
];

const formatearDinero = (valor) =>
  Number(valor || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

const formatearPorcentaje = (valor) => {
  if (valor === null || valor === undefined) {
    return 'Sin datos';
  }

  return `${Number(valor).toLocaleString('es-AR', {
    maximumFractionDigits: 2,
  })}%`;
};

const limpiarNombreArchivo = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const obtenerYFinal = (doc, fallback = 30) =>
  doc.lastAutoTable?.finalY
    ? doc.lastAutoTable.finalY
    : fallback;

const asegurarEspacio = (doc, y, espacioNecesario = 35) => {
  const altoPagina = doc.internal.pageSize.getHeight();

  if (y + espacioNecesario > altoPagina - 18) {
    doc.addPage();
    return 22;
  }

  return y;
};

const tituloSeccion = (doc, titulo, y) => {
  const posicionY = asegurarEspacio(doc, y, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(31, 78, 166);

  doc.text(titulo, 14, posicionY);

  doc.setDrawColor(210, 218, 230);
  doc.line(14, posicionY + 2, 196, posicionY + 2);

  return posicionY + 7;
};

export const generarResumenMensualPdf = ({
  resumen,
  nombreClub,
}) => {
  if (!resumen) {
    throw new Error(
      'No hay un resumen disponible para generar el PDF.'
    );
  }

  const anio =
    resumen?.periodo?.anio ??
    resumen?.anio ??
    '';

  const mes =
    resumen?.periodo?.mes ??
    resumen?.mes ??
    '';

  const nombreMes =
    MESES[Number(mes) - 1] || `Mes ${mes}`;

  const club =
    resumen?.club?.nombre_club ||
    nombreClub ||
    'Club';

  const esSnapshot =
    resumen?.es_snapshot === true;

  const tipoResumen = esSnapshot
    ? 'Resumen mensual definitivo'
    : 'Vista previa del mes en curso';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  /*
   * HEADER
   */

  doc.setFillColor(31, 78, 166);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);

  doc.text('DameCancha', 14, 15);

  doc.setFontSize(14);
  doc.text('Resumen mensual del club', 14, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text(
    `${nombreMes} ${anio} - ${tipoResumen}`,
    14,
    31
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text(club, 196, 16, {
    align: 'right',
  });

  /*
   * RESUMEN GENERAL
   */

  let y = 47;

  y = tituloSeccion(
    doc,
    'Resumen general',
    y
  );

  autoTable(doc, {
    startY: y,
    theme: 'grid',

    head: [
      ['Indicador', 'Resultado'],
    ],

    body: [
      [
        'Reservas del período',
        String(resumen.total_reservas ?? 0),
      ],
      [
        'Usuarios únicos',
        String(resumen.usuarios_unicos ?? 0),
      ],
      [
        'Monto de reservas registradas en DameCancha',
        formatearDinero(
          resumen.monto_reservas_validas
        ),
      ],
      [
        'Ingresos manuales declarados',
        formatearDinero(
          resumen.ingresos_manuales_total
        ),
      ],
      [
        'Total consolidado informado',
        formatearDinero(
          resumen.total_consolidado_informado
        ),
      ],
      [
        'Turnos fijos vigentes',
        String(
          resumen.turnos_fijos_vigentes ?? 0
        ),
      ],
      [
        'Ocurrencias de turnos fijos',
        String(
          resumen.ocurrencias_turnos_fijos_mes ??
            0
        ),
      ],
    ],

    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },

    headStyles: {
      fillColor: [31, 78, 166],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },

    columnStyles: {
      0: {
        cellWidth: 120,
      },
      1: {
        halign: 'right',
      },
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  /*
   * ESTADO DE RESERVAS
   */

  y = obtenerYFinal(doc) + 10;

  y = tituloSeccion(
    doc,
    'Estado de reservas',
    y
  );

  autoTable(doc, {
    startY: y,
    theme: 'grid',

    head: [
      [
        'Pendientes',
        'Confirmadas',
        'Completadas',
        'Canceladas',
      ],
    ],

    body: [
      [
        resumen.reservas_pendientes ?? 0,
        resumen.reservas_confirmadas ?? 0,
        resumen.reservas_completadas ?? 0,
        resumen.reservas_canceladas ?? 0,
      ],
    ],

    styles: {
      font: 'helvetica',
      fontSize: 9,
      halign: 'center',
      cellPadding: 3,
    },

    headStyles: {
      fillColor: [31, 78, 166],
      textColor: [255, 255, 255],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  /*
   * DESTACADOS
   */

  y = obtenerYFinal(doc) + 10;

  y = tituloSeccion(
    doc,
    'Destacados del mes',
    y
  );

  const destacados =
    resumen.destacados || {};

  autoTable(doc, {
    startY: y,
    theme: 'grid',

    body: [
      [
        'Cancha más utilizada',
        destacados.cancha_mas_utilizada
          ?.nombre_cancha || 'Sin datos',
        `${destacados.cancha_mas_utilizada
          ?.reservas_total ?? 0} reservas`,
      ],
      [
        'Deporte más reservado',
        destacados.deporte_mas_reservado
          ?.nombre_deporte || 'Sin datos',
        `${destacados.deporte_mas_reservado
          ?.reservas_total ?? 0} reservas`,
      ],
      [
        'Día más demandado',
        destacados.dia_mas_demandado
          ?.nombre_dia || 'Sin datos',
        `${destacados.dia_mas_demandado
          ?.reservas_total ?? 0} reservas`,
      ],
      [
        'Horario más demandado',
        destacados.hora_mas_demandada
          ?.hora_inicio
          ? `${String(
              destacados.hora_mas_demandada
                .hora_inicio
            ).slice(0, 5)} hs`
          : 'Sin datos',
        `${destacados.hora_mas_demandada
          ?.reservas_total ?? 0} reservas`,
      ],
    ],

    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },

    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 55,
      },
      2: {
        halign: 'right',
        cellWidth: 35,
      },
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  /*
   * OCUPACIÓN POR CANCHA
   */

  const detalleCanchas =
    Array.isArray(resumen.detalle_canchas)
      ? resumen.detalle_canchas
      : [];

  if (detalleCanchas.length > 0) {
    y = obtenerYFinal(doc) + 10;

    y = tituloSeccion(
      doc,
      'Ocupación por cancha',
      y
    );

    autoTable(doc, {
      startY: y,
      theme: 'grid',

      head: [
        [
          'Cancha',
          'Deporte',
          'Ofrecidos',
          'Ocupados',
          'Ocupación',
        ],
      ],

      body: detalleCanchas.map(
        (cancha) => [
          cancha.nombre_cancha ||
            `Cancha ${cancha.id_cancha}`,
          cancha.nombre_deporte || '-',
          cancha.turnos_disponibles ?? 0,
          cancha.turnos_ocupados ?? 0,
          formatearPorcentaje(
            cancha.ocupacion_porcentaje
          ),
        ]
      ),

      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 2.5,
      },

      headStyles: {
        fillColor: [31, 78, 166],
        textColor: [255, 255, 255],
      },

      columnStyles: {
        2: {
          halign: 'center',
        },
        3: {
          halign: 'center',
        },
        4: {
          halign: 'right',
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    });
  }

  /*
   * INGRESOS MANUALES POR CATEGORÍA
   */

  const detalleIngresos =
    resumen.detalle_ingresos_manuales &&
    typeof resumen.detalle_ingresos_manuales ===
      'object'
      ? resumen.detalle_ingresos_manuales
      : {};

  const filasIngresos = Object.entries(
    CATEGORIAS_INGRESOS
  )
    .map(([clave, etiqueta]) => ({
      categoria: etiqueta,
      monto: Number(
        detalleIngresos?.[clave] || 0
      ),
    }))
    .filter((fila) => fila.monto > 0);

  if (filasIngresos.length > 0) {
    y = obtenerYFinal(doc) + 10;

    y = tituloSeccion(
      doc,
      'Ingresos manuales declarados',
      y
    );

    autoTable(doc, {
      startY: y,
      theme: 'grid',

      head: [
        ['Categoría', 'Monto'],
      ],

      body: filasIngresos.map(
        (fila) => [
          fila.categoria,
          formatearDinero(fila.monto),
        ]
      ),

      foot: [
        [
          'Total ingresos manuales',
          formatearDinero(
            resumen.ingresos_manuales_total
          ),
        ],
      ],

      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [31, 78, 166],
        textColor: [255, 255, 255],
      },

      footStyles: {
        fillColor: [235, 240, 248],
        textColor: [30, 41, 59],
        fontStyle: 'bold',
      },

      columnStyles: {
        1: {
          halign: 'right',
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    });
  }

  /*
   * ACLARACIONES
   */

  y = obtenerYFinal(doc) + 12;

  y = tituloSeccion(
    doc,
    'Aclaraciones',
    y
  );

  const aclaraciones =
    Array.isArray(resumen.aclaraciones) &&
    resumen.aclaraciones.length > 0
      ? resumen.aclaraciones
      : ACLARACIONES_DEFAULT;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 70, 85);

  for (const aclaracion of aclaraciones) {
    y = asegurarEspacio(doc, y, 16);

    const texto = doc.splitTextToSize(
      `• ${aclaracion}`,
      174
    );

    doc.text(texto, 18, y);

    y += texto.length * 4.3 + 2;
  }

  /*
   * PIE DE PÁGINA
   */

  const cantidadPaginas =
    doc.getNumberOfPages();

  const generado =
    new Intl.DateTimeFormat('es-AR', {
      timeZone:
        'America/Argentina/Buenos_Aires',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());

  for (
    let pagina = 1;
    pagina <= cantidadPaginas;
    pagina += 1
  ) {
    doc.setPage(pagina);

    const altoPagina =
      doc.internal.pageSize.getHeight();

    doc.setDrawColor(210, 218, 230);

    doc.line(
      14,
      altoPagina - 13,
      196,
      altoPagina - 13
    );

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      100,
      110,
      125
    );

    doc.text(
      `Generado por DameCancha - ${generado}`,
      14,
      altoPagina - 8
    );

    doc.text(
      `Página ${pagina} de ${cantidadPaginas}`,
      196,
      altoPagina - 8,
      {
        align: 'right',
      }
    );
  }

  /*
   * NOMBRE DEL ARCHIVO
   */

  const nombreSeguro =
    limpiarNombreArchivo(club) ||
    'club';

  const periodoSeguro =
    `${anio}-${String(mes).padStart(
      2,
      '0'
    )}`;

  const nombreArchivo =
    `DameCancha-Resumen-${nombreSeguro}-${periodoSeguro}.pdf`;

  doc.save(nombreArchivo);
};

export default generarResumenMensualPdf;
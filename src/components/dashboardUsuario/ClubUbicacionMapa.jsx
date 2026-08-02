import './ClubUbicacionMapa.css';

const DIRECCION_INVALIDA = /^(sin direcci[oó]n|no disponible)$/i;

const esDireccionValida = (valor) =>
  Boolean(
    valor &&
      typeof valor === 'string' &&
      !DIRECCION_INVALIDA.test(valor.trim())
  );

/*
  Construye la ubicación real que Google Maps debe buscar.

  Importante:
  No usamos el nombre del club dentro de la búsqueda del mapa,
  porque Google puede interpretarlo como un lugar distinto y marcar mal la ubicación.

  Ejemplo correcto:
  "Mazzini 880, Tres Arroyos, Buenos Aires, Argentina"
*/
export const construirUbicacionCompleta = ({
  direccion = '',
  ciudad = '',
  provincia = '',
} = {}) => {
  const partes = [direccion, ciudad, provincia, 'Argentina'].filter(
    esDireccionValida
  );

  return partes.join(', ');
};

const obtenerUrlMapaEmbebido = (consulta) => {
  const query = encodeURIComponent(consulta);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`;
  }

  return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
};

const obtenerUrlMapaExterno = (consulta) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    consulta
  )}`;

function ClubUbicacionMapa({
  club = '',
  direccion = '',
  ciudad = '',
  provincia = '',
  titulo = 'Ubicación del club',
  className = '',
}) {
  const ubicacionCompleta = construirUbicacionCompleta({
    direccion,
    ciudad,
    provincia,
  });

  if (!ubicacionCompleta) {
    return (
      <div className={`club-mapa club-mapa--empty ${className}`.trim()}>
        <p>No hay dirección disponible para mostrar el mapa.</p>
      </div>
    );
  }

  return (
    <div className={`club-mapa ${className}`.trim()}>
      <div className="club-mapa__header">
        <span className="club-mapa__titulo">{titulo}</span>

        <a
          href={obtenerUrlMapaExterno(ubicacionCompleta)}
          target="_blank"
          rel="noopener noreferrer"
          className="club-mapa__link"
        >
          Abrir en Google Maps
          <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
        </a>
      </div>

      <div className="club-mapa__frame-wrap">
        <iframe
          title={`Mapa de ${club || 'club'}`}
          src={obtenerUrlMapaEmbebido(ubicacionCompleta)}
          className="club-mapa__frame"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <p className="club-mapa__direccion">
        <i className="bi bi-geo-alt-fill" aria-hidden="true" />
        {club ? `${club} - ` : ''}
        {ubicacionCompleta}
      </p>
    </div>
  );
}

export default ClubUbicacionMapa;

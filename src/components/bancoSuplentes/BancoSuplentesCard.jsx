import { useNavigate } from 'react-router-dom';
import './BancoSuplentesCard.css';

function BancoSuplentesCard({ onOpen }) {
  const navigate = useNavigate();

  const abrirBancoSuplentes = () => {
    if (typeof onOpen === 'function') {
      onOpen();
      return;
    }

    navigate('/banco-de-suplentes');
  };

  return (
    <section className="bsc-card">
      <div className="bsc-card__icon">
        <i className="bi bi-people-fill"></i>
      </div>

      <div className="bsc-card__content">
        <span>Comunidad deportiva</span>
        <h3>Banco de suplentes</h3>
        <p>
          Encontrá compañeros, completá tu equipo o publicá cuándo
          estás disponible.
        </p>
      </div>

      <button type="button" onClick={abrirBancoSuplentes}>
        Explorar
        <i className="bi bi-arrow-right"></i>
      </button>
    </section>
  );
}

export default BancoSuplentesCard;
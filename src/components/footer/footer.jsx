import { useState } from "react";
import "./footer.css";
import { CONTACT, emailHref, phoneHref } from "../../config/contact";

export default function Footer() {
    const [showTermsModal, setShowTermsModal] = useState(false);

    const openTermsModal = () => {
        setShowTermsModal(true);
    };

    const closeTermsModal = () => {
        setShowTermsModal(false);
    };

    return (
        <>
            <footer className="footer-container">
                {/* COLUMNA 1 - SEGUINOS */}
                <div className="footer-section footer-left">
                    <h3>Unite a DameCancha</h3>

                    <ul>
                        <li>
                            <a href="#deportes" className="footer-link">
                                Reservá tu cancha en tres clicks
                            </a>
                        </li>

                        <li>© {new Date().getFullYear()}. Todos los derechos reservados</li>
                    </ul>
                </div>

                {/* COLUMNA 2 - CONTACTANOS */}
                <div className="footer-section footer-center">
                    <h3>Contactanos</h3>

                    <ul>
                        {emailHref && (
                            <li>
                                Email:{" "}
                                <a href={emailHref} className="footer-link">
                                    {CONTACT.email}
                                </a>
                            </li>
                        )}

                        {phoneHref && (
                            <li>
                                Tel:{" "}
                                <a href={phoneHref} className="footer-link">
                                    {CONTACT.phone}
                                </a>
                            </li>
                        )}

                        <li>HQ: {CONTACT.headquarters}</li>
                    </ul>
                </div>

                {/* COLUMNA 3 - LEGAL */}
                <div className="footer-section footer-right">
                    <h3>Legal</h3>

                    <ul>
                        <li>
                            <button
                                type="button"
                                className="footer-link footer-button"
                                onClick={openTermsModal}
                            >
                                Términos y condiciones
                            </button>
                        </li>

                        <li>
                            <a href="#privacidad" className="footer-link">
                                Política de privacidad
                            </a>
                        </li>
                    </ul>
                </div>
            </footer>

            {showTermsModal && (
                <div className="terms-modal-overlay" onClick={closeTermsModal}>
                    <div
                        className="terms-modal-content"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="terms-modal-close"
                            onClick={closeTermsModal}
                            aria-label="Cerrar modal"
                        >
                            ×
                        </button>

                        <h2>Términos y condiciones</h2>

                        <p>
                            Bienvenido/a a <strong>DameCancha</strong>. Al utilizar nuestra
                            plataforma, aceptás los presentes Términos y Condiciones. Te
                            recomendamos leerlos cuidadosamente antes de realizar una reserva.
                        </p>

                        <h3>1. Uso de la plataforma</h3>
                        <p>
                            DameCancha permite a los usuarios consultar disponibilidad,
                            precios y realizar reservas de canchas deportivas de manera online.
                            El uso de la plataforma debe realizarse de forma responsable,
                            respetando la información proporcionada y las condiciones
                            establecidas por cada complejo deportivo.
                        </p>

                        <h3>2. Reservas</h3>
                        <p>
                            Las reservas realizadas a través de DameCancha están sujetas a
                            disponibilidad. Una vez confirmada la reserva, el usuario se
                            compromete a asistir en el día y horario seleccionado.
                        </p>

                        <h3>3. Cancelaciones y modificaciones</h3>
                        <p>
                            Las cancelaciones o modificaciones de reservas deberán realizarse
                            con la anticipación indicada por la plataforma o por el complejo
                            correspondiente.
                        </p>

                        <h3>4. Pagos</h3>
                        <p>
                            En caso de que la plataforma permita pagos online, el usuario
                            deberá ingresar información válida y actualizada. DameCancha no se
                            responsabiliza por errores derivados de datos incorrectos
                            ingresados por el usuario.
                        </p>

                        <h3>5. Responsabilidad del usuario</h3>
                        <p>
                            El usuario se compromete a utilizar la plataforma de buena fe, no
                            realizar reservas falsas, no brindar información incorrecta y
                            respetar las normas de convivencia, seguridad e higiene del
                            complejo deportivo.
                        </p>

                        <h3>6. Responsabilidad de DameCancha</h3>
                        <p>
                            DameCancha actúa como un medio para facilitar la reserva de
                            canchas. La disponibilidad, estado de las instalaciones,
                            condiciones del servicio y normas internas son responsabilidad del
                            complejo deportivo correspondiente.
                        </p>

                        <h3>7. Datos personales</h3>
                        <p>
                            Los datos ingresados por los usuarios serán utilizados únicamente
                            para gestionar reservas, mejorar el servicio y mantener la
                            comunicación relacionada con el uso de la plataforma.
                        </p>

                        <h3>8. Cambios en los términos</h3>
                        <p>
                            DameCancha podrá modificar estos Términos y Condiciones en
                            cualquier momento. Las modificaciones serán publicadas por los
                            canales correspondientes.
                        </p>

                        <h3>9. Contacto</h3>
                        <p>
                            Ante cualquier duda, consulta o reclamo relacionado con estos
                            Términos y Condiciones, podés comunicarte con nosotros a través de
                            nuestro correo de contacto.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
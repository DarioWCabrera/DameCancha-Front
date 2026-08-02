import React, { useState } from 'react';
import './calendario.css';

const Calendar = ({ onDateSelect, onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Función para obtener los días del mes
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Función para obtener el primer día del mes
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Función para renderizar los días
  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Días vacíos al inicio del mes
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-empty-day"></div>);
    }
    
    // Días del mes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      
      days.push(
        <div 
          key={day}
          onClick={() => !isPast && onDateSelect(date)}
          className={`calendar-day ${isPast ? 'calendar-day-past' : 'calendar-day-available'} ${!isPast ? 'calendar-day-selectable' : ''}`}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  // Nombres de los meses
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de los días
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Función para ir al mes anterior
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Función para ir al mes siguiente
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="calendar-container">
      <div className="calendar-wrapper">
        <div className="calendar-header">
          <button 
            onClick={prevMonth}
            className="calendar-nav-button calendar-nav-button-prev"
          >
            &lt;
          </button>
          <h3 className="calendar-title">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button 
            onClick={nextMonth}
            className="calendar-nav-button calendar-nav-button-next"
          >
            &gt;
          </button>
        </div>
        
        <div className="calendar-day-names">
          {dayNames.map(day => (
            <div 
              key={day} 
              className="calendar-day-name"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="calendar-days">
          {renderDays()}
        </div>
        
        <div className="calendar-back-container">
          <button
            onClick={onBack}
            className="calendar-back-button"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
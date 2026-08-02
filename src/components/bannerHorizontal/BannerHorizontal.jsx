import React from 'react';
import './BannerHorizontal.css';

const BannerHorizontal = ({ imagen, url }) => {
  const handleClick = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="banner-horizontal" onClick={handleClick}>
      {imagen ? (
        <img src={imagen} alt="Banner Publicitario" className="banner-horizontal-imagen" />
      ) : (
        <div className="banner-horizontal-placeholder">
          Banner Publicitario
        </div>
      )}
    </div>
  );
};

export default BannerHorizontal;
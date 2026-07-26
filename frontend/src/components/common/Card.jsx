import React from 'react';
import { useHoverGlow } from '../../hooks/useAnimations';

const Card = ({ title, description, children, className = '' }) => {
  const ref = useHoverGlow();

  return (
    <div ref={ref} className={`glass rounded-xl p-6 transition-all ${className}`}>
      {title && <h3 className="text-xl font-bold mb-2 text-primary">{title}</h3>}
      {description && <p className="text-muted">{description}</p>}
      {children}
    </div>
  );
};

export default Card;

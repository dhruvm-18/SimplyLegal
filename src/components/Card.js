import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

const Card = ({ 
  children, 
  variant = 'default',
  elevation = 'medium',
  padding = 'medium',
  className = '',
  onClick,
  hoverable = false,
  loading = false,
  ...props 
}) => {
  const baseClass = `card card-${variant} card-elevation-${elevation} card-padding-${padding}`;
  const hoverableClass = hoverable ? 'card-hoverable' : '';
  const clickableClass = onClick ? 'card-clickable' : '';
  const finalClassName = `${baseClass} ${hoverableClass} ${clickableClass} ${className}`.trim();

  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hover: hoverable ? {
      y: -4,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    } : {},
    tap: onClick ? {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    } : {}
  };

  return (
    <motion.div
      className={finalClassName}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="card-loading">
          <motion.div
            className="card-loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
    </motion.div>
  );
};

export default Card; 
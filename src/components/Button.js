import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  icon,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props 
}) => {
  const baseClass = `btn btn-${variant} btn-${size}`;
  const fullWidthClass = fullWidth ? 'btn-full-width' : '';
  const finalClassName = `${baseClass} ${fullWidthClass} ${className}`.trim();

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    disabled: { scale: 1, opacity: 0.6 }
  };

  const iconVariants = {
    initial: { rotate: 0 },
    hover: { rotate: 5 },
    tap: { rotate: -5 }
  };

  return (
    <motion.button
      className={finalClassName}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      variants={buttonVariants}
      initial="initial"
      whileHover={disabled || loading ? "disabled" : "hover"}
      whileTap={disabled || loading ? "disabled" : "tap"}
      transition={{ duration: 0.2, ease: "easeOut" }}
      {...props}
    >
      {loading && (
        <motion.div
          className="btn-loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {icon && !loading && (
        <motion.span
          className="btn-icon"
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          {icon}
        </motion.span>
      )}
      
      <span className="btn-text">{children}</span>
    </motion.button>
  );
};

export default Button; 
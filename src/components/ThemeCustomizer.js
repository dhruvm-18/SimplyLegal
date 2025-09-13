import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDroplet, FiEye, FiRefreshCw } from 'react-icons/fi';
import './ThemeCustomizer.css';

const ThemeCustomizer = ({ 
  currentTheme = 'default', 
  currentColors = {}, 
  onThemeChange, 
  onColorsChange 
}) => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [customColors, setCustomColors] = useState(currentColors);
  const [showCustomColors, setShowCustomColors] = useState(currentTheme === 'custom');

  // Predefined themes
  const themes = {
    default: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#60A5FA',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1F2937',
      border: '#E5E7EB'
    },
    professional: {
      primary: '#1F2937',
      secondary: '#374151',
      accent: '#6B7280',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      border: '#D1D5DB'
    },
    modern: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#A78BFA',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#1F2937',
      border: '#E9D5FF'
    },
    corporate: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10B981',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#064E3B',
      border: '#A7F3D0'
    },
    elegant: {
      primary: '#DC2626',
      secondary: '#B91C1C',
      accent: '#EF4444',
      background: '#FEF2F2',
      surface: '#FFFFFF',
      text: '#7F1D1D',
      border: '#FECACA'
    },
    sunset: {
      primary: '#F97316',
      secondary: '#EA580C',
      accent: '#FB923C',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#9A3412',
      border: '#FED7AA'
    },
    ocean: {
      primary: '#06B6D4',
      secondary: '#0891B2',
      accent: '#22D3EE',
      background: '#ECFEFF',
      surface: '#FFFFFF',
      text: '#164E63',
      border: '#A5F3FC'
    },
    forest: {
      primary: '#16A34A',
      secondary: '#15803D',
      accent: '#4ADE80',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#14532D',
      border: '#86EFAC'
    },
    royal: {
      primary: '#7C3AED',
      secondary: '#6D28D9',
      accent: '#A78BFA',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#2E1065',
      border: '#C4B5FD'
    },
    minimal: {
      primary: '#6B7280',
      secondary: '#4B5563',
      accent: '#9CA3AF',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      border: '#E5E7EB'
    },
    midnight: {
      primary: '#1E293B',
      secondary: '#0F172A',
      accent: '#475569',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      border: '#CBD5E1'
    },
    cherry: {
      primary: '#E11D48',
      secondary: '#BE185D',
      accent: '#F43F5E',
      background: '#FFF1F2',
      surface: '#FFFFFF',
      text: '#881337',
      border: '#FECDD3'
    },
    emerald: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
      background: '#ECFDF5',
      surface: '#FFFFFF',
      text: '#064E3B',
      border: '#A7F3D0'
    }
  };

  // Initialize custom colors if empty
  useEffect(() => {
    if (Object.keys(customColors).length === 0) {
      setCustomColors(themes.default);
    }
  }, []);

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    setShowCustomColors(theme === 'custom');
    
    if (theme === 'custom') {
      onThemeChange('custom');
      onColorsChange(customColors);
    } else {
      onThemeChange(theme);
      onColorsChange(themes[theme]);
    }
  };

  const handleColorChange = (key, value) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    onColorsChange(newColors);
  };

  const resetToDefault = () => {
    setCustomColors(themes.default);
    onColorsChange(themes.default);
  };

  const getCurrentColors = () => {
    return selectedTheme === 'custom' ? customColors : themes[selectedTheme];
  };

  return (
    <div className="theme-customizer">
      <div className="theme-section">
        <h3 className="section-title">
          <FiDroplet />
          Color Theme
        </h3>
        
        <div className="theme-selector">
          <select
            value={selectedTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="theme-select"
          >
            {Object.keys(themes).map(theme => (
              <option key={theme} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
            <option value="custom">Custom Colors</option>
          </select>
        </div>

        {showCustomColors && (
          <motion.div
            className="custom-colors-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="custom-colors-header">
              <h4>Custom Colors</h4>
              <button 
                className="reset-btn"
                onClick={resetToDefault}
                title="Reset to default colors"
              >
                <FiRefreshCw size={14} />
                Reset
              </button>
            </div>
            
            <div className="color-grid">
              {Object.entries(customColors).map(([key, color]) => (
                <div key={key} className="color-item">
                  <label htmlFor={`color-${key}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <div className="color-inputs">
                    <input
                      id={`color-${key}`}
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="color-text"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="theme-preview-section">
        <h3 className="section-title">
          <FiEye />
          Preview
        </h3>
        
        <div className="theme-preview">
          <div className="color-swatches">
            {Object.entries(getCurrentColors()).map(([key, color]) => (
              <div key={key} className="color-swatch">
                <div 
                  className="color-preview" 
                  style={{ backgroundColor: color }}
                />
                <span>{key}</span>
              </div>
            ))}
          </div>
          
          <div className="preview-card">
            <div 
              className="preview-header"
              style={{
                backgroundColor: getCurrentColors().primary,
                color: '#FFFFFF'
              }}
            >
              <h5>Document Title</h5>
            </div>
            <div 
              className="preview-content"
              style={{
                backgroundColor: getCurrentColors().surface,
                color: getCurrentColors().text,
                borderColor: getCurrentColors().border
              }}
            >
              <p>This is how your document tile will look with the selected theme.</p>
              <div 
                className="preview-button"
                style={{
                  backgroundColor: getCurrentColors().accent,
                  color: '#FFFFFF'
                }}
              >
                View Document
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer; 
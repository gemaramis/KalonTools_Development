import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

const EditableNote = ({ value, onSave, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsEditing(false);
        setTempValue(value || ''); // Revert on click outside
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, value]);

  const renderTooltip = () => {
    if (!showTooltip || !value || isEditing) return null;
    return (
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '6px',
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '8px 12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        zIndex: 50,
        whiteSpace: 'normal',
        width: 'max-content',
        maxWidth: '250px',
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        lineHeight: '1.4',
        pointerEvents: 'none' // So it doesn't interfere with mouse events
      }}>
        {value}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '6px',
          borderStyle: 'solid',
          borderColor: 'var(--surface-color) transparent transparent transparent',
          zIndex: 51
        }}></div>
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '7px',
          borderStyle: 'solid',
          borderColor: 'var(--border-color) transparent transparent transparent',
          zIndex: 50,
          marginTop: '1px'
        }}></div>
      </div>
    );
  };

  if (disabled) {
    return (
      <div 
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div 
          style={{ 
            maxWidth: '150px', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            padding: '6px 8px', 
            opacity: 0.7,
            cursor: 'default'
          }}
        >
          {value || '-'}
        </div>
        {renderTooltip()}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div ref={containerRef} style={{ position: 'relative', zIndex: 100 }}>
        <div style={{ 
          position: 'absolute', 
          top: '-20px', 
          left: '-20px', 
          background: 'var(--surface-color)', 
          border: '1px solid var(--primary-color)', 
          borderRadius: '8px', 
          padding: '12px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <textarea 
            value={tempValue} 
            onChange={(e) => setTempValue(e.target.value)}
            className="input-field"
            style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setTempValue(value || '');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
            >
              <X size={14} /> Cancel
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSave(tempValue);
                setIsEditing(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '4px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <Check size={14} /> OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={(e) => {
        setShowTooltip(true);
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false);
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div 
        onClick={() => setIsEditing(true)}
        style={{ 
          maxWidth: '150px', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          padding: '6px 8px',
          border: '1px solid transparent',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
      >
        {value ? value : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Click to add notes...</span>}
      </div>
      {renderTooltip()}
    </div>
  );
};

export default EditableNote;

import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

const EditableNote = ({ value, onSave, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [showTooltip, setShowTooltip] = useState(false);
  const [editPos, setEditPos] = useState({ top: 0, left: 0 });
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
        zIndex: 9999,
        whiteSpace: 'normal',
        width: 'max-content',
        maxWidth: '250px',
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        lineHeight: '1.4',
        pointerEvents: 'none'
      }}>
        {value}
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
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div style={{ 
          position: 'fixed', 
          top: `${editPos.top}px`, 
          left: `${editPos.left}px`, 
          background: 'var(--surface-color)', 
          border: '1px solid var(--primary-color)', 
          borderRadius: '8px', 
          padding: '16px', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          width: '300px',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 99999
        }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Edit Note</h4>
          <textarea 
            value={tempValue} 
            onChange={(e) => setTempValue(e.target.value)}
            className="input-field"
            style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setTempValue(value || '');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '500' }}
            >
              <X size={16} /> Cancel
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSave(tempValue);
                setIsEditing(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '4px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              <Check size={16} /> Save
            </button>
          </div>
        </div>
        {/* Backdrop */}
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 99998 }} />
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
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          // Ensure it stays on screen (rough boundary check)
          const left = Math.min(rect.left, window.innerWidth - 320);
          const top = Math.min(rect.bottom + 5, window.innerHeight - 200);
          setEditPos({ top, left });
          setIsEditing(true);
        }}
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

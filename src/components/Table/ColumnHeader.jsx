import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Filter } from 'lucide-react';

const ColumnHeader = ({ label, sortKey, sortConfig, onSort, filterValue, onFilterChange, options = [], style = {} }) => {
  const [showFilter, setShowFilter] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilter]);

  if (!sortKey) {
    return (
      <th style={{ 
        padding: 0, 
        fontWeight: '600',
        borderRight: '1px solid var(--border-color)',
        minWidth: '50px'
      }}>
        <div style={{
          padding: '12px 16px',
          resize: 'horizontal',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          minWidth: '50px'
        }}>
          {label}
        </div>
      </th>
    );
  }

  const isSorted = sortConfig?.key === sortKey;
  const direction = isSorted ? sortConfig.direction : null;

  const displayOptions = options.filter(opt => opt !== undefined && opt !== null && opt !== '');

  return (
    <th style={{ 
      padding: 0, 
      fontWeight: '600', 
      position: 'relative',
      borderRight: '1px solid var(--border-color)',
      minWidth: '100px',
      ...style
    }} ref={containerRef}>
      <div style={{
        resize: 'horizontal',
        overflow: 'hidden',
        padding: '12px 16px',
        minWidth: '100px',
        maxWidth: '400px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div 
            onClick={() => onSort(sortKey)} 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1, userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {label}
            <span style={{ color: isSorted ? 'var(--primary-color)' : 'var(--text-secondary)', opacity: isSorted ? 1 : 0.5 }}>
              {direction === 'asc' ? <ArrowUp size={14} /> : direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
            </span>
          </div>
          <div 
            onClick={() => setShowFilter(!showFilter)} 
            style={{ cursor: 'pointer', color: filterValue || showFilter ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            title="Filter"
          >
            <Filter size={14} />
          </div>
        </div>
      </div>
      
      {showFilter && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          zIndex: 50, 
          background: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '4px', 
          padding: '8px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
          marginTop: '4px', 
          minWidth: '200px',
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <input 
            type="text" 
            placeholder={`Search ${label}...`}
            className="input-field"
            style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem' }}
            value={filterValue || ''}
            onChange={(e) => onFilterChange(sortKey, e.target.value)}
            autoFocus
          />
          
          {displayOptions.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              overflowY: 'auto', 
              borderTop: '1px solid var(--border-color)',
              paddingTop: '4px'
            }}>
              <div 
                onClick={() => {
                  onFilterChange(sortKey, '');
                  setShowFilter(false);
                }}
                style={{ 
                  padding: '6px 8px', 
                  fontSize: '0.75rem', 
                  cursor: 'pointer', 
                  borderRadius: '4px',
                  color: !filterValue ? 'var(--primary-color)' : 'var(--text-primary)',
                  backgroundColor: !filterValue ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  fontWeight: !filterValue ? '600' : 'normal'
                }}
              >
                Clear Filter
              </div>
              {displayOptions.map((opt, idx) => {
                const optString = opt.toString();
                const isSelected = filterValue && optString.toLowerCase() === filterValue.toLowerCase();
                
                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      onFilterChange(sortKey, optString);
                      setShowFilter(false);
                    }}
                    style={{ 
                      padding: '6px 8px', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer', 
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      backgroundColor: isSelected ? 'rgba(0,0,0,0.05)' : 'transparent'
                    }}
                  >
                    {optString}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </th>
  );
};

export default ColumnHeader;

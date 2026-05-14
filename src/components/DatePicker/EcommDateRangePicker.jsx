import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { addDays, endOfDay, startOfDay, subDays, format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

const defineds = {
  startOfWeek: startOfDay(new Date()),
  endOfWeek: endOfDay(new Date()),
  startOfToday: startOfDay(new Date()),
  endOfToday: endOfDay(new Date()),
  startOfYesterday: startOfDay(subDays(new Date(), 1)),
  endOfYesterday: endOfDay(subDays(new Date(), 1)),
  startOfLast7Days: startOfDay(subDays(new Date(), 6)),
  startOfLast30Days: startOfDay(subDays(new Date(), 29)),
};

const staticRanges = createStaticRanges([
  {
    label: 'Hari ini',
    range: () => ({
      startDate: defineds.startOfToday,
      endDate: defineds.endOfToday
    })
  },
  {
    label: 'Kemarin',
    range: () => ({
      startDate: defineds.startOfYesterday,
      endDate: defineds.endOfYesterday
    })
  },
  {
    label: '7 hari terakhir',
    range: () => ({
      startDate: defineds.startOfLast7Days,
      endDate: defineds.endOfToday
    })
  },
  {
    label: '30 hari terakhir',
    range: () => ({
      startDate: defineds.startOfLast30Days,
      endDate: defineds.endOfToday
    })
  }
]);

const EcommDateRangePicker = ({ range, setRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pickerWidth = 800; // Accurate width for 2-month picker + sidebar
      let left = rect.left + window.scrollX;
      
      // If the picker would go off the right edge of the screen, align it to the right of the button
      if (left + pickerWidth > window.innerWidth) {
        left = (rect.right + window.scrollX) - pickerWidth;
      }
      
      // Ensure it doesn't go off the left edge either
      left = Math.max(10, left);

      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: left
      });
    }
  }, [isOpen]);

  const handleSelect = (ranges) => {
    setRange({
      start: ranges.selection.startDate,
      end: ranges.selection.endDate
    });
  };

  const getDisplayValue = () => {
    if (isSameDay(range.start, range.end)) {
      return format(range.start, 'MMM dd, yyyy');
    }
    return `${format(range.start, 'MMM dd, yyyy')} - ${format(range.end, 'MMM dd, yyyy')}`;
  };

  const portal = isOpen ? ReactDOM.createPortal(
    <div 
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${dropdownPos.top + 8}px`,
        left: `${dropdownPos.left}px`,
        zIndex: 9999,
        background: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        width: '800px',
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }}
    >
      <DateRangePicker
        onChange={handleSelect}
        showSelectionPreview={true}
        moveRangeOnFirstSelection={false}
        months={2}
        ranges={[{ startDate: range.start, endDate: range.end, key: 'selection' }]}
        direction="horizontal"
        locale={id}
        staticRanges={staticRanges}
        inputRanges={[]}
        rangeColors={['#00B5A5']} // Custom primary color
      />
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: 'var(--text-primary)',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: isOpen ? 'rgba(0, 181, 165, 0.1)' : 'transparent',
          border: '1px solid var(--border-color)',
          fontWeight: '500'
        }}
      >
        <Calendar size={16} color="var(--text-secondary)" />
        {getDisplayValue()}
      </div>
      {portal}
    </div>
  );
};

export default EcommDateRangePicker;

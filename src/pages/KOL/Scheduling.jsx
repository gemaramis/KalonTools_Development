import React, { useState, useMemo, useEffect } from 'react';
import { Search, Target, Loader2 } from 'lucide-react';
import ColumnHeader from '../../components/Table/ColumnHeader';
import { useSettings } from '../../context/SettingsContext';
import { useGoogleSheetData } from '../../hooks/useGoogleSheetData';

const schedulingDummyData = [
  {
    id: 1,
    mo: 'MO-1001',
    username: '@fashionsista',
    postingDate: '2023-11-05',
    videoQuantity: 2,
    performance: 'Good',
    uniqueCode: 'FASHION50',
    gmv: 15000000,
    roi: '2.5x',
    adResult: 'Positive'
  },
  {
    id: 2,
    mo: 'MO-1002',
    username: '@techguru',
    postingDate: '2023-11-10',
    videoQuantity: 1,
    performance: 'Average',
    uniqueCode: 'TECHPRO',
    gmv: 5000000,
    roi: '1.2x',
    adResult: 'Neutral'
  },
  {
    id: 3,
    mo: 'MO-1003',
    username: '@beautyqueen',
    postingDate: '2023-11-15',
    videoQuantity: 3,
    performance: 'Excellent',
    uniqueCode: 'BEAUTY99',
    gmv: 30000000,
    roi: '4.0x',
    adResult: 'Highly Positive'
  }
];

const Scheduling = () => {
  const { getSettingsForMonth, globalSettings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');

  const monthSettings = useMemo(() => {
    return getSettingsForMonth(periodFilter === 'All' ? 'January' : periodFilter);
  }, [periodFilter, getSettingsForMonth]);

  const { data: kolData, loading, error } = useGoogleSheetData(monthSettings.schedulingSpreadsheetLink);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (kolData) setData(kolData);
  }, [kolData]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getUniqueOptions = (key) => {
    const options = new Set(data.map(item => item[key]).filter(Boolean));
    return Array.from(options).sort();
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    // Global Search & Period
    if (searchTerm) {
      result = result.filter(item => 
        item.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (periodFilter !== 'All') {
      result = result.filter(item => item.postingPeriod === periodFilter);
    }

    // Column Filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        result = result.filter(item => item[key] === filters[key]);
      }
    });

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, periodFilter, filters, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, periodFilter, filters]);

  const stats = useMemo(() => {
    const excellent = filteredData.filter(d => d.performance === 'Excellent').length;
    const good = filteredData.filter(d => d.performance === 'Good').length;
    const average = filteredData.filter(d => d.performance === 'Average').length;
    const completed = filteredData.length;
    return { excellent, good, average, completed };
  }, [filteredData]);

  const handleEdit = async (id, field, value) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    
    // Background Sync to Master Sheet
    if (globalSettings?.appsScriptUrl) {
      const gidMatch = monthSettings.schedulingSpreadsheetLink?.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      
      const payload = {
        action: 'update',
        gid: gid,
        rowIdColumn: 'KOL ID (wajib isi)',
        rowId: id,
        columnName: field, // For scheduling, map accordingly if fields are editable
        newValue: value
      };
      
      try {
        await fetch(globalSettings.appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error("Live sync failed", e);
      }
    }
  };

  const formatCurrency = (value) => {
    const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    return formatted.replace(/,00$/, '');
  };

  const currentMonthTarget = monthSettings.totalTarget;
  const targetProgress = stats.completed;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KOL Scheduling Operations</h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search username..." 
              className="input-field" 
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="input-field" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="All">All Periods</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="Maret">Maret</option>
            <option value="April">April</option>
            <option value="Mei">Mei</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Statistics Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>Performance Overview</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="badge success" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Excellent: {stats.excellent}</div>
            <div className="badge warning" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Good: {stats.good}</div>
            <div className="badge danger" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Average: {stats.average}</div>
          </div>
        </div>

        {/* Quick Report Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} /> Quick Report ({periodFilter === 'All' ? 'Showing January Targets' : periodFilter})
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span>Total Monthly Target</span>
            <span style={{ fontWeight: '600' }}>{currentMonthTarget}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span>Completed Schedules</span>
            <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>{targetProgress}</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((targetProgress / Math.max(currentMonthTarget, 1)) * 100, 100)}%`, height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', paddingBottom: '50px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', resize: 'horizontal', overflow: 'hidden', whiteSpace: 'normal', minWidth: '50px', wordBreak: 'break-word' }}>No</th>
              <ColumnHeader label="Username" sortKey="username" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.username} onFilterChange={handleFilterChange} options={getUniqueOptions('username')} />
              <ColumnHeader label="Posting Date" sortKey="postingDate" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.postingDate} onFilterChange={handleFilterChange} options={getUniqueOptions('postingDate')} />
              <ColumnHeader label="Video Quantity" sortKey="videoQuantity" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.videoQuantity} onFilterChange={handleFilterChange} options={getUniqueOptions('videoQuantity')} />
              <ColumnHeader label="Performance" sortKey="performance" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.performance} onFilterChange={handleFilterChange} options={getUniqueOptions('performance')} />
              <ColumnHeader label="Unique Code" sortKey="uniqueCode" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.uniqueCode} onFilterChange={handleFilterChange} options={getUniqueOptions('uniqueCode')} />
              <ColumnHeader label="GMV" sortKey="gmv" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.gmv} onFilterChange={handleFilterChange} options={getUniqueOptions('gmv')} />
              <ColumnHeader label="ROI" sortKey="roi" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.roi} onFilterChange={handleFilterChange} options={getUniqueOptions('roi')} />
              <ColumnHeader label="Ad Result" sortKey="adResult" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.adResult} onFilterChange={handleFilterChange} options={getUniqueOptions('adResult')} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Loader2 className="animate-spin" size={24} color="var(--primary-color)" />
                    <p>Fetching spreadsheet data...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--danger-color)' }}>
                  <p style={{ fontWeight: '500', marginBottom: '8px' }}>Error: {error}</p>
                  <p style={{ fontSize: '0.875rem' }}>Please check your spreadsheet link in Manage settings.</p>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                  <p>No data available for the selected period.</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>Please ensure your Google Sheet contains data and the link is correctly synced.</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.username}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.postingDate}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.videoQuantity}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    <span className={`badge ${item.performance === 'Excellent' ? 'success' : item.performance === 'Good' ? 'warning' : 'danger'}`} style={{ padding: '4px 8px' }}>
                      {item.performance}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}><code>{item.uniqueCode}</code></td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{formatCurrency(item.gmv)}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.roi}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.adResult}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
          >
            Prev
          </button>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.875rem', minWidth: '40px' }}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                (pageNum === currentPage - 3 && pageNum > 1) || 
                (pageNum === currentPage + 3 && pageNum < totalPages)
              ) {
                return <span key={pageNum} style={{ alignSelf: 'center' }}>...</span>;
              }
              return null;
            })}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Scheduling;

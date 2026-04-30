import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Target, Loader2, RefreshCw } from 'lucide-react';
import ColumnHeader from '../../components/Table/ColumnHeader';
import EditableNote from '../../components/Table/EditableNote';
import { useSettings } from '../../context/SettingsContext';
import { useGoogleSheetData } from '../../hooks/useGoogleSheetData';

const Dealing = () => {
  const { permissions } = useAuth();
  const { getSettingsForMonth, globalSettings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  
  const monthSettings = useMemo(() => {
    return getSettingsForMonth(periodFilter === 'All' ? 'January' : periodFilter);
  }, [periodFilter, getSettingsForMonth]);

  const { data: kolData, loading, error, refresh } = useGoogleSheetData(monthSettings.dealingSpreadsheetLink);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (kolData) setData(kolData);
  }, [kolData]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

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

    if (searchTerm) {
      result = result.filter(item => 
        item.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (periodFilter !== 'All') {
      result = result.filter(item => item.postingPeriod === periodFilter);
    }

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        result = result.filter(item => item[key] === filters[key]);
      }
    });

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
    const totalDeal = filteredData.filter(d => d.dealingStatus === 'Dealed' || d.dealingStatus === 'Deal').length;
    const totalReject = filteredData.filter(d => d.dealingStatus === 'Cancel' || d.dealingStatus === 'Rejected by KOL' || d.approval === 'Rejected').length;
    const totalPaid = filteredData.filter(d => (d.paymentStatus || '').toLowerCase().includes('paid')).length;
    return { totalDeal, totalReject, totalPaid };
  }, [filteredData]);

  const handleEdit = async (id, field, value) => {
    // Optimistic UI Update
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    
    // Background Sync to Master Sheet
    if (globalSettings?.appsScriptUrl) {
      const gidMatch = monthSettings.dealingSpreadsheetLink?.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      
      const columnMap = {
        approval: 'Approval (Koko/Cici)',
        additionalNotes: 'Additional Notes (Koko/Cici)',
        dealingStatus: 'Dealing Status (Amel/Ken)',
        followUpNotes: 'Follow Up Notes (Amel/Ken)',
        paymentStatus: 'Payment Status'
      };
      
      const payload = {
        action: 'update',
        gid: gid,
        rowIdColumn: 'KOL ID (wajib isi)',
        rowId: id,
        columnName: columnMap[field] || field,
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
  const targetProgress = stats.totalDeal;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KOL Dealing Operations</h1>
        
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
          <button onClick={refresh} className="btn btn-secondary" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh Data">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Statistics Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>Overview</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="badge success" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Total Deal: {stats.totalDeal}</div>
            <div className="badge danger" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Total Rejected: {stats.totalReject}</div>
            <div className="badge warning" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Total PAID: {stats.totalPaid}</div>
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
            <span>Deals Secured</span>
            <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>{targetProgress}</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((targetProgress / Math.max(currentMonthTarget, 1)) * 100, 100)}%`, height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', paddingBottom: '10px', maxHeight: '550px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', resize: 'horizontal', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: '50px' }}>No</th>
              <ColumnHeader label="Username" sortKey="username" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.username} onFilterChange={handleFilterChange} options={getUniqueOptions('username')} />
              <ColumnHeader label="Coop. Month" sortKey="postingPeriod" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.postingPeriod} onFilterChange={handleFilterChange} options={getUniqueOptions('postingPeriod')} />
              <ColumnHeader label="PIC" sortKey="pic" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.pic} onFilterChange={handleFilterChange} options={getUniqueOptions('pic')} />
              <ColumnHeader label="Tier" sortKey="tier" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.tier} onFilterChange={handleFilterChange} options={getUniqueOptions('tier')} />
              <ColumnHeader label="Rate Card" sortKey="rateCard" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.rateCard} onFilterChange={handleFilterChange} options={getUniqueOptions('rateCard')} />
              <ColumnHeader label="Final Price" sortKey="finalPrice" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.finalPrice} onFilterChange={handleFilterChange} options={getUniqueOptions('finalPrice')} />
              <ColumnHeader label="Approval (Mgt)" sortKey="approval" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.approval} onFilterChange={handleFilterChange} options={getUniqueOptions('approval')} />
              <ColumnHeader label="SOW" sortKey="sow" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.sow} onFilterChange={handleFilterChange} options={getUniqueOptions('sow')} />
              <ColumnHeader label="Additional Notes (Mgt)" sortKey="additionalNotes" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.additionalNotes} onFilterChange={handleFilterChange} options={getUniqueOptions('additionalNotes')} />
              <ColumnHeader label="Dealing Status" sortKey="dealingStatus" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.dealingStatus} onFilterChange={handleFilterChange} options={getUniqueOptions('dealingStatus')} />
              <ColumnHeader label="Payment Status" sortKey="paymentStatus" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.paymentStatus} onFilterChange={handleFilterChange} options={getUniqueOptions('paymentStatus')} />
              <ColumnHeader label="Follow Up Notes" sortKey="followUpNotes" sortConfig={sortConfig} onSort={handleSort} filterValue={filters.followUpNotes} onFilterChange={handleFilterChange} options={getUniqueOptions('followUpNotes')} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Loader2 className="animate-spin" size={24} color="var(--primary-color)" />
                    <p>Fetching spreadsheet data...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--danger-color)' }}>
                  <p style={{ fontWeight: '500', marginBottom: '8px' }}>Error: {error}</p>
                  <p style={{ fontSize: '0.875rem' }}>Please check your spreadsheet link in Manage settings.</p>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                  <p>No data available for the selected period.</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>Please ensure your Google Sheet contains data and the link is correctly synced.</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const cellStyle = { padding: '12px 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' };
                
                const getApprovalColor = (val) => {
                  if (val === 'Approved' || val === 'YES') return 'var(--success-color)';
                  if (val === 'Rejected' || val === 'NO' || val === 'HOLD') return 'var(--danger-color)';
                  return 'var(--warning-color)';
                };

                const getDealingColor = (val) => {
                  if (val === 'Deal' || val === 'Dealed') return 'var(--success-color)';
                  if (val === 'Cancel' || val === 'Rejected by KOL') return 'var(--danger-color)';
                  return 'var(--warning-color)';
                };

                return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                  <td style={cellStyle}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td style={{ ...cellStyle, fontWeight: '500' }}>{item.username}</td>
                  <td style={cellStyle}>{item.postingPeriod}</td>
                  <td style={cellStyle}>{item.pic}</td>
                  <td style={cellStyle}>{item.tier}</td>
                  <td style={cellStyle}>{formatCurrency(item.rateCard)}</td>
                  <td style={cellStyle}>{formatCurrency(item.finalPrice)}</td>
                  
                  {/* Protected Field: Approval */}
                  <td style={{ padding: '8px', maxWidth: '150px' }}>
                    <select 
                      value={item.approval} 
                      onChange={(e) => handleEdit(item.id, 'approval', e.target.value)}
                      disabled={!permissions.canEditApproval}
                      style={{ 
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                        backgroundColor: permissions.canEditApproval ? 'var(--surface-color)' : 'var(--bg-color)',
                        color: getApprovalColor(item.approval),
                        fontWeight: '600', opacity: permissions.canEditApproval ? 1 : 0.7, width: '100%',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <option value="Pending" style={{ color: 'var(--warning-color)' }}>Pending</option>
                      <option value="Approved" style={{ color: 'var(--success-color)' }}>Approved</option>
                      <option value="Rejected" style={{ color: 'var(--danger-color)' }}>Rejected</option>
                      <option value="YES" style={{ color: 'var(--success-color)' }}>YES</option>
                      <option value="NO" style={{ color: 'var(--danger-color)' }}>NO</option>
                      <option value="HOLD" style={{ color: 'var(--danger-color)' }}>HOLD</option>
                    </select>
                  </td>
                  
                  <td style={cellStyle}>{item.sow}</td>
                  
                  {/* Protected Field: Additional Notes */}
                  <td style={{ padding: '8px', maxWidth: '150px' }}>
                    <EditableNote 
                      value={item.additionalNotes}
                      onSave={(val) => handleEdit(item.id, 'additionalNotes', val)}
                      disabled={!permissions.canEditApproval}
                    />
                  </td>
                  
                  {/* Semi-Protected Field: Dealing Status */}
                  <td style={{ padding: '8px', maxWidth: '150px' }}>
                    <select 
                      value={item.dealingStatus} 
                      onChange={(e) => handleEdit(item.id, 'dealingStatus', e.target.value)}
                      disabled={!permissions.canEditDealingStatus}
                      style={{ 
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                        backgroundColor: permissions.canEditDealingStatus ? 'var(--surface-color)' : 'var(--bg-color)',
                        color: getDealingColor(item.dealingStatus),
                        fontWeight: '600', opacity: permissions.canEditDealingStatus ? 1 : 0.7, width: '100%',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <option value="On Progress" style={{ color: 'var(--warning-color)' }}>On Progress</option>
                      <option value="Deal" style={{ color: 'var(--success-color)' }}>Deal</option>
                      <option value="Dealed" style={{ color: 'var(--success-color)' }}>Dealed</option>
                      <option value="Cancel" style={{ color: 'var(--danger-color)' }}>Cancel</option>
                      <option value="Rejected by KOL" style={{ color: 'var(--danger-color)' }}>Rejected by KOL</option>
                    </select>
                  </td>
                  
                  {/* Payment Status Field */}
                  <td style={{ padding: '8px', maxWidth: '150px' }}>
                    <select 
                      value={item.paymentStatus} 
                      onChange={(e) => handleEdit(item.id, 'paymentStatus', e.target.value)}
                      disabled={!permissions.canEditDealingStatus}
                      style={{ 
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                        backgroundColor: permissions.canEditDealingStatus ? 'var(--surface-color)' : 'var(--bg-color)',
                        color: (item.paymentStatus || '').toLowerCase().includes('paid') ? 'var(--success-color)' : 'var(--warning-color)',
                        fontWeight: '600', opacity: permissions.canEditDealingStatus ? 1 : 0.7, width: '100%',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="DP">DP</option>
                    </select>
                  </td>

                  {/* Semi-Protected Field: Follow Up Notes */}
                  <td style={{ padding: '8px', maxWidth: '150px' }}>
                    <EditableNote 
                      value={item.followUpNotes}
                      onSave={(val) => handleEdit(item.id, 'followUpNotes', val)}
                      disabled={!permissions.canEditDealingStatus}
                    />
                  </td>
                  
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
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
              // Show only first, last, and pages around current page
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

export default Dealing;

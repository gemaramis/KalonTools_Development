import React, { useState, useMemo } from 'react';
import { kolMockData } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { Search } from 'lucide-react';

const Dealing = () => {
  const { permissions } = useAuth();
  const [data, setData] = useState(kolMockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPeriod = periodFilter === 'All' || item.postingPeriod === periodFilter;
      return matchSearch && matchPeriod;
    });
  }, [data, searchTerm, periodFilter]);

  const stats = useMemo(() => {
    const totalDeal = filteredData.filter(d => d.dealingStatus === 'Deal').length;
    const totalReject = filteredData.filter(d => d.dealingStatus === 'Cancel' || d.approval === 'Rejected').length;
    const totalPaid = filteredData.filter(d => d.followUpNotes.toLowerCase().includes('paid')).length;
    return { totalDeal, totalReject, totalPaid };
  }, [filteredData]);

  const handleEdit = (id, field, value) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KOL Dealing Operations</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
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
            <option value="2023-10">2023-10</option>
            <option value="2023-11">2023-11</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div className="badge success" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Total Deal: {stats.totalDeal}</div>
        <div className="badge danger" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Total Rejected: {stats.totalReject}</div>
        <div className="badge warning" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Total PAID: {stats.totalPaid}</div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>No</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Period</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>PIC</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Tier</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Rate Card</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Final Price</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>Approval (Mgt)</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>SOW</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>Additional Notes (Mgt)</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>Dealing Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>Follow Up Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.username}</td>
                <td style={{ padding: '12px 16px' }}>{item.postingPeriod}</td>
                <td style={{ padding: '12px 16px' }}>{item.pic}</td>
                <td style={{ padding: '12px 16px' }}>{item.tier}</td>
                <td style={{ padding: '12px 16px' }}>{formatCurrency(item.rateCard)}</td>
                <td style={{ padding: '12px 16px' }}>{formatCurrency(item.finalPrice)}</td>
                
                {/* Protected Field: Approval */}
                <td style={{ padding: '8px' }}>
                  <select 
                    value={item.approval} 
                    onChange={(e) => handleEdit(item.id, 'approval', e.target.value)}
                    disabled={!permissions.canEditApproval}
                    style={{ 
                      padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                      backgroundColor: permissions.canEditApproval ? 'var(--surface-color)' : 'var(--bg-color)',
                      color: item.approval === 'Approved' ? 'var(--success-color)' : item.approval === 'Rejected' ? 'var(--danger-color)' : 'var(--warning-color)',
                      fontWeight: '600', opacity: permissions.canEditApproval ? 1 : 0.7, width: '100%'
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                
                <td style={{ padding: '12px 16px' }}>{item.sow}</td>
                
                {/* Protected Field: Additional Notes */}
                <td style={{ padding: '8px' }}>
                  <input 
                    type="text" 
                    value={item.additionalNotes} 
                    onChange={(e) => handleEdit(item.id, 'additionalNotes', e.target.value)}
                    disabled={!permissions.canEditApproval}
                    style={{ 
                      padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                      backgroundColor: permissions.canEditApproval ? 'var(--surface-color)' : 'var(--bg-color)',
                      width: '100%', opacity: permissions.canEditApproval ? 1 : 0.7
                    }}
                  />
                </td>
                
                {/* Semi-Protected Field: Dealing Status */}
                <td style={{ padding: '8px' }}>
                  <select 
                    value={item.dealingStatus} 
                    onChange={(e) => handleEdit(item.id, 'dealingStatus', e.target.value)}
                    disabled={!permissions.canEditDealingStatus}
                    style={{ 
                      padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                      backgroundColor: permissions.canEditDealingStatus ? 'var(--surface-color)' : 'var(--bg-color)',
                      color: item.dealingStatus === 'Deal' ? 'var(--success-color)' : item.dealingStatus === 'Cancel' ? 'var(--danger-color)' : 'var(--warning-color)',
                      fontWeight: '600', opacity: permissions.canEditDealingStatus ? 1 : 0.7, width: '100%'
                    }}
                  >
                    <option value="On Progress">On Progress</option>
                    <option value="Deal">Deal</option>
                    <option value="Cancel">Cancel</option>
                  </select>
                </td>
                
                {/* Semi-Protected Field: Follow Up Notes */}
                <td style={{ padding: '8px' }}>
                  <input 
                    type="text" 
                    value={item.followUpNotes} 
                    onChange={(e) => handleEdit(item.id, 'followUpNotes', e.target.value)}
                    disabled={!permissions.canEditDealingStatus}
                    style={{ 
                      padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
                      backgroundColor: permissions.canEditDealingStatus ? 'var(--surface-color)' : 'var(--bg-color)',
                      width: '100%', opacity: permissions.canEditDealingStatus ? 1 : 0.7
                    }}
                  />
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dealing;

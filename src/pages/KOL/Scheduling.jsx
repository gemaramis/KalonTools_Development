import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import ColumnHeader from '../../components/Table/ColumnHeader';

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
  const [data, setData] = useState(schedulingDummyData);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});

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
    const values = data.map(item => item[key]).filter(val => val !== undefined && val !== null && val !== '');
    return [...new Set(values)].sort();
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    // Global Search
    if (searchTerm) {
      result = result.filter(item => 
        item.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.mo && item.mo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Column Filters
    Object.keys(filters).forEach(key => {
      const filterValue = filters[key];
      if (filterValue) {
        result = result.filter(item => {
          const itemValue = item[key]?.toString().toLowerCase() || '';
          return itemValue.includes(filterValue.toLowerCase());
        });
      }
    });

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig]);

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>KOL Scheduling Operations</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search username or MO..." 
              className="input-field" 
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>No</th>
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
            {filteredData.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.username}</td>
                <td style={{ padding: '12px 16px' }}>{item.postingDate}</td>
                <td style={{ padding: '12px 16px' }}>{item.videoQuantity}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`badge ${item.performance === 'Excellent' ? 'success' : item.performance === 'Good' ? 'warning' : 'danger'}`} style={{ padding: '4px 8px' }}>
                    {item.performance}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}><code>{item.uniqueCode}</code></td>
                <td style={{ padding: '12px 16px' }}>{formatCurrency(item.gmv)}</td>
                <td style={{ padding: '12px 16px' }}>{item.roi}</td>
                <td style={{ padding: '12px 16px' }}>{item.adResult}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Scheduling;

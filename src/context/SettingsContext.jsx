import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const [monthlySettings, setMonthlySettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('kln_monthly_settings');
      if (savedSettings && savedSettings !== 'undefined') {
        return JSON.parse(savedSettings);
      }
    } catch (e) {
      console.error("Failed to parse settings from local storage", e);
    }
    return {
      'January': {
        totalTarget: 10,
        targetBudget: 100000000,
        pics: [
          { id: 1, name: 'Amel', percentage: 50 },
          { id: 2, name: 'Ken', percentage: 50 }
        ],
        dealingSpreadsheetLink: '',
        schedulingSpreadsheetLink: ''
      },
      'February': {
        totalTarget: 15,
        targetBudget: 150000000,
        pics: [
          { id: 1, name: 'Amel', percentage: 50 },
          { id: 2, name: 'Ken', percentage: 50 }
        ],
        dealingSpreadsheetLink: '',
        schedulingSpreadsheetLink: ''
      },
      'Maret': {
        totalTarget: 15,
        targetBudget: 150000000,
        pics: [
          { id: 1, name: 'Amel', percentage: 50 },
          { id: 2, name: 'Ken', percentage: 50 }
        ],
        dealingSpreadsheetLink: '',
        schedulingSpreadsheetLink: ''
      },
      'April': {
        totalTarget: 15,
        targetBudget: 150000000,
        pics: [
          { id: 1, name: 'Amel', percentage: 50 },
          { id: 2, name: 'Ken', percentage: 50 }
        ],
        dealingSpreadsheetLink: '',
        schedulingSpreadsheetLink: ''
      },
      'Mei': {
        totalTarget: 15,
        targetBudget: 150000000,
        pics: [
          { id: 1, name: 'Amel', percentage: 50 },
          { id: 2, name: 'Ken', percentage: 50 }
        ],
        dealingSpreadsheetLink: '',
        schedulingSpreadsheetLink: ''
      }
    };
  });

  const [globalSettings, setGlobalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('kln_global_settings');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse global settings", e);
    }
    return { appsScriptUrl: '' };
  });

  useEffect(() => {
    localStorage.setItem('kln_monthly_settings', JSON.stringify(monthlySettings));
  }, [monthlySettings]);

  useEffect(() => {
    localStorage.setItem('kln_global_settings', JSON.stringify(globalSettings));
  }, [globalSettings]);

  const updateMonthlySettings = (month, newSettings) => {
    setMonthlySettings(prev => ({
      ...prev,
      [month]: { ...prev[month], ...newSettings }
    }));
  };

  const getSettingsForMonth = (month) => {
    return monthlySettings[month] || {
      totalTarget: 0,
      targetBudget: 0,
      pics: [],
      dealingSpreadsheetLink: '',
      schedulingSpreadsheetLink: ''
    };
  };

  return (
    <SettingsContext.Provider value={{ 
      monthlySettings, 
      updateMonthlySettings, 
      getSettingsForMonth,
      globalSettings,
      setGlobalSettings 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

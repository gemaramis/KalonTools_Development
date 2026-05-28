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

const DEFAULT_DEALING_LINK = 'https://docs.google.com/spreadsheets/d/1ZeGXZt0pAueJsPq_iqM_-PGE-LcPZ3c2AphDeIlWObA/edit?gid=0#gid=0';
const DEFAULT_SCHEDULING_LINK = 'https://docs.google.com/spreadsheets/d/1ZeGXZt0pAueJsPq_iqM_-PGE-LcPZ3c2AphDeIlWObA/edit?gid=1978733706#gid=1978733706';
const DEFAULT_ECOMM_LINK = 'https://docs.google.com/spreadsheets/d/1CjEAcExQFuQtCrqqXOezRe8icXeVcePIEr0fALNQIMI/edit?gid=1551198310#gid=1551198310';
const DEFAULT_ADS_LINK = 'https://docs.google.com/spreadsheets/d/1CjEAcExQFuQtCrqqXOezRe8icXeVcePIEr0fALNQIMI/edit?gid=372012532#gid=372012532';
const DEFAULT_FINANCE_LINK = 'https://docs.google.com/spreadsheets/d/1CjEAcExQFuQtCrqqXOezRe8icXeVcePIEr0fALNQIMI/edit?gid=251030538#gid=251030538';
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbSZL2bnB7QhSSoyJ9N2qLxUua2HBbpjD6FcbWNDpZta79bFZ_BmWdRUvvOQihFX6o/exec';

  const [globalSettings, setGlobalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('kln_global_settings');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          adsLink: parsed.adsLink || DEFAULT_ADS_LINK,
          financeLink: parsed.financeLink || DEFAULT_FINANCE_LINK,
          appsScriptUrl: parsed.appsScriptUrl || DEFAULT_APPS_SCRIPT_URL
        };
      }
    } catch (e) {
      console.error("Failed to parse global settings", e);
    }
    return { 
      appsScriptUrl: DEFAULT_APPS_SCRIPT_URL,
      ecommLink: DEFAULT_ECOMM_LINK,
      financeLink: DEFAULT_FINANCE_LINK,
      adsLink: DEFAULT_ADS_LINK
    };
  });

  useEffect(() => {
    localStorage.setItem('kln_monthly_settings', JSON.stringify(monthlySettings));
  }, [monthlySettings]);

  useEffect(() => {
    localStorage.setItem('kln_global_settings', JSON.stringify(globalSettings));
  }, [globalSettings]);

  const updateMonthlySettings = React.useCallback((month, newSettings) => {
    setMonthlySettings(prev => ({
      ...prev,
      [month]: { ...prev[month], ...newSettings }
    }));
  }, []);

  const getSettingsForMonth = React.useCallback((month) => {
    const settings = monthlySettings[month] || {
      totalTarget: 10,
      targetBudget: 100000000,
      pics: [
        { id: 1, name: 'Amel', percentage: 50 },
        { id: 2, name: 'Ken', percentage: 50 }
      ]
    };
    
    return {
      ...settings,
      actionPlanNotes: settings.actionPlanNotes || [],
      dealingSpreadsheetLink: settings.dealingSpreadsheetLink || DEFAULT_DEALING_LINK,
      schedulingSpreadsheetLink: settings.schedulingSpreadsheetLink || DEFAULT_SCHEDULING_LINK
    };
  }, [monthlySettings]);

  return (
    <SettingsContext.Provider value={{ 
      monthlySettings, 
      updateMonthlySettings, 
      getSettingsForMonth,
      globalSettings: {
        ...globalSettings,
        appsScriptUrl: globalSettings.appsScriptUrl || DEFAULT_APPS_SCRIPT_URL,
        ecommLink: globalSettings.ecommLink || DEFAULT_ECOMM_LINK,
        financeLink: globalSettings.financeLink || DEFAULT_FINANCE_LINK,
        adsLink: globalSettings.adsLink || DEFAULT_ADS_LINK
      },
      setGlobalSettings 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

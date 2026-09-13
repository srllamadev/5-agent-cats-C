'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ENV } from '@/lib/env';

export interface AuditSettings {
  provider: string;
  deepseekModel: string;
  claudeModel: string;
  openaiModel: string;
  maxBudget: number;
  chainMode: string;
  ipfsMode: string;
}

export interface ApiKeys {
  claude: string;
  deepseek: string;
  openai: string;
  pinata: string;
  snowtrace: string;
}

interface AuditContextType {
  settings: AuditSettings;
  setSettings: (settings: AuditSettings) => void;
  apiKeys: ApiKeys;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  contractSource: string | null;
  setContractSource: (source: string | null) => void;
  contractMeta: any;
  setContractMeta: (meta: any) => void;
}

const defaultSettings: AuditSettings = {
  provider: ENV.DEFAULT_PROVIDER || 'deepseek',
  deepseekModel: ENV.DEFAULT_DEEPSEEK_MODEL || 'deepseek-chat',
  claudeModel: ENV.DEFAULT_CLAUDE_MODEL || 'claude-sonnet-4-5',
  openaiModel: ENV.DEFAULT_OPENAI_MODEL || 'gpt-4o-mini',
  maxBudget: ENV.MAX_AUDIT_BUDGET_USD || 0.10,
  chainMode: ENV.CHAIN_MODE || 'simulated',
  ipfsMode: ENV.IPFS_MODE || 'simulated',
};

const defaultKeys: ApiKeys = {
  claude: '',
  deepseek: '',
  openai: '',
  pinata: '',
  snowtrace: '',
};

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AuditSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audit_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return defaultSettings;
  });

  const [apiKeys, setApiKeysState] = useState<ApiKeys>(() => {
    if (typeof window !== 'undefined') {
      return {
        claude: localStorage.getItem('apikey_claude') || ENV.CLAUDE_API_KEY || '',
        deepseek: localStorage.getItem('apikey_deepseek') || ENV.DEEPSEEK_API_KEY || '',
        openai: localStorage.getItem('apikey_openai') || ENV.OPENAI_API_KEY || '',
        pinata: localStorage.getItem('apikey_pinata') || ENV.PINATA_JWT || '',
        snowtrace: localStorage.getItem('apikey_snowtrace') || ENV.SNOWTRACE_API_KEY || '',
      };
    }
    return defaultKeys;
  });

  const [contractSource, setContractSourceState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('audit_source');
    }
    return null;
  });

  const [contractMeta, setContractMetaState] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const meta = sessionStorage.getItem('audit_meta');
      return meta ? JSON.parse(meta) : null;
    }
    return null;
  });

  const handleSetSettings = (newSettings: AuditSettings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audit_settings', JSON.stringify(newSettings));
    }
  };

  const handleSetApiKey = (provider: keyof ApiKeys, key: string) => {
    setApiKeysState(prev => ({ ...prev, [provider]: key }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(`apikey_${provider}`, key);
    }
  };

  const setContractSource = (source: string | null) => {
    setContractSourceState(source);
    if (typeof window !== 'undefined') {
      if (source) sessionStorage.setItem('audit_source', source);
      else sessionStorage.removeItem('audit_source');
    }
  };

  const setContractMeta = (meta: any) => {
    setContractMetaState(meta);
    if (typeof window !== 'undefined') {
      if (meta) sessionStorage.setItem('audit_meta', JSON.stringify(meta));
      else sessionStorage.removeItem('audit_meta');
    }
  };

  return (
    <AuditContext.Provider value={{
      settings,
      setSettings: handleSetSettings,
      apiKeys,
      setApiKey: handleSetApiKey,
      contractSource,
      setContractSource,
      contractMeta,
      setContractMeta
    }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditContext() {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAuditContext must be used within an AuditProvider');
  }
  return context;
}

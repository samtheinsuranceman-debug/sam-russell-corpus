import React, { createContext, useContext, useState } from 'react';

interface StrategyState {
  data: Record<string, any>;
  updateStrategy: (key: string, value: any) => void;
}

export const StrategyContext = createContext<StrategyState>({
  data: {},
  updateStrategy: () => {},
});

export const useStrategy = () => useContext(StrategyContext);

export const StrategyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Record<string, any>>({});

  const updateStrategy = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <StrategyContext.Provider value={{ data, updateStrategy }}>
      {children}
    </StrategyContext.Provider>
  );
};

export default StrategyContext;

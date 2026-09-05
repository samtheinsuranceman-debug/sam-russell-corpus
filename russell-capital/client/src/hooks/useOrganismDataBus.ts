// @ts-nocheck

import React, { useState, useEffect, useCallback } from 'react';

export const enum Channels {
  CALC_RESULTS = 'calc_results',
  TAX_SUMMARY = 'tax_summary',
  RETIREMENT_STATUS = 'retirement_status',
  PORTFOLIO_METRICS = 'portfolio_metrics',
  INSURANCE_GAPS = 'insurance_gaps',
  ESTATE_PLAN = 'estate_plan',
  NET_WORTH = 'net_worth',
  RISK_SCORE = 'risk_score',
  ALERTS = 'alerts',
  CLIENT_PROFILE = 'client_profile',
}

class DataBus {
  private static instance: DataBus;
  private channels: Map<string, any> = new Map();
  private subscribers: Map<string, Set<Function>> = new Map();

  private constructor() {} // Private constructor for singleton

  public static getInstance(): DataBus {
    if (!DataBus.instance) {
      DataBus.instance = new DataBus();
    }
    return DataBus.instance;
  }

  public publish(channel: string, data: any): void {
    this.channels.set(channel, data);
    if (this.subscribers.has(channel)) {
      const subs = this.subscribers.get(channel)!;
      subs.forEach(callback => callback(data));
    }
  }

  public subscribe(channel: string, callback: Function): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    const subs = this.subscribers.get(channel)!;
    subs.add(callback);
    return () => {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscribers.delete(channel);
      }
    };
  }

  public getLatest(channel: string): any {
    return this.channels.get(channel);
  }

  public getAllChannels(): Map<string, any> {
    return this.channels;
  }

  public clear(): void {
    this.channels.clear();
    this.subscribers.clear();
  }
}

export function useDataBus() {
  return DataBus.getInstance();
}

export function usePublish(channel: string) {
  const dataBus = useDataBus();
  return useCallback((data: any) => {
    dataBus.publish(channel, data);
  }, [dataBus, channel]);
}

export function useSubscribe(channel: string) {
  const dataBus = useDataBus();
  const [data, setData] = useState(() => dataBus.getLatest(channel));

  useEffect(() => {
    const unsubscribe = dataBus.subscribe(channel, (newData: any) => {
      setData(newData);
    });
    return unsubscribe;
  }, [dataBus, channel]);

  return data;
}

export function useAllChannels() {
  const dataBus = useDataBus();
  const allChannels = Object.values(Channels) as string[];
  const [channelsData, setChannelsData] = useState(() => {
    const data: { [key: string]: any } = {};
    allChannels.forEach(ch => {
      data[ch] = dataBus.getLatest(ch);
    });
    return data;
  });

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    allChannels.forEach(ch => {
      const unsubscribe = dataBus.subscribe(ch, (newData: any) => {
        setChannelsData(prev => ({ ...prev, [ch]: newData }));
      });
      unsubscribes.push(unsubscribe);
    });
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [dataBus]);

  return channelsData;
}

export function useBroadcastCalcResult(calcName: string) {
  const dataBus = useDataBus();
  return useCallback((result: any) => {
    dataBus.publish(Channels.CALC_RESULTS, { calcName, result });
  }, [dataBus, calcName]);
}

import { useEffect, useRef, useState } from 'react';
import type { DashboardData } from '@shared/types';

interface UseDashboardResult {
  data: DashboardData | null;
  connected: boolean;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((d: DashboardData) => setData(d))
      .catch(() => {});

    function connect() {
      const es = new EventSource('/api/events');
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (event: MessageEvent) => {
        const d = JSON.parse(event.data as string) as DashboardData;
        setData(d);
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        retryRef.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  return { data, connected };
}

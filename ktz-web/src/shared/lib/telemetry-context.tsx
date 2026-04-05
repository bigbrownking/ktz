'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { TelemetryData, STABLE_TELEMETRY, generateMockData, updateTelemetryData } from './mock-data';
import { BackendTelemetry, BackendHealth } from './backend-types';
import { connectWs } from './ws-client';

export interface TelemetrySnapshot {
  ts: number;
  speed: number;
  health: number;
  temperature: number;
  oilPressure: number;
  voltage: number;
  current: number;
  rpm: number;
  fuelLevel: number;
  healthCategory: string;
}

interface TelemetryContextValue {
  telemetry: TelemetryData;
  connected: boolean;
  locomotiveNumber: string;
  buffer: TelemetrySnapshot[];
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export const KTZ_LOCO_CHANGE = 'ktz-loco-change';

/** Записать номер локомотива для кабины/телеметрии и переподписаться на WS (диспетчер, ссылки с ?loco=). */
export function setKtzLocoNumber(number: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ktz_loco_number', number);
  window.dispatchEvent(new CustomEvent(KTZ_LOCO_CHANGE));
}

const FUEL_MAX_LITERS = 5000;
const WATER_MAX_LITERS = 5000;

/** Сколько миллисекунд телеметрии держим в буфере (тренды, replay и т.д.) */
export const TELEMETRY_BUFFER_MS = 15 * 60 * 1000;
const BUFFER_MS = TELEMETRY_BUFFER_MS;

function mapToFrontend(raw: BackendTelemetry, health: BackendHealth | null): TelemetryData {
  const isTE33A = raw.type === 'TE33A';

  const fuelPct = Math.min(100, (raw.fuelLevel / FUEL_MAX_LITERS) * 100);
  const waterPct = Math.min(100, (raw.waterLevel / WATER_MAX_LITERS) * 100);

  const score = health?.score ?? 75;
  const categoryLabel = (health?.categoryLabel ?? 'Норма') as TelemetryData['healthCategory'];
  const category = health?.category ?? 'NORM';

  const healthFactors = (health?.allFactors ?? []).map(f => ({
    name: f.label,
    value: f.rawValue,
    weight: f.weight / 100,
    status: (f.status === 'OK' ? 'good' : f.status === 'WARN' ? 'warning' : 'critical') as 'good' | 'warning' | 'critical',
    contribution: f.contribution,
  }));

  const alerts = (health?.recommendations ?? [])
    .filter(r => r.startsWith('🔴') || r.startsWith('🟡'))
    .map((r, i) => ({
      id: `ws-${i}-${r.length}-${r.slice(0, 32)}`,
      level: (r.startsWith('🔴') ? 'critical' : 'warning') as 'critical' | 'warning' | 'info',
      title: r.replace(/^[🔴🟡]\s*(СРОЧНО|Внимание):\s*/u, '').split(':')[0].slice(0, 60),
      message: r,
      timestamp: new Date(),
      source: 'Телеметрия',
    }));

  const recommendations = (health?.recommendations ?? []).map((r, i) => ({
    id: String(i),
    title: r.slice(0, 60),
    description: r,
    priority: (r.startsWith('🔴') ? 'high' : r.startsWith('🟡') ? 'medium' : 'low') as 'high' | 'medium' | 'low',
  }));

  const nameParts = (raw.locomotiveName ?? '').split('-');
  const currentStation = nameParts[0]?.trim() ?? 'Астана';
  const nextStation = nameParts[1]?.trim() ?? 'Кокшетау';

  return {
    locomotiveType: raw.type,
    health: score,
    healthFactors: healthFactors.length > 0 ? healthFactors : [],
    healthCategory: categoryLabel,
    speed: raw.speed,
    reserveLevel: fuelPct,
    consumptionRate: 380 + (raw.tractionForce / 400) * 70,
    estimatedRange: (fuelPct / 100) * 5000 / 0.4,

    temperature: isTE33A ? raw.coolantTemp : 0,
    waterTemperature: isTE33A ? raw.coolantTemp : 0,
    oilTemperature: isTE33A ? raw.oilTemp : 0,
    oilPressure: isTE33A ? raw.oilPressure : 0,
    rpm: isTE33A ? raw.engineRpm : 0,
    turbineSpeed: isTE33A ? raw.engineRpm * 6.5 : 0,
    turbinePressure: isTE33A ? raw.turboPressure : 0,

    fuelLevel: isTE33A ? fuelPct : 100,
    fuelConsumption: 380 + (raw.tractionForce / 400) * 70,
    waterLevel: isTE33A ? waterPct : 100,

    brakePressureMain: 4.7,
    brakePressureCylinder1: 4.3,
    brakePressureCylinder2: 4.4,
    brakePressureCylinder3: 4.2,
    brakePressureCylinder4: 4.5,
    brakePressureFeed: 5.2,

    current: raw.current,
    voltage: isTE33A ? raw.voltage : raw.sectionVoltage * 1000,
    generatorOutput: isTE33A ? 2800 : (raw.powerRecuperation ?? 0),
    generatorVoltage: isTE33A ? 3150 : raw.sectionVoltage * 1000,
    batteryVoltage: 110,

    efficiencyMode: raw.tractionForce > 380 ? 'ДИНАМИЧЕСКАЯ ТЯГА АКТИВНА' : 'СТАНДАРТНЫЙ РЕЖИМ',
    status: category === 'NORM' ? 'active' : category === 'WARN' ? 'warning' : 'critical',
    alerts,
    diagnostics: [],
    route: {
      currentStation,
      nextStation,
      progress: 50,
      distance: 42,
      eta: '--:--',
      gradient: 0,
    },
    recommendations,
  };
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [telemetry, setTelemetry] = useState<TelemetryData>(STABLE_TELEMETRY);
  const [connected, setConnected] = useState(false);
  const [buffer, setBuffer] = useState<TelemetrySnapshot[]>([]);
  const [, setLocoRevision] = useState(0);
  const healthRef = useRef<BackendHealth | null>(null);
  const lastRawRef = useRef<BackendTelemetry | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    const onLocoChange = () => setLocoRevision(n => n + 1);
    window.addEventListener(KTZ_LOCO_CHANGE, onLocoChange);
    return () => window.removeEventListener(KTZ_LOCO_CHANGE, onLocoChange);
  }, []);

  const locoNumber =
    typeof window !== 'undefined'
      ? (localStorage.getItem('ktz_loco_number') ?? 'TE33A-001')
      : 'TE33A-001';

  const pushSnapshot = (t: TelemetryData) => {
    const snap: TelemetrySnapshot = {
      ts: Date.now(),
      speed: t.speed,
      health: t.health,
      temperature: t.temperature,
      oilPressure: t.oilPressure,
      voltage: t.voltage,
      current: t.current,
      rpm: t.rpm,
      fuelLevel: t.fuelLevel,
      healthCategory: t.healthCategory,
    };
    setBuffer(prev => {
      const cutoff = Date.now() - BUFFER_MS;
      return [...prev.filter(s => s.ts > cutoff), snap];
    });
  };

  useEffect(() => {
    setTelemetry(generateMockData());
    const interval = setInterval(() => {
      if (!connectedRef.current) {
        setTelemetry(prev => {
          const updated = updateTelemetryData(prev);
          pushSnapshot(updated);
          return updated;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const closeTelemetry = connectWs(
      `/ws/telemetry/${locoNumber}`,
      (data) => {
        const raw = data as BackendTelemetry;
        lastRawRef.current = raw;
        connectedRef.current = true;
        setConnected(true);
        const mapped = mapToFrontend(raw, healthRef.current);
        pushSnapshot(mapped);
        setTelemetry(mapped);
      },
      undefined,
      () => {
        connectedRef.current = false;
        setConnected(false);
      },
    );

    const closeHealth = connectWs(
      `/ws/health/${locoNumber}`,
      (data) => {
        healthRef.current = data as BackendHealth;
        if (lastRawRef.current) {
          setTelemetry(mapToFrontend(lastRawRef.current, healthRef.current));
        }
      },
      undefined,
      () => {
      },
    );

    return () => {
      lastRawRef.current = null;
      closeTelemetry();
      closeHealth();
      connectedRef.current = false;
      setConnected(false);
    };
  }, [locoNumber]);

  return (
    <TelemetryContext.Provider value={{ telemetry, connected, locomotiveNumber: locoNumber, buffer }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryData {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used inside TelemetryProvider');
  return ctx.telemetry;
}

export function useTelemetryContext() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used inside TelemetryProvider');
  return ctx;
}

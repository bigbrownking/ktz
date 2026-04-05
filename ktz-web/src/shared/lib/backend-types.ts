export interface BackendTelemetry {
  locomotiveNumber: string;
  locomotiveName: string | null;
  type: 'TE33A' | 'KZ8A';
  timestamp: string;
  latitude: number;
  longitude: number;

  speed: number;
  tractionForce: number;
  voltage: number;
  current: number;

  engineRpm: number;
  coolantTemp: number;
  oilTemp: number;
  oilPressure: number;
  turboPressure: number;
  fuelLevel: number;
  waterLevel: number;

  sectionVoltage: number;
  powerRecuperation: number;
}

export interface BackendHealth {
  locomotiveNumber: string;
  calculatedAt: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  category: 'NORM' | 'WARN' | 'CRIT';
  categoryLabel: string;
  topFactors: BackendHealthFactor[];
  allFactors: BackendHealthFactor[];
  recommendations: string[];
}

export interface BackendHealthFactor {
  paramName: string;
  label: string;
  rawValue: number;
  penalty: number;
  weight: number;
  contribution: number;
  status: 'OK' | 'WARN' | 'CRIT';
  description: string;
}

export interface BackendMapPoint {
  locomotiveNumber: string;
  locomotiveName: string;
  latitude: number;
  longitude: number;
  speed: number;
  /** Уровень топлива, % */
  fuelLevel?: number;
  timestamp: string;
}

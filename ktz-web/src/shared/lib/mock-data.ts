export interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  source?: string;
}

export interface DiagnosticLog {
  id: string;
  message: string;
  timestamp: string;
  source: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface HealthFactor {
  name: string;
  value: number;
  weight: number;
  status: 'good' | 'warning' | 'critical';
  contribution: number;
}

export interface TelemetryData {
  health: number;
  healthFactors: HealthFactor[];
  healthCategory: 'Норма' | 'Внимание' | 'Критично';
  speed: number;
  reserveLevel: number;
  consumptionRate: number;
  estimatedRange: number;

  temperature: number;
  waterTemperature: number;
  oilTemperature: number;
  oilPressure: number;
  rpm: number;
  turbineSpeed: number;
  turbinePressure: number;

  fuelLevel: number;
  fuelConsumption: number;
  waterLevel: number;

  brakePressureMain: number;
  brakePressureCylinder1: number;
  brakePressureCylinder2: number;
  brakePressureCylinder3: number;
  brakePressureCylinder4: number;
  brakePressureFeed: number;

  current: number;
  voltage: number;
  generatorOutput: number;
  generatorVoltage: number;
  batteryVoltage: number;

  efficiencyMode: string;
  status: 'active' | 'warning' | 'critical';
  alerts: Alert[];
  diagnostics: DiagnosticLog[];
  route: {
    currentStation: string;
    nextStation: string;
    progress: number;
    distance: number;
    eta: string;
    gradient: number;
  };
  recommendations: Recommendation[];
}

export const STABLE_TELEMETRY: TelemetryData = {
  health: 85,
  healthFactors: [],
  healthCategory: 'Норма',
  speed: 0,
  reserveLevel: 85,
  consumptionRate: 400,
  estimatedRange: 1250,
  temperature: 90,
  waterTemperature: 87,
  oilTemperature: 98,
  oilPressure: 3.8,
  rpm: 1900,
  turbineSpeed: 12500,
  turbinePressure: 1.9,
  fuelLevel: 85,
  fuelConsumption: 400,
  waterLevel: 92,
  brakePressureMain: 4.7,
  brakePressureCylinder1: 4.3,
  brakePressureCylinder2: 4.4,
  brakePressureCylinder3: 4.2,
  brakePressureCylinder4: 4.5,
  brakePressureFeed: 5.2,
  current: 850,
  voltage: 3150,
  generatorOutput: 2850,
  generatorVoltage: 3160,
  batteryVoltage: 112,
  efficiencyMode: 'СТАНДАРТНЫЙ РЕЖИМ',
  status: 'active',
  alerts: [],
  diagnostics: [],
  route: {
    currentStation: 'Астана',
    nextStation: 'Кокшетау',
    progress: 45,
    distance: 42,
    eta: '--:--',
    gradient: 0,
  },
  recommendations: [],
};

const stations = [
  ['Астана', 'Караганда'],
  ['Алматы', 'Шымкент'],
  ['Актобе', 'Уральск'],
  ['Павлодар', 'Семей'],
  ['Костанай', 'Рудный'],
];

const diagnosticMessages = [
  { message: 'Обнаружена небольшая пульсация напряжения', source: 'Генератор 8' },
  { message: 'Подтверждён сигнал AWS', source: 'Кабинные системы' },
  { message: 'Автоматическая выдача песка завершена', source: 'Тяговый блок' },
  { message: 'Проверка тормозной системы пройдена', source: 'Тормозная система' },
  { message: 'Синхронизация с диспетчерской', source: 'Связь' },
];

const recommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Оптимизация режима топлива',
    description:
      'Переключитесь на Cruise Control 2.0 для увеличения эффективности на +8% на текущем градиенте.',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Предупреждение об обслуживании',
    description: 'Плановая замена фильтра воздухозаборника через 200км. Предзаказать запчасти.',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Проверка охлаждающей системы',
    description: 'Температура двигателя приближается к верхней норме. Рекомендуется мониторинг.',
    priority: 'medium',
  },
];

const allAlerts: Alert[] = [
  {
    id: '1',
    level: 'critical',
    title: 'НИЗКОЕ ДАВЛЕНИЕ МАСЛА',
    message:
      'Уменьшите обороты или остановитесь немедленно. Обнаружен критический риск отказа в блоке двигателя А.',
    timestamp: new Date(Date.now() - 120000),
    source: 'Дизель',
  },
  {
    id: '2',
    level: 'warning',
    title: 'Повышенная температура охлаждающей жидкости',
    message: 'Температура воды приближается к верхней границе нормы.',
    timestamp: new Date(Date.now() - 300000),
    source: 'Дизель',
  },
  {
    id: '3',
    level: 'warning',
    title: 'Низкое давление в тормозном цилиндре 3',
    message: 'Обнаружена утечка в тормозной системе.',
    timestamp: new Date(Date.now() - 600000),
    source: 'Тормоза',
  },
  {
    id: '4',
    level: 'info',
    title: 'Плановое обслуживание',
    message: 'Через 200 км требуется замена фильтра.',
    timestamp: new Date(Date.now() - 1200000),
    source: 'Система',
  },
];

function calculateHealthFactors(data: Partial<TelemetryData>): HealthFactor[] {
  const factors: HealthFactor[] = [];

  const oilPressureHealth = Math.min(100, Math.max(0, ((data.oilPressure || 3.8) - 3.0) / 1.5 * 100));
  factors.push({
    name: 'Давление масла',
    value: data.oilPressure || 3.8,
    weight: 0.15,
    status: oilPressureHealth >= 70 ? 'good' : oilPressureHealth >= 50 ? 'warning' : 'critical',
    contribution: oilPressureHealth * 0.15,
  });

  const tempHealth = Math.min(100, Math.max(0, 100 - ((data.temperature || 92) - 85) * 5));
  factors.push({
    name: 'Температура двигателя',
    value: data.temperature || 92,
    weight: 0.10,
    status: tempHealth >= 70 ? 'good' : tempHealth >= 50 ? 'warning' : 'critical',
    contribution: tempHealth * 0.10,
  });

  const fuelHealth = data.fuelLevel || 85;
  factors.push({
    name: 'Уровень топлива',
    value: data.fuelLevel || 85,
    weight: 0.15,
    status: fuelHealth >= 50 ? 'good' : fuelHealth >= 20 ? 'warning' : 'critical',
    contribution: Math.min(100, fuelHealth) * 0.15,
  });

  const brakeHealth = Math.min(100, ((data.brakePressureMain || 4.8) / 5.0) * 100);
  factors.push({
    name: 'Давление тормозов',
    value: data.brakePressureMain || 4.8,
    weight: 0.25,
    status: brakeHealth >= 80 ? 'good' : brakeHealth >= 60 ? 'warning' : 'critical',
    contribution: brakeHealth * 0.25,
  });

  const electricHealth = Math.min(100, ((data.voltage || 3200) / 3300) * 100);
  factors.push({
    name: 'Напряжение',
    value: data.voltage || 3200,
    weight: 0.20,
    status: electricHealth >= 90 ? 'good' : electricHealth >= 80 ? 'warning' : 'critical',
    contribution: electricHealth * 0.20,
  });

  const speedHealth = Math.min(100, (data.speed || 80) / 90 * 100);
  factors.push({
    name: 'Режим движения',
    value: data.speed || 80,
    weight: 0.05,
    status: 'good',
    contribution: speedHealth * 0.05,
  });

  return factors;
}

export function generateMockData(): TelemetryData {
  const stationPair = stations[Math.floor(Math.random() * stations.length)];

  const baseData = {
    speed: 70 + Math.random() * 20,
    temperature: 90 + Math.random() * 10,
    oilPressure: 3.5 + Math.random() * 0.8,
    rpm: 1800 + Math.random() * 200,
    fuelLevel: 80 + Math.random() * 15,
    brakePressureMain: 4.5 + Math.random() * 0.5,
    voltage: 3100 + Math.random() * 200,
  };

  const healthFactors = calculateHealthFactors(baseData);
  const totalHealth = healthFactors.reduce((sum, f) => sum + f.contribution, 0);
  const healthCategory: TelemetryData['healthCategory'] =
    totalHealth >= 85 ? 'Норма' : totalHealth >= 60 ? 'Внимание' : 'Критично';

  return {
    health: totalHealth,
    healthFactors: healthFactors.sort((a, b) => b.contribution - a.contribution),
    healthCategory,
    speed: baseData.speed,
    reserveLevel: 80 + Math.random() * 15,
    consumptionRate: 400 + Math.random() * 50,
    estimatedRange: 1200 + Math.random() * 200,

    temperature: baseData.temperature,
    waterTemperature: 85 + Math.random() * 10,
    oilTemperature: 95 + Math.random() * 12,
    oilPressure: baseData.oilPressure,
    rpm: baseData.rpm,
    turbineSpeed: 12000 + Math.random() * 3000,
    turbinePressure: 1.8 + Math.random() * 0.4,

    fuelLevel: baseData.fuelLevel,
    fuelConsumption: 400 + Math.random() * 50,
    waterLevel: 90 + Math.random() * 8,

    brakePressureMain: baseData.brakePressureMain,
    brakePressureCylinder1: 4.2 + Math.random() * 0.6,
    brakePressureCylinder2: 4.3 + Math.random() * 0.5,
    brakePressureCylinder3: 4.1 + Math.random() * 0.5,
    brakePressureCylinder4: 4.4 + Math.random() * 0.4,
    brakePressureFeed: 5.2 + Math.random() * 0.3,

    current: 800 + Math.random() * 200,
    voltage: baseData.voltage,
    generatorOutput: 2800 + Math.random() * 400,
    generatorVoltage: 3150 + Math.random() * 150,
    batteryVoltage: 110 + Math.random() * 15,

    efficiencyMode: 'ДИНАМИЧЕСКАЯ ТЯГА АКТИВНА',
    status: healthCategory === 'Норма' ? 'active' : healthCategory === 'Внимание' ? 'warning' : 'critical',
    alerts: allAlerts.slice(0, healthCategory === 'Критично' ? 3 : healthCategory === 'Внимание' ? 2 : 1),
    diagnostics: [
      { id: '1', message: diagnosticMessages[0].message, timestamp: '14:22:18', source: diagnosticMessages[0].source },
      { id: '2', message: diagnosticMessages[1].message, timestamp: '14:20:52', source: diagnosticMessages[1].source },
      { id: '3', message: diagnosticMessages[2].message, timestamp: '14:18:42', source: diagnosticMessages[2].source },
    ],
    route: {
      currentStation: stationPair[0],
      nextStation: stationPair[1],
      progress: 35 + Math.random() * 30,
      distance: 42,
      eta: '15:44 (UTC+6)',
      gradient: -1.2,
    },
    recommendations,
  };
}

export function updateTelemetryData(prev: TelemetryData): TelemetryData {
  const updated = {
    ...prev,
    speed: Math.max(60, Math.min(95, prev.speed + (Math.random() - 0.5) * 5)),
    reserveLevel: Math.max(70, Math.min(95, prev.reserveLevel - Math.random() * 0.5)),
    consumptionRate: Math.max(380, Math.min(450, prev.consumptionRate + (Math.random() - 0.5) * 10)),
    temperature: Math.max(88, Math.min(102, prev.temperature + (Math.random() - 0.5) * 2)),
    waterTemperature: Math.max(83, Math.min(98, prev.waterTemperature + (Math.random() - 0.5) * 1.5)),
    oilTemperature: Math.max(92, Math.min(110, prev.oilTemperature + (Math.random() - 0.5) * 2)),
    oilPressure: Math.max(3.2, Math.min(4.5, prev.oilPressure + (Math.random() - 0.5) * 0.3)),
    rpm: Math.max(1700, Math.min(2100, prev.rpm + (Math.random() - 0.5) * 50)),
    turbineSpeed: Math.max(11000, Math.min(15000, prev.turbineSpeed + (Math.random() - 0.5) * 300)),
    turbinePressure: Math.max(1.6, Math.min(2.3, prev.turbinePressure + (Math.random() - 0.5) * 0.1)),
    fuelLevel: Math.max(75, Math.min(95, prev.fuelLevel - Math.random() * 0.3)),
    fuelConsumption: Math.max(380, Math.min(450, prev.fuelConsumption + (Math.random() - 0.5) * 10)),
    waterLevel: Math.max(88, Math.min(98, prev.waterLevel + (Math.random() - 0.5) * 0.5)),
    brakePressureMain: Math.max(4.3, Math.min(5.0, prev.brakePressureMain + (Math.random() - 0.5) * 0.1)),
    brakePressureCylinder1: Math.max(4.0, Math.min(4.8, prev.brakePressureCylinder1 + (Math.random() - 0.5) * 0.1)),
    brakePressureCylinder2: Math.max(4.1, Math.min(4.8, prev.brakePressureCylinder2 + (Math.random() - 0.5) * 0.1)),
    brakePressureCylinder3: Math.max(3.9, Math.min(4.7, prev.brakePressureCylinder3 + (Math.random() - 0.5) * 0.1)),
    brakePressureCylinder4: Math.max(4.2, Math.min(4.8, prev.brakePressureCylinder4 + (Math.random() - 0.5) * 0.1)),
    brakePressureFeed: Math.max(5.0, Math.min(5.5, prev.brakePressureFeed + (Math.random() - 0.5) * 0.08)),
    current: Math.max(750, Math.min(1050, prev.current + (Math.random() - 0.5) * 50)),
    voltage: Math.max(3000, Math.min(3300, prev.voltage + (Math.random() - 0.5) * 40)),
    generatorOutput: Math.max(2600, Math.min(3200, prev.generatorOutput + (Math.random() - 0.5) * 80)),
    generatorVoltage: Math.max(3050, Math.min(3300, prev.generatorVoltage + (Math.random() - 0.5) * 35)),
    batteryVoltage: Math.max(105, Math.min(125, prev.batteryVoltage + (Math.random() - 0.5) * 3)),
    route: {
      ...prev.route,
      progress: Math.min(100, prev.route.progress + 0.5),
    },
  };

  const healthFactors = calculateHealthFactors(updated);
  const totalHealth = healthFactors.reduce((sum, f) => sum + f.contribution, 0);
  const healthCategory: TelemetryData['healthCategory'] =
    totalHealth >= 85 ? 'Норма' : totalHealth >= 60 ? 'Внимание' : 'Критично';

  return {
    ...updated,
    health: totalHealth,
    healthFactors: healthFactors.sort((a, b) => b.contribution - a.contribution),
    healthCategory,
  };
}

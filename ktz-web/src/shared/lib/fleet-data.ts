export interface DriverInfo {
  firstName: string;
  lastName: string;
  age: number;
  photoUrl: string;
}

export interface MapTrain {
  locomotiveNumber: string;
  locomotiveName: string;
  type: 'TE33A' | 'KZ8A';
  latitude: number;
  longitude: number;
  speed: number;
  health: number;
  healthCategory: 'Норма' | 'Внимание' | 'Критично';
  routeFrom: string;
  routeTo: string;
  driver: DriverInfo;
  route?: import('./api-client').ApiRoute;
}

export const LOCO_ROUTES: Record<string, {
  from: string;
  to: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
}> = {
  'TE33A-001': { from: 'Астана',        to: 'Кокшетау',     startLat: 51.18, startLon: 71.45, endLat: 53.28, endLon: 69.40 },
  'KZ8A-007':  { from: 'Алматы',        to: 'Шымкент',      startLat: 43.25, startLon: 76.93, endLat: 42.30, endLon: 69.60 },
  'TE33A-002': { from: 'Астана',        to: 'Петропавловск', startLat: 51.18, startLon: 71.45, endLat: 54.87, endLon: 69.16 },
  'TE33A-003': { from: 'Актобе',        to: 'Қостанай',     startLat: 50.28, startLon: 57.21, endLat: 53.21, endLon: 63.62 },
  'KZ8A-008':  { from: 'Алматы',        to: 'Тараз',        startLat: 43.25, startLon: 76.93, endLat: 42.90, endLon: 71.37 },
  'KZ8A-009':  { from: 'Семей',         to: 'Павлодар',     startLat: 50.41, startLon: 80.26, endLat: 52.30, endLon: 76.95 },
  'TE33A-004': { from: 'Қарағанды',    to: 'Жезқазған',    startLat: 49.80, startLon: 73.10, endLat: 47.79, endLon: 67.71 },
  'KZ8A-010':  { from: 'Атырау',        to: 'Ақтау',        startLat: 47.11, startLon: 51.92, endLat: 43.65, endLon: 51.17 },
};

export const LOCO_DRIVERS: Record<string, DriverInfo> = {
  'TE33A-001': { firstName: 'Нұрлан',   lastName: 'Бекжанов',  age: 34, photoUrl: 'https://i.pravatar.cc/150?img=11' },
  'KZ8A-007':  { firstName: 'Серік',    lastName: 'Алиев',     age: 29, photoUrl: 'https://i.pravatar.cc/150?img=12' },
  'TE33A-002': { firstName: 'Дамир',    lastName: 'Сейткали',  age: 41, photoUrl: 'https://i.pravatar.cc/150?img=15' },
  'TE33A-003': { firstName: 'Бауыржан', lastName: 'Ержанов',   age: 37, photoUrl: 'https://i.pravatar.cc/150?img=17' },
  'KZ8A-008':  { firstName: 'Асқар',   lastName: 'Нұрмағамбетов', age: 45, photoUrl: 'https://i.pravatar.cc/150?img=20' },
  'KZ8A-009':  { firstName: 'Руслан',   lastName: 'Қасымов',   age: 32, photoUrl: 'https://i.pravatar.cc/150?img=22' },
  'TE33A-004': { firstName: 'Ерлан',    lastName: 'Тәжібаев',  age: 38, photoUrl: 'https://i.pravatar.cc/150?img=25' },
  'KZ8A-010':  { firstName: 'Марат',    lastName: 'Сейдахмет', age: 50, photoUrl: 'https://i.pravatar.cc/150?img=27' },
};

export const KNOWN_LOCOS = ['TE33A-001', 'KZ8A-007'];

export const STATIC_TRAINS: MapTrain[] = [
  { locomotiveNumber: 'TE33A-002', locomotiveName: 'Астана-Петропавловск', type: 'TE33A', latitude: 52.60, longitude: 70.40, speed: 87, health: 91, healthCategory: 'Норма',    routeFrom: 'Астана', routeTo: 'Петропавловск', driver: LOCO_DRIVERS['TE33A-002'] },
  { locomotiveNumber: 'TE33A-003', locomotiveName: 'Актобе-Қостанай',      type: 'TE33A', latitude: 51.50, longitude: 60.80, speed: 72, health: 68, healthCategory: 'Внимание', routeFrom: 'Актобе', routeTo: 'Қостанай',      driver: LOCO_DRIVERS['TE33A-003'] },
  { locomotiveNumber: 'KZ8A-008',  locomotiveName: 'Алматы-Тараз',         type: 'KZ8A',  latitude: 43.10, longitude: 74.20, speed: 110, health: 96, healthCategory: 'Норма',   routeFrom: 'Алматы', routeTo: 'Тараз',         driver: LOCO_DRIVERS['KZ8A-008']  },
  { locomotiveNumber: 'KZ8A-009',  locomotiveName: 'Семей-Павлодар',        type: 'KZ8A',  latitude: 51.30, longitude: 78.50, speed: 95, health: 55, healthCategory: 'Критично', routeFrom: 'Семей',  routeTo: 'Павлодар',      driver: LOCO_DRIVERS['KZ8A-009']  },
  { locomotiveNumber: 'TE33A-004', locomotiveName: 'Қарағанды-Жезқазған',  type: 'TE33A', latitude: 48.70, longitude: 70.80, speed: 65, health: 82, healthCategory: 'Норма',    routeFrom: 'Қарағанды', routeTo: 'Жезқазған', driver: LOCO_DRIVERS['TE33A-004'] },
  { locomotiveNumber: 'KZ8A-010',  locomotiveName: 'Атырау-Ақтау',          type: 'KZ8A',  latitude: 45.30, longitude: 51.50, speed: 103, health: 78, healthCategory: 'Норма',   routeFrom: 'Атырау', routeTo: 'Ақтау',         driver: LOCO_DRIVERS['KZ8A-010']  },
];

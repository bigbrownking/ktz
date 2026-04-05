'use client';

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapTrain, defaultFuelLevelForLoco } from '@/shared/lib/fleet-data';
import { routesApi, ApiRoute } from '@/shared/lib/api-client';
import { connectWs } from '@/shared/lib/ws-client';
import { BackendMapPoint, BackendHealth } from '@/shared/lib/backend-types';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';
import { mergeMapTrainWithTelemetry } from '@/shared/lib/live-train-merge';

function mergeHealthPayload(
  health: BackendHealth | undefined,
  prev: MapTrain | undefined,
): Pick<MapTrain, 'healthFactors' | 'healthRecommendations'> {
  if (!health) {
    return {
      healthFactors: prev?.healthFactors,
      healthRecommendations: prev?.healthRecommendations,
    };
  }
  const factors =
    health.allFactors?.length ? health.allFactors : (health.topFactors ?? []);
  return {
    healthFactors: factors,
    healthRecommendations: health.recommendations ?? [],
  };
}

/** Данные залогиненного машиниста для своего локомотива (когда API маршрута не заполнил ФИО) */
export interface SessionDriverInfo {
  locomotiveNumber: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  age: number;
}

interface Props {
  focusLoco?: string | null;
  myLocoNumber?: string | null;
  /** Профиль текущего пользователя — подставляется на поезде с тем же номером локомотива */
  sessionDriver?: SessionDriverInfo | null;
  onTrainsChange?: (trains: MapTrain[]) => void;
  onFocusLocoChange?: (loco: string | null) => void;
}

function healthColor(cat: MapTrain['healthCategory']): string {
  if (cat === 'Норма') return '#10b981';
  if (cat === 'Внимание') return '#f59e0b';
  return '#ef4444';
}

const FUEL_TANK_LITERS_MAX = 5000;

function fuelBarColor(pct: number): string {
  if (pct < 20) return '#ef4444';
  if (pct < 40) return '#f59e0b';
  return '#22c55e';
}

function fuelPercentForTooltip(train: MapTrain): number | null {
  if (train.type === 'KZ8A') return null;
  const f = train.fuelLevel;
  if (f > 100) return Math.min(100, (f / FUEL_TANK_LITERS_MAX) * 100);
  return Math.min(100, Math.max(0, f));
}

function locoType(num: string): 'TE33A' | 'KZ8A' {
  return num.startsWith('KZ') ? 'KZ8A' : 'TE33A';
}

function driverNameLine(d: MapTrain['driver']): string | null {
  const fn = (d.firstName ?? '').trim();
  const ln = (d.lastName ?? '').trim();
  if (!fn || fn === '—') return null;
  const full = `${fn} ${ln}`.trim();
  return full.length > 0 ? full : null;
}

function hasDriverPhotoUrl(url: string | undefined): boolean {
  const u = (url ?? '').trim();
  return u.length > 0 && u !== '/drivers/placeholder.jpg';
}

function locoBadgeLetters(loco: string): string {
  const alnum = loco.replace(/[^a-zA-Z0-9]/g, '');
  if (alnum.length >= 2) return alnum.slice(-2).toUpperCase();
  return loco.slice(0, 2).toUpperCase() || '?';
}

function mergeDriverFromSession(
  loco: string,
  driver: MapTrain['driver'],
  session: SessionDriverInfo | null | undefined,
): MapTrain['driver'] {
  if (!session || session.locomotiveNumber !== loco) return driver;
  const fn = (session.firstName ?? '').trim();
  const ln = (session.lastName ?? '').trim();
  if (!fn && !ln) return driver;
  const photo = (session.photoUrl?.trim() || driver.photoUrl?.trim() || '') || '';
  return {
    firstName: fn || driver.firstName,
    lastName: ln || driver.lastName,
    age: session.age > 0 ? session.age : driver.age,
    photoUrl: photo,
  };
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

/** Точки линии маршрута по данным API (станции → равномерно вдоль прямой start–end) */
function buildRouteLatLngs(route: ApiRoute): [number, number][] {
  const sl = route.startLat;
  const slo = route.startLon;
  const el = route.endLat;
  const elo = route.endLon;
  if (sl == null || slo == null || el == null || elo == null) return [];
  const names = route.stations?.split(',').map(x => x.trim()).filter(Boolean) ?? [];
  const n = Math.max(2, names.length >= 2 ? names.length : 2);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    pts.push([sl + (el - sl) * t, slo + (elo - slo) * t]);
  }
  return pts;
}

export function FleetMap({ focusLoco, myLocoNumber, sessionDriver, onTrainsChange, onFocusLocoChange }: Props) {
  const { telemetry, locomotiveNumber: telemetryLoco } = useTelemetryContext();
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const L = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInst = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLines = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routePolylinesByLoco = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeStationGroupsByLoco = useRef<Record<string, any>>({});
  const onFocusLocoChangeRef = useRef(onFocusLocoChange);
  useEffect(() => { onFocusLocoChangeRef.current = onFocusLocoChange; }, [onFocusLocoChange]);
  const trainData = useRef<Record<string, MapTrain>>({});
  const healthData = useRef<Record<string, BackendHealth>>({});
  const apiRoutes = useRef<ApiRoute[]>([]);
  const [trains, setTrains] = useState<MapTrain[]>([]);
  const [tooltipTrain, setTooltipTrain] = useState<MapTrain | null>(null);
  const hoveredLocoRef = useRef<string | null>(null);
  const tooltipWrapRef = useRef<HTMLDivElement | null>(null);
  const hoveringPanelRef = useRef(false);
  const hideTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const focusLocoRef = useRef(focusLoco);
  useEffect(() => { focusLocoRef.current = focusLoco; }, [focusLoco]);

  const notifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Дебаунс списка поездов: всегда сбрасываем таймер и при срабатывании читаем актуальный trainData (раньше отбрасывались все вызовы, пока ждали 2с — из-за этого здоровье с /ws/health не доходило до сайдбара) */
  const notifyParent = useCallback(() => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    notifyTimer.current = setTimeout(() => {
      notifyTimer.current = null;
      const list = Object.values(trainData.current);
      setTrains(list);
      onTrainsChange?.(list);
    }, 120);
  }, [onTrainsChange]);

  const markerColors = useRef<Record<string, string>>({});
  const myLocoRef = useRef<string | null | undefined>(myLocoNumber);
  useEffect(() => { myLocoRef.current = myLocoNumber; }, [myLocoNumber]);

  const sessionDriverRef = useRef<SessionDriverInfo | null | undefined>(sessionDriver);
  useEffect(() => {
    sessionDriverRef.current = sessionDriver ?? null;
  }, [sessionDriver]);

  /** fixed + viewport: не обрезается родителем с overflow-hidden и не «уезжает» под карту Leaflet */
  const positionTooltip = useCallback((e: { originalEvent: MouseEvent }) => {
    const wrap = tooltipWrapRef.current;
    if (!wrap) return;
    const cx = e.originalEvent.clientX;
    const cy = e.originalEvent.clientY;
    wrap.style.position = 'fixed';
    wrap.style.left = `${cx + 16}px`;
    wrap.style.top = `${cy - 20}px`;
    wrap.style.transform = cx > window.innerWidth * 0.55 ? 'translateX(-110%)' : '';
    wrap.style.zIndex = '2147483000';
  }, []);

  const clearHideTooltipTimer = useCallback(() => {
    if (hideTooltipTimerRef.current) {
      clearTimeout(hideTooltipTimerRef.current);
      hideTooltipTimerRef.current = null;
    }
  }, []);

  const scheduleHideTooltip = useCallback(() => {
    clearHideTooltipTimer();
    hideTooltipTimerRef.current = setTimeout(() => {
      hideTooltipTimerRef.current = null;
      if (!hoveringPanelRef.current) {
        hoveredLocoRef.current = null;
        setTooltipTrain(null);
      }
    }, 280);
  }, [clearHideTooltipTimer]);

  const upsertMarker = useCallback((train: MapTrain) => {
    if (!L.current || !mapInst.current) return;
    const isMine = myLocoRef.current === train.locomotiveNumber;
    const color = isMine ? '#f59e0b' : healthColor(train.healthCategory);
    const existing = markers.current[train.locomotiveNumber];
    if (existing) {
      existing.setLatLng([train.latitude, train.longitude]);
      const prevColor = markerColors.current[train.locomotiveNumber];
      if (prevColor !== color) {
        existing.setIcon(buildIcon(L.current, train, color, isMine));
        markerColors.current[train.locomotiveNumber] = color;
      }
    } else {
      const marker = L.current.marker([train.latitude, train.longitude], {
        icon: buildIcon(L.current, train, color, isMine),
        zIndexOffset: isMine ? 2000 : 1000,
      });
      marker.addTo(mapInst.current);
      marker.on('mouseover', (e: { originalEvent: MouseEvent }) => {
        clearHideTooltipTimer();
        hoveredLocoRef.current = train.locomotiveNumber;
        setTooltipTrain(train);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => positionTooltip(e));
        });
      });
      marker.on('mousemove', (e: { originalEvent: MouseEvent }) => {
        if (hoveredLocoRef.current !== train.locomotiveNumber) return;
        positionTooltip(e);
      });
      marker.on('mouseout', () => {
        if (hoveredLocoRef.current === train.locomotiveNumber) {
          scheduleHideTooltip();
        }
      });
      marker.on('click', (e: { originalEvent?: MouseEvent }) => {
        e.originalEvent?.stopPropagation();
        onFocusLocoChangeRef.current?.(train.locomotiveNumber);
      });
      markers.current[train.locomotiveNumber] = marker;
      markerColors.current[train.locomotiveNumber] = color;
    }
    if (hoveredLocoRef.current === train.locomotiveNumber) {
      setTooltipTrain(train);
    }
  }, [positionTooltip, clearHideTooltipTimer, scheduleHideTooltip]);

  const applyRouteHighlight = useCallback((loc: string | null) => {
    if (!L.current) return;
    const focus = loc ?? null;
    Object.entries(routePolylinesByLoco.current).forEach(([loco, line]) => {
      const selected = focus === loco;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line as any).setStyle({
        color: selected ? '#f59e0b' : '#06b6d4',
        weight: selected ? 7 : 2,
        opacity: focus ? (selected ? 0.98 : 0.1) : 0.32,
        dashArray: selected ? undefined : '8 6',
      });
      if (selected) (line as { bringToFront?: () => void }).bringToFront?.();
    });
    Object.entries(routeStationGroupsByLoco.current).forEach(([loco, group]) => {
      const selected = focus === loco;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (group as any).eachLayer((layer: { setStyle?: (s: object) => void }) => {
        layer.setStyle?.({
          opacity: selected ? 1 : 0.2,
          fillOpacity: selected ? 0.95 : 0.1,
          color: selected ? '#f59e0b' : '#06b6d4',
          weight: selected ? 3 : 1,
          fillColor: '#0f172a',
        });
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || mapInst.current) return;
    let mounted = true;
    const animTimers: ReturnType<typeof setInterval>[] = [];

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    }

    Promise.all([import('leaflet'), routesApi.getAll().catch(() => [] as ApiRoute[])])
      .then(([leaflet, routes]) => {
        if (!mounted || !mapRef.current) return;
        L.current = leaflet;
        apiRoutes.current = routes;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const map = leaflet.map(mapRef.current, {
          center: [48.5, 68.0],
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });

        leaflet.tileLayer(TILE_URL, {
          attribution: TILE_ATTR,
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        routePolylinesByLoco.current = {};
        routeStationGroupsByLoco.current = {};

        routes.forEach(route => {
          const loco = route.locomotiveNumber;
          if (!loco || !route.startLat || !route.startLon || !route.endLat || !route.endLon) return;
          const latlngs = buildRouteLatLngs(route);
          if (latlngs.length < 2) return;

          const line = leaflet.polyline(latlngs, {
            color: '#06b6d4',
            weight: 2,
            opacity: 0.3,
            dashArray: '8 6',
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(map);
          routePolylinesByLoco.current[loco] = line;
          routeLines.current.push(line);

          const names = route.stations?.split(',').map(x => x.trim()).filter(Boolean) ?? [];
          const stationGroup = leaflet.layerGroup();
          latlngs.forEach((ll, i) => {
            const isEnd = i === 0 || i === latlngs.length - 1;
            const label = names[i] ?? (i === 0 ? route.origin : i === latlngs.length - 1 ? route.destination : `Пункт ${i + 1}`);
            const m = leaflet.circleMarker(ll, {
              radius: isEnd ? 6 : 4,
              color: '#06b6d4',
              weight: 2,
              fillColor: '#0f172a',
              fillOpacity: 0.35,
              opacity: 0.35,
            });
            m.bindTooltip(label, { permanent: false, direction: 'top', className: 'ktz-tooltip' });
            stationGroup.addLayer(m);
          });
          stationGroup.addTo(map);
          routeStationGroupsByLoco.current[loco] = stationGroup;
        });

        map.on('click', () => {
          onFocusLocoChangeRef.current?.(null);
        });

        mapInst.current = map;
        if (mounted) setMapReady(true);

        const staticTrains: MapTrain[] = routes
          .filter(r => r.locomotiveNumber && r.startLat && r.startLon)
          .map(r => {
            const midLat = ((r.startLat ?? 0) + (r.endLat ?? 0)) / 2;
            const midLon = ((r.startLon ?? 0) + (r.endLon ?? 0)) / 2;
            const loco = r.locomotiveNumber ?? '';
            return {
              locomotiveNumber: loco,
              locomotiveName: r.locomotiveName ?? '',
              type: (r.locomotiveNumber ?? '').startsWith('KZ') ? 'KZ8A' : 'TE33A',
              latitude: midLat,
              longitude: midLon,
              speed: 70 + Math.floor(Math.random() * 50),
              fuelLevel: defaultFuelLevelForLoco(loco),
              health: 75,
              healthCategory: 'Норма' as const,
              routeFrom: r.origin,
              routeTo: r.destination,
              driver: mergeDriverFromSession(loco, {
                firstName: r.driverName ?? '—',
                lastName: r.driverSurname ?? '',
                age: r.driverAge ?? 0,
                photoUrl: r.driverPhotoUrl ?? '',
              }, sessionDriverRef.current ?? undefined),
              route: r,
            };
          });

        staticTrains.forEach(t => { trainData.current[t.locomotiveNumber] = t; });
        notifyParent();
        setTimeout(() => staticTrains.forEach(t => upsertMarker(t)), 150);

        // Animate static trains along their routes (client-side simulation)
        routes.forEach(route => {
          if (!route.locomotiveNumber || !route.startLat || !route.startLon || !route.endLat || !route.endLon) return;
          const totalMs = (route.estimatedMinutes ?? 240) * 60 * 1000;
          const startMs = Date.now() - Math.random() * totalMs * 0.7;
          const timer = setInterval(() => {
            if (!mounted) return;
            const elapsed = Date.now() - startMs;
            let progress = (elapsed % totalMs) / totalMs;
            if (progress < 0) progress = 0;
            const lat = (route.startLat ?? 0) + ((route.endLat ?? 0) - (route.startLat ?? 0)) * progress;
            const lon = (route.startLon ?? 0) + ((route.endLon ?? 0) - (route.startLon ?? 0)) * progress;
            const prev = trainData.current[route.locomotiveNumber ?? ''];
            if (!prev) return;
            const animated: MapTrain = { ...prev, latitude: lat, longitude: lon };
            trainData.current[route.locomotiveNumber ?? ''] = animated;
            upsertMarker(animated);
          }, 4000);
          animTimers.push(timer);
        });
      });

    return () => {
      mounted = false;
      animTimers.forEach(t => clearInterval(t));
    };
  }, [notifyParent, upsertMarker]);

  useEffect(() => () => {
    if (hideTooltipTimerRef.current) clearTimeout(hideTooltipTimerRef.current);
  }, []);

  useEffect(() => {
    const closeMap = connectWs('/ws/map/all', (raw) => {
      const point = raw as BackendMapPoint;
      setWsConnected(true);

      const apiRoute = apiRoutes.current.find(r => r.locomotiveNumber === point.locomotiveNumber);
      const health = healthData.current[point.locomotiveNumber];
      const prev = trainData.current[point.locomotiveNumber];

      const rawFuel =
        typeof point.fuelLevel === 'number' && !Number.isNaN(point.fuelLevel)
          ? point.fuelLevel
          : undefined;
      const fuel =
        rawFuel !== undefined
          ? rawFuel
          : (prev?.fuelLevel ?? defaultFuelLevelForLoco(point.locomotiveNumber));

      const train: MapTrain = {
        locomotiveNumber: point.locomotiveNumber,
        locomotiveName: point.locomotiveName,
        type: locoType(point.locomotiveNumber),
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed,
        fuelLevel: fuel,
        health: health?.score ?? (prev?.health ?? 75),
        healthCategory: (health?.categoryLabel ?? (prev?.healthCategory ?? 'Норма')) as MapTrain['healthCategory'],
        routeFrom: apiRoute?.origin ?? prev?.routeFrom ?? '',
        routeTo: apiRoute?.destination ?? prev?.routeTo ?? '',
        driver: mergeDriverFromSession(
          point.locomotiveNumber,
          {
            firstName: apiRoute?.driverName ?? prev?.driver?.firstName ?? '—',
            lastName: apiRoute?.driverSurname ?? prev?.driver?.lastName ?? '',
            age: apiRoute?.driverAge ?? prev?.driver?.age ?? 0,
            photoUrl: apiRoute?.driverPhotoUrl ?? prev?.driver?.photoUrl ?? '',
          },
          sessionDriverRef.current ?? undefined,
        ),
        route: apiRoute ?? prev?.route,
        ...mergeHealthPayload(health, prev),
      };

      trainData.current[point.locomotiveNumber] = train;
      notifyParent();
      upsertMarker(train);
    });

    return () => {
      closeMap();
    };
  }, [notifyParent, upsertMarker]);

  /** Подписка на здоровье для каждого локомотива из маршрутов (не только TE33A-001/KZ8A-007), иначе тултип показывает заглушку 75% вместо кабины */
  useEffect(() => {
    if (!mapReady) return;
    const locos = [
      ...new Set(
        (apiRoutes.current ?? []).map(r => r.locomotiveNumber).filter((x): x is string => Boolean(x)),
      ),
    ];
    if (locos.length === 0) return;

    const closeHealthFns = locos.map(loco =>
      connectWs(`/ws/health/${loco}`, (raw) => {
        const health = raw as BackendHealth;
        healthData.current[loco] = health;

        const prev = trainData.current[loco];
        if (prev) {
          const updated: MapTrain = {
            ...prev,
            health: health.score,
            healthCategory: health.categoryLabel as MapTrain['healthCategory'],
            ...mergeHealthPayload(health, prev),
          };
          trainData.current[loco] = updated;
          notifyParent();
          upsertMarker(updated);
        }
      }),
    );

    return () => {
      closeHealthFns.forEach(fn => fn());
    };
  }, [mapReady, notifyParent, upsertMarker]);

  useEffect(() => {
    if (!mapReady) return;
    applyRouteHighlight(focusLoco ?? null);
  }, [focusLoco, mapReady, applyRouteHighlight]);

  useEffect(() => {
    if (!mapReady || !sessionDriver) return;
    const loco = sessionDriver.locomotiveNumber;
    const t = trainData.current[loco];
    if (!t) return;
    const merged = mergeDriverFromSession(loco, t.driver, sessionDriver);
    trainData.current[loco] = { ...t, driver: merged };
    notifyParent();
    upsertMarker(trainData.current[loco]);
  }, [mapReady, sessionDriver, notifyParent, upsertMarker]);

  /** Подтянуть тултип к актуальному trainData после обновления списка */
  useEffect(() => {
    const loco = hoveredLocoRef.current;
    if (!loco) return;
    const t = trainData.current[loco];
    if (t) setTooltipTrain(t);
  }, [trains]);

  /** Для «своего» локомотива — те же цифры, что в кабине (TelemetryContext), пока карта не обогнала WS */
  const tooltipDisplayTrain = useMemo(() => {
    if (!tooltipTrain) return null;
    return mergeMapTrainWithTelemetry(tooltipTrain, telemetryLoco, telemetry);
  }, [tooltipTrain, telemetryLoco, telemetry]);

  return (
    <div className="relative w-full" style={{ height: '640px' }}>
      <style>{`
        .leaflet-container { background: #e8e0d8; font-family: system-ui, sans-serif; }
        .leaflet-control-zoom a {
          background: #1e293b !important; color: #94a3b8 !important;
          border-color: #334155 !important; font-weight: bold;
        }
        .leaflet-control-zoom a:hover { background: #334155 !important; color: #e2e8f0 !important; }
        .leaflet-control-attribution {
          background: rgba(15,22,41,0.85) !important;
          color: #64748b !important; font-size: 9px; backdrop-filter: blur(4px);
        }
        .leaflet-control-attribution a { color: #94a3b8 !important; }
        .ktz-tooltip { background: #181818; color: #06b6d4; border: 1px solid #333; border-radius: 6px; font-size: 11px; font-weight: 600; padding: 2px 8px; }
        .ktz-tooltip::before { display: none; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      <div className="absolute top-3 left-3 z-[500] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
        style={{ background: 'rgba(15,22,41,0.85)', border: '1px solid rgba(30,42,69,0.8)' }}>
        <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
          {wsConnected ? 'Онлайн' : 'Ожидание...'}
        </span>
        <span className="text-slate-500 ml-1">{trains.length} лок.</span>
      </div>

      {tooltipDisplayTrain &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipWrapRef}
            className="will-change-transform pointer-events-auto"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              zIndex: 2147483000,
              backgroundColor: '#111111',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.92)',
            }}
            onMouseEnter={() => {
              clearHideTooltipTimer();
              hoveringPanelRef.current = true;
            }}
            onMouseLeave={() => {
              hoveringPanelRef.current = false;
              hoveredLocoRef.current = null;
              setTooltipTrain(null);
            }}
          >
            <MemoTrainTooltip train={tooltipDisplayTrain} />
          </div>,
          document.body,
        )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildIcon(L: any, train: MapTrain, color: string, isMine = false) {
  const size = isMine ? 52 : 44;
  const half = size / 2;
  const iconSvg = isMine
    ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="${color}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
    : `<svg viewBox="0 0 24 24" width="20" height="20" fill="${color}"><path d="M4 11v8h16v-8H4zm0-2h16V4H4v5zm-2 0V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5H0v-2h2z"/></svg>`;
  const myBadge = isMine
    ? `<div style="position:absolute;bottom:-28px;left:50%;transform:translateX(-50%);background:${color};border-radius:4px;padding:1px 5px;font-size:8px;color:#000;white-space:nowrap;font-weight:800">МОЙ ПОЕЗД</div>`
    : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px">
      <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:${isMine ? 0.6 : 0.35};animation:ktz-pulse ${isMine ? 1.5 : 2}s infinite"></div>
      <div style="position:absolute;inset:0;background:${color}${isMine ? '33' : '1a'};border:${isMine ? '3px' : '2.5px'} solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 ${isMine ? 20 : 12}px ${color}${isMine ? '88' : '66'};cursor:pointer">${iconSvg}</div>
      <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#0f1629cc;border:1px solid ${color};border-radius:5px;padding:1px 6px;font-size:9px;color:${color};white-space:nowrap;font-weight:700;backdrop-filter:blur(4px)">${train.locomotiveNumber}</div>
      <div style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);background:#0f1629cc;border:1px solid #334155;border-radius:5px;padding:1px 5px;font-size:9px;color:#94a3b8;white-space:nowrap">${Math.round(train.speed)} км/ч</div>
      ${myBadge}
    </div><style>@keyframes ktz-pulse{0%,100%{transform:scale(1);opacity:${isMine ? 0.6 : 0.35}}50%{transform:scale(1.3);opacity:0.1}}</style>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
  });
}

const MemoTrainTooltip = memo(function TrainTooltip({ train }: { train: MapTrain }) {
  const color = healthColor(train.healthCategory);
  const healthPct = Math.min(100, Math.max(0, train.health));
  const fuelPct = fuelPercentForTooltip(train);

  const driverLine = driverNameLine(train.driver);
  const showPhoto = hasDriverPhotoUrl(train.driver.photoUrl);

  return (
    <div
      className="w-80 overflow-hidden rounded-2xl border border-[#333]"
      style={{ backgroundColor: '#111111', isolation: 'isolate' }}
    >
      <div className="flex items-center gap-3 border-b border-[#2a2a2a] bg-[#1a1a1a] px-4 py-4">
        <div className="relative flex-shrink-0">
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={train.driver.photoUrl}
              alt=""
              className="w-14 h-14 rounded-full object-cover border-2 bg-[#2a2a2a]"
              style={{ borderColor: color }}
              decoding="async"
              draggable={false}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xs font-bold text-slate-200 bg-[#2a2a2a]"
              style={{ borderColor: color }}
            >
              {driverLine
                ? driverLine
                    .split(/\s+/)
                    .map(s => s[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : locoBadgeLetters(train.locomotiveNumber)}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#1a1a1a]" style={{ background: color }} />
        </div>
        <div className="flex-1 min-w-0">
          {driverLine ? (
            <>
              <div className="font-bold text-white text-sm truncate">{driverLine}</div>
              <div className="text-slate-400 text-xs">
                Машинист{train.driver.age > 0 ? ` · ${train.driver.age} лет` : ''}
              </div>
            </>
          ) : (
            <>
              <div className="font-bold text-slate-400 text-sm">Машинист не назначен</div>
              <div className="text-slate-500 text-xs">Нет данных о назначении в системе</div>
            </>
          )}
          <div className="text-cyan-400 text-xs font-mono mt-0.5">{train.locomotiveNumber} · {train.type}</div>
        </div>
      </div>

      <div className="space-y-3 bg-[#111111] px-4 py-3" style={{ backgroundColor: '#111111' }}>
        <div className="rounded-xl bg-[#1a1a1a] p-3" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Здоровье</span>
            <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color }}>
              {Math.round(healthPct)}% — {train.healthCategory}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#0a0a0a]">
            <div className="h-full rounded-full" style={{ width: `${healthPct}%`, background: color }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#1a1a1a] p-2.5" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="mb-0.5 text-[10px] uppercase tracking-wider text-slate-400">Скорость</div>
            <div className="text-sm font-bold text-white" style={{ color }}>{Math.round(train.speed)} км/ч</div>
          </div>
          <div className="rounded-xl bg-[#1a1a1a] p-2.5" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="mb-0.5 text-[10px] uppercase tracking-wider text-slate-400">
              {train.type === 'KZ8A' ? 'Энергия' : 'Топливо'}
            </div>
            {fuelPct == null ? (
              <div className="text-sm font-bold text-slate-300">Электротяга</div>
            ) : (
              <>
                <div className="text-sm font-bold text-white" style={{ color: fuelBarColor(fuelPct) }}>
                  {Math.round(fuelPct)}%
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#0a0a0a]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${fuelPct}%`, background: fuelBarColor(fuelPct) }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});


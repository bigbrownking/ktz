'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapTrain, KNOWN_LOCOS } from '@/shared/lib/fleet-data';
import { routesApi, ApiRoute } from '@/shared/lib/api-client';
import { connectWs } from '@/shared/lib/ws-client';
import { BackendMapPoint, BackendHealth } from '@/shared/lib/backend-types';

interface Props {
  focusLoco?: string | null;
  myLocoNumber?: string | null;
  onTrainsChange?: (trains: MapTrain[]) => void;
}

function healthColor(cat: MapTrain['healthCategory']): string {
  if (cat === 'Норма') return '#10b981';
  if (cat === 'Внимание') return '#f59e0b';
  return '#ef4444';
}

function locoType(num: string): 'TE33A' | 'KZ8A' {
  return num.startsWith('KZ') ? 'KZ8A' : 'TE33A';
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

interface TooltipState { train: MapTrain; x: number; y: number }

export function FleetMap({ focusLoco, myLocoNumber, onTrainsChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const L = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInst = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLines = useRef<any[]>([]);
  const trainData = useRef<Record<string, MapTrain>>({});
  const healthData = useRef<Record<string, BackendHealth>>({});
  const apiRoutes = useRef<ApiRoute[]>([]);
  const [trains, setTrains] = useState<MapTrain[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const notifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyParent = useCallback((updated: Record<string, MapTrain>) => {
    if (notifyTimer.current) return;
    notifyTimer.current = setTimeout(() => {
      notifyTimer.current = null;
      const list = Object.values(updated);
      setTrains(list);
      onTrainsChange?.(list);
    }, 2000);
  }, [onTrainsChange]);

  const markerColors = useRef<Record<string, string>>({});
  const myLocoRef = useRef<string | null | undefined>(myLocoNumber);
  useEffect(() => { myLocoRef.current = myLocoNumber; }, [myLocoNumber]);

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
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({ train, x: e.originalEvent.clientX - rect.left, y: e.originalEvent.clientY - rect.top });
      });
      marker.on('mousemove', (e: { originalEvent: MouseEvent }) => {
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip(prev => prev ? { ...prev, x: e.originalEvent.clientX - rect.left, y: e.originalEvent.clientY - rect.top } : null);
      });
      marker.on('mouseout', () => setTooltip(null));
      markers.current[train.locomotiveNumber] = marker;
      markerColors.current[train.locomotiveNumber] = color;
    }
    setTooltip(prev => prev?.train.locomotiveNumber === train.locomotiveNumber ? { ...prev, train } : prev);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || mapInst.current) return;
    let mounted = true;

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

        routes.forEach(route => {
          if (!route.startLat || !route.startLon || !route.endLat || !route.endLon) return;
          const line = leaflet.polyline(
            [[route.startLat, route.startLon], [route.endLat, route.endLon]],
            { color: '#06b6d4', weight: 3, opacity: 0.5, dashArray: '8 6' },
          ).addTo(map);
          routeLines.current.push(line);

          leaflet.circleMarker([route.startLat, route.startLon], { radius: 6, color: '#06b6d4', fillColor: '#0a0e1a', fillOpacity: 1, weight: 2 })
            .bindTooltip(route.origin, { permanent: false, direction: 'top', className: 'ktz-tooltip' })
            .addTo(map);
          leaflet.circleMarker([route.endLat, route.endLon], { radius: 6, color: '#06b6d4', fillColor: '#0a0e1a', fillOpacity: 1, weight: 2 })
            .bindTooltip(route.destination, { permanent: false, direction: 'top', className: 'ktz-tooltip' })
            .addTo(map);
        });

        mapInst.current = map;

        const staticTrains: MapTrain[] = routes
          .filter(r => r.locomotiveNumber && r.startLat && r.startLon)
          .map(r => {
            const midLat = ((r.startLat ?? 0) + (r.endLat ?? 0)) / 2;
            const midLon = ((r.startLon ?? 0) + (r.endLon ?? 0)) / 2;
            return {
              locomotiveNumber: r.locomotiveNumber ?? '',
              locomotiveName: r.locomotiveName ?? '',
              type: (r.locomotiveNumber ?? '').startsWith('KZ') ? 'KZ8A' : 'TE33A',
              latitude: midLat,
              longitude: midLon,
              speed: 70 + Math.floor(Math.random() * 50),
              health: 75,
              healthCategory: 'Норма' as const,
              routeFrom: r.origin,
              routeTo: r.destination,
              driver: {
                firstName: r.driverName ?? '—',
                lastName: r.driverSurname ?? '',
                age: r.driverAge ?? 0,
                photoUrl: r.driverPhotoUrl ?? '',
              },
              route: r,
            };
          });

        staticTrains.forEach(t => { trainData.current[t.locomotiveNumber] = t; });
        notifyParent({ ...trainData.current });
        setTimeout(() => staticTrains.forEach(t => upsertMarker(t)), 150);

        // Animate static trains along their routes (client-side simulation)
        const animTimers: ReturnType<typeof setInterval>[] = [];
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

        return () => { mounted = false; animTimers.forEach(t => clearInterval(t)); };
      });

    return () => { mounted = false; };
  }, [notifyParent, upsertMarker]);

  useEffect(() => {
    const closeMap = connectWs('/ws/map/all', (raw) => {
      const point = raw as BackendMapPoint;
      setWsConnected(true);

      const apiRoute = apiRoutes.current.find(r => r.locomotiveNumber === point.locomotiveNumber);
      const health = healthData.current[point.locomotiveNumber];
      const prev = trainData.current[point.locomotiveNumber];

      const train: MapTrain = {
        locomotiveNumber: point.locomotiveNumber,
        locomotiveName: point.locomotiveName,
        type: locoType(point.locomotiveNumber),
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed,
        health: health?.score ?? (prev?.health ?? 75),
        healthCategory: (health?.categoryLabel ?? (prev?.healthCategory ?? 'Норма')) as MapTrain['healthCategory'],
        routeFrom: apiRoute?.origin ?? prev?.routeFrom ?? '',
        routeTo: apiRoute?.destination ?? prev?.routeTo ?? '',
        driver: {
          firstName: apiRoute?.driverName ?? prev?.driver?.firstName ?? '—',
          lastName: apiRoute?.driverSurname ?? prev?.driver?.lastName ?? '',
          age: apiRoute?.driverAge ?? prev?.driver?.age ?? 0,
          photoUrl: apiRoute?.driverPhotoUrl ?? prev?.driver?.photoUrl ?? '',
        },
        route: apiRoute ?? prev?.route,
      };

      trainData.current[point.locomotiveNumber] = train;
      notifyParent({ ...trainData.current });
      upsertMarker(train);
    });

    const closeHealthFns = KNOWN_LOCOS.map(loco =>
      connectWs(`/ws/health/${loco}`, (raw) => {
        const health = raw as BackendHealth;
        healthData.current[loco] = health;

        const prev = trainData.current[loco];
        if (prev) {
          const updated: MapTrain = {
            ...prev,
            health: health.score,
            healthCategory: health.categoryLabel as MapTrain['healthCategory'],
          };
          trainData.current[loco] = updated;
          notifyParent({ ...trainData.current });
          upsertMarker(updated);
        }
      }),
    );

    return () => {
      closeMap();
      closeHealthFns.forEach(fn => fn());
    };
  }, [notifyParent, upsertMarker]);

  useEffect(() => {
    if (!focusLoco || !mapInst.current) return;
    const train = trainData.current[focusLoco];
    if (train) {
      mapInst.current.flyTo([train.latitude, train.longitude], 9, { duration: 1.2 });
    }
  }, [focusLoco]);

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

      {tooltip && (
        <div
          className="absolute z-[600] pointer-events-none"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 20,
            transform: tooltip.x > 500 ? 'translateX(-110%)' : undefined,
          }}
        >
          <TrainTooltip train={tooltip.train} />
        </div>
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

function TrainTooltip({ train }: { train: MapTrain }) {
  const color = healthColor(train.healthCategory);
  const r = train.route;
  const stations = r?.stations ? r.stations.split(',').map(s => s.trim()) : null;
  const etaMin = r?.estimatedMinutes ?? null;
  const etaStr = etaMin ? `${Math.floor(etaMin / 60)}ч ${etaMin % 60}м` : null;

  return (
    <div className="bg-[#0a0e1a]/97 border border-[#1e2a45] rounded-2xl shadow-2xl w-80 backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800/60">
        <div className="relative flex-shrink-0">
          <img
            src={train.driver.photoUrl || `https://i.pravatar.cc/150?u=${train.locomotiveNumber}`}
            alt={train.driver.firstName}
            className="w-14 h-14 rounded-full object-cover border-2"
            style={{ borderColor: color }}
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0a0e1a]" style={{ background: color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate">
            {train.driver.firstName} {train.driver.lastName}
          </div>
          <div className="text-slate-400 text-xs">Машинист{train.driver.age > 0 ? ` · ${train.driver.age} лет` : ''}</div>
          <div className="text-cyan-400 text-xs font-mono mt-0.5">{train.locomotiveNumber} · {train.type}</div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Здоровье</span>
            <span className="font-bold text-xs" style={{ color }}>{Math.round(train.health)}% — {train.healthCategory}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${train.health}%`, background: color }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/60 rounded-xl p-2.5">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Скорость</div>
            <div className="font-bold text-white text-sm" style={{ color }}>{Math.round(train.speed)} км/ч</div>
          </div>
          {etaStr && (
            <div className="bg-slate-900/60 rounded-xl p-2.5">
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Время в пути</div>
              <div className="font-bold text-white text-sm">{etaStr}</div>
            </div>
          )}
          {r?.distanceKm && (
            <div className="bg-slate-900/60 rounded-xl p-2.5">
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Расстояние</div>
              <div className="font-bold text-white text-sm">{r.distanceKm} км</div>
            </div>
          )}
        </div>

        {stations && stations.length > 0 && (
          <div>
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Маршрут</div>
            <div className="flex items-start gap-1.5">
              <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                {stations.map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full border ${i === 0 || i === stations.length - 1 ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500 bg-slate-800'}`} />
                    {i < stations.length - 1 && <div className="w-px h-3 bg-slate-700" />}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                {stations.map((st, i) => (
                  <div key={i} className={`text-xs leading-none ${i === 0 || i === stations.length - 1 ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}>
                    {st}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


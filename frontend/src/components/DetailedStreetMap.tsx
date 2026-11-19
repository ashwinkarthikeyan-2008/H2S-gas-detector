import React, { useEffect, useRef } from 'react';
import type { ZoneCoordinate } from './ZoneGeographicMap';

type GlobeZone = { id: string; code: string; name: string; level: string; location: ZoneCoordinate };
declare global { interface Window { L?: any } }
let leafletLoad: Promise<any> | null = null;
const ensureLeaflet = () => {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletLoad) leafletLoad = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-map-css')) { const link = document.createElement('link'); link.id = 'leaflet-map-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link); }
    const script = document.querySelector<HTMLScriptElement>('script[data-leaflet-map]');
    if (script) { script.addEventListener('load', () => resolve(window.L)); script.addEventListener('error', () => reject(new Error('Detailed map could not be loaded.'))); return; }
    const next = document.createElement('script'); next.dataset.leafletMap = 'true'; next.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; next.async = true; next.onload = () => resolve(window.L); next.onerror = () => reject(new Error('Detailed map needs an internet connection.')); document.body.appendChild(next);
  });
  return leafletLoad;
};
const mapTone: Record<string, string> = { CRITICAL: '#c9344d', ELEVATED: '#ed7b40', WARNING: '#d9a928', NORMAL: '#328c67', 'NO DATA': '#8796a5' };
const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));

export const DetailedStreetMap: React.FC<{
  zones: GlobeZone[];
  focus: (ZoneCoordinate & { zoom?: number }) | null;
  site: ({ name: string; industry: string } & ZoneCoordinate) | null;
  selectedZoneId: string;
  placeMode: boolean;
  onSelectZone: (id: string) => void;
  onPlaceZone: (location: ZoneCoordinate) => void;
}> = ({ zones, focus, site, selectedZoneId, placeMode, onSelectZone, onPlaceZone }) => {
  const host = useRef<HTMLDivElement>(null); const map = useRef<any>(null); const markerLayer = useRef<any>(null); const siteMarker = useRef<any>(null);
  const zoneMarkers = useRef<Map<string, { marker: any; signature: string }>>(new Map());
  const callbacks = useRef({ onSelectZone, onPlaceZone, placeMode }); callbacks.current = { onSelectZone, onPlaceZone, placeMode };
  const focusRef = useRef(focus); focusRef.current = focus;
  const [ready, setReady] = React.useState(false); const [error, setError] = React.useState('');

  useEffect(() => {
    let cancelled = false;
    void ensureLeaflet().then((L) => {
      if (cancelled || !host.current || map.current) return;
      const initial = focusRef.current; map.current = L.map(host.current, { zoomControl: true, scrollWheelZoom: 'center', wheelDebounceTime: 100, wheelPxPerZoomLevel: 110, zoomSnap: .5, zoomDelta: .5 }).setView(initial ? [initial.lat, initial.lng] : [20.5937, 78.9629], initial?.zoom || 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).addTo(map.current);
      markerLayer.current = L.layerGroup().addTo(map.current); setReady(true); window.setTimeout(() => map.current?.invalidateSize({ pan: false }), 80);
    }).catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load the detailed map.'); });
    return () => { cancelled = true; map.current?.remove(); map.current = null; markerLayer.current = null; siteMarker.current = null; zoneMarkers.current.clear(); };
  }, []);

  useEffect(() => { if (ready && focus) map.current?.setView([focus.lat, focus.lng], focus.zoom || 13, { animate: true }); }, [ready, focus?.lat, focus?.lng, focus?.zoom]);
  useEffect(() => {
    if (!ready || !markerLayer.current) return;
    if (!site) { if (siteMarker.current) markerLayer.current.removeLayer(siteMarker.current); siteMarker.current = null; return; }
    const L = window.L;
    const icon = L.divIcon({ className: 'street-site-marker-wrap', html: '<span class="street-site-marker"><i></i></span>', iconSize: [34, 42], iconAnchor: [17, 38] });
    const content = `<strong>${escapeHtml(site.name)}</strong><br/>${escapeHtml(site.industry)} · selected location`;
    if (!siteMarker.current) siteMarker.current = L.marker([site.lat, site.lng], { icon, zIndexOffset: 1000 }).addTo(markerLayer.current).bindPopup(content);
    else { siteMarker.current.setLatLng([site.lat, site.lng]); siteMarker.current.setIcon(icon); siteMarker.current.setPopupContent(content); }
  }, [ready, site?.lat, site?.lng, site?.name, site?.industry]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const handleClick = (event: any) => { if (callbacks.current.placeMode) callbacks.current.onPlaceZone({ lat: event.latlng.lat, lng: event.latlng.lng }); };
    map.current.on('click', handleClick); return () => map.current?.off('click', handleClick);
  }, [ready, placeMode]);
  useEffect(() => {
    if (!ready || !markerLayer.current) return;
    const L = window.L; const liveIds = new Set(zones.map((zone) => zone.id));
    for (const [id, entry] of zoneMarkers.current) if (!liveIds.has(id)) { markerLayer.current.removeLayer(entry.marker); zoneMarkers.current.delete(id); }
    zones.forEach((zone) => {
      const color = mapTone[zone.level] || mapTone['NO DATA']; const text = zone.level === 'ELEVATED' ? 'HIGH' : zone.level === 'WARNING' ? 'MEDIUM' : zone.level;
      const signature = `${zone.location.lat}:${zone.location.lng}:${zone.level}:${selectedZoneId === zone.id}`;
      const existing = zoneMarkers.current.get(zone.id);
      if (existing?.signature === signature) return;
      const icon = L.divIcon({ className: 'street-zone-marker-wrap', html: `<span class="street-zone-marker${selectedZoneId === zone.id ? ' is-selected' : ''}" style="--zone-color:${color}"><i></i><b>${text}</b></span>`, iconSize: [94, 38], iconAnchor: [13, 18] });
      const popup = `<strong>${zone.code} · ${zone.name}</strong><br/>${text} exposure`;
      if (existing) {
        existing.marker.setLatLng([zone.location.lat, zone.location.lng]); existing.marker.setIcon(icon); existing.marker.setPopupContent(popup); existing.signature = signature;
      } else {
        const marker = L.marker([zone.location.lat, zone.location.lng], { icon }).addTo(markerLayer.current);
        marker.on('click', () => callbacks.current.onSelectZone(zone.id)); marker.bindPopup(popup);
        zoneMarkers.current.set(zone.id, { marker, signature });
      }
    });
  }, [ready, zones, selectedZoneId]);

  return <div className={`detailed-street-map${placeMode ? ' is-placing' : ''}`}><div ref={host} className="detailed-street-map-canvas" aria-label="Zoomable detailed street map showing exposure zones"/>{!ready && <div className="street-map-loading">{error || 'Loading detailed map…'}</div>}<div className="street-map-zoom-hint">Zoom in to see states, cities, roads, and local areas · pan to explore</div></div>;
};

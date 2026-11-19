import React, { useState } from 'react';
import { MapPin, LocateFixed, Search, Crosshair } from 'lucide-react';
import { ExposureRecord, IndustrialZone } from '../types';
import { DetailedStreetMap } from './DetailedStreetMap';

type ZoneMapRow = { zone: IndustrialZone; zoneRecords: ExposureRecord[]; level: string; workerCount: number; peakDose: number };
export type ZoneCoordinate = { lat: number; lng: number };
export type FacilityLocation = { name: string; industry: string; lat: number; lng: number; zoom?: number };

const tone = (level: string) => level === 'CRITICAL' ? '#c9344d' : level === 'ELEVATED' ? '#ed7b40' : level === 'WARNING' ? '#d9a928' : level === 'NORMAL' ? '#328c67' : '#8796a5';

export const ZoneGeographicMap: React.FC<{
  rows: ZoneMapRow[];
  selectedZoneId: string;
  locations: Record<string, ZoneCoordinate>;
  facility: FacilityLocation | null;
  onSelectZone: (id: string) => void;
  onSetLocation: (id: string, coordinate: ZoneCoordinate) => void;
  onResetLocation: (id: string) => void;
  onConfirmFacility: (location: FacilityLocation) => boolean;
}> = ({ rows, selectedZoneId, locations, facility, onSelectZone, onSetLocation, onResetLocation, onConfirmFacility }) => {
  const [query, setQuery] = useState('');
  const [facilityName, setFacilityName] = useState(facility?.name || '');
  const [industry, setIndustry] = useState(facility?.industry || 'Chemical processing');
  const [candidate, setCandidate] = useState<FacilityLocation | null>(null);
  const [placeResults, setPlaceResults] = useState<FacilityLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [placeMode, setPlaceMode] = useState(false);
  const [editingFacility, setEditingFacility] = useState(false);
  const [locationError, setLocationError] = useState('');

  const searchAddress = async (event: React.FormEvent) => {
    event.preventDefault(); if (!query.trim()) return;
    setSearching(true); setLocationError('');
    try {
      const params = new URLSearchParams({ q: query.trim(), format: 'jsonv2', limit: '30', addressdetails: '1' });
      const photonParams = new URLSearchParams({ q: query.trim(), limit: '30' });
      const [nominatimPlaces, photonPlaces] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { headers: { Accept: 'application/json' } })
          .then(async (response) => response.ok ? await response.json() : []).catch(() => []),
        fetch(`https://photon.komoot.io/api/?${photonParams.toString()}`, { headers: { Accept: 'application/json' } })
          .then(async (response) => response.ok ? await response.json() : { features: [] }).catch(() => ({ features: [] })),
      ]);
      const places: FacilityLocation[] = [
        ...nominatimPlaces.map((found: any) => ({ name: found.display_name, industry, lat: Number(found.lat), lng: Number(found.lon), zoom: Number(found.zoom) || 15 })),
        ...(photonPlaces.features || []).map((feature: any) => {
          const props = feature.properties || {}; const coords = feature.geometry?.coordinates || [];
          const name = [props.name, props.housenumber && props.street ? `${props.housenumber} ${props.street}` : props.street, props.district, props.city, props.state, props.country].filter(Boolean).join(', ');
          return { name: name || query.trim(), industry, lng: Number(coords[0]), lat: Number(coords[1]), zoom: 16 };
        }),
      ].filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng) && Math.abs(place.lat) <= 90 && Math.abs(place.lng) <= 180)
        .filter((place, index, all) => all.findIndex((other) => Math.abs(other.lat - place.lat) < 0.0001 && Math.abs(other.lng - place.lng) < 0.0001) === index)
        .slice(0, 50);
      if (!places.length) throw new Error('No matching place found. Add a company, facility, city, or region to your search.');
      setPlaceResults(places); setCandidate(places[0]);
    } catch (error) { setLocationError(error instanceof Error ? error.message : 'Could not search this location.'); }
    finally { setSearching(false); }
  };

  const selected = rows.find((row) => row.zone.id === selectedZoneId);
  const unlocated = rows.filter(({ zone }) => !locations[zone.id]);
  const setLocation = (id: string) => { onSelectZone(id); setPlaceMode(true); setLocationError(''); };
  const confirmFacility = () => {
    if (!candidate) return;
    const next = { ...candidate, name: facilityName.trim() || candidate.name.split(',')[0], industry };
    if (onConfirmFacility(next)) { setCandidate(null); setPlaceResults([]); setQuery(next.name); setEditingFacility(false); }
  };

  return <div className="zone-geographic-map">
    <div className="zone-map-tools">
      {!facility || editingFacility || candidate ? <>
        <form onSubmit={(event) => void searchAddress(event)} className="zone-map-search"><Search className="h-4 w-4"/><input aria-label="Search plant or facility location" value={query} onChange={(event) => { setQuery(event.target.value); setCandidate(null); setPlaceResults([]); }} placeholder="Search refinery, plant, company, or area"/><button type="submit" disabled={searching}>{searching ? 'Searching…' : 'Find place'}</button></form>
        {placeResults.length > 0 && <label className="zone-map-site-field zone-map-place-results">Matching places ({placeResults.length})<select aria-label="Choose matching plant or industry location" value={candidate ? `${candidate.lat},${candidate.lng}` : ''} onChange={(event) => { const selected = placeResults.find((place) => `${place.lat},${place.lng}` === event.target.value) || null; setCandidate(selected); }}><option value="">Choose the correct result</option>{placeResults.map((place) => <option key={`${place.lat},${place.lng}`} value={`${place.lat},${place.lng}`}>{place.name}</option>)}</select><small>Results from both place-search indexes. Choose any result to show its exact map location.</small></label>}
        <label className="zone-map-site-field">Plant / area name<input value={facilityName} onChange={(event) => setFacilityName(event.target.value)} placeholder="Name this facility"/></label>
        <label className="zone-map-site-field">Industry<select value={industry} onChange={(event) => setIndustry(event.target.value)}>{['Chemical processing','Oil and gas','Power generation','Manufacturing','Water and wastewater','Other'].map((value) => <option key={value}>{value}</option>)}</select></label>
        {candidate && <button type="button" className="zone-place-button is-active" onClick={confirmFacility}>Use this plant location</button>}
      </> : <div className="zone-map-confirmed-site"><MapPin className="h-4 w-4"/><span><strong>{facility.name}</strong><small>{facility.industry} · Plant location confirmed</small></span><button type="button" onClick={() => { setPlaceMode(false); setCandidate(null); setPlaceResults([]); setQuery(''); setFacilityName(''); setEditingFacility(true); }}>Change place</button></div>}
      <label className="zone-map-zone-picker">Zone to pin<select aria-label="Choose zone to place on map" value={selectedZoneId} onChange={(event) => onSelectZone(event.target.value)}><option value="">Choose a zone</option>{rows.map(({ zone }) => <option key={zone.id} value={zone.id}>{zone.zoneCode} · {zone.zoneName}</option>)}</select></label>
      <button type="button" disabled={!facility || !selectedZoneId} onClick={() => { setPlaceMode((value) => !value); setLocationError(''); }} className={`zone-place-button${placeMode ? ' is-active' : ''}`}><Crosshair className="h-4 w-4"/>{placeMode ? 'Cancel pin placement' : selected && locations[selectedZoneId] ? 'Move zone pin' : 'Place zone pin'}</button>
      {facility && selectedZoneId && locations[selectedZoneId] && <button type="button" onClick={() => { onResetLocation(selectedZoneId); setPlaceMode(false); }} className="zone-reset-pin-button">Unpin zone</button>}
    </div>
    {candidate && <p className="zone-map-instruction"><LocateFixed className="h-4 w-4"/>Confirm this search result to focus the map and automatically pin every zone. You can move individual pins later.</p>}
    {facility && !candidate && !editingFacility && <p className="zone-map-instruction"><LocateFixed className="h-4 w-4"/>All zones are automatically pinned at this plant. Pin colors follow each zone’s latest exposure level; select a zone and use “Move zone pin” to adjust its map position.</p>}
    {placeMode && <p className="zone-map-instruction"><LocateFixed className="h-4 w-4"/>Click the map to move <strong>{selected?.zone.zoneCode || 'the selected zone'}</strong> inside {facility?.name}. Its severity color updates automatically from readings.</p>}
    {locationError && <p role="alert" className="zone-map-error">{locationError}</p>}
    <DetailedStreetMap zones={rows.filter(({ zone }) => !!locations[zone.id]).map(({ zone, level }) => ({ id: zone.id, code: zone.zoneCode, name: zone.zoneName, level, location: locations[zone.id] }))} focus={candidate || facility} site={candidate || facility} selectedZoneId={selectedZoneId} placeMode={placeMode} onSelectZone={onSelectZone} onPlaceZone={(point) => { if (selectedZoneId) { onSetLocation(selectedZoneId, point); setPlaceMode(false); setLocationError(''); } }}/>
    <div className="zone-map-provider-note">Zoom the map for region, city, road, and local-area labels. Filter readings and monitor zone severity below.</div>
    {facility && <div className="zone-map-level-legend" aria-label="Exposure level marker colors"><strong>Automatic zone pins</strong><span><i style={{ background: tone('CRITICAL') }}/>Critical <b>{rows.filter((row) => row.level === 'CRITICAL').length}</b></span><span><i style={{ background: tone('ELEVATED') }}/>High <b>{rows.filter((row) => row.level === 'ELEVATED').length}</b></span><span><i style={{ background: tone('WARNING') }}/>Warning / medium <b>{rows.filter((row) => row.level === 'WARNING').length}</b></span><span><i style={{ background: tone('NORMAL') }}/>Normal <b>{rows.filter((row) => row.level === 'NORMAL').length}</b></span><span><i style={{ background: tone('NO DATA') }}/>No readings <b>{rows.filter((row) => row.level === 'NO DATA').length}</b></span></div>}
    {rows.some(({ zone }) => !!locations[zone.id]) && <div className="zone-pinned-list"><strong>Pinned zones <small>({rows.filter(({ zone }) => !!locations[zone.id]).length})</small></strong><div>{rows.filter(({ zone }) => !!locations[zone.id]).map(({ zone, level }) => <div key={zone.id} className={`zone-pinned-item${zone.id === selectedZoneId ? ' is-selected' : ''}`}><button type="button" onClick={() => onSelectZone(zone.id)} className="zone-pinned-select"><i style={{ background: tone(level) }}/><span><strong>{zone.zoneCode}</strong><small>{level === 'ELEVATED' ? 'HIGH' : level === 'WARNING' ? 'MEDIUM' : level}</small></span></button><button type="button" onClick={() => { onResetLocation(zone.id); setPlaceMode(false); }} className="zone-pinned-unpin" aria-label={`Unpin ${zone.zoneCode}`}>Unpin</button></div>)}</div></div>}
    {unlocated.length > 0 && <div className="zone-unlocated-list"><div><strong>{facility ? 'Zones unpinned by you' : 'Choose a plant location to pin zones'}</strong><p>{facility ? 'These zones stay unpinned until you move them back onto the map.' : 'Search for a facility and confirm the result. Every zone will then be pinned automatically.'}</p></div>{facility && <div>{unlocated.map(({ zone, level }) => <button key={zone.id} type="button" onClick={() => setLocation(zone.id)}><span style={{ background: tone(level) }}/>{zone.zoneCode}<small>Set location</small></button>)}</div>}</div>}
  </div>;
};

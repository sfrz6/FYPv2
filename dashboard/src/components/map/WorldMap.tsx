import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMapPoints } from '@/hooks/useHoneypotData';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilters } from '@/context/FiltersContext';

export function WorldMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const { data: mapPoints, isLoading } = useMapPoints();
  const { filters, setFilters } = useFilters();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with dark tiles
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapPoints) return;

    // Clear existing markers
    if (markerClusterRef.current) {
      mapInstanceRef.current.removeLayer(markerClusterRef.current);
    }

    // Create marker cluster group
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 100) size = 'large';
        else if (count > 10) size = 'medium';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    // Add markers
    mapPoints.forEach((point) => {
      const isOman = (point.country || '').toUpperCase() === 'OM';
      const marker = L.marker([point.lat, point.lon], {
        icon: L.divIcon({
          html: isOman ? '<div class="muscat-marker"></div>' : '<div class="attack-marker"></div>',
          className: isOman ? 'oman-marker-container' : 'attack-marker-container',
          iconSize: [12, 12],
        }),
      });

      marker.bindPopup(`
        <div class="map-popup">
          <strong>${point.country || 'Unknown'}</strong><br/>
          Attacks: ${point.count}<br/>
          Coords: ${point.lat.toFixed(2)}, ${point.lon.toFixed(2)}
        </div>
      `);

      marker.bindTooltip(
        `${(point.country || 'Unknown').toUpperCase()}: ${point.count} events`,
        { direction: 'top', offset: [0, -8] }
      );

      marker.on('click', () => {
        if (point.country && !filters.countries.includes(point.country)) {
          setFilters({
            ...filters,
            countries: [...filters.countries, point.country],
          });
        }
      });

      markers.addLayer(marker);
    });

    mapInstanceRef.current.addLayer(markers);
    markerClusterRef.current = markers;
  }, [mapPoints, filters, setFilters]);

  // Removed auto-adding OM to filters to avoid filtering out other datasets

  if (isLoading) {
    return <Skeleton className="w-full h-[500px] rounded-2xl" />;
  }

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-full" />
      <style>{`
        .marker-cluster-small {
          background-color: hsl(var(--primary) / 0.6);
        }
        .marker-cluster-small div {
          background-color: hsl(var(--primary) / 0.8);
        }
        .marker-cluster-medium {
          background-color: hsl(var(--accent) / 0.6);
        }
        .marker-cluster-medium div {
          background-color: hsl(var(--accent) / 0.8);
        }
        .marker-cluster-large {
          background-color: hsl(var(--destructive) / 0.6);
        }
        .marker-cluster-large div {
          background-color: hsl(var(--destructive) / 0.8);
        }
        .marker-cluster {
          border-radius: 50%;
          text-align: center;
          font-weight: bold;
          color: hsl(var(--primary-foreground));
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin: 5px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .attack-marker {
          width: 12px;
          height: 12px;
          background: hsl(var(--primary));
          border: 2px solid hsl(var(--background));
          border-radius: 50%;
          box-shadow: 0 0 10px hsl(var(--primary) / 0.6);
        }
        .attack-marker-container {
          background: transparent !important;
          border: none !important;
        }
        .map-popup {
          font-family: var(--font-sans);
          padding: 0.5rem;
        }
        .leaflet-popup-content-wrapper {
          background: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: hsl(var(--popover));
        }
        .muscat-marker {
          width: 12px;
          height: 12px;
          background: #00ff6a;
          border: 2px solid hsl(var(--background));
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(0, 255, 106, 0.6);
        }
        .oman-marker-container {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

/**
 * Shared Leaflet map for SOS live tracking (Uber-style).
 * - Patient view: shows patient marker (cyan/mint glowing halo) + doctor vehicle marker (moving) + road route line.
 * - Doctor view: shows doctor marker (own live position) + patient marker.
 *
 * Dynamically loaded (client-only) so SSR doesn't crash on window/navigator.
 */
export function SosLiveMap({
  patientLat,
  patientLng,
  doctorLat,
  doctorLng,
  height = 360,
  className = "",
}: {
  patientLat: number;
  patientLng: number;
  doctorLat?: number | null;
  doctorLng?: number | null;
  height?: number | string;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const doctorMarkerRef = useRef<Marker | null>(null);
  const patientMarkerRef = useRef<Marker | null>(null);
  const routeLineRef = useRef<Polyline | null>(null);
  const routeGlowRef = useRef<Polyline | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapRef.current || mapInstance.current) return;

      // CartoDB Positron gives a clean, ultra-modern grayscale/light map style matching Uber/Contra
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([patientLat, patientLng], 15);
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Re-add small attribution in bottom corner
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

      // Patient marker: Cyan/mint pulsating halo ring + solid inner emerald dot (matching Contra mockup)
      const patientIcon = L.divIcon({
        className: "sos-patient-marker",
        html: `
          <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(31,209,134,0.25);border:2px solid rgba(31,209,134,0.6);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(31,209,134,0.35);"></div>
            <div style="position:relative;width:14px;height:14px;border-radius:50%;background:#10b981;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      patientMarkerRef.current = L.marker([patientLat, patientLng], { icon: patientIcon }).addTo(map);

      // Doctor vehicle marker: Sleek top-down vehicle icon matching Contra UI
      const doctorIcon = L.divIcon({
        className: "sos-doctor-marker",
        html: `
          <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 6px 12px rgba(17,66,50,0.35));">
            <div style="background:#ffffff;border:2px solid #0f172a;border-radius:12px;padding:5px 7px;display:flex;align-items:center;gap:4px;box-shadow:0 4px 10px rgba(0,0,0,0.2);">
              <span style="font-size:16px;line-height:1;">🚑</span>
              <span style="font-size:10px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">SOS</span>
            </div>
          </div>
        `,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });

      if (doctorLat != null && doctorLng != null) {
        doctorMarkerRef.current = L.marker([doctorLat, doctorLng], { icon: doctorIcon }).addTo(map);
      }

      setReady(true);
    })();

    return () => {
      disposed = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Doctor position & draw/refresh Road Route Polyline
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    const L = (window as unknown as { L?: typeof import("leaflet") }).L;
    if (!L) return;

    if (doctorLat == null || doctorLng == null) {
      if (doctorMarkerRef.current) {
        doctorMarkerRef.current.remove();
        doctorMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      if (routeGlowRef.current) {
        routeGlowRef.current.remove();
        routeGlowRef.current = null;
      }
      mapInstance.current.setView([patientLat, patientLng], 15);
      return;
    }

    // Add or move doctor marker
    if (!doctorMarkerRef.current) {
      const doctorIcon = L.divIcon({
        className: "sos-doctor-marker",
        html: `
          <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 6px 12px rgba(17,66,50,0.35));">
            <div style="background:#ffffff;border:2px solid #0f172a;border-radius:12px;padding:5px 7px;display:flex;align-items:center;gap:4px;box-shadow:0 4px 10px rgba(0,0,0,0.2);">
              <span style="font-size:16px;line-height:1;">🚑</span>
              <span style="font-size:10px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">SOS</span>
            </div>
          </div>
        `,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });
      doctorMarkerRef.current = L.marker([doctorLat, doctorLng], { icon: doctorIcon }).addTo(mapInstance.current);
    } else {
      doctorMarkerRef.current.setLatLng([doctorLat, doctorLng]);
    }

    // Update or create Route Polyline connecting Doctor to Patient
    let isCancelled = false;
    const fetchAndRenderRoute = async () => {
      let coords: [number, number][] = [
        [doctorLat, doctorLng],
        [patientLat, patientLng],
      ];

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${doctorLng},${doctorLat};${patientLng},${patientLat}?overview=full&geometries=geojson`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as {
            routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
          };
          const pts = data.routes?.[0]?.geometry?.coordinates;
          if (Array.isArray(pts) && pts.length > 0) {
            coords = pts.map(([lon, lat]) => [lat, lon]);
          }
        }
      } catch {
        // Fall back to direct line
      }

      if (isCancelled || !mapInstance.current) return;

      if (!routeGlowRef.current) {
        // Background glow line (coral tint)
        routeGlowRef.current = L.polyline(coords, {
          color: "#fee2e2",
          weight: 8,
          opacity: 0.8,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(mapInstance.current);
      } else {
        routeGlowRef.current.setLatLngs(coords);
      }

      if (!routeLineRef.current) {
        // High-contrast vibrant route line (matches Contra mockup coral/red)
        routeLineRef.current = L.polyline(coords, {
          color: "#ef4444",
          weight: 4.5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(mapInstance.current);
      } else {
        routeLineRef.current.setLatLngs(coords);
      }

      mapInstance.current.fitBounds(
        [
          [patientLat, patientLng],
          [doctorLat, doctorLng],
        ],
        { padding: [60, 60], maxZoom: 16 }
      );
    };

    void fetchAndRenderRoute();

    return () => {
      isCancelled = true;
    };
  }, [ready, doctorLat, doctorLng, patientLat, patientLng]);

  return (
    <div
      ref={mapRef}
      className={`relative overflow-hidden transition-opacity duration-300 ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: "100%",
        opacity: ready ? 1 : 0.4,
      }}
    />
  );
}

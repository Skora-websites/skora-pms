"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

/**
 * Shared Leaflet map for SOS live tracking.
 * - Patient view: shows patient marker (fixed) + doctor marker (moving).
 * - Doctor view: shows doctor marker (own live position) + patient marker.
 *
 * Leaflet is loaded dynamically (client-only) so SSR doesn't crash on
 * `window`/`navigator`.
 */
export function SosLiveMap({
  patientLat,
  patientLng,
  doctorLat,
  doctorLng,
  height = 320,
}: {
  patientLat: number;
  patientLng: number;
  doctorLat?: number | null;
  doctorLng?: number | null;
  height?: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const doctorMarkerRef = useRef<Marker | null>(null);
  const patientMarkerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current).setView([patientLat, patientLng], 14);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Patient marker (red, pulsing icon)
      const patientIcon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#dc2626;border:3px solid #fff;box-shadow:0 0 0 6px rgba(220,38,38,.25);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      patientMarkerRef.current = L.marker([patientLat, patientLng], { icon: patientIcon }).addTo(map);
      patientMarkerRef.current.bindPopup("<b>Your location</b>").openPopup();

      // Doctor marker (blue car-style)
      const doctorIcon = L.divIcon({
        className: "",
        html: `<div style="width:24px;height:24px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25);display:flex;align-items:center;justify-content:center;font-size:12px;">🚑</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      doctorMarkerRef.current = L.marker([doctorLat ?? patientLat, doctorLng ?? patientLng], {
        icon: doctorIcon,
      }).addTo(map);

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

  // Move doctor marker as live coordinates update.
  useEffect(() => {
    if (!doctorMarkerRef.current || doctorLat == null || doctorLng == null) return;
    doctorMarkerRef.current.setLatLng([doctorLat, doctorLng]);
    if (mapInstance.current) {
      mapInstance.current.fitBounds(
        [
          [patientLat, patientLng],
          [doctorLat, doctorLng],
        ],
        { padding: [40, 40], maxZoom: 16 }
      );
    }
  }, [doctorLat, doctorLng, patientLat, patientLng]);

  return (
    <div
      ref={mapRef}
      style={{
        height: `${height}px`,
        width: "100%",
        borderRadius: "1rem",
        zIndex: 0,
        opacity: ready ? 1 : 0.4,
        transition: "opacity .3s",
      }}
    />
  );
}

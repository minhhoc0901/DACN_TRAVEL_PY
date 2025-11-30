

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet"; // Import Leaflet để tùy chỉnh marker
import "leaflet/dist/leaflet.css";

// Tùy chỉnh icon cho marker
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
});

// Component để cập nhật vị trí bản đồ khi viewport thay đổi
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapSection = ({ viewport, setViewport }) => {
  const center = [viewport.latitude, viewport.longitude];

  return (
    <section id="map" className="map mb-8">
      <h2 className="text-2xl font-semibold mb-4">Bản đồ địa điểm</h2>
      <MapContainer
        center={center}
        zoom={viewport.zoom}
        style={{ width: viewport.width, height: viewport.height }}
        whenCreated={(map) => {
          map.on("moveend", () => {
            const newCenter = map.getCenter();
            setViewport({
              ...viewport,
              latitude: newCenter.lat,
              longitude: newCenter.lng,
              zoom: map.getZoom(),
            });
          });
        }}
      >
        <MapUpdater center={center} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={center} icon={customIcon}>
          <Popup>Địa điểm này</Popup>
        </Marker>
      </MapContainer>
    </section>
  );
};

export default MapSection;
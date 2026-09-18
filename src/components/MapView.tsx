/** Maps stored sites and turns deliberate map clicks into a new geographic boundary. */
import { useEffect, useRef, useState, type MouseEvent } from "react";
import mapboxgl from "mapbox-gl";
import * as maplibregl from "maplibre-gl";
import type { Polygon, FeatureCollection, Feature } from "geojson";
import type { Site } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";
import "maplibre-gl/dist/maplibre-gl.css";

// Mapbox requires a token even for third-party tiles. The documented no-token preview
// uses MapLibre; supplying VITE_MAPBOX_TOKEN selects the required Mapbox renderer.
const engine = (import.meta.env.VITE_MAPBOX_TOKEN
  ? mapboxgl
  : maplibregl) as unknown as typeof mapboxgl;
type Coordinate = [number, number];
interface Props {
  sites: Site[];
  selected?: string;
  onSelect?: (site: Site) => void;
  onDraw?: (polygon: Polygon | null) => void;
  drawing?: boolean;
}

/** Share one map implementation between portfolio browsing and boundary drawing. */
export default function MapView({
  sites,
  selected,
  onSelect,
  onDraw,
  drawing = false,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const callbacks = useRef({ onSelect, onDraw, sites });
  callbacks.current = { onSelect, onDraw, sites };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [satellite, setSatellite] = useState(false);
  const [corners, setCorners] = useState<Coordinate[]>([]);
  const [finished, setFinished] = useState(false);
  const [drawMode, setDrawMode] = useState(true);
  const pointerStart = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (!container.current) return;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    let instance: mapboxgl.Map;
    try {
      instance = new engine.Map({
        container: container.current,
        accessToken: token || "",
        style: token
          ? "mapbox://styles/mapbox/light-v11"
          : {
              version: 8,
              sources: {
                osm: {
                  type: "raster",
                  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                  tileSize: 256,
                  maxzoom: 19,
                  attribution:
                    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
                },
              },
              layers: [
                {
                  id: "base",
                  type: "raster",
                  source: "osm",
                  paint: { "raster-saturation": -0.65, "raster-opacity": 0.9 },
                },
              ],
            },
        center: [81, 21],
        zoom: 3.5,
      });
    } catch {
      setError(
        "This map requires WebGL. Site details remain available in the list.",
      );
      return;
    }
    map.current = instance;
    instance.addControl(
      new engine.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    if (drawing) instance.doubleClickZoom.disable();
    instance.on("load", () => {
      instance.addSource("sites", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      instance.addLayer({
        id: "site-fill",
        type: "fill",
        source: "sites",
        paint: { "fill-color": "#43855e", "fill-opacity": 0.32 },
      });
      instance.addLayer({
        id: "site-line",
        type: "line",
        source: "sites",
        paint: { "line-color": "#245a42", "line-width": 2 },
      });
      if (drawing) {
        instance.addSource("draft", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        instance.addLayer({
          id: "draft-fill",
          type: "fill",
          source: "draft",
          filter: ["==", "$type", "Polygon"],
          paint: { "fill-color": "#c4dd73", "fill-opacity": 0.4 },
        });
        instance.addLayer({
          id: "draft-line",
          type: "line",
          source: "draft",
          filter: ["!=", "$type", "Point"],
          paint: { "line-color": "#325d3d", "line-width": 3 },
        });
        instance.addLayer({
          id: "draft-corners",
          type: "circle",
          source: "draft",
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-color": "#f5fbe8",
            "circle-radius": 5,
            "circle-stroke-color": "#325d3d",
            "circle-stroke-width": 2,
          },
        });
      }
      instance.on("click", "site-fill", (event) => {
        const id = event.features?.[0]?.properties?.id;
        const site = callbacks.current.sites.find((s) => s.id === id);
        if (site) callbacks.current.onSelect?.(site);
      });
      setReady(true);
    });
    instance.on("error", () =>
      setError(
        "Some map tiles could not load. Check your connection or Mapbox token.",
      ),
    );
    return () => {
      setReady(false);
      instance.remove();
      map.current = null;
    };
  }, [drawing]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;
    const data: FeatureCollection = {
      type: "FeatureCollection",
      features: sites.map((site) => ({
        type: "Feature",
        properties: { id: site.id },
        geometry: site.geometry,
      })),
    };
    (instance.getSource("sites") as mapboxgl.GeoJSONSource).setData(data);
    const markers = sites.map((site, index) => {
      const button = document.createElement("button");
      button.className = `map-marker ${selected === site.id ? "selected" : ""}`;
      button.textContent = String(index + 1);
      button.ariaLabel = `View ${site.name}`;
      button.addEventListener("click", () =>
        callbacks.current.onSelect?.(site),
      );
      const marker = new engine.Marker({ element: button })
        .setLngLat(site.geometry.coordinates[0][0] as Coordinate)
        .addTo(instance);
      button.setAttribute("role", "button");
      return marker;
    });
    if (sites.length && !drawing) {
      const bounds = new engine.LngLatBounds();
      sites.forEach((site) =>
        site.geometry.coordinates[0].forEach((point) =>
          bounds.extend(point as Coordinate),
        ),
      );
      instance.fitBounds(bounds, {
        padding: 65,
        maxZoom: 11,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 850,
      });
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [sites, selected, ready, drawing]);
  useEffect(() => {
    if (!ready || !drawing || !map.current) return;
    const features: Feature[] = corners.map((coordinates) => ({
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates },
    }));
    if (corners.length >= 3)
      features.unshift({
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[...corners, corners[0]]] },
      });
    else if (corners.length === 2)
      features.unshift({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: corners },
      });
    (map.current.getSource("draft") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features,
    });
  }, [corners, ready, drawing]);
  /** Ignore drags and map controls so repositioning the map never accidentally places a corner. */
  function addCorner(event: MouseEvent<HTMLDivElement>) {
    if (
      !drawing ||
      !drawMode ||
      finished ||
      !ready ||
      !map.current ||
      (event.target as HTMLElement).closest("button,a,summary")
    )
      return;
    if (
      pointerStart.current &&
      Math.hypot(
        event.clientX - pointerStart.current[0],
        event.clientY - pointerStart.current[1],
      ) > 5
    )
      return;
    const box = container.current!.getBoundingClientRect();
    const point = map.current.unproject([
      event.clientX - box.left,
      event.clientY - box.top,
    ]);
    const coordinate: Coordinate = [
      Number(point.lng.toFixed(7)),
      Number(point.lat.toFixed(7)),
    ];
    setCorners((previous) =>
      previous.length < 1999 && previous.at(-1)?.join() !== coordinate.join()
        ? [...previous, coordinate]
        : previous,
    );
  }
  /** Explicit completion avoids ambiguous double-click behavior across browsers and touch devices. */
  function finishBoundary() {
    if (corners.length < 3) return;
    setFinished(true);
    callbacks.current.onDraw?.({
      type: "Polygon",
      coordinates: [[...corners, corners[0]]],
    });
  }
  /** Replacing only the satellite layer preserves markers and existing boundaries. */
  function toggleSatellite() {
    const instance = map.current;
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!instance || !token || !ready) return;
    if (!instance.getSource("satellite")) {
      instance.addSource("satellite", {
        type: "raster",
        tiles: [
          `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.jpg90?access_token=${token}`,
        ],
        tileSize: 256,
        attribution: "© Mapbox",
      });
      instance.addLayer(
        { id: "satellite", type: "raster", source: "satellite" },
        "site-fill",
      );
    }
    instance.setLayoutProperty(
      "satellite",
      "visibility",
      satellite ? "none" : "visible",
    );
    setSatellite(!satellite);
  }
  return (
    <div>
      <div className={`map-shell ${drawing ? "drawing-map" : ""}`}>
        <div
          className="map-canvas"
          ref={container}
          onMouseDown={(event) => {
            pointerStart.current = [event.clientX, event.clientY];
          }}
          onClick={addCorner}
        />
        {error && (
          <div className="map-error" role="status">
            {error}
          </div>
        )}
        {!drawing && (
          <>
            <div className="map-key">
              <span className="live-dot" />
              {sites.length} restoration sites
            </div>
            <div className="map-style">
              <button
                type="button"
                className={!satellite ? "active" : ""}
                onClick={() => satellite && toggleSatellite()}
              >
                Terrain
              </button>
              <button
                type="button"
                disabled={!import.meta.env.VITE_MAPBOX_TOKEN || !ready}
                title="Satellite imagery requires a Mapbox token"
                className={satellite ? "active" : ""}
                onClick={() => !satellite && toggleSatellite()}
              >
                Satellite
              </button>
            </div>
          </>
        )}
      </div>
      {drawing && (
        <div className="drawing-tools">
          <button
            type="button"
            className="button secondary"
            onClick={() => setDrawMode(!drawMode)}
          >
            {drawMode ? "Pause drawing to pan" : "Resume drawing"}
          </button>
          <span aria-live="polite">{corners.length} corners</span>
          <button
            type="button"
            className="button secondary"
            disabled={!corners.length}
            onClick={() => {
              setCorners((previous) => previous.slice(0, -1));
              setFinished(false);
              callbacks.current.onDraw?.(null);
            }}
          >
            Undo
          </button>
          <button
            type="button"
            className="button primary"
            disabled={corners.length < 3 || finished}
            onClick={finishBoundary}
          >
            {finished ? "Boundary complete" : "Finish boundary"}
          </button>
        </div>
      )}
    </div>
  );
}

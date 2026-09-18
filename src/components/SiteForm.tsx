/** Combines geographic drawing and site metadata into a single reviewable save operation. */
import { useState, type FormEvent } from "react";
import type { Polygon } from "geojson";
import area from "@turf/area";
import MapView from "./MapView";
import type { NewSite, Project } from "../types";
import { number } from "../lib/analytics";
/** One site belongs to one project; the server independently verifies that relationship. */
export default function SiteForm({
  projects,
  defaultProject,
  save,
}: {
  projects: Project[];
  defaultProject?: string;
  save: (project: string, data: NewSite) => Promise<void>;
}) {
  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!polygon) return;
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await save(String(data.get("project")), {
        name: String(data.get("name")).trim(),
        ecosystem: String(data.get("ecosystem")),
        geometry: polygon,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <p className="muted">
        Click the map to place at least three corners, then choose Finish
        boundary. Use Undo to adjust a corner.
      </p>
      <MapView sites={[]} drawing onDraw={setPolygon} />
      <div className="boundary-summary">
        <span className="live-dot" />
        {polygon
          ? `${number(area(polygon) / 10000, 2)} hectares · boundary ready`
          : "Draw a boundary to continue"}
      </div>
      <div className="form-grid">
        <label>
          Site name
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. Agumbe Rainforest"
          />
        </label>
        <label>
          Project
          <select name="project" defaultValue={defaultProject}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ecosystem
          <select name="ecosystem">
            {[
              "Tropical forest",
              "Mangrove",
              "Grassland",
              "Wetland",
              "Woodland",
            ].map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
        <div className="muted field-note">
          New sites begin without measurements. No analytics are invented for
          newly drawn boundaries.
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={!polygon || busy}>
        {busy ? "Saving boundary…" : "Save site & boundary"}
      </button>
    </form>
  );
}

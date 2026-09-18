/** Connects a selected map boundary to its individual ecological performance. */
import { useState } from "react";
import { ArrowDownToLine, MapPin, Leaf } from "lucide-react";
import type { Site } from "../types";
import { latest, number, exportSites } from "../lib/analytics";
import TrendChart from "./TrendChart";
/** Missing measurements are shown as unavailable, never as verified environmental results. */
export default function SiteDetails({
  site,
  projectName,
}: {
  site: Site;
  projectName: string;
}) {
  const [metric, setMetric] = useState<"carbon" | "biodiversity" | "canopy">(
    "carbon",
  );
  const observation = latest(site);
  return (
    <div className="site-detail">
      <p className="eyebrow">
        <MapPin size={14} />
        {projectName}
      </p>
      <div className="detail-banner">
        <Leaf size={34} />
        <div>
          <strong>{site.ecosystem}</strong>
          <p>{number(site.area_ha, 1)} hectares under management</p>
        </div>
      </div>
      <div className="detail-metrics">
        <div>
          <span>Carbon stored</span>
          <strong>
            {observation ? number(observation.carbon) : "—"}
            <small> tCO₂e</small>
          </strong>
        </div>
        <div>
          <span>Biodiversity</span>
          <strong>
            {observation?.biodiversity ?? "—"}
            <small> /100</small>
          </strong>
        </div>
        <div>
          <span>Canopy cover</span>
          <strong>
            {observation?.canopy ?? "—"}
            <small> %</small>
          </strong>
        </div>
      </div>
      <div className="section-heading">
        <h3>Performance over time</h3>
        <select
          aria-label="Site chart metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
        >
          <option value="carbon">Carbon storage</option>
          <option value="biodiversity">Biodiversity</option>
          <option value="canopy">Canopy cover</option>
        </select>
      </div>
      <TrendChart rows={site.observations} metric={metric} />
      <div className="detail-footer">
        <span className="muted">
          {observation
            ? `Latest observation · ${observation.date}`
            : "Awaiting first observation"}
        </span>
        <button
          className="button secondary"
          disabled={!site.observations.length}
          onClick={() => exportSites([site])}
        >
          <ArrowDownToLine size={15} /> Export CSV
        </button>
      </div>
    </div>
  );
}

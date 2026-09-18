/** Shows carbon history beside the portfolio's biodiversity indicator. */
import { Leaf, Sprout } from "lucide-react";
import type { CSSProperties } from "react";
import type { Observation } from "../types";
import { number } from "../lib/analytics";
import TrendChart from "./TrendChart";
/** Missing observations stay visibly empty, even when the portfolio contains new sites. */
export default function PortfolioAnalytics({
  period,
  setPeriod,
  monitoredCount,
  carbon,
  diversity,
  rows,
  authenticated,
}: {
  period: string;
  setPeriod: (value: string) => void;
  monitoredCount: number;
  carbon: number;
  diversity: number | null;
  rows: Observation[];
  authenticated: boolean;
}) {
  return (
    <section className="analytics-grid">
      <article className="panel carbon-panel">
        <div className="section-heading">
          <div>
            <h2>Carbon, captured.</h2>
            <p>Cumulative storage across monitored sites</p>
          </div>
          <select
            aria-label="Chart time period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="12">Last 12 months</option>
            <option value="6">Last 6 months</option>
            <option value="3">Last 3 months</option>
          </select>
        </div>
        <div className="chart-headline">
          <strong>{monitoredCount ? number(carbon) : "—"}</strong>
          <span>tonnes CO₂ equivalent</span>
          <span className="chart-legend">
            <i /> Carbon stored
          </span>
        </div>
        <TrendChart rows={rows} />
      </article>
      <article className="biodiversity-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">LIFE BEYOND CARBON</div>
            <h2>More life. More resilience.</h2>
          </div>
          <Sprout size={25} />
        </div>
        <div className="biodiversity-body">
          <div
            className="score-ring"
            style={
              { "--score": `${(diversity || 0) * 3.6}deg` } as CSSProperties
            }
          >
            <div>
              <strong>{diversity === null ? "—" : number(diversity)}</strong>
              <span>OUT OF 100</span>
            </div>
          </div>
          <div>
            <strong>Biodiversity index</strong>
            <p>
              {monitoredCount
                ? `A snapshot of ecosystem diversity across ${monitoredCount} monitored sites.`
                : "Add observations to understand your ecosystem."}
            </p>
            <span className="nature-pill">
              <Leaf size={12} />{" "}
              {authenticated ? "Portfolio indicator" : "Illustrative sample"}
            </span>
          </div>
        </div>
        <div className="bio-footer">
          Healthy ecosystems are the foundation of lasting impact.
        </div>
      </article>
    </section>
  );
}

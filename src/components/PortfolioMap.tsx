/** Pairs geographic boundaries with an accessible list of the same sites. */
import { ArrowUpRight, Globe2, Plus } from "lucide-react";
import type { Project, Site } from "../types";
import MapView from "./MapView";
/** List-based selection remains available when a browser cannot render a map. */
export default function PortfolioMap({
  view,
  projects,
  sites,
  selected,
  onAddSite,
  onSelect,
}: {
  view: string;
  projects: Project[];
  sites: Site[];
  selected?: string;
  onAddSite: () => void;
  onSelect: (site: Site) => void;
}) {
  return (
    <section
      className={`map-panel panel ${view === "Map explorer" ? "expanded-map" : ""}`}
    >
      <div className="section-heading">
        <div>
          <h2>
            <Globe2 size={18} /> Your impact, on the ground
          </h2>
          <p>A living view of your restoration footprint</p>
        </div>
        <button
          className="button secondary"
          disabled={!projects.length}
          onClick={onAddSite}
        >
          <Plus size={15} /> Add site
        </button>
      </div>
      <div className="map-layout">
        <MapView sites={sites} selected={selected} onSelect={onSelect} />
        <div className="map-site-list">
          <div className="list-heading">
            PROJECT SITES <span>{sites.length}</span>
          </div>
          {sites.length ? (
            sites.map((site, i) => (
              <button
                className="site-row"
                key={site.id}
                onClick={() => onSelect(site)}
              >
                <span className="site-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{site.name}</strong>
                  <small>
                    {projects.find((p) => p.id === site.project_id)?.region}
                  </small>
                  <span className="site-tag">{site.ecosystem}</span>
                </span>
                <ArrowUpRight size={15} />
              </button>
            ))
          ) : (
            <div className="empty-inline">
              {projects.length
                ? "No sites match this view. Add a site or clear your filters."
                : "Create your first project, then draw a site boundary."}
            </div>
          )}
          <div className="map-list-footer">
            <span className="live-dot" /> Select a site to explore its impact
          </div>
        </div>
      </div>
    </section>
  );
}

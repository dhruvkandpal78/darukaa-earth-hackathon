/** Project cards organize each initiative and provide direct access to its sites. */
import { ArrowRight, ArrowUpRight, Compass, MapPin, Plus } from "lucide-react";
import type { Project, Site } from "../types";
import { number } from "../lib/analytics";
/** The parent owns filtering and saving; this view only presents the matching records. */
export default function ProjectGrid({
  visibleProjects,
  hasProjects,
  view,
  onViewAll,
  onAddSite,
  onSelectSite,
  onReset,
}: {
  visibleProjects: Project[];
  hasProjects: boolean;
  view: string;
  onViewAll: () => void;
  onAddSite: (id: string) => void;
  onSelectSite: (site: Site) => void;
  onReset: () => void;
}) {
  return (
    <section className="projects-section">
      <div className="section-heading">
        <div>
          <h2>
            Your restoration portfolio{" "}
            <span className="count-badge">{visibleProjects.length}</span>
          </h2>
          <p>Local roots. A collective difference.</p>
        </div>
        {view === "Overview" && (
          <button className="text-button" onClick={onViewAll}>
            View all projects <ArrowRight size={16} />
          </button>
        )}
      </div>
      <div className="project-grid">
        {visibleProjects.map((project, i) => (
          <article className="project-card" key={project.id}>
            <div
              className={`project-landscape landscape-${project.category === "Blue carbon" ? "water" : project.category === "Biodiversity" ? "grass" : "forest"}`}
            >
              <div className="landscape-shape a" />
              <div className="landscape-shape b" />
              <div className="landscape-shape c" />
              <span className="project-category">{project.category}</span>
              <span className="landscape-coordinate">
                {project.sites[0]
                  ? `${project.sites[0].geometry.coordinates[0][0][1].toFixed(2)}° N · ${project.sites[0].geometry.coordinates[0][0][0].toFixed(2)}° E`
                  : "NEW LANDSCAPE"}
              </span>
              <span className="landscape-index">0{i + 1}</span>
            </div>
            <div className="project-card-body">
              <div className="project-title">
                <h3>{project.name}</h3>
                <ArrowUpRight size={18} />
              </div>
              <p>
                <MapPin size={13} />
                {project.region}
              </p>
              <p className="project-description">
                {project.description ||
                  "A new chapter in landscape restoration."}
              </p>
              <div className="project-bottom">
                <span>
                  <strong>{project.sites.length}</strong> sites{" "}
                  <span className="separator">/</span>{" "}
                  <strong>
                    {number(
                      project.sites.reduce((sum, s) => sum + s.area_ha, 0),
                    )}
                  </strong>{" "}
                  ha
                </span>
                <button
                  onClick={() => onAddSite(project.id)}
                  aria-label={`Add site to ${project.name}`}
                >
                  <Plus size={14} /> Add site
                </button>
              </div>
              <div className="project-sites">
                {project.sites.map((s) => (
                  <button key={s.id} onClick={() => onSelectSite(s)}>
                    {s.name}
                    <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visibleProjects.length && (
        <div className="empty-state">
          <Compass size={34} />
          <h3>
            {hasProjects
              ? "No matching landscapes"
              : "Your next chapter starts here"}
          </h3>
          <p>
            {hasProjects
              ? "Try another search or project focus."
              : "Create a project and map the first site in your portfolio."}
          </p>
          <button className="button primary" onClick={onReset}>
            {hasProjects ? "Clear filters" : "Create first project"}
          </button>
        </div>
      )}
    </section>
  );
}

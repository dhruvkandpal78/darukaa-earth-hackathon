/** Coordinates the portfolio screens; detailed map, forms, and analytics live in separate components. */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Bell,
  Menu,
  FolderOpen,
  Leaf,
  Plus,
  Search,
  Sprout,
  Trees,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import area from "@turf/area";
import type { NewProject, NewSite, Project, Site, User } from "./types";
import { demoProjects } from "./data/demo";
import { request, setToken } from "./lib/api";
import { exportSites, latest, number, timeline } from "./lib/analytics";
import Modal from "./components/Modal";
import Sidebar from "./components/Sidebar";
import AnimatedValue from "./components/AnimatedValue";
import ProjectGrid from "./components/ProjectGrid";
import PortfolioMap from "./components/PortfolioMap";
import PortfolioAnalytics from "./components/PortfolioAnalytics";
import TrendChart from "./components/TrendChart";
import ProjectForm from "./components/ProjectForm";
import SiteForm from "./components/SiteForm";
import AuthForm from "./components/AuthForm";
import SiteDetails from "./components/SiteDetails";

/** Small stat cards share hierarchy while keeping units and measurement coverage visible. */
function Stat({
  icon: Icon,
  label,
  value,
  unit,
  note,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <article className={`stat-card ${accent ? "accent" : ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <div className="stat-value">
        <AnimatedValue value={value} />
        <span>{unit}</span>
      </div>
      <div className="stat-note">
        <span className="tiny-dot" />
        {note}
      </div>
    </article>
  );
}
/** The initial sample workspace is deliberate: real portfolios become available after authentication. */
export default function App() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(
    structuredClone(demoProjects),
  );
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState("Overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All projects");
  const [period, setPeriod] = useState("12");
  const [modal, setModal] = useState<
    "project" | "site" | "auth" | "help" | null
  >(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const visibleProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === "All projects" || p.category === filter) &&
          `${p.name} ${p.region} ${p.sites.map((s) => s.name).join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [projects, query, filter],
  );
  const sites = useMemo(
    () => visibleProjects.flatMap((p) => p.sites),
    [visibleProjects],
  );
  const monitored = sites.filter((s) => latest(s));
  const carbon = monitored.reduce((sum, site) => sum + latest(site)!.carbon, 0);
  const diversity = monitored.length
    ? monitored.reduce((sum, site) => sum + latest(site)!.biodiversity, 0) /
      monitored.length
    : null;
  const rows = timeline(sites).slice(-Number(period));
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    const expire = () => {
      setToken(null);
      setUser(null);
      setProjects(structuredClone(demoProjects));
      setModal("auth");
      setNotice(
        "Your session expired. Sign in again to access saved projects.",
      );
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  /** Replace sample records completely when entering a real account, even when it has no projects. */
  async function loadPortfolio(account: User) {
    setUser(account);
    setModal(null);
    setLoading(true);
    setProjects([]);
    setLoadError("");
    try {
      setProjects(await request<Project[]>("/projects"));
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  /** Sample writes last only for this page session; authenticated writes go to PostGIS. */
  async function createProject(data: NewProject) {
    const project = user
      ? await request<Project>("/projects", data)
      : {
          ...data,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          sites: [],
        };
    setProjects((previous) => [project, ...previous]);
    setModal(null);
    setView("Projects");
    setQuery("");
    setFilter("All projects");
    setNotice(
      user ? "Project created." : "Sample project created for this session.",
    );
  }
  /** Use the same returned server shape for newly drawn sites and loaded portfolio records. */
  async function createSite(id: string, data: NewSite) {
    const site: Site = user
      ? await request<Site>(`/projects/${id}/sites`, data)
      : {
          ...data,
          id: crypto.randomUUID(),
          project_id: id,
          area_ha: area(data.geometry) / 10000,
          observations: [],
        };
    setProjects((previous) =>
      previous.map((p) =>
        p.id === id ? { ...p, sites: [...p.sites, site] } : p,
      ),
    );
    setModal(null);
    setNotice(
      user ? "Site boundary saved." : "Sample site added for this session.",
    );
  }
  /** Signing out clears both credentials and private records from the visible interface. */
  function logout() {
    setToken(null);
    setUser(null);
    setProjects(structuredClone(demoProjects));
    setSelectedSite(null);
    setQuery("");
    setFilter("All projects");
    setNotice("Signed out. You are now viewing the sample portfolio.");
  }
  return (
    <div className="app-shell">
      <Sidebar
        open={navigationOpen}
        close={() => setNavigationOpen(false)}
        user={user}
        view={view}
        setView={setView}
        projectCount={projects.length}
        onHelp={() => setModal("help")}
        onAccount={() => (user ? logout() : setModal("auth"))}
      />
      <main>
        <header className="topbar">
          <div className="header-navigation">
            <button
              className="menu-toggle"
              aria-label="Open navigation"
              aria-controls="workspace-navigation"
              aria-expanded={navigationOpen}
              onClick={() => setNavigationOpen(true)}
            >
              <Menu size={20} />
              <span>Menu</span>
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <strong>{view}</strong>
            </div>
          </div>
          <div className="header-actions">
            <span className="system-status">
              <span className="live-dot" />
              {user ? "Private workspace" : "Sample workspace"}
            </span>
            <button
              className="icon-button"
              aria-label="View data notices"
              onClick={() =>
                setNotice(
                  user
                    ? "New sites have no observations until data is imported. See Help & methodology."
                    : "All sample measurements are synthetic, covering January–December 2025.",
                )
              }
            >
              <Bell size={18} />
            </button>
            <button
              className="avatar small"
              onClick={() => setModal("auth")}
              aria-label="Account sign in"
            >
              {user ? user.name.slice(0, 2).toUpperCase() : "DE"}
            </button>
          </div>
        </header>
        <div className="content" key={view}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> THE BIGGER PICTURE
              </div>
              <h1>
                {view === "Overview"
                  ? "Every hectare tells a story."
                  : view === "Projects"
                    ? "Your projects. Lasting impact."
                    : view === "Map explorer"
                      ? "Rooted in real places."
                      : "See nature’s progress."}
              </h1>
              <p>
                {view === "Overview"
                  ? "Bring your carbon, biodiversity, and restoration efforts into focus."
                  : view === "Projects"
                    ? "A connected home for every landscape you’re helping restore."
                    : view === "Map explorer"
                      ? "Explore your sites. Select a boundary to see its story."
                      : "Follow the signals that matter, from carbon to canopy."}
              </p>
            </div>
            <button
              className="button primary"
              onClick={() => setModal("project")}
            >
              <Plus size={17} /> New project
            </button>
          </div>
          {!user && (
            <div className="demo-strip">
              <span>
                <span className="demo-badge">DEMO</span>Explore a sample
                portfolio. Measurements are synthetic; changes last until
                refresh.
              </span>
              <button onClick={() => setModal("auth")}>
                Create your workspace <ArrowRight size={14} />
              </button>
            </div>
          )}
          {loadError && (
            <div role="alert" className="error-banner">
              {loadError}
              <button onClick={() => user && loadPortfolio(user)}>Retry</button>
            </div>
          )}
          <div className="filterbar">
            <div className="filter-tabs">
              {[
                "All projects",
                "Forest restoration",
                "Blue carbon",
                "Biodiversity",
              ].map((f) => (
                <button
                  key={f}
                  className={filter === f ? "active" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search projects and sites"
                placeholder="Search projects or sites…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
          {loading ? (
            <div className="loading-state" role="status">
              Loading your landscapes…
            </div>
          ) : (
            <>
              <section className="stats-grid" aria-label="Portfolio summary">
                <Stat
                  icon={FolderOpen}
                  label="Active projects"
                  value={String(visibleProjects.length).padStart(2, "0")}
                  note={`${sites.length} geographical sites`}
                />
                <Stat
                  icon={Trees}
                  label="Land under care"
                  value={number(sites.reduce((sum, s) => sum + s.area_ha, 0))}
                  unit="ha"
                  note="Area within mapped boundaries"
                />
                <Stat
                  icon={Leaf}
                  label="Carbon stored"
                  value={monitored.length ? number(carbon) : "—"}
                  unit="tCO₂e"
                  note={`${monitored.length} sites with observations`}
                  accent
                />
                <Stat
                  icon={Sprout}
                  label="Biodiversity index"
                  value={diversity === null ? "—" : number(diversity, 1)}
                  unit="/100"
                  note="Average across monitored sites"
                />
              </section>
              {view === "Overview" || view === "Map explorer" ? (
                <PortfolioMap
                  view={view}
                  projects={projects}
                  sites={sites}
                  selected={selectedSite?.id}
                  onAddSite={() => {
                    setProjectId(undefined);
                    setModal("site");
                  }}
                  onSelect={setSelectedSite}
                />
              ) : null}
              {view === "Overview" || view === "Analytics" ? (
                <PortfolioAnalytics
                  period={period}
                  setPeriod={setPeriod}
                  monitoredCount={monitored.length}
                  carbon={carbon}
                  diversity={diversity}
                  rows={rows}
                  authenticated={!!user}
                />
              ) : null}
              {view === "Analytics" && (
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <h2>Biodiversity over time</h2>
                      <p>Mean monthly index · monitored sites</p>
                    </div>
                    <button
                      className="button secondary"
                      disabled={!monitored.length}
                      onClick={() => exportSites(sites)}
                    >
                      <ArrowDownToLine size={15} /> Export data
                    </button>
                  </div>
                  <TrendChart rows={rows} metric="biodiversity" />
                </section>
              )}
              {view !== "Map explorer" && view !== "Analytics" && (
                <ProjectGrid
                  visibleProjects={visibleProjects}
                  hasProjects={!!projects.length}
                  view={view}
                  onViewAll={() => setView("Projects")}
                  onAddSite={(id) => {
                    setProjectId(id);
                    setModal("site");
                  }}
                  onSelectSite={setSelectedSite}
                  onReset={() =>
                    projects.length
                      ? (setQuery(""), setFilter("All projects"))
                      : setModal("project")
                  }
                />
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              <Leaf size={13} /> Built for a planet worth restoring.
            </span>
            <span>
              Darukaa Earth <span>·</span>{" "}
              {user ? "Your private portfolio" : "Sample data · Jan–Dec 2025"}
            </span>
          </footer>
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          title={
            modal === "project"
              ? "Create a new project"
              : modal === "site"
                ? "Map a new site"
                : modal === "auth"
                  ? "Welcome to Darukaa Earth"
                  : "A clearer view of your impact"
          }
          close={() => setModal(null)}
          wide={modal === "site"}
        >
          {modal === "project" ? (
            <ProjectForm save={createProject} />
          ) : modal === "site" ? (
            <SiteForm
              projects={projects}
              defaultProject={projectId}
              save={createSite}
            />
          ) : modal === "auth" ? (
            <AuthForm complete={loadPortfolio} />
          ) : (
            <div className="help-content">
              <h3>Start with a project</h3>
              <p>
                Create a project, choose its restoration focus, then add sites
                by drawing their boundaries on the map. Each site can be opened
                from the map, list, or project card.
              </p>
              <h3>Understand the measurements</h3>
              <p>
                Carbon is cumulative storage in tonnes of CO₂ equivalent.
                Biodiversity is an illustrative 0–100 index. Canopy is the
                percentage of land covered by tree canopy. Portfolio indices are
                simple averages of sites with observations; sites without
                observations are excluded.
              </p>
              <h3>Sample data and your account</h3>
              <p>
                The demo uses synthetic monthly data for 2025 and approximate
                boundaries in India. It is not verified carbon accounting. Demo
                edits last until refresh. Sign in or register to store your own
                projects securely. New sites have no observations until a
                dataset is imported using the documented administrator import
                command.
              </p>
              <h3>Map controls</h3>
              <p>
                Drag to pan, use +/− to zoom, and select numbered site markers
                to inspect analytics. Satellite imagery requires a configured
                Mapbox token. OpenStreetMap tiles provide a fallback basemap.
              </p>
            </div>
          )}
        </Modal>
      )}
      {selectedSite && (
        <Modal
          title={selectedSite.name}
          close={() => setSelectedSite(null)}
          wide
        >
          <SiteDetails
            site={selectedSite}
            projectName={
              projects.find((p) => p.id === selectedSite.project_id)?.name || ""
            }
          />
        </Modal>
      )}
    </div>
  );
}

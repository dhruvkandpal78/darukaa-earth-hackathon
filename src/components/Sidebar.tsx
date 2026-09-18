/** Full navigation stays visible on desktop and opens in an accessible drawer on smaller screens. */
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleHelp,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  Leaf,
  LogOut,
  Sprout,
  X,
} from "lucide-react";
import type { User } from "../types";
interface Props {
  user: User | null;
  view: string;
  setView: (view: string) => void;
  projectCount: number;
  onHelp: () => void;
  onAccount: () => void;
}
/** Both layouts share identical labels and actions, so zoom never removes a feature. */
function Navigation({
  user,
  view,
  setView,
  projectCount,
  onHelp,
  onAccount,
}: Props) {
  return (
    <>
      <button
        className="brand"
        onClick={() => setView("Overview")}
        aria-label="Darukaa Earth home"
      >
        <span className="brand-mark">
          <Leaf size={25} />
        </span>
        <span>
          darukaa<span className="brand-earth">.earth</span>
        </span>
      </button>
      <div className="workspace-label">NATURE INTELLIGENCE</div>
      <div className="workspace-picker">
        <div className="workspace-avatar">D</div>
        <div>
          <strong>Darukaa workspace</strong>
          <small>{user ? "Private portfolio" : "Sample portfolio"}</small>
        </div>
      </div>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="Workspace navigation">
        {[
          { name: "Overview", icon: LayoutDashboard },
          { name: "Projects", icon: FolderOpen },
          { name: "Map explorer", icon: Globe2 },
          { name: "Analytics", icon: Sprout },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            aria-current={view === name ? "page" : undefined}
            className={view === name ? "active" : ""}
            onClick={() => setView(name)}
          >
            <Icon size={20} />
            <span>{name}</span>
            {name === "Projects" && (
              <span className="nav-count">{projectCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="nature-note">
          <div className="orbit-art">
            <Sprout size={34} />
          </div>
          <strong>
            Small actions.
            <br />
            Living landscapes.
          </strong>
          <p>
            A clearer picture of your
            <br />
            impact on the planet.
          </p>
          <span>
            GROW WITH PURPOSE <ArrowUpRight size={13} />
          </span>
        </div>
        <button className="help-button" onClick={onHelp}>
          <CircleHelp size={18} /> Help & methodology
        </button>
        <button className="profile" onClick={onAccount}>
          <span className="avatar">
            {user ? user.name.slice(0, 2).toUpperCase() : "DE"}
          </span>
          <span>
            <strong>{user?.name || "Explore Darukaa"}</strong>
            <small>
              {user ? "Sign out of workspace" : "Sign in to save your work"}
            </small>
          </span>
          {user ? <LogOut size={15} /> : <ArrowRight size={15} />}
        </button>
      </div>
    </>
  );
}
/** Native dialog behavior supplies focus trapping, Escape support, and focus restoration. */
export default function Sidebar({
  open,
  close,
  ...props
}: Props & { open: boolean; close: () => void }) {
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) drawer.current?.showModal();
    else drawer.current?.close();
  }, [open]);
  return (
    <>
      <aside className="sidebar">
        <Navigation {...props} />
      </aside>
      <dialog
        id="workspace-navigation"
        className="nav-drawer"
        ref={drawer}
        onCancel={close}
        aria-label="Workspace menu"
      >
        <button
          className="drawer-close icon-button"
          aria-label="Close navigation"
          onClick={close}
        >
          <X size={21} />
        </button>
        <Navigation
          {...props}
          setView={(view) => {
            props.setView(view);
            close();
          }}
          onHelp={() => {
            close();
            props.onHelp();
          }}
          onAccount={() => {
            close();
            props.onAccount();
          }}
        />
      </dialog>
    </>
  );
}

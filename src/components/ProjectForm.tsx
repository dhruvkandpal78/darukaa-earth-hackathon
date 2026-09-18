/** Collects project details and lets the parent choose real or sample storage. */
import { useState, type FormEvent } from "react";
import type { NewProject } from "../types";
/** Keep entered values visible when a request fails so users never lose their work. */
export default function ProjectForm({
  save,
}: {
  save: (data: NewProject) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await save({
        name: String(data.get("name")).trim(),
        region: String(data.get("region")).trim(),
        category: String(data.get("category")),
        description: String(data.get("description")).trim(),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <p className="muted">
        Every restoration journey starts with a place. Give yours a home.
      </p>
      <label>
        Project name
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          placeholder="e.g. Western Ghats Rewilding"
          autoFocus
        />
      </label>
      <div className="form-grid">
        <label>
          Region
          <input
            name="region"
            required
            minLength={2}
            maxLength={120}
            placeholder="State, country"
          />
        </label>
        <label>
          Project focus
          <select name="category">
            <option>Forest restoration</option>
            <option>Blue carbon</option>
            <option>Biodiversity</option>
          </select>
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          maxLength={2000}
          rows={3}
          placeholder="What will this project restore or protect?"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Creating project…" : "Create project"}
      </button>
    </form>
  );
}

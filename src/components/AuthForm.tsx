/** Registration and login connect to the Python API; sample access never uses fake credentials. */
import { useState, type FormEvent } from "react";
import { request, setToken } from "../lib/api";
import type { User } from "../types";
/** A shared form keeps password guidance and failure handling consistent. */
export default function AuthForm({
  complete,
}: {
  complete: (user: User) => void;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await request<{ token: string; user: User }>(
        `/auth/${register ? "register" : "login"}`,
        {
          email: form.get("email"),
          password: form.get("password"),
          ...(register ? { name: form.get("name") } : {}),
        },
      );
      setToken(result.token);
      complete(result.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="segmented">
        <button
          type="button"
          className={!register ? "active" : ""}
          onClick={() => {
            setRegister(false);
            setError("");
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={register ? "active" : ""}
          onClick={() => {
            setRegister(true);
            setError("");
          }}
        >
          Create account
        </button>
      </div>
      <p className="muted">
        Your projects, connected. Sign in to securely save your portfolio.
      </p>
      {register && (
        <label>
          Your name
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
      )}
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 12 : 1}
          maxLength={128}
        />
        {register && <small>Use at least 12 characters.</small>}
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy
          ? "Connecting…"
          : register
            ? "Create your account"
            : "Sign in to your workspace"}
      </button>
    </form>
  );
}

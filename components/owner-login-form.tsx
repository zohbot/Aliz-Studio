"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";

type OwnerLoginFormProps = {
  demoEmail: string;
  demoPassword: string;
  showDemoCredentials: boolean;
};

export function OwnerLoginForm({ demoEmail, demoPassword, showDemoCredentials }: OwnerLoginFormProps) {
  const [email, setEmail] = useState(showDemoCredentials ? demoEmail : "");
  const [password, setPassword] = useState(showDemoCredentials ? demoPassword : "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/owner/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error || "Could not sign in.");
      return;
    }

    window.location.assign(payload.redirectTo || "/owner/dashboard");
  }

  return (
    <form className="owner-login-card" onSubmit={handleSubmit}>
      <div className="owner-login-card__icon" aria-hidden="true">
        <LockKeyhole size={22} />
      </div>
      <div>
        <p className="section-kicker">Owner access</p>
        <h1>Appointment command center.</h1>
        <p>
          Sign in with configured owner credentials to review bookings, deposit tracking, and
          customer request workflow.
        </p>
      </div>

      <label>
        Email
        <input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label>
        Password
        <input
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-action primary-action--wide" disabled={isSubmitting} type="submit">
        <LogIn size={18} />
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      {showDemoCredentials ? (
        <div className="demo-credentials" aria-label="Demo owner credentials">
          <span>Demo email</span>
          <strong>{demoEmail}</strong>
          <span>Demo password</span>
          <strong>{demoPassword}</strong>
        </div>
      ) : null}
    </form>
  );
}

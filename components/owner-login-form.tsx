"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
      <div className="owner-login-card__brand">
        <Image
          alt="Aliz Studio"
          height={70}
          priority
          src="/brand/aliz-studio-logo-dark.png"
          width={210}
        />
      </div>
      <div>
        <p className="section-kicker">Owner access</p>
        <h1>Appointment command center.</h1>
        <p>
          Sign in with configured owner credentials to review bookings, deposit tracking, and
          customer request workflow.
        </p>
      </div>

      <div className="owner-login-field">
        <label htmlFor="owner-email">Email</label>
        <input
          autoComplete="email"
          id="owner-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="owner-login-field">
        <label htmlFor="owner-password">Password</label>
        <span className="password-field">
          <input
            autoComplete="current-password"
            id="owner-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type={isPasswordVisible ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="password-toggle"
            onClick={() => setIsPasswordVisible((current) => !current)}
            type="button"
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </div>

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

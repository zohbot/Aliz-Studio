"use client";

import { LogOut } from "lucide-react";

type OwnerSessionActionsProps = {
  ownerName: string;
};

export function OwnerSessionActions({ ownerName }: OwnerSessionActionsProps) {
  async function logout() {
    await fetch("/api/owner/auth/logout", {
      method: "POST"
    });
    window.location.assign("/owner/login?loggedOut=1");
  }

  return (
    <aside className="owner-session-panel" aria-label="Owner session">
      <span>Signed in</span>
      <strong>{ownerName}</strong>
      <button className="primary-action owner-session-panel__logout" onClick={logout} type="button">
        <LogOut size={17} />
        Log out
      </button>
    </aside>
  );
}

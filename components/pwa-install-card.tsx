"use client";

import { useEffect, useState } from "react";
import { Download, PlusCircle, Share2, X } from "lucide-react";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

const dismissedStorageKey = "aliz-install-cta-dismissed";

function isIosLikePlatform() {
  const navigatorWithTouch = navigator as Navigator & { standalone?: boolean; maxTouchPoints?: number };

  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && Number(navigatorWithTouch.maxTouchPoints) > 1)
  );
}

function isStandaloneDisplayMode() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function PwaInstallCard() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsIos(isIosLikePlatform());
      updateStandaloneState();
      setIsDismissed(window.localStorage.getItem(dismissedStorageKey) === "true");
    });
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandaloneState = () => setIsStandalone(isStandaloneDisplayMode());
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      window.localStorage.setItem(dismissedStorageKey, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    displayModeQuery.addEventListener("change", updateStandaloneState);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      displayModeQuery.removeEventListener("change", updateStandaloneState);
    };
  }, []);

  async function handleInstallClick() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "dismissed") {
      window.localStorage.setItem(dismissedStorageKey, "true");
      setIsDismissed(true);
    }
  }

  function handleDismiss() {
    window.localStorage.setItem(dismissedStorageKey, "true");
    setIsDismissed(true);
  }

  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <section className="pwa-install-card" aria-label="Install Aliz Studio app">
      <div className="pwa-install-card__icon" aria-hidden="true">
        <Download size={22} />
      </div>
      <div className="pwa-install-card__copy">
        <p className="section-kicker">Install app</p>
        <h2>Keep Aliz Studio one tap away.</h2>
        <p>
          Add the booking demo to your home screen for quicker service browsing and mock deposit
          testing. No real payments or notifications are enabled.
        </p>

        {isIos ? (
          <ol className="pwa-install-card__steps">
            <li>
              <Share2 size={16} />
              Tap the browser Share button.
            </li>
            <li>
              <PlusCircle size={16} />
              Choose Add to Home Screen.
            </li>
          </ol>
        ) : (
          <p className="pwa-install-card__hint">
            Chrome, Edge, and Android browsers may show a direct install prompt when the app is eligible.
          </p>
        )}
      </div>

      <div className="pwa-install-card__actions">
        {installPrompt ? (
          <button className="primary-action" onClick={handleInstallClick} type="button">
            <Download size={17} />
            Install Aliz Studio app
          </button>
        ) : null}
        <button className="secondary-action pwa-install-card__dismiss" onClick={handleDismiss} type="button">
          <X size={16} />
          Hide install tips
        </button>
      </div>
    </section>
  );
}

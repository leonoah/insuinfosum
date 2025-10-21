import { useCallback } from "react";
import { Accessibility } from "lucide-react";

declare global {
  interface Window {
    openAccessibilityWidget?: () => void;
    accessibilityWidget?: {
      open?: () => void;
    };
  }
}

export const AccessibilityButton = () => {
  const handleClick = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (typeof window.openAccessibilityWidget === "function") {
      window.openAccessibilityWidget();
      return;
    }

    if (typeof window.accessibilityWidget?.open === "function") {
      window.accessibilityWidget.open();
    }
  }, []);

  return (
    <button
      type="button"
      aria-label="אפשרויות נגישות"
      className="fixed bottom-4 left-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      onClick={handleClick}
    >
      <Accessibility className="h-6 w-6" />
      <span className="sr-only">אפשרויות נגישות</span>
    </button>
  );
};

export default AccessibilityButton;

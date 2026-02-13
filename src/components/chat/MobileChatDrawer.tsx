import React from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}

/**
 * Mobile-optimized chat drawer component
 * Uses vaul for smooth drawer animations
 * Handles keyboard appearance and safe area insets
 */
export function MobileChatDrawer({
  open,
  onOpenChange,
  children,
  title = "Chat",
}: MobileChatDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "max-h-[90vh] rounded-t-xl bg-white",
            "flex flex-col",
            // Safe area insets for notched devices
            "pb-[env(safe-area-inset-bottom)]"
          )}
        >
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-4 mb-2" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/**
 * Hook to handle keyboard appearance on mobile
 * Adjusts viewport when keyboard is shown
 */
export function useKeyboardAdjustment() {
  React.useEffect(() => {
    const handleResize = () => {
      // Detect keyboard appearance by viewport height change
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      
      if (viewportHeight < windowHeight) {
        // Keyboard is visible
        document.documentElement.style.setProperty(
          "--keyboard-height",
          `${windowHeight - viewportHeight}px`
        );
      } else {
        // Keyboard is hidden
        document.documentElement.style.setProperty("--keyboard-height", "0px");
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);
}

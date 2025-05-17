
// This file is maintained for backward compatibility
// The actual Toaster component is now imported directly from sonner in main.tsx
import { toast, Toaster as SonnerToaster } from "sonner";

export { toast };

export function Toaster() {
  return <SonnerToaster position="bottom-right" richColors />;
}

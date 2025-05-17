
// This file is kept for backward compatibility
// The actual Toaster component is now imported directly from sonner in main.tsx
import { toast } from "sonner";

export { toast };

export function Toaster() {
  // This is now just a placeholder as we're using the sonner Toaster in main.tsx
  return null;
}

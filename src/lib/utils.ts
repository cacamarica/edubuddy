import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validateStudentId = (id: any): string | null => {
  if (typeof id === 'string' && id.trim() !== '') {
    return id;
  }
  console.error('Invalid studentId:', id);
  return null;
};

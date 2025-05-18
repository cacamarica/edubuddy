/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />

// Define Deno namespace for TypeScript
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }
  
  export const env: Env;
}

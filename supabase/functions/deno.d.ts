// Type declarations for Deno environment

// Allow importing from Deno modules with .ts extension
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export interface ConnInfo {
    readonly localAddr: Deno.Addr;
    readonly remoteAddr: Deno.Addr;
  }
  
  export type Handler = (
    request: Request,
    connInfo: ConnInfo,
  ) => Response | Promise<Response>;
  
  export interface ServeInit {
    port?: number;
    hostname?: string;
    handler: Handler;
    onListen?: (params: { hostname: string; port: number }) => void;
    signal?: AbortSignal;
  }
  
  export function serve(handler: Handler, options?: Partial<ServeInit>): never;
  export function serve(options: ServeInit): never;
}

// Declare the Deno namespace
declare namespace Deno {
  export interface Addr {
    transport: "tcp" | "udp";
    hostname: string;
    port: number;
  }
  
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }
  
  export const env: Env;
}

// Support for Supabase client
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClient {
    from(table: string): any;
    auth: any;
    storage: any;
    rpc(fn: string, params?: any): any;
    [key: string]: any;
  }
  
  export function createClient(url: string, key: string, options?: any): SupabaseClient;
}

// Support for xhr module
declare module "https://deno.land/x/xhr@0.1.0/mod.ts" {
  // No exports needed, this is imported for side effects
} 
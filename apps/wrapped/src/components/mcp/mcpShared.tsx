import { useState, type ReactNode } from 'react';

export const MCP_ENDPOINT = 'https://mcp.bundestag-wrapped.de/mcp';

export const docLink = 'text-pink-400 hover:text-pink-300 underline underline-offset-2';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-white/40 border-b border-white/10 pb-3 mb-6">
      {children}
    </h2>
  );
}

export function ToolChip({ name }: { name: string }) {
  return (
    <span className="font-mono text-xs text-white/80 bg-white/5 border border-white/10 rounded-md px-2 py-1">
      {name}
    </span>
  );
}

export function EndpointBar() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(MCP_ENDPOINT).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-mono overflow-x-auto flex items-center">
        {MCP_ENDPOINT}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-white/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400"
        aria-label="Endpoint-URL kopieren"
      >
        {copied ? 'Kopiert ✓' : 'Kopieren'}
      </button>
    </div>
  );
}

export const CONNECT_INTRO =
  'Der Server läuft öffentlich, spricht Streamable HTTP und braucht keine Anmeldung. Überall dieselbe URL eintragen:';

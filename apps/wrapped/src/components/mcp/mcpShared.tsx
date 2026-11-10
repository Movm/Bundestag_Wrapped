import { useState, type ReactNode } from 'react';

export const MCP_ENDPOINT = 'https://mcp.bundestag-wrapped.de/mcp';

export const docLink = 'text-on-accent hover:text-on-accent underline underline-offset-2';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-on-muted border-b border-track pb-3 mb-6">
      {children}
    </h2>
  );
}

export function ToolChip({ name }: { name: string }) {
  return (
    <span className="font-mono text-xs text-on bg-wr-card border border-track rounded-md px-2 py-1">
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
      <code className="flex-1 bg-wr-ink border border-track rounded-xl px-4 py-3 text-sm text-on font-mono overflow-x-auto flex items-center">
        {MCP_ENDPOINT}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 px-4 rounded-xl border border-track bg-wr-card hover:bg-bg-elevated text-sm font-medium text-on transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400"
        aria-label="Endpoint-URL kopieren"
      >
        {copied ? 'Kopiert ✓' : 'Kopieren'}
      </button>
    </div>
  );
}

export const CONNECT_INTRO =
  'Der Server läuft öffentlich, spricht Streamable HTTP und braucht keine Anmeldung. Überall dieselbe URL eintragen:';

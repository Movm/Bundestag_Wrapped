import type { KeyboardEvent, ReactNode } from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  controls?: string;
  id?: string;
}

function navigateTabs(event: KeyboardEvent<HTMLButtonElement>) {
  const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
  const index = tabs.indexOf(event.currentTarget);
  const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
    : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
    : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
  if (next < 0) return;
  event.preventDefault();
  tabs[next].focus();
  tabs[next].click();
}

export function TabButton({ active, onClick, children, controls, id }: TabButtonProps) {
  return (
    <button type="button" role="tab" id={id} tabIndex={active ? 0 : -1}
      aria-selected={active} aria-controls={controls} onClick={onClick} onKeyDown={navigateTabs}
      className={`min-h-11 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-pink-700 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>
      {children}
    </button>
  );
}

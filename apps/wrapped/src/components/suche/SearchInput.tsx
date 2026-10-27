import { useEffect, useState, type InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onQueryChange: (query: string) => void;
}
/** Keep keystrokes local. Router navigation and result rendering happen after typing pauses. */
export function SearchInput({ value, onQueryChange, ...props }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  if (value !== previousValue) { setPreviousValue(value); setDraft(value); }
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onQueryChange(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, value, onQueryChange]);
  return <input {...props} value={draft} onChange={event => setDraft(event.target.value)} />;
}

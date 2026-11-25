'use dom';

// Placeholder: Task 5 replaces this with the real DOM component.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/index.css';
import App from '@/App';

const queryClient = new QueryClient();

export default function WrappedDom(_props: { dom?: import('expo/dom').DOMProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

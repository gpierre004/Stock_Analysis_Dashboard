// src/App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio'; // Import the Portfolio component

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route path="/" exact component={Dashboard} />
          <Route path="/portfolio" component={Portfolio} /> {/* Add the new route */}
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
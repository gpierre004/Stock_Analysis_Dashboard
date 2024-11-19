import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/Dashboard';
import Portfolio from './components/Portfolio';
import { Watchlist } from './components/Watchlist';
import TransactionForm from './components/TransactionForm';
import { 
  LayoutGrid, 
  Briefcase, 
  Eye, 
  FileSpreadsheet 
} from 'lucide-react';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-800 text-white p-4">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-center">Stock Analysis</h1>
            </div>
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/" 
                    className="flex items-center p-2 hover:bg-gray-700 rounded transition duration-200"
                  >
                    <LayoutGrid className="mr-3" size={20} />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/portfolio" 
                    className="flex items-center p-2 hover:bg-gray-700 rounded transition duration-200"
                  >
                    <Briefcase className="mr-3" size={20} />
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/watchlist" 
                    className="flex items-center p-2 hover:bg-gray-700 rounded transition duration-200"
                  >
                    <Eye className="mr-3" size={20} />
                    Watchlist
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/transactions" 
                    className="flex items-center p-2 hover:bg-gray-700 rounded transition duration-200"
                  >
                    <FileSpreadsheet className="mr-3" size={20} />
                    Transactions
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/transactions" element={<TransactionForm />} />
            </Routes>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;

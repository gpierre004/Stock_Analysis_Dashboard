import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { PlusCircle, UploadCloud, Download } from 'lucide-react';

interface TransactionEntry {
  ticker: string;
  quantity: number;
  purchase_price: number;
  type: 'BUY' | 'SELL';
  purchase_date: string;
  portfolio_id: number;
  comment?: string;
}

interface RecentTransaction extends TransactionEntry {
  purchase_id: number;
}

export const TransactionForm: React.FC = () => {
  const [portfolioId, setPortfolioId] = useState<number>(1); // Default portfolio ID
  const [singleTransaction, setSingleTransaction] = useState<TransactionEntry>({
    ticker: '',
    quantity: 0,
    purchase_price: 0,
    type: 'BUY',
    purchase_date: new Date().toISOString().split('T')[0],
    portfolio_id: portfolioId,
    comment: ''
  });

  const [bulkTransactions, setBulkTransactions] = useState<TransactionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    fetchRecentTransactions();
  }, []); // Only fetch on component mount

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/transactions/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch recent transactions');
      }
      const data = await response.json();
      setRecentTransactions(data);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  };

  const handleSingleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSingleTransaction(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'purchase_price' ? Number(value) : value,
      portfolio_id: portfolioId
    }));
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/transactions/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transaction_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('portfolio_id', portfolioId.toString());

    setIsLoading(true);
    setError(null);

    fetch('http://localhost:5000/api/transactions/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to upload transactions');
      }
      return response.json();
    })
    .then(result => {
      alert(`${result.count || 0} transactions uploaded successfully`);
      setBulkTransactions([]);
      fetchRecentTransactions(); // Refresh recent transactions
    })
    .catch(error => {
      console.error('Error uploading transactions:', error);
      setError(error.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const submitSingleTransaction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...singleTransaction,
          portfolio_id: portfolioId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit transaction');
      }

      const result = await response.json();
      alert('Transaction added successfully');
      
      // Reset form
      setSingleTransaction({
        ticker: '',
        quantity: 0,
        purchase_price: 0,
        type: 'BUY',
        purchase_date: new Date().toISOString().split('T')[0],
        portfolio_id: portfolioId,
        comment: ''
      });

      // Refresh recent transactions
      fetchRecentTransactions();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaction Entry</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Portfolio ID</label>
          <input 
            type="number" 
            value={portfolioId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setPortfolioId(id);
              setSingleTransaction(prev => ({...prev, portfolio_id: id}));
            }}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter Portfolio ID"
          />
        </div>

        <div className="flex mb-4 border-b">
          <button 
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 ${activeTab === 'single' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Single Transaction
          </button>
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 ${activeTab === 'bulk' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Bulk Upload
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}

        {activeTab === 'single' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Ticker</label>
              <input 
                type="text" 
                name="ticker"
                value={singleTransaction.ticker}
                onChange={handleSingleTransactionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter stock ticker"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Transaction Type</label>
              <select 
                name="type"
                value={singleTransaction.type}
                onChange={handleSingleTransactionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">Sell</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
              <input 
                type="number" 
                name="quantity"
                value={singleTransaction.quantity}
                onChange={handleSingleTransactionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Number of shares"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Price per Share</label>
              <input 
                type="number" 
                name="purchase_price"
                step="0.01"
                value={singleTransaction.purchase_price}
                onChange={handleSingleTransactionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Price per share"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Transaction Date</label>
              <input 
                type="date" 
                name="purchase_date"
                value={singleTransaction.purchase_date}
                onChange={handleSingleTransactionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Comment (Optional)</label>
              <textarea 
                name="comment"
                value={singleTransaction.comment}
                onChange={handleSingleTransactionChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Additional notes"
              />
            </div>
            <div className="col-span-2 flex justify-between items-center">
              <button 
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                <Download className="mr-2 w-4 h-4" />
                Download Template
              </button>
              <button 
                onClick={submitSingleTransaction}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isLoading ? 'Submitting...' : 'Add Transaction'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Upload Excel File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                  <UploadCloud className="w-8 h-8" />
                  <span className="mt-2 text-base leading-normal">Select a file</span>
                  <input 
                    type='file' 
                    className="hidden" 
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.purchase_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.purchase_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.portfolio_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.ticker}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${transaction.purchase_price}
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;

import React, { useState } from 'react';
import Papa from 'papaparse';
import { FileUpload, PlusCircle, UploadCloud } from 'lucide-react';

interface TransactionEntry {
  ticker: string;
  quantity: number;
  purchase_price: number;
  type: 'BUY' | 'SELL';
  purchase_date: string;
  portfolio_id: number;
  comment?: string;
}

export const TransactionForm: React.FC = () => {
  const [singleTransaction, setSingleTransaction] = useState<TransactionEntry>({
    ticker: '',
    quantity: 0,
    purchase_price: 0,
    type: 'BUY',
    purchase_date: new Date().toISOString().split('T')[0],
    portfolio_id: 1, // Default portfolio ID, might want to make this dynamic
    comment: ''
  });

  const [bulkTransactions, setBulkTransactions] = useState<TransactionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSingleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSingleTransaction(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'purchase_price' ? Number(value) : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsedTransactions: TransactionEntry[] = results.data.map((row: any) => ({
          ticker: row.ticker || row.symbol,
          quantity: Number(row.quantity),
          purchase_price: Number(row.purchase_price || row.price),
          type: row.type?.toUpperCase() || row.transactionType?.toUpperCase() || 'BUY',
          purchase_date: row.purchase_date || row.transactionDate || new Date().toISOString().split('T')[0],
          portfolio_id: 1, // Default portfolio ID
          comment: row.comment || ''
        })).filter(t => t.ticker && t.quantity && t.purchase_price);

        setBulkTransactions(parsedTransactions);
      },
      error: (error) => {
        setError('Error parsing CSV file');
        console.error(error);
      }
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
        body: JSON.stringify(singleTransaction)
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
        portfolio_id: 1,
        comment: ''
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const submitBulkTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/transactions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkTransactions)
      });

      if (!response.ok) {
        throw new Error('Failed to submit bulk transactions');
      }

      const result = await response.json();
      alert(`${bulkTransactions.length} transactions added successfully`);
      
      // Reset bulk transactions
      setBulkTransactions([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaction Entry</h2>
        
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
                <option value="BUY">Buy</option>
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
            <div className="col-span-2 flex justify-end">
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
              <label className="block text-gray-700 text-sm font-bold mb-2">Upload CSV File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                  <UploadCloud className="w-8 h-8" />
                  <span className="mt-2 text-base leading-normal">Select a file</span>
                  <input 
                    type='file' 
                    className="hidden" 
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {bulkTransactions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Transactions to be Added</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border">Ticker</th>
                        <th className="px-4 py-2 border">Type</th>
                        <th className="px-4 py-2 border">Quantity</th>
                        <th className="px-4 py-2 border">Price</th>
                        <th className="px-4 py-2 border">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkTransactions.map((transaction, index) => (
                        <tr key={index} className="text-center">
                          <td className="px-4 py-2 border">{transaction.ticker}</td>
                          <td className="px-4 py-2 border">{transaction.type}</td>
                          <td className="px-4 py-2 border">{transaction.quantity}</td>
                          <td className="px-4 py-2 border">${transaction.purchase_price.toFixed(2)}</td>
                          <td className="px-4 py-2 border">{transaction.purchase_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={submitBulkTransactions}
                    disabled={isLoading}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    {isLoading ? 'Submitting...' : `Add ${bulkTransactions.length} Transactions`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;

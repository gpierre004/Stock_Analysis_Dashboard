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

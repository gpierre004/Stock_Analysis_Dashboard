import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { addTransaction, createTransactionTemplate, bulkUploadTransactions } from '../services/transactionService.js';
import path from 'path';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Add this new route for template download
router.get('/template', (req, res) => {
    try {
        const templatePath = createTransactionTemplate();
        res.download(templatePath, 'transaction_template.xlsx');
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Existing route for single transaction
router.post('/', async (req, res) => {
    try {
        const result = await addTransaction(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(400).json({ error: error.message });
    }
});

// New route for bulk upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Process and validate the data
        const transactions = data.map(row => {
            // Check if the required fields exist
            if (!row['Run Date'] || !row['Symbol'] || !row['Action'] || !row['portfolio_id']) {
                console.error('Missing required fields in row:', row);
                throw new Error('Missing required fields in the uploaded data');
            }

            const ticker = row['Symbol'].trim();
            
            // Convert action to proper ENUM value
            const type = row['Action'].toUpperCase();
            if (type !== 'BUY' && type !== 'SELL') {
                throw new Error(`Invalid transaction type: ${type}. Must be either BUY or SELL.`);
            }

            return {
                purchase_date: new Date(row['Run Date']),
                ticker,
                type,
                quantity: Math.abs(parseFloat(row['Quantity']) || 0),
                purchase_price: parseFloat(row['Price']) || 0,
                comment: row['Description'],
                portfolio_id: parseInt(row['portfolio_id'], 10),
                current_price: parseFloat(row['Price']) || 0
            };
        });

        const result = await bulkUploadTransactions(transactions);
        res.json(result);
    } catch (error) {
        console.error('Error processing file upload:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;

import { Transaction } from '../models/index.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createTransactionTemplate() {
    // Define the template headers
    const headers = [
        'Run Date', 'Action', 'Symbol', 'Description', 'Type',
        'Exchange Quantity', 'Exchange Currency', 'Quantity', 'Currency',
        'Price', 'Exchange Rate', 'Commission', 'Fees',
        'Accrued Interest', 'Amount', 'Cash Balance', 'Settlement Date'
    ];

    // Create a worksheet
    const ws = xlsx.utils.aoa_to_sheet([headers]);

    // Create a workbook
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Transactions');

    // Set column widths
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    // Save the template
    const templatePath = path.join(__dirname, '../../public/templates');
    const filePath = path.join(templatePath, 'transaction_template.xlsx');
    
    // Ensure the templates directory exists
    if (!fs.existsSync(templatePath)) {
        fs.mkdirSync(templatePath, { recursive: true });
    }

    xlsx.writeFile(wb, filePath);
    return filePath;
}

export async function addTransaction(transactionData) {
    try {
        const transaction = await Transaction.create(transactionData);
        logger.info(`New transaction added: ${transaction.purchase_id}`);
        return { message: 'Transaction added successfully', transaction };
    } catch (error) {
        logger.error('Error adding transaction:', error);
        throw new Error('Unable to add transaction: ' + error.message);
    }
}

export async function bulkUploadTransactions(transactions) {
    try {
        const createdTransactions = await Transaction.bulkCreate(transactions, {
            validate: true
        });
        
        logger.info(`Bulk upload completed: ${createdTransactions.length} transactions added`);
        return {
            message: `Successfully uploaded ${createdTransactions.length} transactions`,
            transactions: createdTransactions
        };
    } catch (error) {
        logger.error('Error in bulk upload:', error);
        throw new Error('Unable to process bulk upload: ' + error.message);
    }
}

export async function getRecentTransactions(portfolioId, limit = 10) {
    try {
        const transactions = await Transaction.findAll({
            where: { portfolio_id: portfolioId },
            order: [['purchase_date', 'DESC']],
            limit: limit
        });
        
        logger.info(`Retrieved ${transactions.length} recent transactions for portfolio ${portfolioId}`);
        return transactions;
    } catch (error) {
        logger.error('Error fetching recent transactions:', error);
        throw new Error('Unable to fetch recent transactions: ' + error.message);
    }
}

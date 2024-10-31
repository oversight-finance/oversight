export interface CSVRow {
    "Account Type": string;
    "Account Number": string;
    "Transaction Date": string;
    "Cheque Number": string;
    "category": string;
    "merchant": string;
    "CAD$": string;
    "USD$": string;
}

export interface ParsedData {
    accountType: string;
    accountNumber: string;
    date: Date;
    chequeNumber: string;
    category: string;
    merchant: string;
    amount: number;
    amountUSD: number;
    isRecurring?: boolean;
    recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
    recurringEndDate?: Date | null;
}

export interface NetWorthDataPoint {
    date: Date;
    netWorth: number;
}

export const defaultNetWorthData: NetWorthDataPoint[] = [
    { date: new Date("2023-01-12T15:23:00Z"), netWorth: -15000 },
    { date: new Date("2024-01-12T15:23:00Z"), netWorth: -5000 },
    { date: new Date("2024-02-18T09:45:00Z"), netWorth: -2000 },
    { date: new Date("2024-03-14T12:37:00Z"), netWorth: 1000 },
    { date: new Date("2024-04-17T16:52:00Z"), netWorth: 4000 },
    { date: new Date("2024-05-13T11:19:00Z"), netWorth: 3000 },
    { date: new Date("2024-06-16T14:08:00Z"), netWorth: 7000 },
    { date: new Date("2024-06-19T14:08:00Z"), netWorth: 70000 },
];

export const transformCSVToNetWorthData = (csvData: ParsedData[]): NetWorthDataPoint[] => {
    // Sort data by date if your CSV includes dates
    // For this example, we'll create dates based on the array index
    return csvData.map((row, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (csvData.length - index - 1));

        return {
            date: date,
            netWorth: row.amount
        };
    });
}; 
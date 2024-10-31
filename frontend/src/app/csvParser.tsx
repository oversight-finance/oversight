"use client";

import { useState } from "react";
import Papa from "papaparse";
import type { ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { type CSVRow, type ParsedData } from "@/utils/dataTransformers";

interface CSVUploaderProps {
  onDataUpdate: (data: ParsedData[]) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onDataUpdate }) => {
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const filtered = results.data.map((row) => ({
          accountType: row["Account Type"],
          accountNumber: row["Account Number"], 
          date: new Date(row["Transaction Date"]),
          chequeNumber: row["Cheque Number"],
          category: row["category"],
          merchant: row["merchant"],
          amount: parseFloat(row["CAD$"]) || 0,
          amountUSD: parseFloat(row["USD$"]) || 0
        }));
        onDataUpdate(filtered);
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
      },
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>CSV File Upload</CardTitle>
      </CardHeader>
      <CardContent>
        <label
          htmlFor="csv-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">CSV files only</p>
          </div>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </CardContent>
    </Card>
  );
};

export default CSVUploader;

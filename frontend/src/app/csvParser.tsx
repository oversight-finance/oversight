"use client"; // Mark this file as a Client Component
//n Next.js 13+ (specifically with the App Router and React Server Components), by default, all components are treated as Server Components. However, components using hooks like useState, useEffect, and others need to be Client Components because those hooks only work in the browser.
import { useState } from "react";
import Papa from "papaparse";
import type { ChangeEvent } from "react";

// Define the type for the parsed CSV data, matching the CSV structure
interface CSVRow {
  "Description 1": string;
  CAD$: string;
}
// Define the type for the parsed CSV data
interface ParsedData {
  description: string;
  amount: string;
}

const CSVUploader: React.FC = () => {
  const [data, setData] = useState<ParsedData[]>([]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Safely access the file

    if (!file) return;

    // Use PapaParse to parse the CSV file
    Papa.parse<CSVRow>(file, {
      header: true, // if CSV file has headers
      skipEmptyLines: true,
      complete: (results) => {
        // Extract only the fields you're interested in (id and amount in this case)
        const filteredData = results.data.map((row) => ({
          description: row["Description 1"],
          amount: row.CAD$,
        }));

        console.log(JSON.stringify(filteredData)); // Filtered CSV data
        setData(filteredData); // Set the filtered data to state
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
      },
    });
  };

  return (
    <div>
      <h2>Upload CSV File</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <h3>Parsed CSV Data:</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre> {/* Display parsed data as JSON */}
    </div>
  );
};

export default CSVUploader;

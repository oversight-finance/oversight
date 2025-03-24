"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import CSVUploader from "../csvParser";
import Networth from "@/components/Networth/Networth";
import TransactionTable from "@/components/TransactionTables/TransactionTable";
import SpendingChart from "@/components/SpendingChart/SpendingChart";
import {
  type ParsedData,
  type NetWorthDataPoint,
  defaultNetWorthData,
} from "@/utils/dataTransformers";
import { AccountsProvider, useAccounts } from "@/contexts/AccountsContext";
import { useAssets } from "@/contexts/AssetsContext";
import { AssetType } from "@/types/Asset";
import { Vehicle, CarPaymentMethod } from "@/types/Vehicle";
import { RealEstate } from "@/types/RealEstate";
import CreateAccount from "@/components/LinkedAccounts/CreateAccount";
import CreateAssetMessage from "@/components/CreateAssetMessage/CreateAssetMessage";
import MonthlyGraph from "@/components/MonthlyGraph/MonthlyGraph";
import { calculateAssetGrowth } from "../assets/[id]/components/utils";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Define the TimeRange type
type TimeRange = "3M" | "6M" | "1Y" | "2Y" | "ALL";

// TimeRangeSelector component
function TimeRangeSelector({
  selectedTimeRange,
  setSelectedTimeRange,
}: {
  selectedTimeRange: TimeRange;
  setSelectedTimeRange: (range: TimeRange) => void;
}) {
  return (
    <div className="flex items-center justify-end mb-2">
      <div className="flex items-center rounded-md border">
        {(["3M", "6M", "1Y", "2Y", "ALL"] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
            className={cn(
              "h-8 rounded-none px-2 text-xs md:px-3 md:text-sm first:rounded-l-md last:rounded-r-md",
              selectedTimeRange === range && "bg-muted font-medium"
            )}
          >
            {range}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { accounts } = useAccounts();
  const { assets } = useAssets();
  const { getUserId } = useAuth();
  const userId = getUserId();
  const [networthData, setNetworthData] = useState<NetWorthDataPoint[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1Y");

  // Get number of months for the selected time range
  const getTimeRangeMonths = (range: TimeRange): number => {
    switch (range) {
      case "3M":
        return 3;
      case "6M":
        return 6;
      case "1Y":
        return 12;
      case "2Y":
        return 24;
      case "ALL":
        return 120; // 10 years should be enough to cover all historical data
    }
  };

  // Calculate networth data from all accounts and assets
  const calculateNetworth = () => {
    // Get all transactions from all accounts
    const allTransactions = accounts.flatMap(
      (account) =>
        account.transactions?.map((transaction) => {
          // Handle different transaction types
          const date = new Date(
            "transaction_date" in transaction
              ? transaction.transaction_date
              : new Date().toISOString()
          );

          const amount = "amount" in transaction ? transaction.amount : 0;

          return { date, amount };
        }) || []
    );

    // Sort transactions by date (descending - newest first)
    const sortedTransactions = allTransactions.sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Determine start and end dates for the data points
    const endDate = new Date();
    let startDate: Date;

    // Set start date based on selected time range
    if (selectedTimeRange === "ALL") {
      // Find the earliest date among transactions and asset purchases
      let earliestDate: Date | null = null;

      // Check transactions
      if (sortedTransactions.length > 0) {
        earliestDate = new Date(
          sortedTransactions[sortedTransactions.length - 1].date
        );
      }

      // Check asset purchase dates
      assets.forEach((asset) => {
        let purchaseDate: Date | null = null;

        if ("make" in asset && "model" in asset) {
          if (asset.purchase_date) {
            purchaseDate = new Date(asset.purchase_date);
          }
        } else if ("property_type" in asset && "address" in asset) {
          if (asset.purchase_date) {
            purchaseDate = new Date(asset.purchase_date);
          }
        } else {
          const genericAsset = asset as { purchase_date?: string };
          if (genericAsset.purchase_date) {
            purchaseDate = new Date(genericAsset.purchase_date);
          }
        }

        if (purchaseDate && (!earliestDate || purchaseDate < earliestDate)) {
          earliestDate = purchaseDate;
        }
      });

      // If we found an earliest date, use it, otherwise default to 10 years ago
      if (earliestDate) {
        startDate = earliestDate;
      } else {
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 10); // Default to 10 years ago if no data
      }
    } else {
      // For specific time ranges, calculate from current date
      startDate = new Date(endDate);
      const monthsToGoBack = getTimeRangeMonths(selectedTimeRange);
      startDate.setMonth(startDate.getMonth() - monthsToGoBack);
    }

    // Ensure startDate is set to the beginning of its month
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Process assets
    const assetsData = assets
      .map((asset) => {
        // Extract asset details based on type
        let purchaseDate: Date | null = null;
        let purchaseValue: number | null = null;
        let growthRate: number = 0;

        // Use proper type checking for Vehicle assets
        if ("make" in asset && "model" in asset) {
          const vehicleAsset = asset as Vehicle;
          if (vehicleAsset.purchase_date && vehicleAsset.purchase_price) {
            purchaseDate = new Date(vehicleAsset.purchase_date);
            purchaseValue = vehicleAsset.purchase_price;
            growthRate =
              vehicleAsset.annual_growth_rate !== undefined
                ? vehicleAsset.annual_growth_rate
                : -15; // Default depreciation rate
          }
        }
        // Use proper type checking for RealEstate assets
        else if ("property_type" in asset && "address" in asset) {
          const realEstateAsset = asset as RealEstate;
          if (realEstateAsset.purchase_date && realEstateAsset.purchase_price) {
            purchaseDate = new Date(realEstateAsset.purchase_date);
            purchaseValue = realEstateAsset.purchase_price;
            growthRate =
              realEstateAsset.annual_growth_rate !== undefined
                ? realEstateAsset.annual_growth_rate
                : 3; // Default appreciation rate
          }
        }
        // Handle other asset types
        else {
          // Use type assertion for generic asset properties
          const genericAsset = asset as {
            purchase_date?: string;
            purchase_price?: number;
            asset_type?: AssetType;
            annual_growth_rate?: number;
          };

          if (genericAsset.purchase_date && genericAsset.purchase_price) {
            purchaseDate = new Date(genericAsset.purchase_date);
            purchaseValue = genericAsset.purchase_price;
            growthRate =
              genericAsset.annual_growth_rate !== undefined
                ? genericAsset.annual_growth_rate
                : 0;
          }
        }

        if (!purchaseDate || !purchaseValue) return null;

        // Get the asset values for all relevant months
        const assetValueData = calculateAssetGrowth(
          purchaseValue,
          growthRate,
          getTimeRangeMonths(selectedTimeRange) + 12, // Add buffer for calculations
          purchaseDate.toISOString()
        );

        return {
          purchaseDate,
          assetValueData,
        };
      })
      .filter(Boolean); // Filter out null values

    // Generate monthly data points (working backwards)
    const monthlyDataPoints: { date: Date; netWorth: number }[] = [];

    // Start with current account balances
    const currentAccountBalance = accounts.reduce(
      (sum, account) => sum + (account.balance || 0),
      0
    );

    // Current date (we'll work backwards from here)
    let currentDate = new Date(endDate);
    currentDate.setDate(1); // Set to first of month
    currentDate.setHours(0, 0, 0, 0);

    // Create function to calculate asset value for a specific date
    // This function now includes assets purchased at any point in the month
    const calculateTotalAssetValueAtDate = (date: Date): number => {
      // Create a date for the last day of the given month
      const lastDayOfMonth = new Date(date);
      lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
      lastDayOfMonth.setDate(0); // Setting to 0 gives us the last day of the previous month

      return assetsData.reduce((sum, assetData) => {
        if (!assetData) return sum;

        // Check if asset purchase date is within or before this month
        // We compare with the last day of the month to include any asset purchased during the month
        if (assetData.purchaseDate > lastDayOfMonth) return sum;

        // Find correct month value
        const dateYearMonth = date.toISOString().split("T")[0].substring(0, 7);
        const matchingValue = assetData.assetValueData.find(
          (mv) => mv.month === dateYearMonth
        );

        if (matchingValue) {
          return sum + matchingValue.value;
        } else {
          // If no exact match, find closest earlier month
          const closestValue = assetData.assetValueData
            .filter((mv) => mv.month <= dateYearMonth)
            .sort((a, b) => b.month.localeCompare(a.month))[0];

          if (closestValue) {
            return sum + closestValue.value;
          }
        }
        return sum;
      }, 0);
    };

    // Reset the month-by-month networth calculation
    // Start with current month's networth
    let currentNetWorth =
      currentAccountBalance + calculateTotalAssetValueAtDate(currentDate);

    // Add the current month data point
    monthlyDataPoints.push({
      date: new Date(currentDate),
      netWorth: currentNetWorth,
    });

    // Work backwards month by month until we reach the start date
    while (true) {
      // Move to previous month
      currentDate.setMonth(currentDate.getMonth() - 1);

      // If we've gone past the start date, we're done
      if (currentDate < startDate) {
        break;
      }

      const currentYearMonth = currentDate
        .toISOString()
        .split("T")[0]
        .substring(0, 7);
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextYearMonth = nextMonth
        .toISOString()
        .split("T")[0]
        .substring(0, 7);

      // Find transactions that happened in the next month (since we're working backwards)
      // These need to be removed from the current networth to get the previous month's networth
      const monthTransactions = sortedTransactions.filter((transaction) => {
        const transactionYearMonth = transaction.date
          .toISOString()
          .split("T")[0]
          .substring(0, 7);
        return transactionYearMonth === nextYearMonth;
      });

      // Calculate the total transaction amount for the next month
      const monthTransactionSum = monthTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      // Remove the next month's transactions from current networth
      currentNetWorth -= monthTransactionSum;

      // Rather than incrementally adjusting asset values, recalculate total asset value at this point
      // This ensures correct handling of assets purchased in the future
      const nextMonthAssetValue = calculateTotalAssetValueAtDate(nextMonth);
      const currentMonthAssetValue =
        calculateTotalAssetValueAtDate(currentDate);

      // When working backwards, we remove the asset value change from next month to current month
      currentNetWorth -= nextMonthAssetValue - currentMonthAssetValue;

      // Add data point for this month
      monthlyDataPoints.push({
        date: new Date(currentDate),
        netWorth: currentNetWorth,
      });
    }

    // Reverse the array to get ascending date order
    monthlyDataPoints.reverse();

    // Sort by date (should already be sorted, but just to be safe)
    monthlyDataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    setNetworthData(monthlyDataPoints);
  };

  // Use useEffect to recalculate networth when accounts, assets, or time range changes
  useEffect(() => {
    calculateNetworth();
  }, [accounts, assets, selectedTimeRange]);

  // No need to filter the data again as we're already calculating it for the specific time range
  const filteredNetworthData = networthData;

  // Check if we should show the empty state message
  const showEmptyState = accounts.length === 0 && assets.length === 0 && userId;

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-4 md:p-6 overflow-hidden w-full">
        <div className="flex flex-col gap-4 md:gap-6 max-w-[1200px] mx-auto">
          {/* Header with title and action buttons */}
          <div className="flex justify-between items-center mb-6 pl-2">
            <h1 className="text-2xl font-bold truncate">Dashboard</h1>
            <div className="flex gap-2 shrink-0">
              <CreateAssetMessage />
            </div>
          </div>

          {showEmptyState ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg border-muted">
              <PlusCircle className="w-12 h-12 mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No Assets or Accounts Added
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add your first asset or account to start tracking your wealth
              </p>
              <div className="flex gap-2">
                <CreateAccount />
                <CreateAssetMessage />
              </div>
            </div>
          ) : (
            <>
              {/* Time range selector above Networth graph */}
              <TimeRangeSelector
                selectedTimeRange={selectedTimeRange}
                setSelectedTimeRange={setSelectedTimeRange}
              />

              {/* First row: Networth graph spanning full width */}
              <div className="w-full">
                <Networth data={filteredNetworthData} />
              </div>

              {/* Second row: Spending categories on left (1/3 width), Income/Spending graphs on right (2/3 width) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Left column: Spending categories (1/3 width) */}
                <div className="w-full min-w-0 lg:col-span-4">
                  <SpendingChart timeRange={selectedTimeRange} />
                </div>

                {/* Right column: Income and Spending graphs stacked (2/3 width) */}
                <div className="w-full min-w-0 space-y-4 lg:col-span-8">
                  <MonthlyGraph type="income" timeRange={selectedTimeRange} />
                  <MonthlyGraph type="spending" timeRange={selectedTimeRange} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

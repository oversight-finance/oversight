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
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Define the TimeRange type
type TimeRange = "1M" | "3M" | "6M" | "1Y" | "2Y" | "ALL";

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
        {(["1M", "3M", "6M", "1Y", "2Y", "ALL"] as TimeRange[]).map((range) => (
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
  const { accounts, getCombinedTransactions, getCombinedBalances } =
    useAccounts();
  const { assets } = useAssets();
  const { getUserId } = useAuth();
  const userId = getUserId();
  const [networthData, setNetworthData] = useState<NetWorthDataPoint[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1Y");

  // Get number of months for the selected time range
  const getTimeRangeMonths = (range: TimeRange): number => {
    switch (range) {
      case "1M":
        return 1;
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

  // Check if we should use weekly data points
  const shouldUseWeeklyPoints = (range: TimeRange): boolean => {
    return range === "1M" || range === "3M";
  };

  // Calculate networth data from all accounts and assets
  const calculateNetworth = () => {
    // Get all transactions from all accounts
    const allTransactions =
      getCombinedTransactions().map((transaction) => {
        // Handle different transaction types
        const date = new Date(
          "transaction_date" in transaction
            ? transaction.transaction_date
            : new Date().toISOString()
        );

        const amount = "amount" in transaction ? transaction.amount : 0;

        return { date, amount };
      }) || [];

    // Determine end date (current date) and start date based on selected time range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let startDate: Date;
    if (selectedTimeRange === "ALL") {
      // Find earliest date among transactions and assets
      startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 10); // Default 10 years back

      // Check transactions for earlier dates
      if (allTransactions.length > 0) {
        const firstTransactionDate = allTransactions[0].date;
        if (firstTransactionDate < startDate) {
          startDate = firstTransactionDate;
        }
      }

      // Check assets for earlier purchase dates
      assets.forEach((asset) => {
        if (asset.purchase_date) {
          const purchaseDate = new Date(asset.purchase_date);
          if (purchaseDate < startDate) {
            startDate = purchaseDate;
          }
        }
      });
    } else {
      // Set start date based on time range selection
      startDate = new Date(endDate);
      const monthsToGoBack = getTimeRangeMonths(selectedTimeRange);
      startDate.setMonth(startDate.getMonth() - monthsToGoBack);

      // For 1-month view, ensure we get the whole month
      if (selectedTimeRange === "1M") {
        startDate.setDate(1); // Set to first day of month
      }
    }

    startDate.setHours(0, 0, 0, 0);

    // 1. Generate asset data points month by month from purchase date
    const assetDataPoints: { assetId: string; date: Date; value: number }[] =
      [];

    // Process each asset to generate monthly data points
    assets.forEach((asset, index) => {
      const assetId = asset.id || `asset-${index}`;
      let purchaseDate: Date | null = null;
      let purchaseValue: number | null = null;
      let growthRate: number = 0;

      // Extract asset details based on type
      if ("make" in asset && "model" in asset) {
        // Vehicle asset
        const vehicleAsset = asset as Vehicle;
        if (vehicleAsset.purchase_date && vehicleAsset.purchase_price) {
          purchaseDate = new Date(vehicleAsset.purchase_date);
          purchaseValue = vehicleAsset.purchase_price;
          growthRate = vehicleAsset.annual_growth_rate ?? -15; // Default -15% depreciation
        }
      } else if ("property_type" in asset && "address" in asset) {
        // Real estate asset
        const realEstateAsset = asset as RealEstate;
        if (realEstateAsset.purchase_date && realEstateAsset.purchase_price) {
          purchaseDate = new Date(realEstateAsset.purchase_date);
          purchaseValue = realEstateAsset.purchase_price;
          growthRate = realEstateAsset.annual_growth_rate ?? 3; // Default 3% appreciation
        }
      } else {
        // Generic asset
        const genericAsset = asset as {
          purchase_date?: string;
          purchase_price?: number;
          annual_growth_rate?: number;
        };

        if (genericAsset.purchase_date && genericAsset.purchase_price) {
          purchaseDate = new Date(genericAsset.purchase_date);
          purchaseValue = genericAsset.purchase_price;
          growthRate = genericAsset.annual_growth_rate ?? 0;
        }
      }

      if (!purchaseDate || !purchaseValue) return;

      // Skip if purchase date is after our end date
      if (purchaseDate > endDate) return;

      // Calculate monthly growth rate
      const monthlyGrowthRate = Math.pow(1 + growthRate / 100, 1 / 12) - 1;

      // Start with purchase date and value
      let currentDate = new Date(purchaseDate);
      currentDate.setHours(0, 0, 0, 0);
      let currentValue = purchaseValue;

      // Add initial data point at purchase date
      assetDataPoints.push({
        assetId,
        date: new Date(currentDate),
        value: currentValue,
      });

      // Generate monthly data points until end date
      while (true) {
        // Move to next month
        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);

        // Stop if we've gone beyond the end date
        if (nextDate > endDate) break;

        // Apply monthly growth
        currentValue = currentValue * (1 + monthlyGrowthRate);

        // Fix floating point imprecision - round extremely small values to 0
        if (Math.abs(currentValue) < 0.01) {
          currentValue = 0;
        }

        // Add data point
        assetDataPoints.push({
          assetId,
          date: new Date(nextDate),
          value: currentValue,
        });

        currentDate = nextDate;
      }
    });

    // 2. Combine all events (transactions and asset value changes) in chronological order
    // First, build an asset value map by date
    const assetValuesByDate = new Map<string, Map<string, number>>();

    assetDataPoints.forEach((point) => {
      const dateStr = point.date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!assetValuesByDate.has(dateStr)) {
        assetValuesByDate.set(dateStr, new Map<string, number>());
      }

      assetValuesByDate.get(dateStr)!.set(point.assetId, point.value);
    });

    console.log("assetDatePoints", assetDataPoints);
    // Create events array combining transactions and dates with asset changes
    type Event = {
      date: Date;
      type: "transaction" | "asset_change";
      transactionAmount?: number;
    };

    const events: Event[] = [];

    // Add transactions as events
    allTransactions.forEach((transaction) => {
      if (transaction.date >= startDate && transaction.date <= endDate) {
        events.push({
          date: new Date(transaction.date),
          type: "transaction",
          transactionAmount: transaction.amount,
        });
      }
    });

    // Add asset value change dates as events
    Array.from(assetValuesByDate.keys()).forEach((dateStr) => {
      const date = new Date(dateStr);
      if (date >= startDate && date <= endDate) {
        events.push({
          date,
          type: "asset_change",
        });
      }
    });

    // Add current date as an event to ensure we have the most recent data point
    events.push({
      date: new Date(endDate),
      type: "asset_change",
    });

    // Sort events by date, most recent first (since we're working backwards)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Combine events on the same day
    const uniqueDateEvents: Event[] = [];
    const processedDates = new Set<string>();

    events.forEach((event) => {
      const dateStr = event.date.toISOString().split("T")[0];
      if (!processedDates.has(dateStr)) {
        uniqueDateEvents.push(event);
        processedDates.add(dateStr);
      }
    });

    // 3. Calculate networth points working backwards from current
    const networthPoints: NetWorthDataPoint[] = [];

    // Get the current total account balance
    const currentAccountsTotal = getCombinedBalances();

    // Calculate current total asset value
    let currentAssetsTotal = 0;

    // For each asset, find its most recent value
    const assetIds = new Set<string>();
    assetDataPoints.forEach((point) => assetIds.add(point.assetId));

    // Create a map to track purchase dates by asset ID
    const assetPurchaseDates = new Map<string, Date>();
    assets.forEach((asset, index) => {
      const assetId = asset.id || `asset-${index}`;
      if (asset.purchase_date) {
        assetPurchaseDates.set(assetId, new Date(asset.purchase_date));
      }
    });

    // Get current asset values (most recent for each asset)
    const currentAssetValues = new Map<string, number>();
    assetIds.forEach((assetId) => {
      // Find the most recent value for this asset
      const assetPoints = assetDataPoints
        .filter((point) => point.assetId === assetId && point.date <= endDate)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (assetPoints.length > 0) {
        const latestValue = assetPoints[0].value;
        currentAssetValues.set(assetId, latestValue);
        currentAssetsTotal += latestValue;
      }
    });

    // Current total networth is sum of accounts and assets
    let runningNetWorth = currentAccountsTotal + currentAssetsTotal;

    // Start with the current networth
    networthPoints.push({
      date: new Date(endDate),
      netWorth: runningNetWorth,
    });

    // Track the assets we've already accounted for (removed value when crossing purchase date)
    const assetsRemoved = new Set<string>();

    // Track the current asset values as we move backwards in time
    const currentAssetValuesAtTime = new Map<string, number>(
      currentAssetValues
    );

    // Work backwards through events
    for (let i = 0; i < uniqueDateEvents.length; i++) {
      const event = uniqueDateEvents[i];
      const dateStr = event.date.toISOString().split("T")[0];
      const eventDate = new Date(dateStr);

      // Skip the most recent date which we've already processed
      if (i === 0) continue;

      if (event.type === "transaction" && event.transactionAmount) {
        // For a transaction, reverse its effect on the running networth
        runningNetWorth -= event.transactionAmount;
      }

      // Update asset values for this specific date
      assetIds.forEach((assetId) => {
        const purchaseDate = assetPurchaseDates.get(assetId);

        // Skip assets that have been removed already
        if (assetsRemoved.has(assetId)) return;

        // If we have crossed before the purchase date, remove the asset entirely
        if (purchaseDate && eventDate < purchaseDate) {
          // Get the current value of this asset and remove it
          const assetValue = currentAssetValuesAtTime.get(assetId) || 0;
          runningNetWorth -= assetValue;
          // Mark as removed so we don't process it again
          assetsRemoved.add(assetId);
          currentAssetValuesAtTime.delete(assetId);
        } else {
          // If we're still after purchase date, find the specific value for this date
          const assetValuesMap = assetValuesByDate.get(dateStr);
          if (assetValuesMap && assetValuesMap.has(assetId)) {
            // Asset has a value for this exact date - update the asset value
            const oldValue = currentAssetValuesAtTime.get(assetId) || 0;
            const newValue = assetValuesMap.get(assetId) || 0;
            // Adjust running networth by the difference
            runningNetWorth -= oldValue - newValue;
            // Update the current value for this asset
            currentAssetValuesAtTime.set(assetId, newValue);
          }
        }
      });

      // Add a data point for this date
      networthPoints.push({
        date: event.date,
        netWorth: runningNetWorth,
      });
    }

    // Reverse array to get chronological order
    networthPoints.reverse();

    let filteredPoints = [...networthPoints];

    // Simple filtering based on time range
    if (selectedTimeRange === "ALL") {
      // For ALL time range, simply remove any initial zero points
      // Find first non-zero point
      const firstNonZeroIndex = filteredPoints.findIndex(
        (point) => Math.abs(point.netWorth) > 0.01
      );
      if (firstNonZeroIndex > 0) {
        filteredPoints = filteredPoints.slice(firstNonZeroIndex);
      }
    } else if (selectedTimeRange === "1M") {
      // Filter for current month if needed
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      filteredPoints = filteredPoints.filter((point) => {
        const pointMonth = point.date.getMonth();
        const pointYear = point.date.getFullYear();
        return pointMonth === currentMonth && pointYear === currentYear;
      });
    }

    // Set the networth data state with our filtered points
    setNetworthData(filteredPoints);
  };

  // Use useEffect to recalculate networth when accounts, assets, or time range changes
  useEffect(() => {
    calculateNetworth();
  }, [accounts, assets, selectedTimeRange]);

  // No filtering needed since the calculation already handles time ranges
  const filteredNetworthData = networthData;

  // Check if we should show the empty state message
  const showEmptyState =
    Object.keys(accounts).length === 0 &&
    Object.keys(assets).length === 0 &&
    userId;

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-4 md:p-6 overflow-hidden w-full">
        <div className="flex flex-col gap-4 md:gap-6 max-w-[1200px] mx-auto">
          {/* Header with title and action buttons */}
          <div className="flex justify-between items-center pl-2">
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
                <Networth
                  data={filteredNetworthData}
                  timeRange={selectedTimeRange}
                />
              </div>

              {/* Second row: Spending categories on left (1/3 width), Income/Spending graphs on right (2/3 width) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Left column: Spending categories (1/3 width) */}
                <div className="w-full min-w-0 lg:col-span-4">
                  <SpendingChart
                    timeRange={
                      selectedTimeRange as
                        | "1M"
                        | "3M"
                        | "6M"
                        | "1Y"
                        | "2Y"
                        | "ALL"
                    }
                  />
                </div>

                {/* Right column: Income and Spending graphs stacked (2/3 width) */}
                <div className="w-full min-w-0 space-y-4 lg:col-span-8">
                  <MonthlyGraph
                    type="income"
                    timeRange={
                      selectedTimeRange as
                        | "1M"
                        | "3M"
                        | "6M"
                        | "1Y"
                        | "2Y"
                        | "ALL"
                    }
                  />
                  <MonthlyGraph
                    type="spending"
                    timeRange={
                      selectedTimeRange as
                        | "1M"
                        | "3M"
                        | "6M"
                        | "1Y"
                        | "2Y"
                        | "ALL"
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

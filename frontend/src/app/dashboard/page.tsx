"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import CSVUploader from "../csvParser";
import Networth from "@/components/Networth/Networth";
import TransactionTable from "@/components/TransactionTable/TransactionTable";
import SpendingChart from "@/components/SpendingChart/SpendingChart";
import {
  type ParsedData,
  type NetWorthDataPoint,
  defaultNetWorthData,
} from "@/utils/dataTransformers";
import { AccountsProvider, useAccounts } from "@/contexts/AccountsContext";
import { useAssets } from "@/contexts/AssetsContext";
import { AssetType } from "@/types/Asset";
import CreateAccount from "@/components/LinkedAccounts/CreateAccount";
import CreateAssetMessage from "@/components/CreateAssetMessage/CreateAssetMessage";
import MonthlyGraph from "@/components/MonthlyGraph/MonthlyGraph";
import {
  calculateAppreciation,
  calculateDepreciation,
} from "../assets/[id]/components/utils";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function Dashboard() {
  const { accounts } = useAccounts();
  const { assets } = useAssets();
  const [networthData, setNetworthData] = useState<NetWorthDataPoint[]>([]);

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

    // Sort transactions by date (ascending)
    const sortedTransactions = allTransactions.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Calculate running total for account-based networth
    let runningTotal = 0;
    let networthPoints: NetWorthDataPoint[] = [];

    if (sortedTransactions.length > 0) {
      networthPoints = sortedTransactions.map((transaction) => {
        runningTotal += transaction.amount;
        return {
          date: transaction.date,
          netWorth: runningTotal,
        };
      });
    } else {
      // If no transactions, create a default data point for today
      networthPoints = [
        {
          date: new Date(),
          netWorth: 0,
        },
      ];
    }

    // Get the date range for the networth graph
    const startDate =
      networthPoints.length > 0
        ? networthPoints[0].date
        : new Date(new Date().setFullYear(new Date().getFullYear() - 1));

    const endDate = new Date();

    // Generate monthly data points between start and end dates
    const monthlyDataPoints: { date: Date; netWorth: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Find the closest transaction data point
      const closestPoint =
        networthPoints.find(
          (point) => point.date.getTime() >= currentDate.getTime()
        ) || networthPoints[networthPoints.length - 1];

      monthlyDataPoints.push({
        date: new Date(currentDate),
        netWorth: closestPoint ? closestPoint.netWorth : 0,
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Add account balances - this ensures we include accounts without transactions
    accounts.forEach((account) => {
      if (account.balance) {
        // Add the current balance to the last monthly data point
        if (monthlyDataPoints.length > 0) {
          const lastPoint = monthlyDataPoints[monthlyDataPoints.length - 1];
          lastPoint.netWorth += account.balance;
        }
      }
    });

    // Add asset values to each monthly data point
    assets.forEach((asset) => {
      // Get purchase date and value based on asset type
      let purchaseDate: Date | null = null;
      let purchaseValue: number | null = null;
      let assetType: AssetType | null = null;
      let depreciationRate: number = 15; // Default depreciation rate for vehicles
      let appreciationRate: number = 3; // Default appreciation rate for real estate

      // Check if it's a Vehicle asset
      if ("make" in asset && "model" in asset) {
        if (asset.purchase_date && asset.purchase_price) {
          purchaseDate = new Date(asset.purchase_date);
          purchaseValue = asset.purchase_price;
          assetType = AssetType.VEHICLE;
        }
      }
      // Check if it's a RealEstate asset
      else if ("property_type" in asset) {
        if (asset.purchase_date && asset.purchase_price) {
          purchaseDate = new Date(asset.purchase_date);
          purchaseValue = asset.purchase_price;
          assetType = AssetType.REAL_ESTATE;
          appreciationRate = 3.5; // Custom rate for real estate
        }
      }

      if (!purchaseDate || !purchaseValue || !assetType) return;

      // Calculate monthly values based on asset type
      let monthlyValues: { month: string; value: number }[] = [];

      if (assetType === AssetType.VEHICLE) {
        // Vehicle depreciation
        monthlyValues = calculateDepreciation(
          purchaseValue,
          depreciationRate,
          60, // 5 years of monthly data
          purchaseDate.toISOString()
        );
      } else if (assetType === AssetType.REAL_ESTATE) {
        // Real estate appreciation
        monthlyValues = calculateAppreciation(
          purchaseValue,
          appreciationRate,
          60, // 5 years of monthly data
          purchaseDate.toISOString()
        );
      } else {
        // For other asset types, use current value
        // Safe check to get current value with fallback to purchase value
        let currentValue = purchaseValue;

        if (
          "current_value" in asset &&
          typeof asset.current_value === "number"
        ) {
          currentValue = asset.current_value;
        }

        monthlyValues = [
          {
            month: new Date().toISOString().split("T")[0].substring(0, 7),
            value: currentValue,
          },
        ];
      }

      // Add asset values to monthly data points
      monthlyDataPoints.forEach((dataPoint) => {
        const dataPointMonth = dataPoint.date
          .toISOString()
          .split("T")[0]
          .substring(0, 7);

        // Skip if data point is before asset purchase
        if (dataPoint.date < purchaseDate) return;

        // Find the closest asset value for this month
        const assetValueForMonth =
          monthlyValues.find((mv) => mv.month === dataPointMonth) ||
          monthlyValues.find((mv) => mv.month <= dataPointMonth) ||
          monthlyValues[0];

        if (assetValueForMonth) {
          dataPoint.netWorth += assetValueForMonth.value;
        } else if (
          "current_value" in asset &&
          typeof asset.current_value === "number"
        ) {
          // Fallback to current value if no calculated value is found
          dataPoint.netWorth += asset.current_value;
        } else if (purchaseValue) {
          // Fallback to purchase value as last resort
          dataPoint.netWorth += purchaseValue;
        }
      });
    });

    // Sort final data points by date
    monthlyDataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    setNetworthData(monthlyDataPoints);
  };

  // Use useEffect to recalculate networth when accounts or assets change
  useEffect(() => {
    calculateNetworth();
  }, [accounts, assets]);

  // Check if we should show the empty state message
  const showEmptyState = accounts.length === 0 && assets.length === 0;

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
              {/* First row: Networth graph spanning full width */}
              <div className="w-full">
                <Networth data={networthData} />
              </div>

              {/* Second row: Spending categories on left (1/3 width), Income/Spending graphs on right (2/3 width) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Left column: Spending categories (1/3 width) */}
                <div className="w-full min-w-0 lg:col-span-4">
                  <SpendingChart />
                </div>

                {/* Right column: Income and Spending graphs stacked (2/3 width) */}
                <div className="w-full min-w-0 space-y-4 lg:col-span-8">
                  <MonthlyGraph type="income" />
                  <MonthlyGraph type="spending" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

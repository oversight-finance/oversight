import {
  Vehicle,
  CarPaymentMethod,
  calculateRemainingLoanBalance,
} from "@/types/Vehicle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { calculateAssetGrowth, formatCurrency, formatDate } from "./utils";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface VehicleDetailsProps {
  asset: Vehicle;
}

export default function VehicleDetails({ asset }: VehicleDetailsProps) {
  // Calculate depreciation over 60 months (5 years)
  // Use negative growth rate for depreciation
  const depreciationRate = asset.annual_growth_rate || -15; // Default to -15% annual depreciation
  const depreciationData = calculateAssetGrowth(
    asset.purchase_price || 0,
    depreciationRate,
    60,
    asset.purchase_date || new Date().toISOString()
  );

  // Get min and max values for the chart
  const maxValue = depreciationData[0]?.value || 0;
  const minValue = depreciationData[depreciationData.length - 1]?.value || 0;

  // Calculate financing progress
  const hasFinancing =
    asset.payment_method !== CarPaymentMethod.CASH &&
    asset.loan_term_months &&
    asset.interest_rate &&
    asset.loan_start_date &&
    asset.loan_amount;

  // Calculate financing progress details
  const calculateFinancingDetails = () => {
    if (
      !hasFinancing ||
      !asset.loan_amount ||
      !asset.loan_term_months ||
      !asset.loan_start_date
    ) {
      return null;
    }

    // Calculate months elapsed since loan start
    const loanStartDate = new Date(asset.loan_start_date);
    const currentDate = new Date();
    const totalMonthsElapsed =
      (currentDate.getFullYear() - loanStartDate.getFullYear()) * 12 +
      (currentDate.getMonth() - loanStartDate.getMonth());

    // Cap the months to the loan term
    const monthsElapsed = Math.min(totalMonthsElapsed, asset.loan_term_months);

    // Calculate standard monthly payment using amortization formula
    // Convert annual interest rate from percentage to decimal (e.g., 6% -> 0.06)
    // Then convert to monthly rate (e.g., 0.06/12 = 0.005)
    const annualRateDecimal = (asset.interest_rate || 0) / 100;
    const monthlyRate = annualRateDecimal / 12;

    // For debugging
    console.log(`Interest Rate: ${asset.interest_rate}%`);
    console.log(`Annual Rate (decimal): ${annualRateDecimal}`);
    console.log(`Monthly Rate: ${monthlyRate}`);

    // Calculate the monthly payment using standard amortization formula
    // P = L[r(1+r)^n]/[(1+r)^n-1] where:
    // P = payment, L = loan amount, r = monthly interest rate, n = number of payments
    const monthlyPayment =
      monthlyRate === 0
        ? asset.loan_amount / asset.loan_term_months // For 0% loans
        : (asset.loan_amount *
            monthlyRate *
            Math.pow(1 + monthlyRate, asset.loan_term_months)) /
          (Math.pow(1 + monthlyRate, asset.loan_term_months) - 1);

    // Total cost of the loan over its full term
    const totalLoanCost = monthlyPayment * asset.loan_term_months;

    // Total interest paid over the life of the loan
    const totalExpectedInterest = totalLoanCost - asset.loan_amount;

    // Now calculate current payment progress using amortization schedule
    let remainingBalance = asset.loan_amount;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let actualMonthsPaid = 0;

    // Build amortization schedule month by month
    for (let i = 0; i < monthsElapsed; i++) {
      if (remainingBalance <= 0) break; // Loan already paid off

      // Calculate interest for this month
      const interestThisMonth = remainingBalance * monthlyRate;

      // Calculate principal for this month
      const principalThisMonth = Math.min(
        monthlyPayment - interestThisMonth,
        remainingBalance
      );

      // Update running totals
      totalInterestPaid += interestThisMonth;
      totalPrincipalPaid += principalThisMonth;
      remainingBalance -= principalThisMonth;
      actualMonthsPaid++;
    }

    // Calculate total paid so far
    const totalPaid = monthlyPayment * actualMonthsPaid;

    // Log values for debugging
    console.log({
      loanAmount: asset.loan_amount,
      interestRatePercent: asset.interest_rate,
      annualRateDecimal,
      monthlyRate,
      totalMonths: asset.loan_term_months,
      monthlyPayment,
      totalLoanCost,
      totalExpectedInterest,
      monthsElapsed,
      actualMonthsPaid,
      totalPaid,
      totalPrincipalPaid,
      totalInterestPaid,
      remainingBalance,
    });

    return {
      monthsPaid: actualMonthsPaid,
      totalPaid,
      principalPaid: totalPrincipalPaid,
      interestPaid: totalInterestPaid,
      remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
      totalMonths: asset.loan_term_months,
      totalExpectedInterest,
      monthlyPayment,
    };
  };

  const financingProgress = calculateFinancingDetails();

  return (
    <div className="space-y-4">
      {/* First row: Vehicle Info and Financial Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Make & Model</p>
                <p className="font-medium">
                  {asset.make} {asset.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">{asset.year || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {asset.vin && (
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-medium">{asset.vin}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{asset.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Price</p>
                <p className="font-medium">
                  {formatCurrency(asset.purchase_price || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="font-medium">
                  {formatCurrency(asset.current_value || 0)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchase Date</p>
              <p className="font-medium">
                {asset.purchase_date ? formatDate(asset.purchase_date) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Value Change</p>
              {asset.purchase_price && asset.current_value ? (
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium ${
                      asset.current_value >= asset.purchase_price
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrency(asset.current_value - asset.purchase_price)}
                  </p>
                  <p
                    className={`text-sm ${
                      asset.current_value >= asset.purchase_price
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    (
                    {(
                      ((asset.current_value - asset.purchase_price) /
                        asset.purchase_price) *
                      100
                    ).toFixed(1)}
                    %)
                  </p>
                </div>
              ) : (
                <p className="font-medium">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">
                {asset.payment_method || "Cash"}
              </p>
            </div>
            {asset.payment_method &&
              asset.payment_method !== CarPaymentMethod.CASH && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Interest Rate
                      </p>
                      <p className="font-medium">
                        {asset.interest_rate
                          ? `${asset.interest_rate}%`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Monthly Payment
                      </p>
                      <p className="font-medium">
                        {financingProgress?.monthlyPayment
                          ? formatCurrency(financingProgress.monthlyPayment)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {asset.payment_method === CarPaymentMethod.LEASE
                        ? "Lease Term"
                        : "Loan Term"}
                    </p>
                    <p className="font-medium">
                      {asset.payment_method === CarPaymentMethod.LEASE
                        ? asset.lease_term_months
                          ? `${asset.lease_term_months} months (${(
                              asset.lease_term_months / 12
                            ).toFixed(1)} years)`
                          : "N/A"
                        : asset.loan_term_months
                        ? `${asset.loan_term_months} months (${(
                            asset.loan_term_months / 12
                          ).toFixed(1)} years)`
                        : "N/A"}
                    </p>
                  </div>
                </>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Second row: Financing Progress and Depreciation Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Financing Progress Card */}
        {financingProgress && (
          <Card className="shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle>Financing Progress</CardTitle>
              <p className="text-sm text-muted-foreground">
                {financingProgress.remainingBalance === 0
                  ? "Loan fully paid off!"
                  : `${financingProgress.monthsPaid} of ${financingProgress.totalMonths} months completed`}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span>{formatCurrency(financingProgress.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Principal Paid:</span>
                  <span>{formatCurrency(financingProgress.principalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interest Paid:</span>
                  <span>{formatCurrency(financingProgress.interestPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Expected Interest:
                  </span>
                  <span>
                    {formatCurrency(financingProgress.totalExpectedInterest)}
                  </span>
                </div>
                {financingProgress.remainingBalance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Remaining Balance:
                    </span>
                    <span>
                      {formatCurrency(financingProgress.remainingBalance)}
                    </span>
                  </div>
                )}
              </div>

              {/* Principal vs Interest breakdown */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Payment Breakdown</p>
                <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        financingProgress.totalPaid > 0
                          ? (financingProgress.principalPaid /
                              financingProgress.totalPaid) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-destructive"
                    style={{
                      width: `${
                        financingProgress.totalPaid > 0
                          ? (financingProgress.interestPaid /
                              financingProgress.totalPaid) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Principal (
                      {financingProgress.totalPaid > 0
                        ? (
                            (financingProgress.principalPaid /
                              financingProgress.totalPaid) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-destructive rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Interest (
                      {financingProgress.totalPaid > 0
                        ? (
                            (financingProgress.interestPaid /
                              financingProgress.totalPaid) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              </div>

              {/* Paid vs Remaining Balance */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Loan Progress</p>
                <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${
                        (asset.loan_amount || 0) > 0
                          ? (financingProgress.principalPaid /
                              (asset.loan_amount || 0)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                  {financingProgress.remainingBalance > 0 && (
                    <div
                      className="h-full bg-black"
                      style={{
                        width: `${
                          (asset.loan_amount || 0) > 0
                            ? (financingProgress.remainingBalance /
                                (asset.loan_amount || 0)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Paid (
                      {(asset.loan_amount || 0) > 0
                        ? (
                            (financingProgress.principalPaid /
                              (asset.loan_amount || 0)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                  {financingProgress.remainingBalance > 0 && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-black rounded-full mr-1"></div>
                      <span className="text-muted-foreground">
                        Remaining (
                        {(asset.loan_amount || 0) > 0
                          ? (
                              (financingProgress.remainingBalance /
                                (asset.loan_amount || 0)) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{formatCurrency(financingProgress.principalPaid)}</span>
                  <span>
                    {formatCurrency(financingProgress.remainingBalance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Depreciation Chart Card */}
        <Card className="flex flex-col shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Projected Value Depreciation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on {depreciationRate}% annual depreciation rate
            </p>
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={depreciationData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id={`valueGradient-${asset.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={`hsl(var(${
                          depreciationRate >= 0 ? "--success" : "--destructive"
                        }))`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="100%"
                        stopColor={`hsl(var(${
                          depreciationRate >= 0 ? "--success" : "--destructive"
                        }))`}
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={Math.floor(depreciationData.length / 10)}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={true}
                    tickMargin={8}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={[minValue * 0.9, maxValue * 1.05]}
                    width={70}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm text-muted-foreground">
                            {dataPoint.month}
                          </div>
                          <div className="font-bold">
                            Value: {formatCurrency(dataPoint.value)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={`hsl(var(${
                      depreciationRate >= 0 ? "--success" : "--destructive"
                    }))`}
                    fill={`url(#valueGradient-${asset.id})`}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

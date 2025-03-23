import {
  Vehicle,
  CarPaymentMethod,
  calculateRemainingLoanBalance,
} from "@/types/Vehicle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { calculateDepreciation, formatCurrency, formatDate } from "./utils";

interface VehicleDetailsProps {
  asset: Vehicle;
}

export default function VehicleDetails({ asset }: VehicleDetailsProps) {
  // Calculate depreciation over 60 months (5 years)
  const depreciationRate = 15; // Default to 15% annual depreciation
  const depreciationData = calculateDepreciation(
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
    asset.monthly_payment &&
    asset.loan_term_months &&
    asset.interest_rate &&
    asset.loan_start_date;

  const remainingBalance = calculateRemainingLoanBalance(asset);

  // Calculate financing progress details
  const calculateFinancingDetails = () => {
    if (
      !hasFinancing ||
      !asset.loan_amount ||
      !asset.monthly_payment ||
      !asset.loan_term_months ||
      !asset.loan_start_date
    ) {
      return null;
    }

    // Calculate months elapsed since loan start
    const loanStartDate = new Date(asset.loan_start_date);
    const currentDate = new Date();
    const monthsElapsed = Math.min(
      (currentDate.getFullYear() - loanStartDate.getFullYear()) * 12 +
        (currentDate.getMonth() - loanStartDate.getMonth()),
      asset.loan_term_months
    );

    // Calculate total paid so far
    const totalPaid = asset.monthly_payment * monthsElapsed;

    // Calculate interest rate per month
    const monthlyInterestRate = asset.interest_rate
      ? asset.interest_rate / 100 / 12
      : 0;

    // Calculate total interest paid
    let balance = asset.loan_amount;
    let principalPaid = 0;
    let interestPaid = 0;

    for (let i = 0; i < monthsElapsed; i++) {
      const interestForMonth = balance * monthlyInterestRate;
      const principalForMonth = Math.min(
        asset.monthly_payment - interestForMonth,
        balance
      );

      interestPaid += interestForMonth;
      principalPaid += principalForMonth;
      balance -= principalForMonth;

      if (balance <= 0) break;
    }

    return {
      monthsPaid: monthsElapsed,
      totalPaid,
      principalPaid,
      interestPaid,
      remainingBalance: balance > 0 ? balance : 0,
      totalMonths: asset.loan_term_months,
    };
  };

  const financingProgress = calculateFinancingDetails();

  return (
    <div className="space-y-6">
      {/* First row: Vehicle Info and Financial Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        {asset.monthly_payment
                          ? formatCurrency(asset.monthly_payment)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financing Progress Card */}
        {financingProgress && (
          <Card>
            <CardHeader>
              <CardTitle>Financing Progress</CardTitle>
              <p className="text-sm text-muted-foreground">
                {financingProgress.monthsPaid} of{" "}
                {financingProgress.totalMonths} months completed
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
              </div>

              {/* Principal vs Interest breakdown */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Payment Breakdown</p>
                <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        (financingProgress.principalPaid /
                          financingProgress.totalPaid) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-destructive"
                    style={{
                      width: `${
                        (financingProgress.interestPaid /
                          financingProgress.totalPaid) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Principal (
                      {(
                        (financingProgress.principalPaid /
                          financingProgress.totalPaid) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-destructive rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Interest (
                      {(
                        (financingProgress.interestPaid /
                          financingProgress.totalPaid) *
                        100
                      ).toFixed(1)}
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
                        (financingProgress.totalPaid /
                          (asset.loan_amount || 1)) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-black"
                    style={{
                      width: `${
                        (financingProgress.remainingBalance /
                          (asset.loan_amount || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Paid (
                      {(
                        (financingProgress.totalPaid /
                          (asset.loan_amount || 1)) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-black rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Remaining (
                      {(
                        (financingProgress.remainingBalance /
                          (asset.loan_amount || 1)) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{formatCurrency(financingProgress.totalPaid)}</span>
                  <span>
                    {formatCurrency(financingProgress.remainingBalance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Depreciation Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle>Projected Value Depreciation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on {depreciationRate}% annual depreciation rate
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={depreciationData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={Math.floor(depreciationData.length / 10)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={[minValue * 0.9, maxValue * 1.05]}
                    width={70}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { RealEstate } from "@/types/RealEstate";
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

interface RealEstateDetailsProps {
  realEstate: RealEstate;
}

export default function RealEstateDetails({
  realEstate,
}: RealEstateDetailsProps) {
  if (!realEstate) return null;

  // Calculate appreciation over 60 months (5 years)
  const growthRate = realEstate.annual_growth_rate || 3; // Default to 3% if not specified
  const appreciationData = calculateAssetGrowth(
    realEstate.purchase_price || 0,
    growthRate,
    60,
    realEstate.purchase_date || new Date().toISOString()
  );

  // Get min and max values for the chart
  const minValue = appreciationData[0]?.value || 0;
  const maxValue = appreciationData[appreciationData.length - 1]?.value || 0;

  // Calculate current value (will be used since we aren't storing it in the database)
  const currentValue = calculateCurrentValue(
    realEstate.purchase_price,
    realEstate.purchase_date,
    growthRate
  );

  // Check if property has financing
  const hasFinancing =
    realEstate.mortgage_balance !== undefined &&
    realEstate.mortgage_balance > 0 &&
    realEstate.mortgage_interest_rate !== undefined &&
    realEstate.mortgage_interest_rate > 0 &&
    realEstate.mortgage_term_years !== undefined &&
    realEstate.mortgage_term_years > 0 &&
    realEstate.purchase_date;

  // Calculate financing details - similar to VehicleDetails approach
  const calculateFinancingDetails = () => {
    if (
      !hasFinancing ||
      !realEstate.mortgage_balance ||
      !realEstate.mortgage_term_years ||
      !realEstate.purchase_date ||
      !realEstate.mortgage_interest_rate
    ) {
      return null;
    }

    // Calculate months elapsed since mortgage start (assuming purchase date is mortgage start date)
    const mortgageStartDate = new Date(realEstate.purchase_date);
    const currentDate = new Date();
    const totalMonthsElapsed =
      (currentDate.getFullYear() - mortgageStartDate.getFullYear()) * 12 +
      (currentDate.getMonth() - mortgageStartDate.getMonth());

    // Cap the months to the loan term
    const loanTermMonths = realEstate.mortgage_term_years * 12;
    const monthsElapsed = Math.min(totalMonthsElapsed, loanTermMonths);

    // Convert annual interest rate from percentage to decimal and then to monthly
    const annualRateDecimal = realEstate.mortgage_interest_rate / 100;
    const monthlyRate = annualRateDecimal / 12;

    // Calculate the monthly payment using standard amortization formula
    const monthlyPayment =
      monthlyRate === 0
        ? realEstate.mortgage_balance / loanTermMonths // For 0% loans
        : (realEstate.mortgage_balance *
            monthlyRate *
            Math.pow(1 + monthlyRate, loanTermMonths)) /
          (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

    // Total cost of the loan over its full term
    const totalLoanCost = monthlyPayment * loanTermMonths;

    // Total interest paid over the life of the loan
    const totalExpectedInterest = totalLoanCost - realEstate.mortgage_balance;

    // Calculate current payment progress using amortization schedule
    let remainingBalance = realEstate.mortgage_balance;
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

    return {
      monthsPaid: actualMonthsPaid,
      totalPaid,
      principalPaid: totalPrincipalPaid,
      interestPaid: totalInterestPaid,
      remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
      totalMonths: loanTermMonths,
      totalExpectedInterest,
      monthlyPayment,
    };
  };

  const financingProgress = calculateFinancingDetails();

  // Calculate annual expenses
  const annualPropertyTax = realEstate.property_tax_annual || 0;
  const annualInsurance = 0; // Not stored in our schema yet
  const annualMaintenance = 0; // Not stored in our schema yet
  const totalAnnualExpenses =
    annualPropertyTax + annualInsurance + annualMaintenance;

  // Calculate monthly expenses
  const monthlyExpenses = totalAnnualExpenses / 12;

  // Calculate monthly mortgage payment if applicable
  const monthlyMortgagePayment = financingProgress?.monthlyPayment || 0;

  // Calculate monthly cash flow (now just negative expenses since we don't track income)
  const monthlyCashFlow = -monthlyExpenses - monthlyMortgagePayment;

  return (
    <div className="space-y-6">
      {/* First row: Property Info and Financial Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Property Type</p>
              <p className="font-medium capitalize">
                {realEstate.property_type?.replace("_", " ") || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{realEstate.address || "N/A"}</p>
            </div>

            {/* We don't have these fields in our schema yet, so we're hiding them */}
            {/* <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
                <p className="font-medium">N/A</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
                <p className="font-medium">N/A</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Square Feet</p>
                <p className="font-medium">N/A</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year Built</p>
                <p className="font-medium">N/A</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lot Size</p>
                <p className="font-medium">N/A</p>
              </div>
            </div> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Price</p>
                <p className="font-medium">
                  {formatCurrency(realEstate.purchase_price || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="font-medium">
                  {formatCurrency(currentValue || 0)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchase Date</p>
              <p className="font-medium">
                {realEstate.purchase_date
                  ? formatDate(realEstate.purchase_date)
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Value Change</p>
              {realEstate.purchase_price && currentValue ? (
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium ${
                      currentValue >= realEstate.purchase_price
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrency(currentValue - realEstate.purchase_price)}
                  </p>
                  <p
                    className={`text-sm ${
                      currentValue >= realEstate.purchase_price
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    (
                    {(
                      ((currentValue - realEstate.purchase_price) /
                        realEstate.purchase_price) *
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
              <p className="text-sm text-muted-foreground">Financing Type</p>
              <p className="font-medium capitalize">
                {realEstate.mortgage_balance && realEstate.mortgage_balance > 0
                  ? "Mortgage"
                  : "Cash"}
              </p>
            </div>
            {realEstate.mortgage_interest_rate &&
              realEstate.mortgage_interest_rate > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Interest Rate
                      </p>
                      <p className="font-medium">
                        {realEstate.mortgage_interest_rate
                          ? `${realEstate.mortgage_interest_rate}%`
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
                    <p className="text-sm text-muted-foreground">Loan Term</p>
                    <p className="font-medium">
                      {realEstate.mortgage_term_years
                        ? `${realEstate.mortgage_term_years * 12} months (${
                            realEstate.mortgage_term_years
                          } years)`
                        : "N/A"}
                    </p>
                  </div>
                </>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Second row: Financing Progress and Appreciation Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expenses and Income Card (or Financing Progress if applicable) */}
        {financingProgress ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financing Progress</CardTitle>
              <p className="text-sm text-muted-foreground">
                {financingProgress.remainingBalance === 0
                  ? "Mortgage fully paid off!"
                  : `${financingProgress.monthsPaid} of ${financingProgress.totalMonths} months completed`}
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
                        (realEstate.mortgage_balance || 0) > 0
                          ? (financingProgress.principalPaid /
                              (realEstate.mortgage_balance || 0)) *
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
                          (realEstate.mortgage_balance || 0) > 0
                            ? (financingProgress.remainingBalance /
                                (realEstate.mortgage_balance || 0)) *
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
                      {(realEstate.mortgage_balance || 0) > 0
                        ? (
                            (financingProgress.principalPaid /
                              (realEstate.mortgage_balance || 0)) *
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
                        {(realEstate.mortgage_balance || 0) > 0
                          ? (
                              (financingProgress.remainingBalance /
                                (realEstate.mortgage_balance || 0)) *
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Annual Expenses</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Property Tax
                    </p>
                    <p className="font-medium">
                      {formatCurrency(annualPropertyTax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Insurance</p>
                    <p className="font-medium">
                      {formatCurrency(annualInsurance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Maintenance</p>
                    <p className="font-medium">
                      {formatCurrency(annualMaintenance)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Total Monthly Costs</p>
                  <p className="font-medium text-destructive">
                    {formatCurrency(monthlyCashFlow)}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Property Expenses:
                    </span>
                    <span className="text-destructive">
                      -{formatCurrency(monthlyExpenses)}
                    </span>
                  </div>
                  {monthlyMortgagePayment > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Mortgage Payment:
                      </span>
                      <span className="text-destructive">
                        -{formatCurrency(monthlyMortgagePayment)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appreciation Chart Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">
              Projected Value Appreciation
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on {growthRate}% annual appreciation rate
            </p>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={appreciationData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id={`valueGradient-${realEstate.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={`hsl(var(${
                          growthRate >= 0 ? "--success" : "--destructive"
                        }))`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="100%"
                        stopColor={`hsl(var(${
                          growthRate >= 0 ? "--success" : "--destructive"
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
                    interval={Math.floor(appreciationData.length / 10)}
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
                      growthRate >= 0 ? "--success" : "--destructive"
                    }))`}
                    fill={`url(#valueGradient-${realEstate.id})`}
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

// Helper function to calculate the current value of a real estate property
function calculateCurrentValue(
  purchasePrice: number = 0,
  purchaseDate: string = new Date().toISOString(),
  annualGrowthRate: number = 3
): number {
  if (!purchasePrice || !purchaseDate) return purchasePrice;

  const purchaseDateTime = new Date(purchaseDate).getTime();
  const currentDateTime = new Date().getTime();

  // Calculate years elapsed (including partial years)
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const yearsElapsed =
    (currentDateTime - purchaseDateTime) / millisecondsPerYear;

  // If the purchase date is in the future, return the purchase price
  if (yearsElapsed < 0) return purchasePrice;

  // Calculate appreciated value using compound appreciation
  const currentValue =
    purchasePrice * Math.pow(1 + annualGrowthRate / 100, yearsElapsed);

  // Round to 2 decimal places
  return Math.round(currentValue * 100) / 100;
}

import { Asset } from "@/types/Account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { calculateAppreciation, calculateFinancingProgress, formatCurrency, formatDate } from "./utils";

interface RealEstateDetailsProps {
  asset: Asset;
}

export default function RealEstateDetails({ asset }: RealEstateDetailsProps) {
  const { metadata } = asset;
  if (!metadata) return null;

  // Calculate appreciation over 60 months (5 years)
  const appreciationRate = metadata.appreciationRate || 3; // Default to 3% if not specified
  const appreciationData = calculateAppreciation(
    asset.purchaseValue || 0, 
    appreciationRate, 
    60,
    asset.purchaseDate || new Date().toISOString()
  );

  // Get min and max values for the chart
  const minValue = appreciationData[0]?.value || 0;
  const maxValue = appreciationData[appreciationData.length - 1]?.value || 0;

  // Calculate financing progress if applicable
  const financingProgress = metadata.financingType !== 'cash' && 
    metadata.monthlyPayment > 0 && 
    asset.purchaseDate && 
    metadata.interestRate !== undefined && 
    metadata.loanTerm !== undefined && 
    asset.purchaseValue !== undefined
    ? calculateFinancingProgress(
        asset.purchaseDate,
        metadata.monthlyPayment,
        metadata.interestRate,
        metadata.loanTerm,
        asset.purchaseValue
      )
    : null;

  // Calculate annual expenses
  const annualPropertyTax = metadata.propertyTax || 0;
  const annualInsurance = metadata.insuranceCost || 0;
  const annualMaintenance = metadata.maintenanceCost || 0;
  const totalAnnualExpenses = annualPropertyTax + annualInsurance + annualMaintenance;
  
  // Calculate monthly expenses
  const monthlyExpenses = totalAnnualExpenses / 12;
  
  // Calculate monthly income (if rental property)
  const monthlyRentalIncome = metadata.rentalIncome || 0;
  
  // Calculate monthly cash flow
  const monthlyCashFlow = monthlyRentalIncome - monthlyExpenses - (metadata.monthlyPayment || 0);
  
  // Calculate cap rate if it's a rental property
  const capRate = monthlyRentalIncome > 0 && asset.currentValue 
    ? ((monthlyRentalIncome * 12) / asset.currentValue) * 100 
    : 0;

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
              <p className="font-medium capitalize">{metadata.propertyType?.replace('_', ' ') || "N/A"}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">
                {metadata.address?.street}, {metadata.address?.city}, {metadata.address?.state} {metadata.address?.zipCode}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
                <p className="font-medium">{metadata.bedrooms || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
                <p className="font-medium">{metadata.bathrooms || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Square Feet</p>
                <p className="font-medium">{metadata.squareFeet ? metadata.squareFeet.toLocaleString() : "N/A"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year Built</p>
                <p className="font-medium">{metadata.yearBuilt || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lot Size</p>
                <p className="font-medium">{metadata.lotSize ? `${metadata.lotSize} acres` : "N/A"}</p>
              </div>
            </div>
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
                <p className="font-medium">{formatCurrency(asset.purchaseValue || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="font-medium">{formatCurrency(asset.currentValue || 0)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchase Date</p>
              <p className="font-medium">
                {asset.purchaseDate ? formatDate(asset.purchaseDate) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Value Change</p>
              {asset.purchaseValue && asset.currentValue ? (
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${asset.currentValue >= asset.purchaseValue ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(asset.currentValue - asset.purchaseValue)}
                  </p>
                  <p className={`text-sm ${asset.currentValue >= asset.purchaseValue ? 'text-success' : 'text-destructive'}`}>
                    ({((asset.currentValue - asset.purchaseValue) / asset.purchaseValue * 100).toFixed(1)}%)
                  </p>
                </div>
              ) : (
                <p className="font-medium">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Financing Type</p>
              <p className="font-medium capitalize">{metadata.financingType || "Cash"}</p>
            </div>
            {metadata.financingType && metadata.financingType !== 'cash' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{metadata.interestRate ? `${metadata.interestRate}%` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">{metadata.monthlyPayment ? formatCurrency(metadata.monthlyPayment) : "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Term</p>
                  <p className="font-medium">
                    {metadata.loanTerm 
                      ? `${metadata.loanTerm} months (${(metadata.loanTerm / 12).toFixed(1)} years)` 
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
                {financingProgress.monthsPaid} of {metadata.loanTerm} months completed
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
                      width: `${(financingProgress.principalPaid / financingProgress.totalPaid) * 100}%` 
                    }}
                  />
                  <div 
                    className="h-full bg-destructive"
                    style={{ 
                      width: `${(financingProgress.interestPaid / financingProgress.totalPaid) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                    <span className="text-muted-foreground">Principal ({((financingProgress.principalPaid / financingProgress.totalPaid) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-destructive rounded-full mr-1"></div>
                    <span className="text-muted-foreground">Interest ({((financingProgress.interestPaid / financingProgress.totalPaid) * 100).toFixed(1)}%)</span>
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
                      width: `${(financingProgress.totalPaid / (asset.purchaseValue || 1)) * 100}%` 
                    }}
                  />
                  <div 
                    className="h-full bg-black"
                    style={{ 
                      width: `${(financingProgress.remainingBalance / (asset.purchaseValue || 1)) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Paid ({((financingProgress.totalPaid / (asset.purchaseValue || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-black rounded-full mr-1"></div>
                    <span className="text-muted-foreground">
                      Remaining ({((financingProgress.remainingBalance / (asset.purchaseValue || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{formatCurrency(financingProgress.totalPaid)}</span>
                  <span>{formatCurrency(financingProgress.remainingBalance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Expenses & Income</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Annual Expenses</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Property Tax</p>
                    <p className="font-medium">{formatCurrency(annualPropertyTax)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Insurance</p>
                    <p className="font-medium">{formatCurrency(annualInsurance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Maintenance</p>
                    <p className="font-medium">{formatCurrency(annualMaintenance)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Monthly Cash Flow</p>
                  <p className={`font-medium ${monthlyCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(monthlyCashFlow)}
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Income:</span>
                    <span className="text-success">{formatCurrency(monthlyRentalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Expenses:</span>
                    <span className="text-destructive">-{formatCurrency(monthlyExpenses)}</span>
                  </div>
                  {metadata.monthlyPayment > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Payment:</span>
                      <span className="text-destructive">-{formatCurrency(metadata.monthlyPayment)}</span>
                    </div>
                  )}
                </div>
              </div>

              {monthlyRentalIncome > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Cap Rate</p>
                    <p className="font-medium">{capRate.toFixed(2)}%</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Annual rental income divided by property value
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Appreciation Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projected Value Appreciation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on {appreciationRate}% annual appreciation rate
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={appreciationData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={Math.floor(appreciationData.length / 10)}
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
                    stroke="hsl(var(--success))" 
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
import { useState, useEffect } from "react";
import { useAssets } from "@/contexts/AssetsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Vehicle, CarPaymentMethod } from "@/types/Vehicle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { formatTotalAmount } from "@/lib/utils";

// Calculate depreciated value based on purchase price, date, and depreciation rate
const calculateCurrentValue = (
  purchasePrice: number,
  purchaseDate: string,
  depreciationRate: number
): number => {
  if (!purchasePrice || !purchaseDate) return 0;

  const purchaseDateTime = new Date(purchaseDate).getTime();
  const currentDateTime = new Date().getTime();

  // Calculate years elapsed (including partial years)
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const yearsElapsed =
    (currentDateTime - purchaseDateTime) / millisecondsPerYear;

  // If the purchase date is in the future, return the purchase price
  if (yearsElapsed < 0) return purchasePrice;

  // Calculate depreciated value using compound depreciation
  const currentValue =
    purchasePrice * Math.pow(1 - depreciationRate / 100, yearsElapsed);

  // Round to 2 decimal places
  return Math.round(currentValue * 100) / 100;
};

// Calculate financing progress including principal paid, interest paid, and remaining balance
const calculateFinancingProgress = (
  purchaseDate: string,
  monthlyPayment: number,
  interestRate: number,
  loanTerm: number,
  purchaseValue: number
): {
  monthsPaid: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
} => {
  if (
    !purchaseDate ||
    !monthlyPayment ||
    !interestRate ||
    !loanTerm ||
    !purchaseValue
  ) {
    return {
      monthsPaid: 0,
      totalPaid: 0,
      principalPaid: 0,
      interestPaid: 0,
      remainingBalance: purchaseValue,
    };
  }

  const monthlyInterestRate = interestRate / 100 / 12;
  const purchaseDateTime = new Date(purchaseDate).getTime();
  const currentDateTime = new Date().getTime();
  const monthsPaid = Math.min(
    Math.floor(
      (currentDateTime - purchaseDateTime) / (1000 * 60 * 60 * 24 * 30.44)
    ),
    loanTerm
  );

  let remainingBalance = purchaseValue;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  // Calculate amortization for each month that has passed
  for (let month = 0; month < monthsPaid; month++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = Math.min(
      monthlyPayment - interestPayment,
      remainingBalance
    );

    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment;
    remainingBalance -= principalPayment;
  }

  return {
    monthsPaid,
    totalPaid: monthsPaid * monthlyPayment,
    principalPaid: totalPrincipalPaid,
    interestPaid: totalInterestPaid,
    remainingBalance,
  };
};

export default function VehicleForm() {
  const { addAsset } = useAssets();
  const { getCurrentUserId } = useAccounts();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial form data with necessary Vehicle fields
  const [formData, setFormData] = useState<
    Partial<Vehicle> & { user_id: string }
  >({
    user_id: "", // Will be set when submitting
    make: "",
    model: "",
    year: new Date().getFullYear(),
    purchase_price: 0,
    current_value: 0,
    purchase_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    vin: "",
    currency: "USD",
    payment_method: CarPaymentMethod.CASH,
    loan_amount: 0,
    interest_rate: 0,
    loan_term_months: 0,
    monthly_payment: 0,
    lease_term_months: 0,
  });

  // Just keep depreciationRate for calculation
  const [depreciationRate, setDepreciationRate] = useState(15); // default 15% annual depreciation

  // Calculate current value whenever relevant fields change
  useEffect(() => {
    const currentValue = calculateCurrentValue(
      formData.purchase_price || 0, // Add default value of 0
      formData.purchase_date || "",
      depreciationRate
    );

    setFormData((prev) => ({
      ...prev,
      current_value: currentValue,
    }));
  }, [formData.purchase_price, formData.purchase_date, depreciationRate]);

  // Calculate loan end date based on start date and term
  useEffect(() => {
    if (
      formData.payment_method === CarPaymentMethod.FINANCE &&
      formData.loan_start_date &&
      formData.loan_term_months
    ) {
      const startDate = new Date(formData.loan_start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + formData.loan_term_months);

      setFormData((prev) => ({
        ...prev,
        loan_end_date: endDate.toISOString().split("T")[0],
      }));
    }
  }, [
    formData.loan_start_date,
    formData.loan_term_months,
    formData.payment_method,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user ID
      const userId = await getCurrentUserId();
      if (!userId) {
        console.error("Unable to get current user ID");
        return;
      }

      // Create a complete Vehicle object with required fields
      const vehicle: Vehicle = {
        id: "", // Will be set by the backend
        user_id: userId, // Use the actual user ID
        make: formData.make || "",
        model: formData.model || "",
        year: formData.year || new Date().getFullYear(),
        purchase_price: formData.purchase_price || 0,
        current_value: formData.current_value || 0,
        purchase_date:
          formData.purchase_date || new Date().toISOString().split("T")[0],
        vin: formData.vin || "",
        currency: formData.currency || "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_method: formData.payment_method,
      };

      // Add financing details if not cash purchase
      if (formData.payment_method !== CarPaymentMethod.CASH) {
        vehicle.loan_amount = formData.loan_amount;
        vehicle.loan_start_date = formData.purchase_date; // Default to purchase date
        vehicle.interest_rate = formData.interest_rate;
        vehicle.monthly_payment = formData.monthly_payment;

        if (formData.payment_method === CarPaymentMethod.FINANCE) {
          vehicle.loan_term_months = formData.loan_term_months;
          vehicle.loan_end_date = formData.loan_end_date;
        } else if (formData.payment_method === CarPaymentMethod.LEASE) {
          vehicle.lease_term_months = formData.lease_term_months;
        }
      }

      // Add the vehicle to assets context
      const newAssetId = await addAsset(vehicle);

      if (newAssetId) {
        // Find and close the dialog using the DialogClose component
        const closeButton = document.querySelector(
          "[data-dialog-close]"
        ) as HTMLButtonElement;
        if (closeButton) {
          closeButton.click();
        }

        // Reset form
        setFormData({
          user_id: "",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          purchase_price: 0,
          current_value: 0,
          purchase_date: new Date().toISOString().split("T")[0],
          vin: "",
          currency: "USD",
          payment_method: CarPaymentMethod.CASH,
          loan_amount: 0,
          interest_rate: 0,
          loan_term_months: 0,
          monthly_payment: 0,
          lease_term_months: 0,
        });

        setDepreciationRate(15);

        // Redirect to the new vehicle's details page
        router.push(`/vehicles/${newAssetId}`);
      } else {
        console.error("Failed to add vehicle");
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] max-h-[60vh]">
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <form
          id="vehicle-form"
          onSubmit={handleSubmit}
          className="space-y-6 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="make" className="text-sm font-medium">
              Make
            </label>
            <Input
              id="make"
              value={formData.make}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  make: e.target.value,
                })
              }
              required
              placeholder="Toyota, Honda, Ford, etc."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">
              Model
            </label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  model: e.target.value,
                })
              }
              required
              placeholder="Camry, Accord, F-150, etc."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="year" className="text-sm font-medium">
              Year
            </label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  year: parseInt(e.target.value) || new Date().getFullYear(),
                })
              }
              required
              placeholder="2023"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="purchase_price" className="text-sm font-medium">
              Purchase Price
            </label>
            <Input
              id="purchase_price"
              type="number"
              value={formData.purchase_price || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchase_price: parseFloat(e.target.value) || 0,
                })
              }
              required
              placeholder="25000"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount you paid for this vehicle
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="purchase_date" className="text-sm font-medium">
              Purchase Date
            </label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchase_date: e.target.value,
                })
              }
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="payment_method" className="text-sm font-medium">
              Payment Method
            </label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: CarPaymentMethod) =>
                setFormData({
                  ...formData,
                  payment_method: value,
                })
              }
            >
              <SelectTrigger id="payment_method">
                <SelectValue placeholder="Select Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CarPaymentMethod.CASH}>
                  Cash Purchase
                </SelectItem>
                <SelectItem value={CarPaymentMethod.FINANCE}>
                  Financed
                </SelectItem>
                <SelectItem value={CarPaymentMethod.LEASE}>Leased</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional fields based on payment method */}
          {formData.payment_method !== CarPaymentMethod.CASH && (
            <>
              <div className="space-y-2">
                <label htmlFor="loan_amount" className="text-sm font-medium">
                  {formData.payment_method === CarPaymentMethod.LEASE
                    ? "Lease Amount"
                    : "Loan Amount"}
                </label>
                <Input
                  id="loan_amount"
                  type="number"
                  value={formData.loan_amount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      loan_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="20000"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="loan_start_date"
                  className="text-sm font-medium"
                >
                  {formData.payment_method === CarPaymentMethod.LEASE
                    ? "Lease Start Date"
                    : "Loan Start Date"}
                </label>
                <Input
                  id="loan_start_date"
                  type="date"
                  value={formData.loan_start_date || formData.purchase_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      loan_start_date: e.target.value,
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Defaults to purchase date if not specified
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="interest_rate" className="text-sm font-medium">
                  Interest Rate (%)
                </label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="30"
                  value={formData.interest_rate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interest_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="4.5"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="monthly_payment"
                  className="text-sm font-medium"
                >
                  Monthly Payment
                </label>
                <Input
                  id="monthly_payment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_payment || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_payment: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="450"
                  className="w-full"
                />
              </div>

              {formData.payment_method === CarPaymentMethod.FINANCE && (
                <div className="space-y-2">
                  <label
                    htmlFor="loan_term_months"
                    className="text-sm font-medium"
                  >
                    Loan Term (months)
                  </label>
                  <Input
                    id="loan_term_months"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.loan_term_months || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        loan_term_months: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="60"
                    className="w-full"
                  />
                </div>
              )}

              {formData.payment_method === CarPaymentMethod.LEASE && (
                <div className="space-y-2">
                  <label
                    htmlFor="lease_term_months"
                    className="text-sm font-medium"
                  >
                    Lease Term (months)
                  </label>
                  <Input
                    id="lease_term_months"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.lease_term_months || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lease_term_months: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="36"
                    className="w-full"
                  />
                </div>
              )}

              {formData.loan_end_date && (
                <div className="space-y-2">
                  <label
                    htmlFor="loan_end_date"
                    className="text-sm font-medium"
                  >
                    {formData.payment_method === CarPaymentMethod.LEASE
                      ? "Lease End Date"
                      : "Loan End Date"}
                  </label>
                  <Input
                    id="loan_end_date"
                    type="date"
                    value={formData.loan_end_date}
                    readOnly
                    className="w-full bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Calculated based on start date and term
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <label htmlFor="vin" className="text-sm font-medium">
              VIN (Vehicle Identification Number)
            </label>
            <Input
              id="vin"
              value={formData.vin || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vin: e.target.value,
                })
              }
              placeholder="1HGCM82633A123456"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter the VIN for your vehicle
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="depreciationRate" className="text-sm font-medium">
              Depreciation Rate (% per year)
            </label>
            <Input
              id="depreciationRate"
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={depreciationRate}
              onChange={(e) =>
                setDepreciationRate(parseFloat(e.target.value) || 15)
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Average vehicle depreciation is around 15-20% per year
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="current_value" className="text-sm font-medium">
              Current Value (Estimated)
            </label>
            <Input
              id="current_value"
              value={formatTotalAmount(formData.current_value || 0)}
              readOnly
              className="w-full bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Calculated based on purchase price, date, and depreciation rate
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="currency" className="text-sm font-medium">
              Currency
            </label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  currency: value,
                })
              }
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

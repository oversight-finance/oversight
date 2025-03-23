import { useState, useEffect } from "react";
import { useAssets } from "@/contexts/AssetsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/types/Vehicle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { formatTotalAmount } from "@/lib/utils";

type FinancingType = "cash" | "finance" | "lease";

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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initial form data with necessary Vehicle fields
  const [formData, setFormData] = useState<Partial<Vehicle> & { user_id: string }>({
    user_id: "user1", // Default user ID
    make: "",
    model: "",
    year: new Date().getFullYear(),
    purchase_price: 0,
    current_value: 0,
    purchase_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    vin: "",
    currency: "USD",
  });

  // Additional form fields not part of Vehicle type
  const [additionalData, setAdditionalData] = useState({
    licensePlate: "",
    condition: "good",
    color: "",
    mileage: 0,
    financingType: "cash" as FinancingType,
    interestRate: 0,
    monthlyPayment: 0,
    loanTerm: 0, // in months
    depreciationRate: 15, // default 15% annual depreciation
  });

  // Calculate current value whenever relevant fields change
  useEffect(() => {
    const currentValue = calculateCurrentValue(
      formData.purchase_price || 0, // Add default value of 0
      formData.purchase_date || "",
      additionalData.depreciationRate
    );

    setFormData((prev) => ({
      ...prev,
      current_value: currentValue,
    }));
  }, [
    formData.purchase_price,
    formData.purchase_date,
    additionalData.depreciationRate,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a complete Vehicle object with required fields
      const vehicle: Vehicle = {
        id: crypto.randomUUID(), // The addAsset will override this
        user_id: formData.user_id,
        make: formData.make || "",
        model: formData.model || "",
        year: formData.year || new Date().getFullYear(),
        purchase_price: formData.purchase_price || 0,
        current_value: formData.current_value || 0,
        purchase_date: formData.purchase_date || new Date().toISOString().split("T")[0],
        vin: formData.vin,
        currency: formData.currency || "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add the vehicle as an asset and get the new asset ID
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
          user_id: "user1",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          purchase_price: 0,
          current_value: 0,
          purchase_date: new Date().toISOString().split("T")[0],
          vin: "",
          currency: "USD",
        });

        setAdditionalData({
          licensePlate: "",
          condition: "good",
          color: "",
          mileage: 0,
          financingType: "cash" as FinancingType,
          interestRate: 0,
          monthlyPayment: 0,
          loanTerm: 0,
          depreciationRate: 15,
        });

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
            <label htmlFor="licensePlate" className="text-sm font-medium">
              License Plate
            </label>
            <Input
              id="licensePlate"
              value={additionalData.licensePlate}
              onChange={(e) =>
                setAdditionalData({
                  ...additionalData,
                  licensePlate: e.target.value,
                })
              }
              placeholder="ABC-1234"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter the license plate for your vehicle
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
              value={additionalData.depreciationRate}
              onChange={(e) =>
                setAdditionalData({
                  ...additionalData,
                  depreciationRate: parseFloat(e.target.value) || 15,
                })
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

import { useState, useEffect } from "react";
import { useAssets } from "@/contexts/AssetsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RealEstate } from "@/types/RealEstate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { formatTotalAmount } from "@/lib/utils";

type FinancingType = "cash" | "mortgage" | "heloc";
type PropertyType =
  | "single_family"
  | "multi_family"
  | "condo"
  | "townhouse"
  | "commercial"
  | "land";

// Calculate appreciated value based on purchase price, date, and appreciation rate
const calculateCurrentValue = (
  purchasePrice: number,
  purchaseDate: string,
  appreciationRate: number
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

  // Calculate appreciated value using compound appreciation
  const currentValue =
    purchasePrice * Math.pow(1 + appreciationRate / 100, yearsElapsed);

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

// Create an address formatter helper
const formatFullAddress = (address: string, city: string, state: string, zipCode: string, country: string): string => {
  return `${address}, ${city}, ${state} ${zipCode}, ${country}`;
};

export default function RealEstateForm() {
  const { addAsset } = useAssets();
  const { getCurrentUserId } = useAccounts();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address components for the form
  const [addressComponents, setAddressComponents] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
  });
  
  // Initial form data with necessary RealEstate fields
  const [formData, setFormData] = useState<Partial<RealEstate> & { user_id: string }>({
    user_id: "", // Will be set when submitting
    property_type: "single_family" as PropertyType,
    address: "",
    purchase_price: 0,
    current_value: 0,
    purchase_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    mortgage_balance: 0,
    currency: "USD",
  });

  // Update the address whenever address components change
  useEffect(() => {
    const fullAddress = formatFullAddress(
      addressComponents.street,
      addressComponents.city,
      addressComponents.state,
      addressComponents.zipCode,
      addressComponents.country
    );
    
    setFormData(prev => ({
      ...prev,
      address: fullAddress
    }));
  }, [addressComponents]);

  // Additional form fields not part of RealEstate type
  const [additionalData, setAdditionalData] = useState({
    square_feet: 0,
    bedrooms: 0,
    bathrooms: 0,
    year_built: 0,
    lot_size: 0, // in acres
    property_tax: 0, // annual
    insurance_cost: 0, // annual
    maintenance_cost: 0, // annual
    rental_income: 0, // monthly
    financing_type: "cash" as FinancingType,
    interest_rate: 0,
    monthly_payment: 0,
    loan_term: 0, // in months
    appreciation_rate: 3, // default 3% annual appreciation
  });

  // Calculate current value whenever relevant fields change
  useEffect(() => {
    const currentValue = calculateCurrentValue(
      formData.purchase_price || 0,
      formData.purchase_date || "",
      additionalData.appreciation_rate
    );

    setFormData((prev) => ({
      ...prev,
      current_value: currentValue,
    }));
  }, [
    formData.purchase_price,
    formData.purchase_date,
    additionalData.appreciation_rate,
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

      // Create a complete RealEstate object with required fields
      const realEstate: RealEstate = {
        id: "", // The backend will generate this
        user_id: userId, // Use the actual user ID
        property_type: formData.property_type || "single_family",
        address: formData.address || "",
        purchase_price: formData.purchase_price || 0,
        current_value: formData.current_value || 0,
        purchase_date: formData.purchase_date || new Date().toISOString().split("T")[0],
        mortgage_balance: formData.mortgage_balance || 0,
        currency: formData.currency || "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add the property as an asset and get the new asset ID
      const newAssetId = await addAsset(realEstate);

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
          property_type: "single_family" as PropertyType,
          address: "",
          purchase_price: 0,
          current_value: 0,
          purchase_date: new Date().toISOString().split("T")[0],
          mortgage_balance: 0,
          currency: "USD",
        });

        setAddressComponents({
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA",
        });

        setAdditionalData({
          square_feet: 0,
          bedrooms: 0,
          bathrooms: 0,
          year_built: 0,
          lot_size: 0,
          property_tax: 0,
          insurance_cost: 0,
          maintenance_cost: 0,
          rental_income: 0,
          financing_type: "cash" as FinancingType,
          interest_rate: 0,
          monthly_payment: 0,
          loan_term: 0,
          appreciation_rate: 3,
        });

        // Redirect to the new property's details page
        router.push(`/real-estate/${newAssetId}`);
      } else {
        console.error("Failed to add real estate property");
      }
    } catch (error) {
      console.error("Error adding real estate property:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] max-h-[60vh]">
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <form
          id="real-estate-form"
          onSubmit={handleSubmit}
          className="space-y-6 py-2"
        >
          <div className="space-y-2">
            <label htmlFor="property_type" className="text-sm font-medium">
              Property Type
            </label>
            <Select
              value={formData.property_type}
              onValueChange={(value: PropertyType) =>
                setFormData({
                  ...formData,
                  property_type: value,
                })
              }
            >
              <SelectTrigger id="property_type">
                <SelectValue placeholder="Select Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_family">Single Family Home</SelectItem>
                <SelectItem value="multi_family">Multi-Family</SelectItem>
                <SelectItem value="condo">Condominium</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="commercial">Commercial Property</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="street" className="text-sm font-medium">
              Street Address
            </label>
            <Input
              id="street"
              value={addressComponents.street}
              onChange={(e) =>
                setAddressComponents({
                  ...addressComponents,
                  street: e.target.value,
                })
              }
              required
              placeholder="123 Main St"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <Input
                id="city"
                value={addressComponents.city}
                onChange={(e) =>
                  setAddressComponents({
                    ...addressComponents,
                    city: e.target.value,
                  })
                }
                required
                placeholder="Anytown"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium">
                State
              </label>
              <Input
                id="state"
                value={addressComponents.state}
                onChange={(e) =>
                  setAddressComponents({
                    ...addressComponents,
                    state: e.target.value,
                  })
                }
                required
                placeholder="CA"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="zipCode" className="text-sm font-medium">
                Zip Code
              </label>
              <Input
                id="zipCode"
                value={addressComponents.zipCode}
                onChange={(e) =>
                  setAddressComponents({
                    ...addressComponents,
                    zipCode: e.target.value,
                  })
                }
                required
                placeholder="12345"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                Country
              </label>
              <Input
                id="country"
                value={addressComponents.country}
                onChange={(e) =>
                  setAddressComponents({
                    ...addressComponents,
                    country: e.target.value,
                  })
                }
                required
                placeholder="USA"
                className="w-full"
              />
            </div>
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
              placeholder="250000"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount you paid for this property
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="purchase_date" className="text-sm font-medium">
              Purchase Date
            </label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date || ""}
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
            <label htmlFor="mortgage_balance" className="text-sm font-medium">
              Mortgage Balance
            </label>
            <Input
              id="mortgage_balance"
              type="number"
              value={formData.mortgage_balance || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mortgage_balance: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="200000"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Current outstanding mortgage balance (if any)
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="appreciation_rate" className="text-sm font-medium">
              Appreciation Rate (% per year)
            </label>
            <Input
              id="appreciation_rate"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={additionalData.appreciation_rate}
              onChange={(e) =>
                setAdditionalData({
                  ...additionalData,
                  appreciation_rate: parseFloat(e.target.value) || 3,
                })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Average real estate appreciation is around 3-5% per year
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
              Calculated based on purchase price, date, and appreciation rate
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="currency" className="text-sm font-medium">
              Currency
            </label>
            <Select
              value={formData.currency || "USD"}
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
              {isSubmitting ? "Adding..." : "Add Property"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useAssets } from "@/contexts/AssetsContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { DialogClose } from "@/components/ui/dialog";

type PropertyType =
  | "single_family"
  | "multi_family"
  | "condo"
  | "townhouse"
  | "commercial"
  | "land";

// Create an address formatter helper
const formatFullAddress = (
  address: string,
  city: string,
  state: string,
  zipCode: string,
  country: string
): string => {
  return `${address}, ${city}, ${state} ${zipCode}, ${country}`;
};

export default function RealEstateForm() {
  const { addAsset } = useAssets();
  const { getUserId } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  // Address components for the form
  const [addressComponents, setAddressComponents] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
  });

  // Form data matching the RealEstate interface
  const [formData, setFormData] = useState<
    Omit<RealEstate, "id" | "created_at" | "updated_at">
  >({
    user_id: "", // Will be set when submitting
    property_type: "single_family",
    address: "",
    purchase_price: 0,
    purchase_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    mortgage_balance: 0,
    mortgage_interest_rate: 0,
    mortgage_term_years: 30,
    property_tax_annual: 0,
    currency: "USD",
    annual_growth_rate: 3, // Default 3% annual appreciation
    current_value: 0,
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

    setFormData((prev) => ({
      ...prev,
      address: fullAddress,
    }));
  }, [addressComponents]);

  // Calculate current value based on purchase price, date, and appreciation rate
  useEffect(() => {
    if (
      !formData.purchase_price ||
      !formData.purchase_date ||
      !formData.annual_growth_rate
    )
      return;

    const purchaseDateTime = new Date(formData.purchase_date).getTime();
    const currentDateTime = new Date().getTime();

    // Calculate years elapsed (including partial years)
    const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
    const yearsElapsed =
      (currentDateTime - purchaseDateTime) / millisecondsPerYear;

    // If the purchase date is in the future, return the purchase price
    if (yearsElapsed < 0) {
      setFormData((prev) => ({
        ...prev,
        current_value: formData.purchase_price,
      }));
      return;
    }

    // Calculate appreciated value using compound appreciation
    const currentValue =
      formData.purchase_price *
      Math.pow(1 + (formData.annual_growth_rate || 0) / 100, yearsElapsed);

    // Round to 2 decimal places
    setFormData((prev) => ({
      ...prev,
      current_value: Math.round(currentValue * 100) / 100,
    }));
  }, [
    formData.purchase_price,
    formData.purchase_date,
    formData.annual_growth_rate,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user ID
      const userId = getUserId();
      if (!userId) {
        console.error("Unable to get current user ID");
        return;
      }

      // Create the real estate data object
      const realEstateData: RealEstate = {
        id: "", // Will be set by the backend
        user_id: userId,
        property_type: formData.property_type,
        address: formData.address,
        purchase_price: formData.purchase_price,
        purchase_date: formData.purchase_date,
        mortgage_balance: formData.mortgage_balance,
        mortgage_interest_rate: formData.mortgage_interest_rate,
        mortgage_term_years: formData.mortgage_term_years,
        property_tax_annual: formData.property_tax_annual,
        currency: formData.currency,
        annual_growth_rate: formData.annual_growth_rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Use the addAsset function from context
      const newAssetId = await addAsset(realEstateData);

      if (newAssetId) {
        // Close the dialog programmatically
        if (dialogCloseRef.current) {
          dialogCloseRef.current.click();
        }

        // Reset form
        setFormData({
          user_id: "",
          property_type: "single_family",
          address: "",
          purchase_price: 0,
          purchase_date: new Date().toISOString().split("T")[0],
          mortgage_balance: 0,
          mortgage_interest_rate: 0,
          mortgage_term_years: 30,
          property_tax_annual: 0,
          currency: "USD",
          annual_growth_rate: 3,
        });

        setAddressComponents({
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA",
        });

        // Redirect to the new property's details page
        router.push(`/assets/${newAssetId}`);
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
          {/* Hidden DialogClose component that we can click programmatically */}
          <DialogClose ref={dialogCloseRef} className="hidden" />

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
                <SelectItem value="single_family">
                  Single Family Home
                </SelectItem>
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
            <label
              htmlFor="mortgage_interest_rate"
              className="text-sm font-medium"
            >
              Mortgage Interest Rate (%)
            </label>
            <Input
              id="mortgage_interest_rate"
              type="number"
              min="0"
              max="20"
              step="0.01"
              value={formData.mortgage_interest_rate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mortgage_interest_rate: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="4.5"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="mortgage_term_years"
              className="text-sm font-medium"
            >
              Mortgage Term (Years)
            </label>
            <Input
              id="mortgage_term_years"
              type="number"
              min="1"
              max="40"
              step="1"
              value={formData.mortgage_term_years || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mortgage_term_years: parseInt(e.target.value) || 0,
                })
              }
              placeholder="30"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="property_tax_annual"
              className="text-sm font-medium"
            >
              Annual Property Tax
            </label>
            <Input
              id="property_tax_annual"
              type="number"
              min="0"
              step="0.01"
              value={formData.property_tax_annual || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  property_tax_annual: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="3000"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="annual_growth_rate" className="text-sm font-medium">
              Annual Growth Rate (%)
            </label>
            <Input
              id="annual_growth_rate"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={formData.annual_growth_rate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  annual_growth_rate: parseFloat(e.target.value) || 3,
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
              Calculated based on purchase price, date, and growth rate
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

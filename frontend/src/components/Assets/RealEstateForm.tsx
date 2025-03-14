import { useState, useEffect } from "react";
import { useAssets } from "@/contexts/AssetsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AssetType } from "@/types/Account";
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

export default function RealEstateForm() {
  const { addAsset } = useAssets();
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: "user1", // Default user ID
    type: AssetType.REAL_ESTATE,
    name: "",
    purchaseValue: 0,
    currentValue: 0, // This will be calculated automatically
    purchaseDate: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    metadata: {
      propertyType: "single_family" as PropertyType,
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "USA",
      },
      squareFeet: 0,
      bedrooms: 0,
      bathrooms: 0,
      yearBuilt: 0,
      lotSize: 0, // in acres
      propertyTax: 0, // annual
      insuranceCost: 0, // annual
      maintenanceCost: 0, // annual
      rentalIncome: 0, // monthly
      financingType: "cash" as FinancingType,
      interestRate: 0,
      monthlyPayment: 0,
      loanTerm: 0, // in months
      appreciationRate: 3, // default 3% annual appreciation
    },
  });

  // Calculate current value whenever relevant fields change
  useEffect(() => {
    const currentValue = calculateCurrentValue(
      formData.purchaseValue,
      formData.purchaseDate,
      formData.metadata.appreciationRate
    );

    setFormData((prev) => ({
      ...prev,
      currentValue,
    }));
  }, [
    formData.purchaseValue,
    formData.purchaseDate,
    formData.metadata.appreciationRate,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate a name if not provided
    const propertyName =
      formData.name ||
      `${formData.metadata.address.street}, ${formData.metadata.address.city}`;

    // Calculate current value one more time before submitting
    const currentValue = calculateCurrentValue(
      formData.purchaseValue,
      formData.purchaseDate,
      formData.metadata.appreciationRate
    );

    // Add the property as an asset and get the new asset ID
    const newAssetId = addAsset({
      ...formData,
      name: propertyName,
      currentValue,
    });

    // Find and close the dialog using the DialogClose component
    const closeButton = document.querySelector(
      "[data-dialog-close]"
    ) as HTMLButtonElement;
    if (closeButton) {
      closeButton.click();
    }

    // Reset form
    setFormData({
      userId: "user1",
      type: AssetType.REAL_ESTATE,
      name: "",
      purchaseValue: 0,
      currentValue: 0,
      purchaseDate: new Date().toISOString().split("T")[0],
      metadata: {
        propertyType: "single_family" as PropertyType,
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "USA",
        },
        squareFeet: 0,
        bedrooms: 0,
        bathrooms: 0,
        yearBuilt: 0,
        lotSize: 0,
        propertyTax: 0,
        insuranceCost: 0,
        maintenanceCost: 0,
        rentalIncome: 0,
        financingType: "cash" as FinancingType,
        interestRate: 0,
        monthlyPayment: 0,
        loanTerm: 0,
        appreciationRate: 3,
      },
    });

    // Redirect to the new asset's details page
    router.push(`/assets/${newAssetId}`);
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
            <label htmlFor="propertyType" className="text-sm font-medium">
              Property Type
            </label>
            <Select
              value={formData.metadata.propertyType}
              onValueChange={(value: PropertyType) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    propertyType: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_family">
                  Single Family Home
                </SelectItem>
                <SelectItem value="multi_family">Multi-Family</SelectItem>
                <SelectItem value="condo">Condominium</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
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
              value={formData.metadata.address.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    address: {
                      ...formData.metadata.address,
                      street: e.target.value,
                    },
                  },
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
                value={formData.metadata.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      address: {
                        ...formData.metadata.address,
                        city: e.target.value,
                      },
                    },
                  })
                }
                required
                placeholder="City"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium">
                State
              </label>
              <Input
                id="state"
                value={formData.metadata.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      address: {
                        ...formData.metadata.address,
                        state: e.target.value,
                      },
                    },
                  })
                }
                required
                placeholder="State"
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
                value={formData.metadata.address.zipCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      address: {
                        ...formData.metadata.address,
                        zipCode: e.target.value,
                      },
                    },
                  })
                }
                required
                placeholder="Zip Code"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                Country
              </label>
              <Input
                id="country"
                value={formData.metadata.address.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      address: {
                        ...formData.metadata.address,
                        country: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Country"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="squareFeet" className="text-sm font-medium">
                Square Feet
              </label>
              <Input
                id="squareFeet"
                type="number"
                value={formData.metadata.squareFeet || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      squareFeet: Number(e.target.value),
                    },
                  })
                }
                min={0}
                placeholder="Square Feet"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="yearBuilt" className="text-sm font-medium">
                Year Built
              </label>
              <Input
                id="yearBuilt"
                type="number"
                value={formData.metadata.yearBuilt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      yearBuilt: Number(e.target.value),
                    },
                  })
                }
                min={1800}
                max={new Date().getFullYear()}
                placeholder="Year Built"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="bedrooms" className="text-sm font-medium">
                Bedrooms
              </label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.metadata.bedrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      bedrooms: Number(e.target.value),
                    },
                  })
                }
                min={0}
                placeholder="Bedrooms"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="bathrooms" className="text-sm font-medium">
                Bathrooms
              </label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.metadata.bathrooms || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      bathrooms: Number(e.target.value),
                    },
                  })
                }
                min={0}
                step={0.5}
                placeholder="Bathrooms"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lotSize" className="text-sm font-medium">
                Lot Size (acres)
              </label>
              <Input
                id="lotSize"
                type="number"
                value={formData.metadata.lotSize || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      lotSize: Number(e.target.value),
                    },
                  })
                }
                min={0}
                step={0.01}
                placeholder="Lot Size"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="purchaseValue" className="text-sm font-medium">
              Purchase Price
            </label>
            <Input
              id="purchaseValue"
              type="number"
              value={formData.purchaseValue || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchaseValue: Number(e.target.value),
                })
              }
              required
              min={0}
              placeholder="Purchase Price"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="purchaseDate" className="text-sm font-medium">
              Purchase Date
            </label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchaseDate: e.target.value,
                })
              }
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="appreciationRate" className="text-sm font-medium">
              Annual Appreciation Rate (%)
            </label>
            <Input
              id="appreciationRate"
              type="number"
              value={formData.metadata.appreciationRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    appreciationRate: Number(e.target.value),
                  },
                })
              }
              min={-10}
              max={20}
              step={0.1}
              placeholder="Annual Appreciation Rate"
              className="w-full"
            />
          </div>

          {/* Display calculated current value */}
          <div className="p-4 bg-muted rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Estimated Current Value:
              </span>
              <span className="text-lg font-bold">
                {formatTotalAmount(formData.currentValue)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {formData.metadata.appreciationRate}% annual appreciation
              over{" "}
              {(
                (new Date().getTime() -
                  new Date(formData.purchaseDate).getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
              ).toFixed(1)}{" "}
              years
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="propertyTax" className="text-sm font-medium">
                Annual Property Tax
              </label>
              <Input
                id="propertyTax"
                type="number"
                value={formData.metadata.propertyTax || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      propertyTax: Number(e.target.value),
                    },
                  })
                }
                min={0}
                placeholder="Annual Property Tax"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="insuranceCost" className="text-sm font-medium">
                Annual Insurance
              </label>
              <Input
                id="insuranceCost"
                type="number"
                value={formData.metadata.insuranceCost || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      insuranceCost: Number(e.target.value),
                    },
                  })
                }
                min={0}
                placeholder="Annual Insurance"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="maintenanceCost" className="text-sm font-medium">
                Annual Maintenance
              </label>
              <Input
                id="maintenanceCost"
                type="number"
                value={formData.metadata.maintenanceCost || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      maintenanceCost: Number(e.target.value),
                    },
                  })
                }
                min={0}
                placeholder="Annual Maintenance"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="rentalIncome" className="text-sm font-medium">
              Monthly Rental Income (if applicable)
            </label>
            <Input
              id="rentalIncome"
              type="number"
              value={formData.metadata.rentalIncome || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    rentalIncome: Number(e.target.value),
                  },
                })
              }
              min={0}
              placeholder="Monthly Rental Income"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Financing Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.metadata.financingType === "cash"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      metadata: {
                        ...formData.metadata,
                        financingType: "cash",
                      },
                    })
                  }
                  className="h-4 w-4"
                />
                <span>Cash</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.metadata.financingType === "mortgage"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      metadata: {
                        ...formData.metadata,
                        financingType: "mortgage",
                      },
                    })
                  }
                  className="h-4 w-4"
                />
                <span>Mortgage</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.metadata.financingType === "heloc"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      metadata: {
                        ...formData.metadata,
                        financingType: "heloc",
                      },
                    })
                  }
                  className="h-4 w-4"
                />
                <span>HELOC</span>
              </label>
            </div>
          </div>

          {formData.metadata.financingType !== "cash" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="interestRate" className="text-sm font-medium">
                    Interest Rate (%)
                  </label>
                  <Input
                    id="interestRate"
                    type="number"
                    value={formData.metadata.interestRate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          interestRate: Number(e.target.value),
                        },
                      })
                    }
                    min={0}
                    step={0.01}
                    placeholder="Interest Rate"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="monthlyPayment"
                    className="text-sm font-medium"
                  >
                    Monthly Payment
                  </label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    value={formData.metadata.monthlyPayment || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          monthlyPayment: Number(e.target.value),
                        },
                      })
                    }
                    min={0}
                    placeholder="Monthly Payment"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="loanTerm" className="text-sm font-medium">
                    Loan Term (months)
                  </label>
                  <Input
                    id="loanTerm"
                    type="number"
                    value={formData.metadata.loanTerm || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          loanTerm: Number(e.target.value),
                        },
                      })
                    }
                    min={0}
                    placeholder="Loan Term in Months"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Display financing progress when applicable */}
              {formData.metadata.monthlyPayment > 0 && (
                <div className="p-4 bg-muted rounded-md space-y-2">
                  {(() => {
                    const progress = calculateFinancingProgress(
                      formData.purchaseDate,
                      formData.metadata.monthlyPayment,
                      formData.metadata.interestRate,
                      formData.metadata.loanTerm,
                      formData.purchaseValue
                    );

                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Financing Progress
                          </span>
                          <span className="text-sm">
                            {progress.monthsPaid} of{" "}
                            {formData.metadata.loanTerm} months
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Total Paid:</span>
                            <span>{formatTotalAmount(progress.totalPaid)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Principal Paid:</span>
                            <span>
                              {formatTotalAmount(progress.principalPaid)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Interest Paid:</span>
                            <span>
                              {formatTotalAmount(progress.interestPaid)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>Remaining Balance:</span>
                            <span>
                              {formatTotalAmount(progress.remainingBalance)}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </form>
      </div>
      <div className="flex justify-end px-4 pb-4">
        <Button type="submit" form="real-estate-form">
          Add Property
        </Button>
      </div>
    </div>
  );
}

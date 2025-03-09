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

type FinancingType = 'cash' | 'finance' | 'lease';

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
    const yearsElapsed = (currentDateTime - purchaseDateTime) / millisecondsPerYear;
    
    // If the purchase date is in the future, return the purchase price
    if (yearsElapsed < 0) return purchasePrice;
    
    // Calculate depreciated value using compound depreciation
    const currentValue = purchasePrice * Math.pow(1 - (depreciationRate / 100), yearsElapsed);
    
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
    if (!purchaseDate || !monthlyPayment || !interestRate || !loanTerm || !purchaseValue) {
        return {
            monthsPaid: 0,
            totalPaid: 0,
            principalPaid: 0,
            interestPaid: 0,
            remainingBalance: purchaseValue
        };
    }

    const monthlyInterestRate = (interestRate / 100) / 12;
    const purchaseDateTime = new Date(purchaseDate).getTime();
    const currentDateTime = new Date().getTime();
    const monthsPaid = Math.min(
        Math.floor((currentDateTime - purchaseDateTime) / (1000 * 60 * 60 * 24 * 30.44)),
        loanTerm
    );

    let remainingBalance = purchaseValue;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    // Calculate amortization for each month that has passed
    for (let month = 0; month < monthsPaid; month++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
        
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;
        remainingBalance -= principalPayment;
    }

    return {
        monthsPaid,
        totalPaid: monthsPaid * monthlyPayment,
        principalPaid: totalPrincipalPaid,
        interestPaid: totalInterestPaid,
        remainingBalance
    };
};

export default function VehicleForm() {
    const { addAsset } = useAssets();
    const router = useRouter();
    const [formData, setFormData] = useState({
        userId: "user1", // Default user ID
        type: AssetType.VEHICLE,
        name: "",
        purchaseValue: 0,
        currentValue: 0, // This will be calculated automatically
        purchaseDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        metadata: {
            make: "",
            model: "",
            year: new Date().getFullYear(),
            licensePlate: "",
            vin: "",
            condition: "good",
            color: "",
            mileage: 0,
            financingType: "cash" as FinancingType,
            interestRate: 0,
            monthlyPayment: 0,
            loanTerm: 0, // in months
            depreciationRate: 15, // default 15% annual depreciation
        }
    });

    // Calculate current value whenever relevant fields change
    useEffect(() => {
        const currentValue = calculateCurrentValue(
            formData.purchaseValue,
            formData.purchaseDate,
            formData.metadata.depreciationRate
        );
        
        setFormData(prev => ({
            ...prev,
            currentValue
        }));
    }, [formData.purchaseValue, formData.purchaseDate, formData.metadata.depreciationRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Generate a name if not provided
        const vehicleName = formData.name || 
            `${formData.metadata.year} ${formData.metadata.make} ${formData.metadata.model}`;
        
        // Calculate current value one more time before submitting
        const currentValue = calculateCurrentValue(
            formData.purchaseValue,
            formData.purchaseDate,
            formData.metadata.depreciationRate
        );
        
        // Prepare the asset data
        const assetData = {
            ...formData,
            name: vehicleName,
            currentValue
        };
        
        // Add the vehicle as an asset and get the new asset ID
        const newAssetId = addAsset(assetData);

        // Find and close the dialog using the DialogClose component
        const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
        if (closeButton) {
            closeButton.click();
        }

        // Reset form
        setFormData({
            userId: "user1",
            type: AssetType.VEHICLE,
            name: "",
            purchaseValue: 0,
            currentValue: 0,
            purchaseDate: new Date().toISOString().split('T')[0],
            metadata: {
                make: "",
                model: "",
                year: new Date().getFullYear(),
                licensePlate: "",
                vin: "",
                condition: "good",
                color: "",
                mileage: 0,
                financingType: "cash" as FinancingType,
                interestRate: 0,
                monthlyPayment: 0,
                loanTerm: 0,
                depreciationRate: 15,
            }
        });

        // Redirect to the new asset's details page
        router.push(`/assets/${newAssetId}`);
    };

    return (
        <div className="flex flex-col h-[60vh] max-h-[60vh]">
            <div className="flex-1 overflow-y-auto px-4 pb-6">
                <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-6 py-2">
                    <div className="space-y-2">
                        <label htmlFor="make" className="text-sm font-medium">Make</label>
                        <Input
                            id="make"
                            value={formData.metadata.make}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        make: e.target.value 
                                    } 
                                })
                            }
                            required
                            placeholder="Toyota, Honda, Ford, etc."
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="model" className="text-sm font-medium">Model</label>
                        <Input
                            id="model"
                            value={formData.metadata.model}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        model: e.target.value 
                                    } 
                                })
                            }
                            required
                            placeholder="Camry, Civic, F-150, etc."
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="year" className="text-sm font-medium">Year</label>
                        <Input
                            id="year"
                            type="number"
                            value={formData.metadata.year}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        year: Number(e.target.value) 
                                    } 
                                })
                            }
                            required
                            min={1900}
                            max={new Date().getFullYear() + 1}
                            className="w-full"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="licensePlate" className="text-sm font-medium">License Plate</label>
                            <Input
                                id="licensePlate"
                                value={formData.metadata.licensePlate}
                                onChange={(e) =>
                                    setFormData({ 
                                        ...formData, 
                                        metadata: { 
                                            ...formData.metadata, 
                                            licensePlate: e.target.value 
                                        } 
                                    })
                                }
                                placeholder="Optional"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="vin" className="text-sm font-medium">VIN</label>
                            <Input
                                id="vin"
                                value={formData.metadata.vin}
                                onChange={(e) =>
                                    setFormData({ 
                                        ...formData, 
                                        metadata: { 
                                            ...formData.metadata, 
                                            vin: e.target.value 
                                        } 
                                    })
                                }
                                placeholder="Optional"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="color" className="text-sm font-medium">Color</label>
                        <Input
                            id="color"
                            value={formData.metadata.color}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        color: e.target.value 
                                    } 
                                })
                            }
                            placeholder="Optional"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="mileage" className="text-sm font-medium">Mileage</label>
                        <Input
                            id="mileage"
                            type="number"
                            value={formData.metadata.mileage}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        mileage: Number(e.target.value) 
                                    } 
                                })
                            }
                            min={0}
                            placeholder="Optional"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="purchaseDate" className="text-sm font-medium">Purchase Date</label>
                        <Input
                            id="purchaseDate"
                            type="date"
                            value={formData.purchaseDate}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    purchaseDate: e.target.value 
                                })
                            }
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="purchaseValue" className="text-sm font-medium">Purchase Price</label>
                        <Input
                            id="purchaseValue"
                            type="number"
                            value={formData.purchaseValue}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    purchaseValue: Number(e.target.value) 
                                })
                            }
                            required
                            min={0}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="depreciationRate" className="text-sm font-medium">Annual Depreciation Rate (%)</label>
                        <Input
                            id="depreciationRate"
                            type="number"
                            value={formData.metadata.depreciationRate}
                            onChange={(e) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        depreciationRate: Number(e.target.value) 
                                    } 
                                })
                            }
                            required
                            min={0}
                            max={100}
                            className="w-full"
                        />
                    </div>

                    {/* Display calculated current value */}
                    <div className="p-4 bg-muted rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Estimated Current Value:</span>
                            <span className="text-lg font-bold">{formatTotalAmount(formData.currentValue)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on {formData.metadata.depreciationRate}% annual depreciation over {
                                ((new Date().getTime() - new Date(formData.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
                            } years
                        </p>
                    </div>

                    {/* Display financing progress when applicable */}
                    {formData.metadata.financingType !== 'cash' && formData.metadata.monthlyPayment > 0 && (
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
                                            <span className="text-sm font-medium">Financing Progress</span>
                                            <span className="text-sm">{progress.monthsPaid} of {formData.metadata.loanTerm} months</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>Total Paid:</span>
                                                <span>{formatTotalAmount(progress.totalPaid)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Principal Paid:</span>
                                                <span>{formatTotalAmount(progress.principalPaid)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Interest Paid:</span>
                                                <span>{formatTotalAmount(progress.interestPaid)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>Remaining Balance:</span>
                                                <span>{formatTotalAmount(progress.remainingBalance)}</span>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Financing Type</label>
                        <Select
                            value={formData.metadata.financingType}
                            onValueChange={(value: string) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        financingType: value as FinancingType 
                                    } 
                                })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select financing type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="lease">Lease</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.metadata.financingType !== 'cash' && (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="interestRate" className="text-sm font-medium">Interest Rate (%)</label>
                                <Input
                                    id="interestRate"
                                    type="number"
                                    step="0.01"
                                    value={formData.metadata.interestRate}
                                    onChange={(e) =>
                                        setFormData({ 
                                            ...formData, 
                                            metadata: { 
                                                ...formData.metadata, 
                                                interestRate: Number(e.target.value) 
                                            } 
                                        })
                                    }
                                    min={0}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="monthlyPayment" className="text-sm font-medium">Monthly Payment</label>
                                <Input
                                    id="monthlyPayment"
                                    type="number"
                                    step="0.01"
                                    value={formData.metadata.monthlyPayment}
                                    onChange={(e) =>
                                        setFormData({ 
                                            ...formData, 
                                            metadata: { 
                                                ...formData.metadata, 
                                                monthlyPayment: Number(e.target.value) 
                                            } 
                                        })
                                    }
                                    min={0}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="loanTerm" className="text-sm font-medium">
                                    {formData.metadata.financingType === 'finance' ? 'Loan Term (months)' : 'Lease Term (months)'}
                                </label>
                                <Input
                                    id="loanTerm"
                                    type="number"
                                    value={formData.metadata.loanTerm}
                                    onChange={(e) =>
                                        setFormData({ 
                                            ...formData, 
                                            metadata: { 
                                                ...formData.metadata, 
                                                loanTerm: Number(e.target.value) 
                                            } 
                                        })
                                    }
                                    min={0}
                                    className="w-full"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="condition" className="text-sm font-medium">Condition</label>
                        <Select
                            value={formData.metadata.condition}
                            onValueChange={(value) =>
                                setFormData({ 
                                    ...formData, 
                                    metadata: { 
                                        ...formData.metadata, 
                                        condition: value 
                                    } 
                                })
                            }
                        >
                            <SelectTrigger id="condition" className="w-full">
                                <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                                <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </form>
            </div>
            
            <div className="sticky bottom-0 pt-4 pb-4 px-4 bg-background border-t mt-4">
                <Button type="submit" form="vehicle-form" className="w-full">
                    Add Vehicle
                </Button>
            </div>
        </div>
    );
} 
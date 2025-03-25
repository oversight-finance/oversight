import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/contexts/AccountsContext";
import { toast } from "@/hooks/use-toast";
import { AccountType, CryptoWallet } from "@/types/Account";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Define common cryptocurrencies for the dropdown
const commonCoins = [
  "BTC",
  "ETH",
  "BNB",
  "XRP",
  "DOGE",
  "ADA",
  "SOL",
  "DOT",
  "LINK",
  "AVAX",
  "MATIC",
  "UNI",
  "LTC",
  "ATOM",
  "FIL",
  "AAVE",
  "ALGO",
  "XLM",
  "XMR",
  "USDT",
  "USDC",
  "DAI",
];

export default function CryptoWalletForm() {
  const { addAccount } = useAccounts();
  const { getUserId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_name: "",
    wallet_address: "",
    coin_symbol: "",
    balance: 0,
  });
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userId = await getUserId();

      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not available. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const wallet = {
        user_id: userId,
        account_type: AccountType.CRYPTO,
        account_name: formData.account_name,
        wallet_address: formData.wallet_address || undefined,
        coin_symbol: formData.coin_symbol.toUpperCase(),
        balance: formData.balance,
      };

      const result = await addAccount(wallet as CryptoWallet);

      if (result) {
        toast({
          title: "Success",
          description: "Crypto wallet added successfully",
        });

        // Close the dialog using the DialogClose ref
        if (dialogCloseRef.current) {
          dialogCloseRef.current.click();
        }

        // Reset form
        setFormData({
          account_name: "",
          wallet_address: "",
          coin_symbol: "",
          balance: 0,
        });

        router.push(`/accounts/crypto/${result.id}`);
      } else {
        throw new Error("Failed to create wallet");
      }
    } catch (error) {
      console.error("Error creating crypto wallet:", error);
      toast({
        title: "Error",
        description: "Failed to create crypto wallet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-2"
    >
      <div className="space-y-2">
        <label htmlFor="account_name">Wallet Name</label>
        <Input
          id="account_name"
          value={formData.account_name}
          onChange={(e) =>
            setFormData({ ...formData, account_name: e.target.value })
          }
          placeholder="My Bitcoin Wallet"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="coin_symbol">Coin Symbol</label>
        <Input
          id="coin_symbol"
          value={formData.coin_symbol}
          onChange={(e) =>
            setFormData({ ...formData, coin_symbol: e.target.value })
          }
          placeholder="BTC"
          list="coin-options"
          required
        />
        <datalist id="coin-options">
          {commonCoins.map((coin) => (
            <option key={coin} value={coin} />
          ))}
        </datalist>
        <p className="text-sm text-muted-foreground">
          Enter a symbol like BTC for Bitcoin, ETH for Ethereum, etc.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="wallet_address">Wallet Address</label>
        <Input
          id="wallet_address"
          value={formData.wallet_address}
          onChange={(e) =>
            setFormData({ ...formData, wallet_address: e.target.value })
          }
          placeholder="0x123..."
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="balance">Current Balance</label>
        <Input
          id="balance"
          type="number"
          step="any"
          min="0"
          value={formData.balance}
          onChange={(e) =>
            setFormData({ ...formData, balance: Number(e.target.value) })
          }
          placeholder="0.00"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Crypto Wallet"}
      </Button>
    </form>
  );
}

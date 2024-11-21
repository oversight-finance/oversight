"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Link as LinkIcon } from "lucide-react"
import { useAccounts } from "@/contexts/AccountsContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type LinkingState = "initial" | "loading" | "linking" | "success"

export default function Accounts() {
  const { addAccount } = useAccounts()
  const [open, setOpen] = useState(false)
  const [linkingState, setLinkingState] = useState<LinkingState>("initial")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountType, setAccountType] = useState("checking")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (bankName && accountNumber) {
      setLinkingState("loading")
      // Simulate analyzing credentials
      await new Promise(resolve => setTimeout(resolve, 1500))
      setLinkingState("linking")
      // Simulate bank connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Add the account to context
      addAccount({
        bankName,
        accountNumber,
        accountType,
        balance: Math.random() * 10000, // Simulated balance
      })
      setLinkingState("success")
    }
  }

  const handleClose = () => {
    setOpen(false)
    // Reset state after dialog animation completes
    setTimeout(() => {
      setLinkingState("initial")
      setBankName("")
      setAccountNumber("")
    }, 300)
  }

  const renderContent = () => {
    switch (linkingState) {
      case "loading":
        return (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-lg font-medium">Analyzing credentials...</div>
              <div className="text-sm text-muted-foreground animate-pulse">
                Verifying your banking information
              </div>
            </div>
          </Card>
        )

      case "linking":
        return (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <LinkIcon className="h-4 w-4 absolute bottom-0 right-0 animate-pulse text-primary" />
              </div>
              <div className="text-lg font-medium">Connecting to {bankName}...</div>
              <div className="text-sm text-muted-foreground animate-pulse">
                Establishing secure connection
              </div>
            </div>
          </Card>
        )

      case "success":
        return (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <CheckCircle2 className="h-8 w-8 text-success animate-in zoom-in" />
              <div className="text-lg font-medium">Successfully Connected!</div>
              <div className="text-sm text-muted-foreground">
                Your account has been linked successfully
              </div>
              <Button onClick={handleClose} className="mt-4">
                Done
              </Button>
            </div>
          </Card>
        )

      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Enter your bank name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter your account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4">
                Link Account
              </Button>
            </Card>
            <div className="text-sm text-muted-foreground text-center">
              Your credentials are encrypted and secure
            </div>
          </form>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="w-full">
          <Button variant="ghost" className="w-full justify-start">
            <span>Link Accounts</span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Your Bank Account</DialogTitle>
          <DialogDescription>
            Connect your bank account to automatically track your transactions
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
} 
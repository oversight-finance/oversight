import { createContext, useContext, useState } from "react"

export interface LinkedAccount {
  id: string
  bankName: string
  accountNumber: string
  accountType: string
  balance: number
  lastUpdated: Date
}

interface AccountsContextType {
  accounts: LinkedAccount[]
  addAccount: (account: Omit<LinkedAccount, "id" | "lastUpdated">) => void
  removeAccount: (id: string) => void
  updateAccount: (id: string, updates: Partial<LinkedAccount>) => void
}

const AccountsContext = createContext<AccountsContextType | null>(null)

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])

  const addAccount = (newAccount: Omit<LinkedAccount, "id" | "lastUpdated">) => {
    setAccounts(current => [...current, {
      ...newAccount,
      id: crypto.randomUUID(),
      lastUpdated: new Date()
    }])
  }

  const removeAccount = (id: string) => {
    setAccounts(current => current.filter(account => account.id !== id))
  }

  const updateAccount = (id: string, updates: Partial<LinkedAccount>) => {
    setAccounts(current => current.map(account => 
      account.id === id ? { ...account, ...updates } : account
    ))
  }

  return (
    <AccountsContext.Provider value={{ accounts, addAccount, removeAccount, updateAccount }}>
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts() {
  const context = useContext(AccountsContext)
  if (!context) {
    throw new Error("useAccounts must be used within an AccountsProvider")
  }
  return context
} 
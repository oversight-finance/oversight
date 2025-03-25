-- Users Table
-- This table holds additional user information and references auth.users.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  PRIMARY KEY (id)
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Accounts Tables
-- Represents financial accounts for each user.
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  account_type account_type NOT NULL,
  balance numeric(12, 2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Bank Accounts Table
-- Represents financial bank accounts for each user.
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  account_number text NOT NULL,
  routing_number text NOT NULL,
  currency text DEFAULT 'CAD',
  balance numeric(12, 2) NOT NULL,
  PRIMARY KEY (account_id)
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Bank Accounts Transactions Table
-- Represents financial bank accounts transactions for each user.
CREATE TABLE IF NOT EXISTS public.bank_accounts_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  account_id uuid NOT NULL REFERENCES public.bank_accounts(account_id) ON DELETE CASCADE,
  transaction_date timestamptz DEFAULT now() NOT NULL,
  amount numeric(12, 2) NOT NULL,
  merchant text,
  category text,
  FOREIGN KEY (account_id) REFERENCES public.bank_accounts(account_id) ON DELETE CASCADE
);

ALTER TABLE public.bank_accounts_transactions ENABLE ROW LEVEL SECURITY;


-- Recurring Schedules Table
-- Represents recurring financial events like bill payments or income
CREATE TABLE IF NOT EXISTS public.recurring_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  frequency text NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
  start_date date NOT NULL,
  end_date date,
  payment_method text,
  default_amount numeric(12, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;

-- Crypto Accounts Table
-- Represents cryptocurrency accounts for each user
CREATE TABLE IF NOT EXISTS public.crypto_wallets (
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  coin_symbol text NOT NULL,  -- e.g., 'BTC', 'ETH', 'SOL'
  wallet_address text,
  balance numeric(16, 8) NOT NULL, -- Higher precision for crypto amounts
  PRIMARY KEY (account_id)
);
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

-- Crypto Accounts Transactions Table
-- Represents cryptocurrency transactions for each user
CREATE TABLE IF NOT EXISTS public.crypto_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.crypto_wallets(account_id) ON DELETE CASCADE,
  transaction_date timestamptz DEFAULT now() NOT NULL,
  amount numeric(16, 8) NOT NULL, -- Crypto amount
  price_at_transaction numeric(16, 2) NOT NULL, -- Price in fiat at transaction time
  fee numeric(12, 2), -- Transaction fee
  FOREIGN KEY (account_id) REFERENCES public.crypto_wallets(account_id) ON DELETE CASCADE
);
ALTER TABLE public.crypto_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Investment Accounts Table
-- Represents investment accounts like RRSP, TFSA, and general investment accounts
CREATE TABLE IF NOT EXISTS public.investment_accounts (
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  account_type text NOT NULL, -- e.g., 'RRSP', 'TFSA', 'General'
  institution text NOT NULL,
  account_number text,
  contribution_room numeric(12, 2), -- For registered accounts like RRSP, TFSA
  balance numeric(12, 2) NOT NULL,
  currency text DEFAULT 'CAD',
  PRIMARY KEY (account_id)
);
ALTER TABLE public.investment_accounts ENABLE ROW LEVEL SECURITY;

-- Investment Transactions Table
-- Represents transactions in investment accounts (buys, sells, dividends, etc.)
CREATE TABLE IF NOT EXISTS public.investment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.investment_accounts(account_id) ON DELETE CASCADE,
  transaction_date timestamptz DEFAULT now() NOT NULL,
  transaction_type text NOT NULL, -- e.g., 'buy', 'sell', 'dividend', 'contribution', 'withdrawal'
  ticker_symbol text, -- Stock/ETF symbol if applicable
  quantity numeric(16, 6), -- Number of shares/units
  price_per_unit numeric(12, 4), -- Price per share/unit
  amount numeric(12, 2) NOT NULL, -- Total transaction amount
  fee numeric(12, 2), -- Commission or transaction fee
  currency text DEFAULT 'CAD',
  FOREIGN KEY (account_id) REFERENCES public.investment_accounts(account_id) ON DELETE CASCADE
);
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;


-- Vehicles Table
-- Stores information about user-owned vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  purchase_price numeric(12, 2),
  current_value numeric(12, 2),
  purchase_date date,
  vin text,
  currency text DEFAULT 'CAD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Real Estate Table
-- Stores information about user-owned real estate properties
CREATE TABLE IF NOT EXISTS public.real_estate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_type text NOT NULL, -- e.g., 'residential', 'commercial', 'land'
  address text NOT NULL,
  purchase_price numeric(12, 2) NOT NULL,
  current_value numeric(12, 2) NOT NULL,
  purchase_date date NOT NULL,
  mortgage_balance numeric(12, 2),
  mortgage_interest_rate numeric(5, 3),
  mortgage_term_years integer,
  property_tax_annual numeric(12, 2),
  currency text DEFAULT 'CAD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.real_estate ENABLE ROW LEVEL SECURITY;

-- Budgets Table
-- Stores user-defined budget limits for different spending categories.
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL, -- Comma-separated list of categories
  budget_name text NOT NULL,
  budget_amount numeric(12, 2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.budgets IS 'Stores user-defined budget limits for different spending categories.';
COMMENT ON COLUMN public.budgets.category IS 'Comma-separated list of categories (e.g., "Groceries,Dining,Entertainment")';


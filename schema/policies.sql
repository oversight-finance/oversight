-- RLS policy for users table - only allow users to view and edit their own data
CREATE POLICY users_policy
  ON public.users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS policy for accounts table - only allow users to view and edit their own accounts
CREATE POLICY accounts_policy
  ON public.accounts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policy for bank_accounts table - only allow users to view and edit bank accounts 
-- linked to accounts they own
CREATE POLICY bank_accounts_policy
  ON public.bank_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = bank_accounts.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = bank_accounts.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- Row Level Security Policy for bank_accounts_transactions
-- Only allow users to read transactions for accounts they own
CREATE POLICY bank_accounts_transactions_all_operations_policy
  ON public.bank_accounts_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = bank_accounts_transactions.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = bank_accounts_transactions.account_id
      AND accounts.user_id = auth.uid()
    )
  );


-- RLS policy for recurring_schedules table - only allow users to view and edit their own schedules
CREATE POLICY recurring_schedules_policy
  ON public.recurring_schedules
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policy for crypto_wallets table - only allow users to view and edit crypto wallets
-- linked to accounts they own
CREATE POLICY crypto_wallets_policy
  ON public.crypto_wallets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = crypto_wallets.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = crypto_wallets.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- RLS policy for crypto_wallet_transactions - only allow users to view and edit transactions
-- for crypto wallets they own
CREATE POLICY crypto_wallet_transactions_policy
  ON public.crypto_wallet_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = crypto_wallet_transactions.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = crypto_wallet_transactions.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- RLS policy for vehicles table - only allow users to view and edit their own vehicles
CREATE POLICY vehicles_policy
  ON public.vehicles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policy for real_estate table - only allow users to view and edit their own properties
CREATE POLICY real_estate_policy
  ON public.real_estate
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policy for investment_accounts table - only allow users to view and edit their own investment accounts
CREATE POLICY investment_accounts_policy
  ON public.investment_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = investment_accounts.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = investment_accounts.account_id
      AND accounts.user_id = auth.uid()
    )
  );

-- RLS policy for investment_transactions table - only allow users to view and edit transactions
-- for investment accounts they own
CREATE POLICY investment_transactions_policy
  ON public.investment_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      JOIN public.investment_accounts ON accounts.id = investment_accounts.account_id
      WHERE investment_accounts.account_id = investment_transactions.account_id
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      JOIN public.investment_accounts ON accounts.id = investment_accounts.account_id
      WHERE investment_accounts.account_id = investment_transactions.account_id
      AND accounts.user_id = auth.uid()
    )
  );

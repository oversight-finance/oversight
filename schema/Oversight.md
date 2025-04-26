# **Oversight: Comprehensive Financial Tracking App Specification (Canada)**

## **1. Introduction and Overview**  
Oversight is a full-featured personal finance tracking application tailored for Canadian users. It consolidates diverse assets – bank accounts, crypto holdings, investments, vehicles, real estate, and other asset types – into a single dashboard for holistic financial oversight. The app supports multi-currency tracking (CAD, USD, and cryptocurrencies) and provides rich analytics on portfolio performance and spending patterns. A core emphasis is placed on user privacy (PIPEDA compliance) and security, using Supabase with Row-Level Security (RLS) to ensure that each user’s data is isolated and protected. Oversight’s design and UX draw inspiration from Palantir’s aesthetic: a sleek dark-mode interface with elegant, data-dense visuals and subtle animations via Framer Motion. Key features include:  

- **Unified Asset Tracking:** Link bank accounts, on-chain crypto wallets, exchange-based crypto accounts, investment accounts, vehicle valuations (via VIN), real estate valuations, and manually-defined assets.  
- **Multi-Currency Support:** Track balances in CAD, USD, and crypto, with conversion and aggregation for a unified net worth view. Historical performance is measured with accurate currency conversions over time.  
- **Transaction Ingestion:** Import transactions from multiple sources – via Plaid API (for banks/brokerages), by uploading statements (PDF or CSV), or by manual entry. The system intelligently de-duplicates transactions across sources and merges data for accuracy.  
- **On-Demand Updates:** Account data is fetched or refreshed only when prompted by the user (no automatic background sync unless user triggers it), giving users control over when to pull new data.  
- **Spending Analytics:** Provide detailed spending analysis with categorizations, budgets, and visualizations (e.g. category-wise pie charts and spending trends over time). The app categorizes expenses/income and presents insights into cash flow.  
- **Portfolio Performance Analytics:** Compute full historical performance of the user’s portfolio, including metrics like average purchase price for assets, holding period return (HPR) for investments, time-weighted returns, and other financial KPIs. Display growth charts and ROI for each asset class and the overall portfolio.  
- **Scenario Simulation & AI Advisor:** Offer a powerful “what-if” financial simulator where users can model future decisions (e.g. investing in BTC, buying a house, paying down debt) and project their impact on net worth and cash flow. An integrated AI assistant guides decision-making by analyzing scenarios and providing personalized insights or suggestions (e.g. highlighting risks, comparing options).  
- **Tech Stack:** Use **Next.js** (React/TypeScript) for the frontend, ensuring a fast, SEO-friendly, and responsive web application. Use **Supabase** (PostgreSQL database + Auth) as the backend BaaS, leveraging Supabase’s authentication and row-level security for data protection. The UI will be styled in a modern dark theme (Palantir-like), using component libraries and custom CSS for a polished look, with **Framer Motion** for interactive animations.  
- **Security & Privacy:** All sensitive data is secured. Supabase RLS policies ensure each user can only access their own records ([Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=Row%20Level%20Security%20in%20Supabase)) ([Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=alter%20table%20,security)). The app complies with Canadian privacy law (PIPEDA), meaning user consent is obtained for data access (e.g. linking accounts), personal data is stored in Canada or in compliance with cross-border data handling rules, and users can request data deletion. Sensitive fields (like bank access tokens or API keys) are encrypted at rest.  
- **Roles & Pricing:** Oversight will implement role-based access controls to enable a freemium model. **Free users** get core tracking and analytics features, whereas **Premium users** unlock advanced tools like scenario simulation, AI-driven advice, unlimited account connections, and potentially certain integrations (e.g. detailed property valuation reports). Supabase’s role management and RLS will be used to enforce feature access by role.  

This document details the product and technical design of Oversight. It covers system architecture, data model, third-party integrations (Plaid, VinAudit, Houski, crypto APIs), transaction parsing/deduplication logic, analytics engine design, scenario planning module (with AI integration), security and privacy considerations, and UI/UX design guidelines. The specification is organized to provide a clear blueprint for implementation, and is suitable for use with AI-assisted development tools (such as Vercel’s v0) to accelerate the build process.  

## **2. System Architecture**  
 ([image]()) *Figure 1: High-level architecture of Oversight. The Next.js frontend communicates with Supabase and external financial APIs. All sensitive data is stored in Supabase (managed Postgres) with row-level security, and third-party integrations (Plaid, Houski, etc.) are accessed via secure server functions.*  

Oversight is structured as a modern **full-stack web application** with a decoupled frontend and backend, leveraging serverless principles for scalability. The **frontend** is a Next.js application (deployed on Vercel) that delivers both the UI and, via Next.js API routes, the backend integration logic. The **backend** consists of Supabase (which provides a Postgres database, authentication, and file storage) and a set of third-party service APIs for data integration. Below is an overview of the architecture and component responsibilities:

- **Next.js Frontend (Client-side):** The user interface is built with React components. It communicates with the backend in two ways: (1) directly querying Supabase for most database reads/writes (using the Supabase JavaScript client with user’s JWT for authenticated requests), and (2) calling Next.js API routes (serverless functions) for actions that involve third-party APIs or sensitive operations (e.g. exchanging Plaid tokens, parsing uploaded files). The frontend is responsible for rendering views (dashboards, forms, charts) and handling user interactions (e.g. initiating a data refresh or running a simulation). It also embeds **Plaid Link** on the client side for secure bank account linking (Plaid Link runs in the user’s browser for credential input). The frontend includes the navigation and UI logic to enable/disable features based on the user’s role (free vs premium) and to trigger authentication flows.  

- **Next.js API Routes (Server Functions):** These act as the application’s custom backend logic, running on the server side (within the Next.js app). They handle integration with external services and any operation that should not expose secrets to the client. For example: an API route will receive a Plaid `public_token` from the frontend and then use server-side Plaid credentials to exchange it for an `access_token` and retrieve account data. Similarly, API routes fetch data from **Houski** (property data), **VinAudit** (vehicle data), and crypto APIs. They also process file uploads (PDF/CSV parsing) and perform heavy computations (e.g. running a financial simulation or invoking the AI advisor). After processing, these routes will write to/read from the Supabase database as needed (using either the Supabase server SDK or direct SQL queries) and return results to the frontend. The Next.js server functions ensure that third-party API keys (Plaid secret, etc.) are never exposed on the client.

- **Supabase Backend (Database & Auth):** Supabase provides a hosted Postgres database with an authentication layer. Each user of Oversight will authenticate via Supabase Auth (email/password or OAuth social login, as enabled). Supabase manages user accounts and issues a JSON Web Token (JWT) upon login, which the frontend uses for subsequent requests. We enable **Row-Level Security (RLS)** on all database tables to enforce that users can only access their own data ([Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=Row%20Level%20Security%20in%20Supabase)). Custom RLS policies will match the `user_id` field on records to the logged-in user’s UID (from the JWT) for every query – this provides an additional **server-side authorization** check on top of the app logic. The database schema (detailed in Section 3) includes tables for accounts, transactions, asset values, scenarios, etc. Supabase also includes a Storage bucket, which we use to securely store any uploaded documents (like PDF statements), protected by access rules (so only the owning user or authorized server functions can read them). Supabase’s integration with Postgres means we can also utilize **SQL** and **Postgres extensions** as needed (for example, pgcrypto for encryption, or PostGIS if location data was used – though not in our case). The backend may also use **Supabase Edge Functions** (if complex logic needs to run closer to the database), but generally Next.js API routes suffice. All data in Supabase is automatically backed up and encrypted at rest by the platform.  

- **External APIs and Integrations:** Oversight integrates with several third-party services for live data:
  - **Plaid API (Bank & Investment Data):** Used to link users’ bank accounts and investment accounts. Plaid Link (web SDK) is loaded in the frontend to let users securely input bank credentials. The Next.js API then exchanges the temporary token for a permanent access token and fetches account balances and transactions via Plaid endpoints. Plaid provides bank **transaction data, balances, account names/types, and if available, investment holdings**. We store these in our database for the user. (See Section 4 for details on Plaid integration.)
  - **Cryptocurrency APIs:** For on-chain wallets, Oversight connects to public blockchain APIs or block explorer services (e.g. Etherscan, Blockchair, or libraries like web3.js for Ethereum) to fetch wallet balances and possibly transaction history. For exchange accounts, we either connect via Plaid (Plaid has beta support for some crypto exchanges) or allow the user to enter API keys for popular exchanges (Coinbase, Binance, etc.) and use those exchanges’ APIs. These calls are made server-side for security. We aggregate crypto holdings and prices in real-time (using a price API like CoinGecko for current CAD/USD rates of crypto) so that the portfolio reflects current market value.
  - **VinAudit API (Vehicle Values):** For vehicle assets, Oversight uses VinAudit’s **Vehicle Market Value API** to get real-time valuations by VIN. When a user adds a vehicle asset, they input the VIN; the server calls VinAudit to retrieve market pricing (low, average, high values) for that make/model/year ([Vehicle Market Value API - VinAudit](https://www.vinaudit.com/vehicle-market-value-api#:~:text=VinAudit%27s%20Vehicle%20Market%20Value%20API,dataset%20from%20retailer%20listings%20nationwide)). The returned value is stored as the vehicle’s current valuation and updated on user request (since car values depreciate over time).
  - **Houski API (Real Estate Data):** For real estate, Oversight integrates with Houski’s property data API to fetch home value estimates. A user can input a property address or identifier, and the server queries Houski to get details like the latest appraised value or market estimate for that property ([Real estate data API for developers - Houski](https://www.houski.ca/property-api#:~:text=Access%20detailed%20property%20data%20for,anyone%20can%20use%20our)). This provides an up-to-date valuation of the user’s real estate assets. We store the property’s current value and can periodically (or on-demand) update it via the API to reflect market changes. Houski can also provide historical trends, which we might use for scenario analysis or displaying how the property’s value changed over time.
  - **Other Assets:** For any asset types not covered by an API (e.g. jewelry, collectibles, private investments), the user can manually input an asset with a name, value, and optional details. These are stored in the database and can be updated manually. They will be included in the overall portfolio calculations but won’t have an automatic update source.

All these components work together to deliver a seamless experience. The user’s browser communicates mostly with the Next.js frontend and directly with Supabase (for quick data fetching using Supabase’s JavaScript client). For sensitive operations, the browser makes a request to a protected Next.js API route, which performs server-side logic and interacts with the external APIs and database. This separation ensures that secret keys (Plaid secrets, API tokens, etc.) remain in server-side code and environment variables, never in the client. 

**Scalability & Deployment:** Next.js (and its serverless API routes) will be deployed on a platform like Vercel, which can autoscale to handle traffic. Supabase is a managed service that scales the Postgres instance and provides redundant storage. The stateless nature of the frontend and serverless functions means we can handle many concurrent users; heavy computations (like parsing a big PDF or running a simulation) can be offloaded to serverless functions or queued tasks if needed. We will implement caching where appropriate (e.g. caching API responses for a short time, or storing historical price data to avoid frequent external calls). However, since data is only refreshed on user action, load is user-driven. For example, when a user clicks “Refresh accounts,” a flurry of API calls (Plaid, etc.) happens, but this is on-demand per user. We ensure that each such operation is efficient and perhaps rate-limited to avoid hitting API usage caps. 

**Data Model Summary:** (Detailed schema in Section 3) The core database entities include **User**, **Account**, **Transaction**, **Asset/Valuation**, **Category**, and **Scenario**. Every record created is tagged with the owning user’s ID for RLS enforcement. We use foreign keys to maintain referential integrity (e.g. transactions link to an account; accounts link to a user). By centralizing data in Postgres, we can easily join and query across asset types to produce consolidated reports. The data model is designed to accommodate new asset types or integrations in the future by either adding new account types or new tables related to the accounts.  

## **3. Data Model and Backend Schema**  
Oversight’s database (Supabase/Postgres) is organized to store a wide variety of financial data in a normalized way. All tables in the default `public` schema have Row-Level Security enabled, with policies ensuring only the owner user can read/write their data. Below is an outline of the major tables and their roles:

- **users:** Supabase’s auth system provides a `users` table (with unique `id` for each user). We may extend it with a **Profiles** table that includes additional info like `full_name`, `email` (also in auth), and a `role` field (e.g. “free” or “premium”). The `Profiles` table would reference the Supabase user `id` and include any user preferences (like preferred currency, etc.). Role is used for feature gating in the app. (Supabase can also include custom claims in the JWT for role, or we simply fetch the profile after login.)

- **accounts:** Stores financial accounts and assets tracked by the user. This is a central table that can represent various asset types. Key fields: `id` (PK), `user_id` (FK to users), `type` (enum or text – e.g. “bank”, “credit_card”, “investment”, “crypto_wallet”, “crypto_exchange”, “property”, “vehicle”, “other”), `name` (user-defined or fetched name like “RBC Chequing” or “Coinbase Wallet”), `currency` (e.g. CAD, USD, BTC, ETH, etc.), `balance` (latest balance/value), `last_updated` timestamp, and relevant **identifiers** depending on type. For example, for bank accounts linked via Plaid, we store Plaid’s `account_id` and possibly the Plaid `item_id` (for the institution link) to know which Plaid item it belongs to. For crypto wallets, we store the public address and the coin type (if single-coin like BTC or multi-coin wallet address). For exchanges, perhaps an API key identifier. For properties, we store an `address` or a Houski property ID, and for vehicles, the `VIN`. We may also have a separate table for **account institutions** (like one per Plaid item/institution connection) to track the bank integration (with institution name and Plaid item token), but that can be encapsulated in accounts or a small separate table if needed to avoid duplicate institution entries. Each account has a reference to its latest known balance and perhaps a historical performance link.

- **transactions:** Stores individual financial transactions (mainly for banking, credit, investment accounts, and possibly for crypto if we track transaction history). Key fields: `id` (PK), `account_id` (FK to accounts), `date`, `payee` or `description`, `amount` (in account’s currency; we use positive for credits, negative for debits or vice-versa), `currency` (should match account currency for consistency, but stored for clarity), `category` (FK to a categories table or an enum indicating spending category), `source` (enum: e.g. “Plaid”, “manual_csv”, “manual_entry” to know how this transaction was added), and some unique fingerprint fields used for de-duplication (see Section 4). We also include any extra info from sources: for Plaid we might store Plaid’s transaction ID, merchant name, Plaid’s category suggestions, etc. For uploaded statements, we might store the original text description line for reference. Transactions for investment accounts might include trade transactions (buy/sell of securities) – those could be marked with a subtype (trade, dividend, interest, fee, etc.). The transactions table is central for cashflow analysis and is the basis for spending analytics. It can grow large, so we will index it by user and date for fast querying. RLS ensures users only see their own transactions.

- **categories:** (Optional table) Defines spending categories (e.g. “Food”, “Rent”, “Utilities”, “Entertainment”, etc.) which transactions can be tagged with. We can seed this with standard categories (perhaps using Plaid’s category taxonomy as a starting point). Users might be allowed to rename or add categories. This table would have `id`, `name`, maybe a hierarchy (parent category), and possibly a `type` (expense vs income). Alternatively, we might hard-code categories or use Plaid’s categories without a separate table – but having a table allows customization and consistent usage across transactions (particularly for manual transactions). Each transaction’s `category_id` references this table. For investment transactions, categories might not apply (or we use categories like “Investment” or “Transfer” accordingly).

- **holdings / asset_values:** This table (or set of tables) tracks the values of non-transactional assets (like properties, vehicles, maybe crypto holdings) over time. For example, a property doesn’t generate transactions but has a changing valuation. Similarly, a crypto wallet’s balance changes with market prices even if no transactions occur. We maintain an **asset valuation history** table with fields: `id`, `account_id` (FK to accounts), `date`, `value` (in base currency or in asset currency and another field for currency). This allows us to plot historical value curves for assets whose values we periodically update (property, vehicle, even total portfolio snapshots). For assets like stocks or crypto held in investment accounts, their value changes daily with market – but we can derive those from price feeds and transactions. We might not store daily prices for every stock/coin (that could be external API on the fly), but for performance we may cache some price history in this table as well, especially for user’s specific holdings to speed up calculations.

- **scenarios:** Stores user-created financial scenarios for simulation. Fields: `id`, `user_id`, `name` (e.g. “Buy House in 2025”), `created_at`, `base_snapshot` (could link to a snapshot of current finances or simply store when scenario was created). A scenario will have related entries describing the hypothetical events or changes. Possibly a JSON field or a related table (scenario_events) as described next.

- **scenario_events:** Each scenario can have multiple events (e.g. “Purchase asset X worth Y at time T” or “Start saving extra $N per month”). This table could have fields: `id`, `scenario_id` (FK), `event_type` (enum: “buy_asset”, “sell_asset”, “change_expense”, “one-time_income”, etc.), `effective_date` or start date, `parameters` (could be a JSON with details like {asset_type: house, value: 500000, down_payment: 100000, loan_rate:5%, term:25} for a house purchase scenario, or {ticker: BTC, amount: 2} for investing in BTC, etc.). Storing as structured data allows the simulation engine to interpret the events. Alternatively, we may allow a free-form scenario (like an AI-generated scenario description), but ultimately it will translate into data. The scenario events and assumptions feed into the simulation engine (Section 7).

- **user_settings:** Additional settings like whether Plaid integration is enabled (the prompt mentions Plaid toggleable in code – perhaps an environment setting or user setting to disable Plaid if running in a mode without it), preferred currency for display, etc. This could be part of the Profile or a separate table.

- **institution_links:** (Optional) If using Plaid, we might have a table to track each Plaid item (each institution a user connects) storing the Plaid `item_id`, `institution_name`, `access_token` (encrypted), `user_id`, etc. This can help manage Plaid webhooks or re-fetching data. However, since we can fetch accounts and transactions directly and each account knows its item, this table is optional. It mainly would store the `access_token` securely. We will likely encrypt the Plaid access_token before storing, given it provides access to sensitive financial data. This encryption could be done with a symmetric key kept in environment config or using Postgres’s pgcrypto with the user’s password (but that complicates things). A simpler approach is to not store access_tokens at all and rely on Plaid’s ephemeral tokens each session – but Plaid’s design expects you to store them for ongoing access. We’ll store them encrypted with strong cipher (AES-256) and possibly a key derived from a server secret.

**Database access patterns:** All tables are related via foreign keys, and cascade deletes can be set appropriately (e.g. if a user is deleted, all their accounts, transactions, etc. delete). However, deletion in finance context might be rarely used (except if a user deletes their account entirely). More commonly, if a user unlinks a bank (Plaid item removed), we may either keep the historical data (with a flag that it’s inactive) or offer to delete those accounts/transactions. We should support both. The schema is designed to support future features like sharing data (if a user wanted to share an account with another user, though not in current scope – RLS would be adjusted for that scenario if ever needed).

**Row-Level Security (RLS):** Every table has a policy like: `policy_select_own_data` which allows select for a user if `user_id = auth.uid()` (and similar for insert/update). Only certain tables, like `categories`, might be global or shared (if we don’t want each user to have separate category entries; but even then, we might treat categories as global defaults plus user-custom, so we’ll have to allow read access to default categories for everyone). Other exceptions are reference tables that are non-sensitive. For all user-specific data, RLS ensures isolation. Supabase makes it easy to enable this and tie the policy to the JWT’s `sub` (user ID) ([Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=alter%20table%20,security)). We will thoroughly test these policies to avoid any data leaks.  

## **4. Third-Party Integrations and Data Ingestion**  
Oversight aggregates data from various external sources to provide a unified view. Each integration is implemented carefully to handle authentication, data retrieval, and error cases gracefully. Importantly, all data ingestion methods funnel into the unified data model (accounts and transactions tables), ensuring consistency regardless of source. Below are details for each integration and ingestion method:

### **4.1 Plaid Integration (Bank and Investment Accounts)**  
Plaid is a cornerstone integration for Oversight, enabling linking of bank accounts, credit cards, and investment/brokerage accounts. We integrate Plaid with a **toggle** – meaning the code is written to use Plaid, but it can be turned off (e.g. via a feature flag or configuration) if running the app without Plaid (for example, in a development mode or for users who prefer manual data only). 

**Linking Accounts (Plaid Link Flow):** When a user chooses to link a bank or investment account, the app uses **Plaid Link** – a secure OAuth-like flow provided by Plaid. On the frontend, we include Plaid’s JavaScript package and initialize it with a temporary `link_token` generated via our server. The user is presented with Plaid’s UI to select their financial institution and enter their banking credentials. (Plaid’s Link is required for production use – it’s the mandated way for users to grant access securely ([Link - Overview | Plaid Docs](https://plaid.com/docs/link/#:~:text=Link%20is%20the%20only%20available,for%20testing%20purposes%20via%20%2Fsandbox%2Fpublic_token%2Fcreate)).) Once the user authenticates, Plaid Link returns a `public_token` to our application (this token is short-lived and non-sensitive on its own). 

Our Next.js API route (e.g. `/api/plaid/exchange`) receives this `public_token` and uses Plaid’s secret keys (stored in server env variables) to call `item/public_token/exchange`, obtaining a long-lived `access_token` for that bank *Item*. We store this `access_token` securely (encrypted in the database, tied to the user and institution) as it will be needed to fetch data now and in the future. We also get an `item_id` (Plaid’s identifier for that connection) and details of the accounts at that institution (account names, types, balances) via the `/accounts` endpoint.

**Fetching Account Data:** After linking, the system retrieves the accounts and transactions:
- **Accounts**: For each account returned by Plaid (e.g. checking, savings, credit card, investment account), we create an entry in our `accounts` table. We record the account’s name (e.g. “TD Chequing ****1234”), type (Plaid provides type/subtype, which we map to our categories like “bank” or “credit_card”), the current balance, the institution name, and link it to the Plaid item (by storing `item_id` or an institution reference). If the user already had an account with the same Plaid account_id linked (which can happen if they relink the same account), we detect it and avoid creating duplicates ([GitHub - plaid/pattern: An example end-to-end Plaid integration to create items and fetch transaction data](https://github.com/plaid/pattern#:~:text=By%20default%2C%20Plaid%20Link%20will,see%20the%20root%20items%20route)). We likely use Plaid’s `account_id` as a unique key to prevent duplicate entries. Oversight’s policy is to **prevent linking the same account twice** to avoid confusion and extra API costs – so if Plaid returns an account_id that already exists for that user, we’ll skip or update the existing account rather than create a new one. (We’ll inform the user if they tried to link an already-linked account.)

- **Transactions**: Once accounts are in place, we fetch transaction history. Plaid’s Transactions API allows retrieving up to ~2 years of past transactions for connected accounts. We call `/transactions/sync` or `/transactions/get` (depending on API version) with the `access_token`. The initial sync might pull a large list of transactions. We iterate through them and insert into the `transactions` table. Each transaction from Plaid has a stable `transaction_id` – we store that in a dedicated column. We use this to avoid duplicates: if we ever fetch transactions again (on refresh), we will upsert new ones and ignore those with IDs we’ve seen. Plaid also provides rich data like merchant name, category, location, etc., which we store as needed (category mapping to our categories table, possibly storing Plaid’s category string as well). We take care to attach the correct `account_id` to each transaction (Plaid’s data model gives an account_id for each transaction).

- **Investment Holdings**: For investment accounts, Plaid can provide holdings data (e.g. list of stocks or funds the user holds, number of shares, cost basis if available, and their current price). We will fetch this via Plaid’s Investments endpoints. These holdings can be stored in a separate table or within accounts as sub-accounts. Our approach: create an “investment account” entry in `accounts` (e.g. “Questrade TFSA”), and then store each holding either as pseudo-transactions (e.g. a “buy” transaction and a current “holding” entry) or in a dedicated **holdings** table linked to the account. We opt for a **holdings table**: fields like `account_id`, `symbol` (e.g. AAPL), `quantity`, `avg_buy_price`, `current_price`, etc. Plaid gives current price and value, which we use for snapshot; we can calculate avg buy from transactions if Plaid doesn’t provide it. This data feeds into the portfolio analytics (Section 6). If the user has crypto accounts via Plaid (like Coinbase), similar logic applies.

**Scheduled Refresh vs On-Demand:** Plaid supports webhooks for transaction updates (so it can push new transactions to us). However, our design is to **update only on user prompt** to give users control. This means we might not set up persistent webhooks (which require a publicly reachable endpoint and more complexity). Instead, when a user hits “Refresh” in Oversight, we will call Plaid’s `/transactions/sync` endpoint to fetch any new transactions since the last fetch. We keep track of the last transaction cursor (Plaid provides a cursor for incremental sync). This on-demand sync will retrieve only new or changed transactions and we’ll update our DB accordingly. If a user doesn’t hit refresh, no calls are made (except maybe if they log in after a long time, they’ll presumably click refresh or we might prompt them). This approach simplifies compliance as well – no background processing of user data without consent each time.

**Plaid API keys and Environment:** We will integrate using Plaid’s **Development or Production environment** keys. In code, we have a flag to disable Plaid (for open-source/self-hosting scenarios where Plaid might not be available). If disabled, the “Link Bank” UI is hidden and only manual imports are possible. If enabled, we include the Plaid client script. All secrets (client ID, secret key) are stored in server config. We comply with Plaid’s data handling policies and ensure we handle errors (e.g. if a bank login fails or MFA required, Plaid Link will handle within its widget). 

**Edge Cases:** We implement logic to handle multiple currency accounts (if a bank account is in USD, Plaid marks that – our `accounts.currency` will be USD for that account). We’ll convert it to CAD for overall totals but preserve original currency for transaction listing. We also heed Plaid’s rate limits and error responses: e.g. if an `access_token` becomes invalid (user changed password), Plaid returns an error and we might need to prompt re-link. We utilize Plaid’s **status webhooks** or error codes to detect such conditions and notify the user to reauthenticate. Because we are not auto-polling, we might rely on catching errors during manual refresh.

Finally, by using Plaid we cover a wide range of Canadian financial institutions (and U.S. if needed). This significantly reduces the manual input burden on users by automatically ingesting transactions and balances. We note that “Plaid Link will let a user link the same institution multiple times” and this can cause duplicate data ([GitHub - plaid/pattern: An example end-to-end Plaid integration to create items and fetch transaction data](https://github.com/plaid/pattern#:~:text=By%20default%2C%20Plaid%20Link%20will,see%20the%20root%20items%20route)) – to counter that, we implement checks on our side (comparing institution IDs and account IDs) to prevent duplicate linkages or at least merge them if it happens.

### **4.2 Manual Statement Upload (PDF/CSV)**  
For institutions or asset types not covered by Plaid, or for users who prefer not to use Plaid, Oversight supports manual uploading of account statements. This is especially useful for Canadian institutions that might not be in Plaid, or for adding historical data beyond Plaid’s lookback period. Users can upload **PDF** or **CSV** files of transactions which the system will parse and import into the transactions database.

**File Upload Interface:** Users can navigate to an “Import Transactions” section, select an account (or create a new account entry) to which the statement corresponds, and upload a PDF or CSV file. The file is sent to our Next.js API (using a file upload handler). We store the raw file in Supabase Storage (in a private bucket) and then attempt to parse it.

**Parsing CSV:** CSV is straightforward – many banks allow exporting statements in CSV format. We will implement parsers (or configurable import mappings) for common formats. If the CSV has a header row, we try to detect columns like Date, Description, Amount, etc. We then iterate through rows to create transactions. The user might have to specify some details (e.g. which column is credit vs debit or if amounts are positive/negative). We can provide a preview to confirm parsing is correct. Each parsed transaction is then inserted with source “manual_csv”. We generate a hash or composite key (like date + amount + description) to use for deduplication so that if the same transaction later comes via Plaid or another import, we recognize it (more on dedup strategy below). After successful import, the file could be deleted from storage or retained (perhaps retain for a short period for auditing, then auto-delete, to reduce sensitive data retention).

**Parsing PDF:** PDF bank statements are more challenging as they often are formatted for human reading. We will use a PDF parsing library or service. Options include: using an OCR approach or text-extraction. Many bank PDFs actually contain text (not just scanned images), so a PDF text extraction library (like PDF.js or PyPDF2 if using Python, etc.) could retrieve text. We likely will build a parsing module in Node or Python (if allowed via an API route calling a Python service or use a WASM PDF parser). Given the complexity (and varying formats per bank), our approach: start by supporting a few known Canadian bank statement formats (like RBC, TD, Scotiabank, etc.). We can detect the bank from the PDF text (often the bank name is present) and then apply regex patterns to extract transactions. For example, a typical statement lists lines with date, description, and amount. We will attempt to parse each line. We’ll need to handle multi-line descriptions and page headers/footers. This is non-trivial, so as a v0, we might convert PDF to text and then ask the user to verify the parsed output. Another approach is to leverage AI: we could send the PDF text to an AI model to extract transactions. However, privacy concerns arise, and it may be costly. If done, it would be with user consent and perhaps using a local model or a service that guarantees data deletion. As a primary approach, we attempt rule-based parsing, and use AI assistance as a fallback in the future.

After parsing the PDF into a structured list of transactions (date, description, amount), we proceed to import them just like CSV. Each transaction gets marked with source “manual_pdf”. We also might mark them as “unverified” initially and show the user a preview where they can correct any mistakes before finalizing import.

**Account Mapping:** During upload, the user must indicate which account the transactions belong to. If the account doesn’t exist yet in Oversight, they can create a new account entry (providing account name, type, currency). We then attach all imported transactions to that account (using the account’s ID). For consistency, if later the user links that same account via Plaid, we may want to merge them – we can allow linking an account to an existing manual account (matching by account number perhaps). But merging data from Plaid and manual might lead to duplicates if both cover overlapping periods, which is where deduplication logic is crucial.

**Deduplication Strategy:** Oversight must avoid duplicate transactions that can arise from:
- Multiple imports of the same data (e.g. user accidentally uploads the same statement twice).
- Overlap between Plaid and manual data (e.g. Plaid pulls last 90 days and the user also uploaded a CSV of the last 6 months).
- Linkage of the same account twice via Plaid (we prevent this at account level, but if it happened, transactions could duplicate).

To handle this, we use several techniques:
  - **Unique IDs/Hashes:** If a transaction comes from Plaid, it has a unique `transaction_id` (we rely on that as a primary key or at least store it to check uniqueness). For manual transactions, we create a hash or signature. For example, `hash = SHA1(account_id + date + amount + normalized_description)` as a heuristic unique key. We can store this hash in the transactions table and put a unique index on it to prevent exact duplicates. The “normalized_description” would be the payee/description after stripping out variable components (like check numbers) if possible. This isn’t foolproof but catches obvious duplicates.
  - **Merge on Import:** When importing manually, after parsing we compare each transaction candidate against existing ones in that account (within a reasonable date range, say ±1 day of same date, same absolute amount). If a match is found, we skip or mark as duplicate. We might present to the user: “X potential duplicates were skipped.”
  - **Time-window Deduplication:** If overlapping data ranges are imported, duplicates likely fall on same date and amount. We can implement an algorithm: for a given account, maintain a record of imported date ranges per source. For instance, if Plaid covers Jan–Mar 2025 and a CSV covers Jan–Dec 2024, there’s no overlap. But if CSV covers Dec 2024–Mar 2025 and Plaid also has Jan–Mar 2025, the overlap (Jan–Mar 2025) could produce duplicates. Our logic can attempt to exclude transactions in the overlapping period from one of the sources. Possibly prefer one source as authoritative in overlaps (maybe prefer Plaid for more detailed data and skip manual in that range). This could get complicated, so a simpler approach: always import everything, then run a dedup query to delete duplicates by the unique hash or ID criteria.
  - **User Review:** Provide a “duplicate review” screen where the user can see any suspected duplicates and confirm removal or keep both if they are actually distinct (unlikely but for safety).

**Merging Data from Multiple Sources:** In some cases, data from different sources can complement each other. For example, a manual CSV might have older transactions while Plaid has recent ones. These should just combine into one account’s history (which is fine). If the same transaction is in both, dedup removes one. Another scenario: Plaid provides category info, whereas a CSV might not. If a duplicate is found and one has extra info (like Plaid category or merchant name), we could merge that info into the existing record instead of dropping it. This is a nice-to-have: e.g., we import via CSV first (no categories), then later Plaid brings the same transactions with categories – our dedup could detect and update the category field of the existing entry. Implementation: perhaps do an UPSERT rather than skip – if match by amount/date and we have empty category but Plaid has one, fill it.

**Security & Privacy of Statements:** Uploaded statements contain sensitive info (account numbers, transaction details). By storing them in Supabase storage with strict access rules (only accessible by server or the owning user via signed URL), we keep them private. We also ideally purge or encrypt them after use. The parsing should happen server-side entirely; no statement data is sent to external services without user consent. If using AI for parsing, we have to send content to an AI API – we will only do that if explicitly enabled by the user due to privacy concerns. PIPEDA compliance means we shouldn’t be sending personal financial info to third parties without consent, so any AI parsing likely needs an on-device or on-server model or an approved data processor.

### **4.3 Manual Transaction Entry**  
Aside from bulk import, Oversight allows users to add individual transactions manually. This is useful for cash transactions, or to quickly log something on the fly (like a new investment or expense) that isn’t in any statement or linked account. 

**UI for Manual Entry:** The user can choose an account and then click “Add Transaction”. A form appears to input: date, description, amount, maybe a category, and an optional note. We might have templates for recurring transactions (like salary each month) – future enhancement. On save, it creates a transaction record with source “manual_entry” and it goes into the transactions table for that account. These user-entered records stand alongside imported ones. If a manual entry accidentally duplicates an imported one (user might not realize an automatic import was coming), our dedup might catch it if the values line up. We could warn “This seems similar to an existing transaction on that date”.

Manual entry is straightforward – just ensure the form is easy to use. Possibly provide suggestions (like recent descriptions or payees to choose from, or the AI could guess category from description). But initial version can be simple.

### **4.4 Crypto Wallets and Exchange Accounts**  
Cryptocurrency assets come either from on-chain wallets or from exchange platforms. Oversight will support both:

- **On-Chain Wallets:** The user provides a public address for supported blockchains (e.g. a Bitcoin address, Ethereum address, etc.). For each address, we create an account in the database of type “crypto_wallet” and store the address and coin type. To get the balance, we call an API for that blockchain:
  - For Bitcoin, for example, use a public API like Blockchair or Blockchain.info to get the current BTC balance for that address (and possibly transactions). For Ethereum, use Etherscan’s API to get ETH balance and token balances if we want ERC-20 tokens. Initially we might focus on major assets (BTC, ETH) for simplicity.
  - The balance (in the coin’s native unit) is stored, and we also fetch the current CAD or USD price of that coin via a price API (CoinGecko, etc.) to compute the CAD value for portfolio totals.
  - If the user wants to see transactions for that wallet, we could fetch transaction history from the chain API. This can be a lot of data, so maybe we fetch only latest or on-demand when user views that wallet detail. We store on-chain transactions in the `transactions` table as well (with tx hash as an ID and source “onchain”). However, blockchain transactions may not have clear payees or categories (they are just addresses), so these might be mostly for reference.
  - On-chain wallet data is updated on user prompt (like clicking refresh on that account). No background sync unless triggered. If user wants updated prices only, our portfolio engine will fetch fresh prices anyway.

- **Exchange Accounts:** Many users hold crypto on exchanges like Coinbase, Binance, Kraken, etc. Plaid has beta support for Coinbase (via an OAuth integration). If available, we will allow linking Coinbase via Plaid (which would then treat it similarly to a bank connection and fetch balances of wallets). If Plaid support is not fully covering all, we implement direct exchange integration:
  - Provide an option for the user to enter their **API key/secret** for a given exchange (e.g., a form specifically for Coinbase where they paste an API key and secret, or for Binance, etc.). This info is highly sensitive; if provided, we store it encrypted in the database (or possibly not store at all and just use immediately – but for periodic refresh, storing is needed. We’ll encrypt with a strong key as we do for Plaid).
  - Once credentials are set, we use the exchange’s API (which typically provides endpoints for account balances and trade history). For example, Coinbase’s API can list all assets and their balances in the account. We fetch those and then create one “account” entry per asset or one account entry representing the whole exchange? We have design choices: Perhaps treat each exchange as one account with multiple currencies as sub-balances. But our data model currently has one balance per account. Instead, we might create sub-accounts for each asset on the exchange. Alternatively, model the exchange as an `institution` and have accounts for each coin. A simpler approach: if a user has 5 cryptos on Coinbase, we create 5 account entries (type “crypto_exchange”) with names like “Coinbase - BTC”, “Coinbase - ETH”, etc., or group them somehow in UI (like under a Coinbase group). Each such account stores the coin balance and value.
  - We fetch current prices for those coins via an API to value them (or the exchange API might directly give a CAD value if it’s a CAD wallet, but if not, we convert).
  - For transaction history, the exchange API might provide trade or transfer history. We can import those as transactions if needed (e.g. a trade = sell X for Y, deposit, withdrawal). This can be complex to represent (one trade involves two assets). For now, we may skip detailed trade logging and just track current holdings and maybe deposits/withdrawals as transactions (to track fiat flows).
  - Deduplication: if a user both links a crypto exchange via API and also input a wallet from that exchange, or manually input, duplicates can arise. We ensure they likely wouldn’t do both for the same asset; but if they did, we would handle similarly with checks on addresses or asset names.

- **Crypto Price Updates:** Crypto prices are volatile, so portfolio values can change frequently. Oversight will fetch current prices for all crypto assets the user holds whenever the user opens the app or refreshes. This could be done via a single call to a pricing API (e.g. sending a list of symbols to CoinGecko’s API to get CAD and USD prices). We then update the account’s `balance` value (in CAD) or store the price for calculations. We may not store every price in the DB (unless we want historical charts, in which case we’d log daily prices in the asset_values table for historical reference). Initially, we can compute performance on the fly by combining known purchase info with historical price data fetched as needed.

### **4.5 Vehicle Valuation via VinAudit**  
Oversight treats vehicles as assets that depreciate over time. When a user adds a vehicle, they input the VIN (Vehicle Identification Number) and an optional nickname for the car. We then call the **VinAudit Vehicle Market Value API** (which covers Canadian vehicles) to get an estimate of the car’s current market value ([Vehicle Market Value API - VinAudit](https://www.vinaudit.com/vehicle-market-value-api#:~:text=VinAudit%27s%20Vehicle%20Market%20Value%20API,dataset%20from%20retailer%20listings%20nationwide)). The API likely returns data such as average value, maybe a range (low/high) based on make/model/year and current market data. We will take the average market value and use that as the vehicle’s valuation.

- We store the vehicle as an entry in the `accounts` table with type “vehicle”. We might store additional metadata (could parse VIN to get year, make, model, which VinAudit might also return along with value). These details could be stored in a JSON column or a separate vehicle_info table.
- The returned value is stored in a `balance` field (though calling it balance is semantic stretch; it’s asset value). We also insert a record in the asset_values history table with the date and value. 
- The user can refresh this value by clicking refresh on that asset or on overall portfolio refresh. On refresh, we call VinAudit again for an updated value. (VinAudit likely has usage costs, so we may limit how frequently a user can refresh vehicle values, perhaps suggesting monthly updates since car values don’t change daily.)
- If VinAudit provides historical data or trends, we can display that – but likely it’s just point-in-time estimates.
- Privacy: sending VIN to VinAudit is standard; VIN is not personally identifying beyond the car. Ensure our usage aligns with their API terms.

### **4.6 Real Estate Valuation via Houski**  
Real estate is often a large part of net worth. Oversight allows users to add properties which are then valued using Houski’s API (which has data for Canadian properties) ([Real estate data API for developers - Houski](https://www.houski.ca/property-api#:~:text=Access%20detailed%20property%20data%20for,anyone%20can%20use%20our)). When adding a property, the user might provide an address or perhaps a unique property ID if they have one from Houski (but likely address or postal code is sufficient).

- We call Houski’s **property data API** with the provided address. If the address is valid and found, the API returns details such as estimated market value, property tax assessment, last sale price, etc. We primarily use the **valuation**. Houski might provide a current price estimate and maybe historical values or neighborhood trends. We take the current estimate as the property’s value.
- Store the property as an account of type “property” with the current value. Save the address (or a truncated version if needed for privacy – though address itself is not as sensitive as banking info, we still treat it carefully).
- Each time the user requests, we can re-fetch the latest value. Real estate values don’t fluctuate as rapidly as stocks, but perhaps quarterly or monthly updates are meaningful. We might also schedule a background update of property values occasionally (with user consent), but sticking to on-demand: if user hits refresh on the property, we call the API.
- If the API fails or lacks data (some addresses might not have an estimate), we allow the user to manually input a value and maybe update it themselves over time. They can still use scenario tools with manual values, just won’t have automatic updates.
- In terms of data handling, the address is sent to Houski – according to Houski, anyone can use the API, no special license needed ([Real estate data API for developers - Houski](https://www.houski.ca/property-api#:~:text=Access%20detailed%20property%20data%20for,anyone%20can%20use%20our)), which is good. We will store whatever property ID they return to use for subsequent queries instead of sending the full address each time (to reduce calls or if they have a better query method).
- We should consider converting the value to the user’s base currency (likely CAD since properties are valued in CAD in Canada). If a user’s base is USD for some reason, we can convert via exchange rate.

### **4.7 Other Assets**  
For completeness, Oversight lets users track assets that don’t fit the above categories by manual input:
- **Cash (physical):** e.g. cash on hand – user can just create an “other asset” called “Cash Wallet” and input the amount. No external update.
- **Precious Metals:** If user wants to track gold/silver holdings, they could input quantity and we could integrate a price feed (similar to crypto) to update value. We might not have a dedicated integration initially, but the user can update the value manually or we can consider using a public gold price API.
- **Collectibles/Investments:** Art, wine, private equity – user enters a value manually. Possibly no automatic updates.

These manual assets are stored in accounts table as well (type “other” maybe). They rely on the user to update the values. We allow the user to edit the current value at any time, and optionally record the change as a transaction or as a new valuation entry for history.

### **4.8 Currency Conversion and Multi-Currency Handling**  
Oversight supports multi-currency because users may have USD accounts or crypto in various denominations. Key points of the design:
- **Base Currency:** We will use **CAD as the default base currency** for Canadian users when showing aggregated totals (net worth, etc.), since that’s likely what users want. However, we could allow the user to switch base currency (to USD, etc.) in settings. 
- **Storing Currency:** Each account has a `currency` field. All transactions are stored in the account’s native currency. We do not convert transaction amounts on storage (to preserve fidelity and allow per-account statements in original currency).
- **Conversion Rates:** To compute total balances and performance, we need exchange rates. We integrate with an FX rate API (such as an open source like ExchangeRate API or perhaps leverage a currency conversion library with daily rates from Bank of Canada). For accuracy, historical performance calculations might require historical exchange rates (e.g. if user bought USD stocks a year ago, to compute return in CAD we’d use the FX rate from then vs now). We plan to:
  - Fetch current exchange rates (CAD/USD, CAD/EUR, etc as needed) from a reliable source daily or on-demand. Possibly store a daily FX rate table for reference.
  - When displaying current net worth: sum all CAD assets + (USD assets * CAD/USD rate) + (crypto * CAD value) etc.
  - For historical charts: either convert each transaction to CAD at the transaction date’s rate (for contributions/withdrawals) and track the value of holdings in CAD over time. We might obtain historical USD/CAD rates for needed dates (Bank of Canada offers historical rates we could store).
- **Display:** In UI, for accounts not in base currency, we can show both the original currency and the converted value. E.g. “USD Savings – \$10,000 (≈ C\$13,000)”. For crypto, “0.5 BTC (≈ C\$X)”.
- **User input:** If user enters values (like manual asset or scenario input) in another currency, we will clarify currency. Possibly allow them to choose currency for that input. We then convert or store along with currency info.

By handling currencies carefully, Oversight ensures the portfolio analytics (Section 6) are accurate in the user’s perspective (likely CAD). All performance metrics can be calculated in base currency, which inherently accounts for FX gains/losses too (if USD appreciated vs CAD, that will reflect in the CAD value growth of a USD account).

### **4.9 API and Integration Credentials Security**  
All API keys and secrets (Plaid, exchange keys, etc.) are stored securely:
- **Plaid**: The client ID and secret are stored in environment config on the server. Individual user `access_token`s from Plaid will be encrypted before storing in our DB. We may use a symmetric encryption approach where a server-side key (not in the database) is used to encrypt/decrypt tokens on the fly. Alternatively, we use Postgres’s encryption functions with a key provided via function argument (ensuring it’s not stored in plaintext). This is to mitigate risk if the database were somehow accessed, the tokens (which allow bank access) would not be immediately usable.
- **Exchange API keys**: If users provide their own API keys for Coinbase/Binance, we treat them even more carefully. Ideally, we don’t persist those keys at all; rather, we could ask for them each time needed (which is not user-friendly), so likely we do store them encrypted similarly. We inform the user of this and maybe allow them to revoke keys anytime.
- **Houski/VinAudit** keys: These are presumably our app’s API keys for those services. They reside in server config.
- We also ensure all third-party API calls happen over HTTPS and no sensitive info is logged. 

By designing with these integrations and ingestion methods, Oversight can gather a comprehensive dataset for each user with minimal manual effort, while still allowing manual control when needed. Next, we discuss how the application processes this data to produce meaningful analytics and insights.

## **5. Transaction Management and Deduplication**  
With the variety of data sources feeding transactions and balances into Oversight, robust transaction management is essential. This section outlines how transactions are processed, stored, and de-duplicated to maintain a clean and accurate ledger for the user.

**Unified Transaction Store:** All transactions, regardless of source (Plaid, manual import, crypto, etc.), end up in the single `transactions` table in the database, linked to the appropriate account. This unified store allows the spending analytics engine to query one source for all of a user’s cash flows. We tag each transaction with its origin (`source` field) so we know how it was added (this can help with debugging or special handling if needed). 

**Real-time De-duplication:** As mentioned in the integrations section, when importing new transactions we perform checks to avoid inserting duplicates. Summarizing the strategy:
- **Plaid transactions**: We rely on Plaid’s stable IDs. When we get new data from Plaid, we compare each transaction’s ID against those we have stored for that user. We maintain an index or set of seen Plaid IDs. New ones are inserted; if Plaid sends an update to an existing transaction (which can happen if a pending transaction posts), we update the existing record rather than duplicating (Plaid provides an `is_pending` flag and later a posted transaction with same ID).
- **Manual import**: We generate a hash key for each parsed transaction line and check against existing records for that account. If a match is found, skip or update. The hash could be `account_id + date + amount + normalized_description`. Normalization might involve trimming whitespace, making it lowercase, removing punctuation. For example, descriptions like “PAYMENT - VISA 1234” vs “Payment VISA 1234” should normalize to catch duplicates. We must be cautious not to merge genuinely different transactions that happen to have same amount/date (rare but possible, e.g., two different purchases of \$19.99 on the same day). The risk of false positive is there, so our dedup might require an exact description match as well to be safe.
- **Manual entry vs auto**: If a user manually adds a transaction that later appears via Plaid or import, it’s tricky to auto-detect because descriptions might differ (user might have entered “Utility Bill” whereas bank calls it “CITY HYDRO E-BILL”). In such cases, duplicates may occur. We can provide a reconciliation tool: e.g., highlight similar amounts on same date and let user decide to merge or keep both. For v1, we may not solve this comprehensively, but we’ll document the possibility to users.

**Merge & Update Logic:** In certain cases, merging data from different sources enriches the transaction record. Our system will:
- Prefer **Plaid data** for any overlapping period, because Plaid provides more structured info (categories, merchant). If a manual import overlaps with Plaid, we might choose to drop the manual entries in that overlap if we trust Plaid more. Or we keep both but the dedup will remove duplicates.
- If a duplicate is found where one has category or memo and the other doesn’t, we merge the missing info. E.g., manual CSV had no category, Plaid does – update the existing transaction’s category with Plaid’s category upon detecting it’s the same transaction.
- Keep track of any transactions that are reversed or refunded. If we notice a pair (like one transaction for +$100 and one for -$100 with similar description), that might be a correction. We won’t auto-merge those because they actually represent a refund scenario. But we could flag them in UI.

**Transaction Categorization:** Each transaction will have a category. For Plaid, we map Plaid’s category to our internal categories on import. For manual entries, we might auto-categorize based on description (perhaps using a simple rules engine or even an AI model to suggest a category). We can also let users set rules (for example, “anything with ‘Shell Gas’ in description -> Category Fuel”). In v0, manual transactions can default to an “Uncategorized” category and the user can edit or categorize them later. Good categorization is important for spending analytics, so we will invest in at least basic logic (like matching known keywords to categories).

**Updating Balances:** While transactions track changes, each account’s current balance is stored in the accounts table. We have two ways to maintain balances:
- **From Source**: For bank accounts and cards, Plaid gives us current balance directly. We use that and can reconcile with transactions. If transactions imported don’t sum to the balance (maybe missing some interim ones), the balance still is taken as truth.
- **Calculated**: For manual accounts, we can calculate balance by summing transactions (especially if starting balance is given). We might allow the user to set an initial balance for an account when they start tracking, then subsequent manual entries adjust it.
- We should periodically ensure consistency: e.g., if we have starting balance + all transactions = current balance, if not, something’s off (maybe missing transactions or duplicate). We can highlight such discrepancies.

**Transaction Editing & Deletion:** Users might want to edit or delete transactions (especially manually entered ones, or fix categories). We allow that through the UI. Edits are straightforward (update description, category). Deletions: if a transaction is from Plaid or statement, we might warn that it will come back on next import unless excluded. We could implement an “ignore list” for Plaid transaction IDs the user deleted manually, so we don’t re-import them (though normally no need to delete Plaid transactions except if they consider something irrelevant). For manual entries, deletion just removes it. RLS ensures one user’s edits don’t affect others.

**Handling Duplicated Accounts:** If a user accidentally creates the same account twice (e.g., they manually created an account “Visa ****1111” and also linked that card via Plaid), we should merge those accounts to avoid confusion (or the user can remove one). A merge would involve attaching all transactions to one and deleting the duplicate account record. This is a complex operation and perhaps we simply avoid by clearly guiding linking vs manual to not overlap. 

In summary, the system uses unique identifiers whenever available and carefully constructed heuristics otherwise to keep transaction data clean. By unifying all transactions and scrubbing duplicates, Oversight can provide accurate analytics in the next steps.

## **6. Portfolio Performance Analytics Engine**  
One of Oversight’s core strengths is analyzing the user’s portfolio and investment performance over time. The **Portfolio Performance Analytics Engine** is responsible for computing metrics like average buy prices, returns, and generating historical performance data. It works by combining data from accounts, transactions, and external price feeds.

### **6.1 Metrics and Calculations**  
For each asset or account in the user’s portfolio, and for the portfolio as a whole, we compute a set of financial metrics:

- **Net Worth & Portfolio Value:** The sum of all asset values minus any liabilities (if we track debts like credit card balances or loans as negative assets). Oversight primarily focuses on assets, but if we include credit card accounts, those might show as negative cash or as liability entries. Net worth is computed in the base currency (CAD) by converting each asset’s value at current rates.

- **Individual Asset Value:** Current value of each asset (already stored per account). For securities or crypto, current value = quantity * latest price. For real estate/vehicles, current estimate from APIs. For cash accounts, it’s just balance. These values update on refresh.

- **Historical Value Over Time:** We reconstruct the portfolio’s value over past dates to show growth charts. This requires:
  - Historical **balance snapshots** for non-market assets (we record whenever we updated property or car values).
  - For market-linked assets (stocks, crypto), we can derive historical value from price history. For example, if a user had 10 shares of AAPL since Jan 2022, we can multiply 10 by AAPL’s price on each day to get value over time. Similarly for crypto. This means we need access to historical price data for those assets.
  - For bank accounts, the balance history can be derived by summing transactions over time (like a running balance). We could also store a running balance in transaction records to easily plot account balance over time.
  - We will likely store daily or monthly snapshots for performance to avoid heavy recomputation. Perhaps a nightly job could record each user’s total portfolio value (though since we’re on-demand, maybe we compute on the fly). For now, on-demand: when user opens the performance chart, we compute over a time range by processing transactions and price data. Caching results for repeated use in the session.

- **Average Buy Price (Cost Basis):** For investment assets like stocks or crypto, we calculate the **average cost per unit** the user paid:
  - Example: user bought 2 ETH at \$2000 and later 1 ETH at \$3000, average buy price = (2*2000 + 1*3000) / 3 = \$2333. We can get this from transaction history: sum of [buy amounts in base currency] divided by total units held (taking care to adjust if some were sold).
  - For stocks, if we have complete trade history (either from Plaid or manual input), we can compute cost basis using FIFO or average as needed. For simplicity, we do average cost for display (which suffices for user insight, though not for tax lot accounting).
  - Crypto similar: track all purchases vs sales to know what is held and average paid. If a sale happens, we can either treat it as reducing holdings (and realize a profit which we can track separately).
  - We’ll maintain a calculation per asset: store perhaps `avg_cost` and `unrealized_gain` as derived metrics.

- **Holding Period Return (HPR):** HPR is typically (Current Value – Cost) / Cost, for the period the asset was held. We can compute:
  - For each asset: HPR = (current value – total cost basis of remaining holdings) / (total cost basis) * 100%. If user hasn’t sold, that’s their paper return percentage. If partially sold, we might consider only the part still held for unrealized HPR, or a combined realized+unrealized return.
  - For the overall portfolio: since contributions happen over time, HPR is less meaningful. Instead, we might compute **time-weighted return (TWR)** or **internal rate of return (IRR)**.
    - **Time-Weighted Return**: We can calculate this by breaking the portfolio timeline into intervals between contributions/withdrawals and computing growth rates.
    - **IRR (or XIRR)**: We can treat all cash flows (deposits, withdrawals) and ending portfolio value as an investment and compute the internal rate of return. IRR gives an annualized return taking into account timing of cash flows, which is very useful for personal portfolios.
  - We’ll implement IRR for overall portfolio performance: take all contributions (e.g. salary deposits, asset purchases as negative cash flows from user perspective, etc.) and compute IRR such that NPV=0. This might need numerical methods – possibly will implement a simple Newton’s method or use a library.
  - Simpler, we might show a **cumulative return** graph which shows how net worth has grown in absolute terms and how much is from contributions vs investment growth.

- **Income, Expense, and Savings Rates:** While not explicitly requested, these are often part of analytics:
  - Month-over-month net worth change, broken into contributions (new money added) and investment growth.
  - A savings rate metric (percent of income saved) if we identify income vs expense categories. We may include this in spending analytics.

The engine will ensure these metrics are updated whenever new data comes in (like after a refresh or manual entry). Some metrics (like IRR) might be computed on demand due to complexity.

### **6.2 Spending and Budget Analytics**  
In addition to investment performance, Oversight offers spending analytics:
- **Category Breakdown:** We generate pie charts or bar charts of spending by category for a selected period (e.g. the last month or custom range). This requires summing all transactions marked as expenses (negative amounts in bank/credit accounts) by category. We might exclude transfers between accounts to avoid double counting (we can identify internal transfers by rules, e.g., if user transfers \$500 from checking to investment, it may show as debit in one account and credit in another, which isn’t actual spending – we could mark those as “Transfer” category and exclude from spending totals).
- **Trends:** We can show a line chart of total spending vs income each month, or category trends (e.g. groceries spend per month over the past 12 months).
- **Budgets:** The app can allow users to set budget targets per category (not in initial spec, but likely a future feature). For now, we at least show how actual spending compares to common budget guidelines.
- **Top Expenses:** List the largest expense transactions in the period, or unusual spikes.
- **Recurring Expenses:** Identify recurring bills (by pattern matching names and periodicity) to help user see fixed costs. AI could assist in identifying these patterns.

These analytics are powered by queries on the transactions table. We can create SQL views or use Supabase’s ability to do server-side functions to aggregate data. For example, a simple SQL to sum by category for a user’s last 30 days could be used by the frontend via Supabase.

Visualization will be in the frontend using a chart library (e.g. Chart.js or D3). The backend just supplies the computed aggregates or the raw data for the frontend to aggregate.

### **6.3 Implementation Approach**  
We have two approaches to implementing the analytics engine: **on-the-fly calculation** or **pre-computation**:
- **On-the-fly**: Compute metrics when the user requests the view. For instance, when user opens the “Performance” tab, fetch all relevant data (transactions, current holdings, etc.) and do calculations in either the frontend (JS) or backend (Node or even directly in SQL).
  - *Pros:* No stale data issues, simpler initial implementation.
  - *Cons:* Could be slow if user has a lot of data (lots of transactions to crunch, especially IRR which is iterative).
- **Pre-computation (caching)**: Maintain summary tables or cached values updated whenever new data arrives.
  - e.g., maintain a running total of contributions per month, or last calculated IRR. Or daily portfolio values stored as a time series.
  - *Pros:* Quick retrieval for UI, possibly simpler queries (just select from summary).
  - *Cons:* Complexity in keeping cache updated and correct, especially with edits.

To start, we will implement on-the-fly calculations with efficient queries, given that initial user data sizes may be moderate. We can leverage the power of SQL for some parts:
- Use SQL window functions to compute running balances or category sums easily.
- For IRR, there’s no direct SQL, so we may implement that in Node or even in the browser (the dataset for IRR is just one cash flow per event, which isn’t too heavy). Alternatively, approximate IRR via binary search on a function that we can compute easily in TS.

**Performance Considerations:** For users with thousands of transactions, on-the-fly might be a bit slow in JS. We could push heavy aggregation to the database (Supabase) which is optimized in C for that kind of work. Supabase allows RPC (remote procedure calls) in SQL or using their PostgREST interface. We could create a SQL function for “get_spending_summary(user_id, start_date, end_date)” that returns a structured result.

**Example Calculations:** 
- *Portfolio time series*: Write a routine to compute daily portfolio value. We would:
  - Take each account:
    - If investment: get initial holdings and each trade (contribution or withdrawal of cash).
    - If bank: get daily balances by summing transactions (we might cheat and use cumulative sum on transactions plus a known starting balance).
    - If asset like property: we have a sparse set of valuations, we can linearly interpolate or step-fill until next valuation.
  - Then sum up across accounts for each day.
  This is complex to do in real-time. Instead, easier: 
    - Use end-of-month snapshots for long-term view or allow user to choose granularity (1M, 3M, 1Y, All).
    - Possibly limit detailed graph to say last 1 year daily, older than that monthly.

- *XIRR implementation*: We list all cash flows:
  - Treat any money user puts in as negative cash flow (e.g. salary deposit +$500 = user gained money, but from IRR perspective, the *investment* got +500 from outside, so treat as +500 as cash flow? Actually, depends on POV: If calculating return on net worth, contributions are like deposits (negative from user’s wallet perspective). Might be easier: We look at net worth over time and contributions; maybe skip IRR for now.)
  - Possibly focus on individual account IRRs where it’s clearer (like an investment account IRR for contributions and current value).
  - We might simplify and present simpler measures initially due to complexity.

### **6.4 Reporting and Presentation**  
The results of the analytics engine are presented in various parts of the UI:
- **Dashboard:** A high-level view with current net worth, a sparkline of net worth over the past few months, and maybe key metrics (e.g. YTD return). Also might show a breakdown of current assets (a donut chart of asset allocation: X% real estate, Y% stocks, etc.).
- **Accounts/Investments Page:** For each investment account or asset, show details like quantity, average buy, current price, unrealized gain/loss in absolute and percentage terms. Possibly green/red coloring for gains/losses. If it’s a stock, show its today’s change as well.
- **Performance/Analytics Page:** Here we dive into charts:
  - Net worth graph over time.
  - Perhaps scenario comparisons (when we discuss scenarios, the results might overlay on this graph).
  - Tables of returns: e.g., “Overall portfolio 1-year return: X%, 5-year return: Y%, CAGR: Z%”.
  - Asset class performance: how each category (stocks, crypto, real estate) contributed to growth.
- **Spending Page:** Focused on expenses and budgets:
  - Pie chart of last month’s spending by category.
  - Bar chart of monthly spend vs income.
  - Table of transactions or summary by category, maybe highlighting where overspending relative to a guideline.

We also include **contextual AI-driven insights** in these pages (ties into Section 7). For example:
- On the spending page, an AI prompt might appear: “It looks like your spending on restaurants increased 20% compared to last month. Consider if this aligns with your budget.”
- On the investments page: “Your crypto holdings make up 50% of your portfolio. This is quite high; diversification might reduce risk.”

These insights would be generated by analyzing the metrics we compute and using some rules or AI to word them. The technical aspect: we can feed key numbers to an OpenAI API prompt to generate a few sentences of analysis (ensuring no private raw data leaves, just aggregated numbers/trends which is safer).

### **6.5 Accuracy and Data Quality**  
Ensuring the analytics are accurate requires quality data:
- Our deduplication and transaction completeness directly affect calculation. Missing transactions = wrong contributions, thus wrong returns. We encourage linking accounts or uploading all relevant data for best results.
- For assets like properties, since valuations are estimates, the computed net worth may not be exact. We might let users override the value if they disagree with an API estimate.
- We will label certain values as estimates and even show possible error margins if available (like property ± some percentage).
- The engine also handles edge cases like new accounts (no past data, so no return to show) or accounts closed (we may freeze their data at closure date).
- We test the calculations with known scenarios (we can simulate a dummy user with known returns to ensure our IRR or return calcs match expected).

By building this analytics engine, Oversight aims to give users a clear picture of where they stand financially and how their decisions have impacted their wealth. The next section expands on forward-looking analysis – scenario simulation – which complements these retrospective analytics.

## **7. Financial Scenario Simulation and AI-Assisted Planning**  
One of Oversight’s most innovative features is the **Financial Scenario Simulator**, which lets users model “what-if” situations and get projections and AI-guided insights. This goes beyond tracking past and present finances – it helps in **planning for the future**.

### **7.1 Scenario Simulation Tools**  
**Creating a Scenario:** Users can create a new scenario from the “Simulations” section. They might start from a template or from scratch. A scenario can include one or multiple hypothetical events, such as:
- *Investing in an asset:* e.g. “Invest \$10,000 in Bitcoin next month” or “Buy 100 shares of TSLA in Jan 2026”.
- *Purchasing a property:* e.g. “Buy a house in 2025 worth \$500,000 with 20% down and a 25-year mortgage at 5% interest”.
- *Taking a loan:* e.g. “Take a car loan of \$30,000 at 6% over 5 years starting in 2024”.
- *Changing income or expenses:* e.g. “Increase monthly saving by \$500” or “Childcare expense \$1,000/month starting 2023”.
- *Selling an asset:* e.g. “Sell my ABC stock in 2024”.

The UI for scenario building could be a form-based approach (enter parameters in fields) or a more conversational approach with the AI (discussed in AI section). In v0, a form wizard is more deterministic: user picks scenario type and fills details.

**Modeling and Assumptions:** Once events are defined, we simulate their impact over a future timeline (e.g. up to 5, 10, or 30 years). The simulation engine uses a set of assumptions to project growth:
- **Economic Assumptions:** We will have default growth rates (editable by user) for things like stock market returns, crypto returns, real estate appreciation, inflation, salary growth, etc. For example, assume stocks 5% yearly, real estate 3%, crypto – highly speculative (perhaps user defines or scenario-specific, or we can simulate multiple outcomes).
- **Interest Rates:** For loans or savings accounts, use specified interest rates. For example, a mortgage 5% will accrue interest and we calculate monthly payments, affecting cash flows.
- **Inflation:** If user wants real vs nominal values, we could factor inflation. Initially, we might keep it simple (all nominal).

The engine then projects year-by-year (or month-by-month for accuracy in near term) what the user’s finances look like if the scenario is executed. We essentially create a pro forma cash flow:
- Starting from current assets (we can optionally start from a clone of user’s current data).
- Apply each scenario event at its time:
  - If buying a house: at purchase year, decrease cash by down payment, add a property asset of the house value, add a mortgage liability of the remaining amount; then each subsequent month/year add mortgage payments (reduce cash, reduce liability, add interest expense).
  - If investing in BTC: deduct \$10k cash at that date, add X BTC to crypto holdings; then appreciate the BTC holding value according to assumed growth (or multiple scenarios for volatile assets).
  - If increasing saving: simply add extra contribution to savings every month going forward (which accumulates in cash or investment as specified).
- Calculate resulting asset values each year using growth assumptions. For instance, if user’s stocks starting \$50k, and assumption 5%/yr, in one year it becomes \$52.5k (plus any contributions).
- Summarize final outcome: e.g. “In 2030, net worth becomes \$Y, which is \$Z higher than if you didn’t do this.”

**Multiple Scenarios and Comparison:** Users can create different scenarios (Scenario A, B, C) and compare them. We will allow overlaying scenario outcomes on a graph, and a comparison table of key metrics (e.g. net worth in 5/10/20 years, peak debt, etc.). For example, Scenario A: Buy house vs Scenario B: Continue renting and investing the down payment – Oversight can show that perhaps by 2030, scenario A yields net worth X (house equity etc.) vs scenario B yields net worth Y, along with notes on liquidity, risk, etc.

**Monte Carlo Simulation (Future Enhancement):** We might include a Monte Carlo mode for investment heavy scenarios – e.g., simulate 100 possible outcomes of stock/crypto returns to show a range (like 90% chance net worth will be between A and B by 2030). This requires generating random returns each year based on volatility. Initially, this might be too advanced for v0, but it’s a goal to provide probabilistic outcomes which are more insightful than single-point estimates. The AI could help interpret Monte Carlo outputs (“There is a 20% chance you could actually have less money despite investing due to market volatility”, etc.).

### **7.2 AI-Driven Assistance**  
The “AI advisor” part of Oversight uses artificial intelligence (likely a large language model like GPT-4) to **guide the user through scenario planning and to provide personalized insights**. There are multiple ways AI is integrated:

- **Conversational Planning:** Users might interact with a chatbot-style assistant to create scenarios. For example, a user could type: *“I’m thinking of buying a \$500k condo in Toronto next year with \$100k down. How will that affect my finances over 10 years?”* The AI would parse this input, possibly clarify missing details (interest rate, etc.), create a scenario under the hood, run the simulation, and then respond with results: “If you buy a \$500k condo in 2024 with \$100k down (assuming 5% interest on the \$400k mortgage), your monthly payment would be ~\$X. By 2034, you’ll have \$Y in home equity and your net worth will be \$Z, compared to \$Z0 if you don’t buy.” The AI basically serves as a natural language interface to the simulation engine, making the feature more accessible to non-expert users. This involves NLP to extract scenario parameters and then using our deterministic model to compute outcomes.

- **Insight Generation:** After a scenario is run (whether via form or conversation), the AI can provide commentary. For instance, “Buying the house reduces your liquid savings significantly, so you should maintain an emergency fund. However, it builds equity and by year 5 your home equity surpasses the upfront costs. The break-even point compared to renting would be around year 7, considering property appreciation at 3% annually.” Such nuanced analysis can be generated by prompting the AI with the scenario details and simulation results. We will feed it structured data (like initial net worth, final net worth in both scenario and baseline, etc.) and ask it to highlight pros/cons or suggest optimizations.

- **Decision Guidance:** The AI can also answer specific questions: *“Can I afford this purchase?”* or *“What if interest rates rise?”* Using either a rule base or by calling the language model with relevant info. For example, if user scenario is buying a house at 5% rate, user asks *“What if interest rates rise to 7%?”*, the AI can modify the scenario rate and estimate impact (maybe roughly say “your monthly payment would increase by X, costing you Y more per year”). Ideally, we could re-run the sim at 7% behind the scenes and give exact numbers.

- **Personalized Suggestions:** Based on a user’s data, the AI might proactively identify opportunities or risks. E.g., “You have a lot of cash sitting idle; consider investing some of it. If you invest \$10k in a diversified portfolio, by 5 years you could potentially have \$X more.” This blurs into personalized advice, so we would include disclaimers that it’s not professional financial advice, just educational suggestions. Technically, we’d have triggers or periodic analyses where the AI gets fed the user’s current asset allocation, risk profile (if provided), etc., and generates these suggestions.

**AI Models & Infrastructure:** We’ll likely use an API to a large language model (OpenAI’s GPT-4 or GPT-3.5, or an open-source alternative if we want to self-host for privacy). Key considerations:
- We will **not send raw transaction data** or personally identifiable info to the AI. We summarize or anonymize. E.g., instead of “Your RBC Chequing has \$5000”, we say “Checking account: \$5000”.
- For scenario analysis, we send the scenario parameters and outcome summary, not the entire financial dataset. This limits exposure of sensitive data.
- We craft prompts with clear instructions to the model on what to do (analysis, friendly tone, cautionary statements if needed).
- Example prompt to AI for scenario advice: *“User scenario: Buy house 2025, price 500k, down 100k, mortgage 400k @5%, current rent 1500/m. Simulation results: In 2030 – Net worth with house: 600k (of which home equity 200k), Net worth without house (continue renting + invest downpayment): 550k. Provide advice on this decision, considering cash flow and long-term benefits.”* The model then replies with a thoughtful answer.

**User Experience for AI:** 
- There will be an “Ask Oversight AI” chat interface accessible on the scenario page and possibly on the main dashboard for general questions. We should make it context-aware: e.g., if the user is currently viewing a scenario, the AI’s context is that scenario. If on the spending page, the AI knows to answer spending-related questions.
- We may also incorporate a more guided Q&A approach: a sidebar that says “🤖 Thinking of a big decision? Ask our AI advisor!” to prompt usage.
- The AI’s responses will include caveats: e.g., “This is not financial advice, but based on the data...”.

**AI Technical Models:** We likely rely on GPT-4 for its advanced reasoning. For cost-saving, we might use GPT-3.5 for simpler tasks (like parsing a natural language input into scenario parameters, which is more straightforward). If requiring local processing, we could fine-tune a smaller model for common tasks (like categorizing transactions text to category – that’s another use of AI internally).

**Privacy & Compliance for AI:** We will disclose to users that if they use the AI features, some data might be processed by an AI service possibly outside of Canada (like OpenAI’s servers in the US). Under PIPEDA, this requires user consent and transparency. We might offer an option to disable AI features for privacy-conscious users. Also, we minimize data sent and avoid personal identifiers.

### **7.3 Scenario Simulation Output**  
After running a scenario (with or without AI involvement in creation), the app will show:
- **Projected Net Worth Chart:** A line chart from now until the chosen horizon (say 10 years) showing net worth over time with and without the scenario (baseline vs scenario). If multiple scenarios, multiple lines.
- **Key Outcomes Summary:** e.g. “Net worth in 2030 with scenario: \$X, without: \$Y. Difference: +\$Z (scenario is better by Z)”.
- **Cash Flow Impact:** maybe a chart of yearly expenses/income highlighting changes (like new mortgage payments or decreased rent).
- **Debt Profile:** if scenario involves loans, show how debt balance evolves and when it would be paid off.
- **Asset Allocation over time:** scenario might change composition (e.g., home makes real estate go from 0% to 50% of portfolio).
- **AI commentary:** as discussed, possibly a paragraph or bullet list from the AI highlighting pros/cons and tips. Example: “By purchasing the house, you convert \$100k of your savings into home equity. This increases your net worth in the long run, but you’ll have less liquidity. Ensure you keep an emergency fund for unexpected repairs or if income changes. Compared to investing that \$100k in stocks (baseline scenario), buying the house yields a slightly higher projected net worth, largely due to property appreciation and forced savings via mortgage payments.”

**Interactivity:** Users can tweak assumptions (maybe via sliders or input fields – e.g., change annual return from 5% to 3% to see effect) and the simulation updates. We might integrate the AI in a loop: e.g., after initial scenario, user asks “what if the market crashes by 20% next year?” We can adjust the simulation for a one-time -20% in year1 and show revised outcome.

**Premium Feature Consideration:** Due to the complexity and compute involved (and potentially the cost of AI API calls), the scenario planning and AI advisor might be a **premium feature**. Free users may see it as a tease but get prompted to upgrade to use it. Alternatively, free users could have a limited version (e.g., 1 scenario with limited length, or no AI advice text).

By combining the deterministic simulation with AI’s ability to interpret and communicate, Oversight offers users not just numbers, but actionable understanding – empowering them to make informed decisions about their financial future.

## **8. Security, Privacy, and Compliance**  
Oversight handles highly sensitive financial information, so security and privacy are paramount. The application is designed in accordance with **PIPEDA** (Personal Information Protection and Electronic Documents Act) guidelines for Canadian user data, and follows best practices for data protection.

### **8.1 Authentication and Authorization**  
We rely on **Supabase Auth** for user authentication. Supabase uses secure password hashing and optional 2FA. Users log in with email/password or can use OAuth providers (if enabled, e.g. Google, which Supabase supports). Authentication tokens (JWTs) are stored in httpOnly cookies or local storage as per Next.js best practice, ensuring they are sent securely to the backend. We will use Next.js middleware or Supabase client’s built-in helpers to protect pages and API routes, redirecting to login if not authenticated.

**Role-Based Access:** Each user has a role (free or premium, possibly admin for us). We implement role checks both on frontend (to show/hide features) and backend:
- In the database, a user’s `role` could be stored in their profile. We may also configure Supabase’s JWT to include a custom claim for role. For example, when a user upgrades, we update their profile and the Supabase JWT will eventually reflect that after re-login or token refresh.
- **Row-Level Security (RLS):** Every data table uses the user’s unique ID to restrict acces ([Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=Row%20Level%20Security%20in%20Supabase))】. Only admins (us) with service role credentials could bypass RLS for support or debugging, but in the app, normal users cannot query others’ data. Supabase’s policy syntax makes it easy: e.g., `create policy select_on_transactions for select on transactions using (user_id = auth.uid())`. Also for insert/update – ensure `user_id = auth.uid()` on new records to prevent a user from accidentally writing someone else’s ID.

**Session Management:** The app will maintain sessions with refresh token rotation if possible, to reduce risk of leaked tokens. We’ll also have mechanisms for users to log out from all devices (Supabase supports managing sessions).

### **8.2 Data Security in Transit and At Rest**  
- All network traffic is over **HTTPS/TLS**. This includes calls from frontend to Next.js API, calls from Next.js to external APIs, and interactions with Supabase. (Supabase endpoints and database connections are encrypted).
- **Encryption at Rest:** The Supabase Postgres database encrypts data at rest on the disk level (managed by Supabase). In addition, we plan to encrypt particularly sensitive fields in the database: e.g., Plaid access tokens, exchange API keys, maybe even transaction descriptions if considered sensitive (though likely just tokens and secrets). We can use Postgres’s pgcrypto to encrypt/decrypt using a key we supply at query time (the key can be derived from a user’s password or a master key).
- **Supabase Storage:** Used for storing uploaded documents (statements). We put them in a private bucket. Access to that bucket is controlled by policies – by default, no public read. When the app needs to let the user download their own statement, it will generate a signed URL via Supabase (valid short time) or fetch the file via the server and stream to user. This way, no one can randomly access files.
- **Backups:** Supabase provides automated backups of the database. Those backups should also be encrypted. We ensure any off-site backups we manage are encrypted. Under PIPEDA, if data is stored outside Canada, users should be informed. Supabase currently hosts in various regions; we will choose a region that is allowed and ideally in North America. If possible, a Canadian region (Supabase might host on AWS Montreal or similar if available; if not, US is next, but we’ll mention data might reside on US servers via our privacy policy, which PIPEDA would require disclosing cross-border storage).
  
### **8.3 PIPEDA Compliance**  
To comply with Canadian privacy law (PIPEDA), we adhere to its principles:
- **Consent:** We obtain user consent when linking accounts (which inherently means sharing their data with us and Plaid). The app’s terms will explain what data we collect and why. For AI features, we explicitly ask consent if any personal data is to be sent to AI APIs.
- **Limiting Collection:** We only collect data needed for the app’s stated purposes (financial tracking and advice). For example, we do not collect social insurance numbers, or unrelated personal info. Financial data collected is detailed, but directly used for the user’s benefit.
- **Limiting Use and Retention:** We use data only within the app (we’re not selling it or sharing with third parties except those integrated by user request, like Plaid). If a user deletes their account, we will delete their data (Supabase provides user deletion; we’ll also wipe related records). We might retain some aggregated or anonymized stats (for business metrics) but nothing identifiable.
- **Accuracy:** We strive to keep data accurate by fetching latest on user’s command. Users can also edit certain data. If a user finds an error (like a mis-parsed transaction), they can correct it. 
- **Safeguards:** We’ve covered encryption and RLS. Additionally, we ensure internal access to production data is limited (only authorized devs for troubleshooting under strict circumstances, and even then likely we wouldn’t look at raw transactions unless user asks for support). Admin access to Supabase will be protected by MFA.
- **Openness & Individual Access:** Our privacy policy will be clear on what we collect. Users can request an export of their data (we can provide a data export feature – perhaps a JSON or CSV of all their accounts and transactions on demand). They can also request deletion, which we will comply with (the app might have a “Delete my account” function to automate this, wiping all personal data).
- **Challenging Compliance:** We have contact info for users to reach out with privacy concerns, fulfilling PIPEDA’s accountability principle.

### **8.4 Additional Security Measures**  
- **Content Security Policy (CSP):** On the web app, we’ll enforce a strict CSP to mitigate XSS, only allowing scripts from our domain and known domains (like Plaid, Supabase, analytics if any).
- **Dependencies:** We will keep libraries updated to avoid known vulnerabilities. Use Plaid’s latest SDK, etc.
- **Penetration Testing:** We plan to conduct security testing or use tools to scan for common vulnerabilities (SQL injection – though using parameterized queries or ORMs should avoid it, XSS, CSRF – Next.js + Supabase handles CSRF tokens in forms, etc.).
- **Sensitive Info Redaction:** We ensure that we do not log sensitive info. For example, if logging a Plaid API response for debugging, we will mask account numbers or tokens.
- **AI Output Verification:** Since we use AI for suggestions, we must ensure it doesn’t leak someone else’s info or hallucinate something problematic. We constrain its context strictly to the user’s data we provide. And we put guardrails in the prompt to not produce identifying info or advice that violates policies (e.g., no hate, etc., though unlikely in financial context).

By following these security practices, Oversight builds user trust that their data is safe. Users can confidently connect their accounts knowing that access is protected and under their control (with on-demand updates and easy data removal).

### **8.5 Performance and Reliability Considerations**  
Security also ties into reliability – e.g., ensuring the system isn’t easily brought down by abuse:
- We will implement rate limiting on API routes (to prevent a malicious actor from spamming, or even a user inadvertently causing heavy load by too frequent refresh).
- Use Captcha or other verification for sign-ups to avoid bot accounts (since we connect to financial data, we don’t want fake account spam).
- Monitor for suspicious activity (multiple failed logins -> potential brute force, we can temporarily lock or require captcha).
- Ensure all third-party keys have proper permissions (e.g., if using an AWS key for something, scope it minimally; for exchange API keys we instruct users to give read-only keys when possible).

In summary, Oversight is engineered with a strong security-first mindset, complying with legal standards and using robust technical safeguards to protect user data.

## **9. Role-Based Access Control and Premium Features**  
Oversight will offer a free tier with substantial functionality and a premium tier unlocking advanced features. The architecture accounts for role-based feature locking, meaning certain operations or UI elements are only available to users with the appropriate role. This section outlines which features are premium, how roles are managed, and how the system enforces these differences.

### **9.1 User Roles and Management**  
We define at least two roles: **Free User** and **Premium User**. A third role, **Admin**, is internal for our team to manage the system (not something an end-user can become normally). These roles can be stored in the `profiles` table or managed via an external billing system (e.g., Stripe) that signals to our app who is premium.

If using Supabase, once a user upgrades, we update a `is_premium` boolean or `role='premium'` in their profile. This can then be included in the JWT by adding it as a custom claim (Supabase allows JWT to include user metadata through an auth function or when issuing tokens). If not using custom claims, our frontend can simply fetch the profile after login to know the role.

**Admin Role:** Admins can have a different RLS policy (we, as admins, might bypass RLS to see data if needed, or more realistically, we’ll use the Supabase service role API key in admin tools which inherently bypasses RLS without needing a special user in the app). We won’t focus on admin features here, but note it exists.

### **9.2 Feature Allocation: Free vs Premium**  
Below is a table of key features and which tier has access:

| **Feature**                             | **Free Users** | **Premium Users** |
|-----------------------------------------|---------------|-------------------|
| Link Bank Accounts via Plaid            | Yes (limited number, e.g. up to 2 institutions) | Yes (unlimited institutions) |
| Manual CSV/PDF Transaction Import       | Yes           | Yes |
| Manual Transaction Entry               | Yes           | Yes |
| Multi-Currency Tracking                | Yes           | Yes (with advanced FX analytics) |
| Real-Time Balance and Transaction Refresh | Yes (manual trigger) | Yes (manual trigger, maybe option for automatic scheduled refresh if user wants) |
| Spending Analytics (categories, charts)| Yes           | Yes (with extended history comparison, custom categories) |
| Basic Portfolio Analytics (net worth, asset allocation, basic returns) | Yes | Yes |
| Advanced Performance Metrics (XIRR, detailed ROI per asset) | Limited (maybe last 1 year only) | Yes (full history and advanced metrics) |
| Vehicle and Real Estate Tracking       | Yes           | Yes (could possibly mark real estate API use as premium if API cost high, but ideally yes for both) |
| Financial Scenario Simulation Tools    | No (feature locked, with prompt to upgrade) | **Yes** (full access) |
| AI Assistant (advice, chat, insights)  | No (or very limited trial) | **Yes** (full access) |
| Alerts & Notifications (if implemented, e.g., low balance alert) | Limited (basic email alerts) | Yes (real-time alerts, customizable) |
| Data Export (CSV/Excel of all data)    | Yes           | Yes |
| Priority Support                       | No (community/self-help) | Yes (direct support email) |

In particular, the **Scenario Simulation** and **AI Advisor** are premium. These are costly features (computationally and in terms of AI API costs) and also serve as a strong selling point for upgrade. Free users will see that these features exist (e.g., the UI might show a teaser or disabled button “Premium feature – upgrade to use”). For example, the “Simulate” menu item could be visible but clicking it explains it’s for premium only, highlighting benefits.

We might allow a **trial** period where a free user can try the scenario feature a couple of times to see value.

Another premium angle is **account limits**. Many personal finance apps limit how many accounts you can have on free tier. We might say free users can link up to, say, 5 accounts in total (or a certain number of Plaid items). Premium gets unlimited. This is implemented by simply checking count of accounts on create new, or via RLS we could enforce a limit by role (though easier done in app logic). But given Plaid charges per account, limiting for free might be necessary cost-wise.

### **9.3 Enforcement in Code**  
**Frontend Enforcement:** The React app will check the user’s role and conditionally render features. For example:
- In the navigation menu, if `user.role !== 'premium'`, we either hide the “Scenario Simulator” option or show it with a lock icon.
- If a free user somehow navigates to a premium page (say by URL), we intercept and show an upgrade prompt instead of the content.
- When initiating an action (like adding a 6th bank account on free), the frontend can block and say “Account limit reached for free tier.”

**Backend Enforcement:** It’s important to also enforce critical limits on the backend, since a malicious user could bypass frontend. Some approaches:
- Use Supabase RLS policies to restrict certain operations by role. For example, we could set a policy on the `scenarios` table: allow `select/insert` only if `auth.jwt().role = 'premium'`. This would outright prevent free users from even storing scenarios via direct API calls. Supabase’s JWT can contain `role` if we set it up; otherwise we can join with the profile table in a policy (bit complex, but doable using a subquery to check user’s role).
- Alternatively, in Next.js API routes, every time a premium feature endpoint is called, check the user’s role from the JWT or database before proceeding. For instance, our `/api/simulate` route would verify `if(user.role !== 'premium') return 403`.
- Account linking limit: we could enforce via an RLS policy on `accounts` table for insert: e.g., count existing accounts for that user, and disallow insert if count >= 5 and user not premium. This might be done via a function in a policy (`( select count(*) from accounts where user_id = auth.uid()) < 5`). This is possible but perhaps easier at application logic level.
- Since Supabase RLS cannot directly query across to count (it can in a subquery though), we might prefer app logic for such constraints for clarity.

**Premium Access Management:** We will integrate a payment/subscription system (likely Stripe) outside of this spec’s core. But basically, when a user pays, our backend (maybe via a webhook from Stripe) will mark them premium. We ensure minimal delay in upgrading their access (maybe force a refresh of their session token or just refetch profile). Similarly, if a subscription ends, downgrade role.

We must handle the case where a premium user’s subscription lapses and they revert to free: what happens to their scenarios data? We likely keep it saved but inaccessible until they resubscribe, rather than delete it (in case they come back). So the data stays in DB, but free role can’t access scenarios as per RLS. We’d message: “Your premium subscription ended, renew to access your scenarios.” This encourages renewal.

### **9.4 Future Roles**  
We could envision more granular roles in future (e.g., a “Pro” tier or a family/shared account plan), but for now, free vs premium is the main divide. The system is flexible to add roles, because our design either checks a role field or a boolean.

**RLS Example for Premium:** If we include role in JWT, a policy example:
```sql
-- In Supabase, after adding 'role' to JWT:
create policy "premium_can_use_scenarios" on scenarios
  for all using (
    auth.jwt() ->> 'role' = 'premium' and user_id = auth.uid()
  );
```
This ensures only premium users (and their own data) can select/insert/update scenario records. Free user attempts would get denied at DB level (even if they somehow invoked it).

Not all premium features need RLS; some are purely UI (like how many accounts). But we cover critical data differences.

### **9.5 Communication of Premium Benefits**  
From a product perspective, we will gently push free users to consider premium by highlighting the added value:
- The UI might have an “Upgrade” button always visible (maybe in the user menu or as a badge on locked features).
- Tooltips or modals on locked features describing what they unlock: e.g., “Unlock AI Advisor and Future Planning – try Premium free for 30 days”.
- Email marketing could be used too, but that’s beyond spec.

This ensures that the separation of roles not only is enforced but also serves its purpose to entice upgrades.

## **10. Frontend Design and UX (Palantir-Style Aesthetics)**  
Oversight’s frontend is carefully designed to present complex financial information in a clear, intuitive, and visually appealing way. The design philosophy draws inspiration from Palantir’s enterprise software – emphasizing a **dark, modern UI**, dense data visualization, and smooth interactions. Here we describe the UI/UX design principles, layout, and use of technologies like Framer Motion for animations.
 ([Financial Dashboard / Dark by Kevin Dukkon  on Dribbble](https://dribbble.com/shots/24044531-Financial-Dashboard-Dark))】 *Figure 2: Example of a dark-mode financial dashboard UI (inspired by Palantir’s design). Oversight will feature a left sidebar for navigation, a content area with cards and charts on a dark background, and subtle color accents for highlights (e.g., orange/red for negative values, green for positive). The style is minimalist yet informative.*  

### **10.1 Overall Layout and Navigation**  
Oversight will use a responsive dashboard layout:
- **Sidebar Navigation:** On desktop, a vertical sidebar on the left provides access to main sections: **Dashboard**, **Accounts**, **Transactions**, **Analytics**, **Scenarios** (Premium), **Settings**. Each item uses an icon + label, similar to Palantir’s Foundry or modern SaaS apps, and highlights on hover. In dark mode, the sidebar background is a near-black (#1e1e1e), and icons are simple line icons (using a library like Feather or FontAwesome, tuned for consistency). The sidebar can collapse (icons only) or expand on hover to save space if needed.
- **Top Bar:** A top bar displays the app logo/name on the left (if sidebar is collapsed or on mobile), and on the right shows the user’s name/avatar menu and possibly quick actions (like a “Refresh All” button or a period selector for analytics). In Palantir style, top bars are often minimal; we might only have a settings icon and the user avatar with a dropdown for account settings/logout.
- **Main Content Area:** This is the dynamic area that changes per route. It sits to the right of the sidebar (or full width on mobile). It typically has a header for context (e.g., “Dashboard” or “Spending Analytics”) and the content is arranged in panels, cards, or grids.

**Responsive Design:** On smaller screens (tablet/mobile), the sidebar might become a collapsible menu (hamburger icon). The content may switch to single-column stacked charts and lists. We ensure charts are still legible on mobile by possibly simplifying them or providing horizontal scroll for large tables.

**Color Scheme:** Predominantly dark background with light text:
- Background: #121212 (very dark grey) for main surfaces, with slightly lighter (#1e1e1e) for cards to create layering.
- Text: Mostly a light grey (#E0E0E0) or off-white for primary text, with secondary text in a muted grey (#A0A0A0).
- Accent Color: We might choose an accent (Palantir often uses a teal or blue for highlights). However, financial apps often use green/red to indicate financial ups/downs. We can use green (#4caf50) for positive changes/profits and red (#f44336) for negatives/losses. For neutral highlights or selection, maybe a teal or blue (#2196F3) as our brand color.
- The Palantir aesthetic is usually fairly monochromatic with hints of color in data visualizations. We will similarly keep the UI chrome subtle and let charts (pie segments, bar graphs) provide color where needed.
- Dark mode will be the default and perhaps only mode initially (since specifically requested). We will ensure sufficient contrast (background vs text at least WCAG AA standard) given the dark theme.

**Typography:** Use a clean sans-serif font (Palantir uses proprietary fonts in Foundry, but we might use an open source like Inter or Roboto). Font sizes will be relative: e.g., 14px or 15px base for body text, larger (18-20px) for headings. Numeric data might be slightly larger or bold when important (like the net worth number on dashboard could be big and bold). We’ll align numbers to the right in tables for readability, and use formatting (commas, currency symbols).

### **10.2 Page Designs**  
- **Dashboard:** A snapshot view. It might have a grid of cards:
  - “Net Worth” card with the total in large font and perhaps a small sparkline of its recent trend.
  - “Spending This Month” card with total spending and maybe top category.
  - “Portfolio Allocation” card with a donut chart of asset breakdown (cash, stocks, crypto, etc).
  - Alerts/insights panel if any notable events (like “Your cash balance is higher than last month” or AI tip).
  This gives at-a-glance info and quick links (each card might link to deeper page).
- **Accounts/Transactions:** Possibly a combined page where left side lists accounts with balances, and right side shows either aggregated transactions or one account’s transactions when selected. Could be like a personal finance ledger:
  - If an account is selected, show its recent transactions in a scrollable list, with filters by date/category.
  - Each account item in the list has an icon (bank, card, crypto logo maybe) and balance.
  We use subtle separators and hover effects, no bright borders. Perhaps alternating row shading or just a very light border on the transaction list.
- **Analytics (Spending):** Visual heavy page with charts:
  - A row of buttons or tabs to select time range (e.g., Month to date, Last Month, Last 6 months, Custom).
  - Pie chart for categories, next to a table of category totals.
  - Bar chart for monthly trend. Perhaps an interactive chart where you can tap a bar to see breakdown that month.
  - Possibly filter by account or account type (so user can see just credit card spend vs total).
  Use of color: each category could have a distinct color in the pie, but ensure they are discernible in dark mode (we might pick from a palette that is colorblind-friendly).
- **Portfolio (Investments) Analytics:** If separate from spending page:
  - Charts for portfolio growth over time (line chart).
  - A table of holdings with columns: Asset, Quantity, Current Value, P/L, P/L%.
  - Maybe risk metrics or diversification stats.
  This page is more number-dense. We use formatting like green text for positive gains, red for negative. Possibly small up/down arrows icons.
- **Scenario Simulator:** For premium, if user has none, show a welcome explaining they can create scenarios. If they have scenarios, list them with a summary (like “Buy House – Net Worth in 10yr: \$X vs \$Y baseline”).
  - A button to “Create New Scenario” that opens the form or chat interface.
  - For a selected scenario, show its details and results (as described in Section 7: charts, etc.). Possibly even allow editing events in place.
  - If using conversational UI: a chat panel could be on this page, where the user can type questions and the AI answers about the scenario. This would be a unique UI element: a chat bubble interface embedded in the scenario page.
- **Settings/Profile:** Standard form for profile info, currency preference, and subscription status. In Palantir style, forms are often simple, with each field underlined or in well-separated sections. Dark mode form fields might have lightly outlined boxes on focus.

### **10.3 Interactions and Framer Motion Animations**  
We want a smooth, modern feel:
- **Page Transitions:** Using Framer Motion, we can animate page content appearing. For example, when navigating from Dashboard to Analytics, instead of a harsh cut, we could fade out dashboard cards and fade in the analytics charts, or slide them in. Given it’s a single-page app likely, we can define transition variants for each page container.
- **Chart Animations:** When a chart loads, animate the bars or pie slices growing from 0 to their value. Framer Motion can animate SVG paths or we can use chart library’s built-in animations. This adds delight and helps draw attention.
- **Hover Effects:** Buttons and clickable elements will have hover effects like subtle scale-up or color change. For example, the “Refresh” icon might rotate on hover or on click, using Framer Motion to smoothly rotate and back.
- **Expandable Panels:** If we show/hide sections (like filtering options), animate the height change rather than a jump cut. 
- **Modal dialogs:** If we use any (like adding manual transaction as a modal), animate it popping in (small scale + opacity to full).
- **Sidebar collapse:** If user toggles sidebar, smoothly shrink it to icons-only (width animation) and add tooltips on hover for icon labels.

All animations should be **subtle and fast** (typically 200-300ms) to keep the app feeling snappy. We avoid excessive or distracting motion – it should feel natural. Palantir’s style is generally not cartoonish; it’s purposeful animations for transitions and data appearance.

### **10.4 Palantir-Influenced Aesthetics**  
Palantir interfaces often have:
- Dense data tables but with clear spacing, often a dark theme with green accents (for Foundry).
- Use of **grid lines and separators**: e.g., light grid lines in tables or charts to guide the eye.
- **Tooltips and context info:** On hover of data points, show detailed tooltip. We will do similar for chart points or truncated text.
- **Icons and Logos:** Possibly use simple line icons for accounts (maybe use bank logos if available for linked institutions via Plaid, to quickly identify them – e.g., RBC logo next to that account). Palantir’s design often custom icons, but we can leverage FontAwesome or Material Icons in outlined style to stay minimalist.
- **Dark Mode Best Practices:** Avoid pure black (#000) as it’s harsh; we use dark greys. Use color sparingly (only to denote important things or interactive elements). Ensure focus states are visible (for keyboard navigation, a focus ring may be a bright outline).
- **Blueprint.js** (Palantir’s open source UI kit): We could incorporate some Blueprint components (it’s a React component library with a dark theme option). Blueprint has robust table, date pickers, etc., which might accelerate development and naturally give a Palantir-like feel since it’s literally by Palantir. If we choose, we can style Blueprint to match our theme colors. Alternatively, we can use headless UI components and custom style, as long as we follow the aesthetic guidelines.

### **10.5 Accessibility and Polish**  
We will ensure the interface is accessible:
- Adequate text contrast on dark background (e.g., we won’t use medium grey text on dark grey if it’s not readable).
- Provide alt text and labels for screen readers on icons and charts. For charts, maybe a hidden data table or summary so screen reader users get the info.
- Keyboard navigation: all interactive elements (links, buttons, form fields) reachable via Tab, and any custom components (like a custom select dropdown) will be implemented with accessibility in mind (could use Radix UI or Headless UI for accessible primitives).
- Animations will be disabled or reduced if user prefers reduced motion (respect CSS prefers-reduced-motion).

**Framer Motion Integration:** We’ll use it by wrapping our components in `<motion.div>` and defining variants for states (initial, animate, exit for pages in Next transitions for example). It integrates well with React and is straightforward to add once we design the interactions.

### **10.6 Example Use Case Walkthrough (UX)**  
To illustrate the UX: A user logs in and lands on the Dashboard. They see the dark-themed dashboard with key info. They decide to refresh their data – they click the refresh icon on the top bar. A loading spinner maybe animates (using Motion to rotate 360). The data updates (maybe numbers flip odometer-style to new values – a possible animation effect where the number transitions to new value smoothly). They then go to Transactions page via sidebar; on hover the sidebar item highlights (slight background lightening), on click the main content fades to the new view listing transactions. They filter by category “Food” – a filter panel slides down, they select category, panel slides up, and the list items are filtered with a nice opacity transition for those disappearing. Then they go to Analytics – the line chart animates drawing from left to right, pie chart slices spin in. It’s engaging but not slow.

Overall, Oversight’s UI aims to make complex data understandable at a glance, with design cues that convey professionalism and trust (dark theme, clean lines, no garish colors), and interactive elements that enhance usability (animations as feedback or visual explanation) without overwhelming the user.

## **11. Conclusion**  
This specification provided a comprehensive overview of Oversight, a Canadian-focused financial tracking application. We covered the system architecture (Next.js frontend, Supabase backend, third-party APIs), detailed how data from various financial sources is ingested and normalized, and described the portfolio analytics engine that drives insights on past and future finances. Special attention was given to scenario planning and the integration of AI assistance to help users make informed decisions, which distinguishes Oversight as not just a tracking tool but a forward-looking advisor. We also outlined how role-based access enables a sustainable free/premium model, and how the design (inspired by Palantir) will deliver a superior user experience with a dark, elegant interface and smooth animations.

By following this design document, developers can implement Oversight’s features methodically, and product stakeholders can verify that all requirements (from multi-currency support to PIPEDA compliance) are met. This document is also structured to be used with AI development tools to generate initial code scaffolds: the clear delineation of frontend components, backend logic, and external integrations can guide such tools in creating a Vercel-ready Next.js project with Supabase integration.

Ultimately, Oversight aims to empower Canadian users to gain **full oversight** of their finances – past, present, and future – within a secure, intelligent, and user-friendly platform.
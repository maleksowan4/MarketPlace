# Data Protection, Flows, and Lineage Document
## URN: TECDT510401 — Performance Criterion: P9
**Document Goal:** Outline how data flows through the Marketplace application, trace data lineage, define retention periods, specify the lawful bases for processing sensitive data, and produce required data protection artefacts.

---

## 1. End-to-End Data Flow & Lineage
Data travels across three boundaries: the Client Browser (Next.js), the API Web Server (Express), and the Relational Database (SQL Server).

### A. Data Flow Visual Mapping
```
[User Browser (Next.js)]
       │
       ▼ (1. JSON Payload sent via HTTPS Fetch)
[Express Web Server (API Router)]
       │
       ▼ (2. Middleware scans JWT signature and Role)
[Controller Layer (Business Logic)]
       │
       ▼ (3. Parameters bound to prevent SQL Injection)
[Database Pool (msnodesqlv8)]
       │
       ▼ (4. ODBC Windows Auth transaction)
[SQL Server Database (MarketPlace)]
```

### B. Data Lineage Case Studies (Tracking Lifecycle)

#### Lifecycle 1: User Account & Wallet Registration
1. **Origin:** A guest inputs a username, email, password, and selects a role on the register form `/register`.
2. **Transit:** Next.js sends a `POST /api/users` request containing the body: `{ username, email, password, role }`.
3. **Transformation:** The backend controller intercepts the request, generates a cryptographic salt, and hashes the password using `bcryptjs` to produce a 60-character `PasswordHash` string.
4. **Storage:** The backend runs SQL queries inserting the user record into the `Users` table and initializing a `$0.00` balance row in the `Wallets` table.
5. **Data Lineage Mapping:** 
   `Form Inputs` $\rightarrow$ `HTTP POST` $\rightarrow$ `Bcrypt Hashing (Transformation)` $\rightarrow$ `Users Table` + `Wallets Table` (Persistence).

#### Lifecycle 2: Transactional Checkout
1. **Origin:** A buyer clicks "Place Order" on `/cart` containing local cart items.
2. **Transit:** Next.js posts the cart array to `POST /api/orders` along with the JWT bearer token.
3. **Validation:** The server maps the JWT payload to find the `BuyerID`, queries `Wallets` to inspect the available `Balance`, and queries `Products` to verify stock.
4. **Transformation:** The backend starts a SQL transaction. It deducts the total amount from the buyer's balance, adds it to the seller's balance, decrements product stocks, and inserts a row into `Orders` returning a new `OrderID`.
5. **Data Lineage Mapping:**
   `Browser Cart` $\rightarrow$ `Express Controller` $\rightarrow$ `SQL Transaction (Deduction & Credit)` $\rightarrow$ `Orders Table` + `OrderItems Table` + `WalletTransactions Table` (Persistence).

---

## 2. Personally Identifiable Information (PII) Directory
We audit and classify all personal data processed within the application:

| Data Field | Database Column | Classification | Purpose of Processing | Protection Method |
| :--- | :--- | :--- | :--- | :--- |
| **Username** | `Users.Username` | Indirect Identifier | Displaying names on dashboards and order logs. | Access control validation (JWT). |
| **Email Address** | `Users.Email` | Direct Identifier (PII) | Account authentication, login ID, and communications. | Hashing login index, strict query parameterization. |
| **Password** | `Users.PasswordHash` | Highly Sensitive PII | Validating account ownership during login. | One-way hashing using `bcryptjs` (salt rounds = 10). |
| **Wallet Balance**| `Wallets.Balance` | Sensitive Financial | Executing order purchases and seller credits. | Relational database access controls, transaction scoping. |
| **Transaction History**| `Orders.TotalAmount` | Financial Log | Financial bookkeeping, invoicing, and tax audit audits. | Restricted SQL Server logins, parameter boundaries. |

---

## 3. Lawful Bases for Data Processing
Under standard data protection laws (such as GDPR), personal data can only be collected and processed under specific legal criteria. Our application operates under two primary lawful bases:

### Basis 1: Contractual Necessity (Article 6(1)(b))
* **Application:** We process the user's `Username`, `Email`, `WalletID`, and `Wallet balance` to fulfill the core service contract. 
* **Justification:** We cannot register accounts, verify buyer identities, check product availability, process money transactions, or record orders without collecting this information.

### Basis 2: Legal Obligation (Article 6(1)(c))
* **Application:** We process and retain `Orders`, `OrderItems`, and `WalletTransactions` history records.
* **Justification:** Financial regulations, consumer protection laws, and business tax audits require keeping auditable evidence of digital cash payments and orders for a set period.

---

## 4. Data Retention Policy
We enforce clear retention limits to ensure data is not stored longer than necessary:

| Data Type | Retention Period | Lawful Justification | Deletion/Archiving Method |
| :--- | :--- | :--- | :--- |
| **Active User Profiles** | Duration of active account. | Contractual necessity. | Upon user account deletion, the profile is permanently purged from `Users` (cascading deletes to `Shops` and `Wallets`). |
| **Hashed Passwords** | Duration of active account. | Security necessity. | Purged instantly when the user deletes their account. |
| **Orders & Invoices** | 7 years from transaction date. | Legal tax and audit regulations compliance. | Archived into secure read-only SQL storage after 7 years, then hard-deleted. |
| **Wallet Transaction Logs** | 7 years from transaction date. | Financial audit compliance. | Archived along with orders logs, then hard-deleted. |
| **System Security Logs** | 1 year from creation. | Security audit/incident review. | Automated script purges rows from the `AuditLogs` database table daily once records exceed 365 days. |

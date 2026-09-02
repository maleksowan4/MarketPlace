# Unified Software Testing Specification & Deliverables
## Project Name: Relational Marketplace Portal
**Standard Reference URNs:** 
* **TECIS503301** — Design Tests for Software Products
* **TECIS503402** (or TECIS503402 equivalent) — Test Plan Specification

This unified document compiles all QA design, planning, and execution artifacts for the **Relational Marketplace Portal**. It is structured into six separate, distinct sections to act as the single source of truth for all software testing activities, mapping requirements directly to strategy, design, cases, data parameters, and verification.

---

## Table of Contents
1. [Section 1: Software Testing Strategy](#section-1-software-testing-strategy)
2. [Section 2: Software Test Plan](#section-2-software-test-plan)
3. [Section 3: Test Design Specification](#section-3-test-design-specification)
4. [Section 4: Test Case Catalogue](#section-4-test-case-catalogue)
5. [Section 5: Test Data Specification](#section-5-test-data-specification)
6. [Section 6: Requirements Traceability Matrix](#section-6-requirements-traceability-matrix)

---

<div style="page-break-after: always;"></div>

## Section 1: Software Testing Strategy

### 1. Executive Summary & Objective
The objective of this Test Strategy is to define the testing boundaries, methodologies, and core test types required to validate the functionality, security, performance, and data integrity of the **Relational Marketplace Portal**. 

Our strategy ensures that all user actions—from signing up to atomic wallet checkouts—align with documented functional and non-functional specifications.

### 2. Scope of Testing
The testing activities are categorized across the three core layers of our system architecture:

```
┌──────────────────────────────────────────────────────────┐
│              Next.js Frontend Client Layer               │
│  - Controlled form inputs (email, password validation)    │
│  - Client-side LocalStorage cart state updates           │
│  - AuthContext hook state synchronization & navbar UI     │
└────────────────────────────┬─────────────────────────────┘
                             │ (HTTPS JSON Requests)
                             ▼
┌──────────────────────────────────────────────────────────┐
│              Express.js API Backend Layer                │
│  - Auth & authorization middlewares (JWT verifies role)   │
│  - Business logic controllers (stock checks, balance)    │
└────────────────────────────┬─────────────────────────────┘
                             │ (ODBC msnodesqlv8 Driver)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                MS SQL Server Database                    │
│  - Table schemas, constraints (PK, FK, unique email)     │
│  - Stored Procedures & Views execution validation        │
│  - Transactional ACID properties (Order placement)       │
└──────────────────────────────────────────────────────────┘
```

### 3. Core Testing Techniques & Architectural Justification

#### A. Functional Testing
* **Definition:** Testing specific user features to ensure they behave according to specifications (Black-box testing).
* **Application:** Validating that users can input values, click buttons, register accounts, list products, and execute checkouts.
* **Justification:** Essential for verifying that the basic user journeys (Buyer and Seller workflows) work as intended before deploying features.

#### B. Integration Testing
* **Definition:** Verifying that independent modules or layers of the application communicate correctly.
* **Application:** 
  1. Testing that the Next.js `AuthContext` successfully grabs, stores, and passes JWT tokens to page components.
  2. Testing that the Express controllers successfully query the database pool initialized in `config/db.js`.
* **Justification:** Since the frontend (port 3000) and backend (port 5000) are decoupled, we must ensure that headers, cookies, and CORS configurations let them communicate securely.

#### C. System Testing (End-to-End)
* **Definition:** Testing the fully integrated application as a whole system to verify complete user journeys.
* **Application:** Executing a complete workflow: A seller registers $\rightarrow$ lists a product $\rightarrow$ a buyer registers $\rightarrow$ deposits funds $\rightarrow$ browses the shop $\rightarrow$ adds the product to their cart $\rightarrow$ checks out $\rightarrow$ the seller accepts the order.
* **Justification:** Confirms that the components function together as a unified system under real-world usage scenarios.

#### D. API Testing
* **Definition:** Programmatically verifying HTTP endpoints directly without the graphical user interface.
* **Application:** Checking request/response payloads, headers, parameter bindings, and HTTP status codes (200, 201, 400, 401, 403, 404, 500) for all 17 routes.
* **Justification:** Ensures that our API contracts (documented in `api.md`) are strictly followed by the backend, preventing client crashes.

#### E. Database Testing
* **Definition:** Testing data integrity, constraints, query execution, and transactions inside SQL Server.
* **Application:**
  1. Testing **Atomic Transactions**: Verifying that if an order checkout fails mid-way, all related database writes (wallet updates, stock updates) are completely rolled back.
  2. Testing **Constraints**: Verifying that inserting duplicate emails into the `Users` table throws a primary database constraint violation.
* **Justification:** Our application's core business rule is database consistency. Database testing guarantees that financial balances and inventory stocks remain accurate and non-corrupt under all conditions.

#### F. Security Testing
* **Definition:** Verifying that data protection controls, authentication guards, and role authorizations function correctly.
* **Application:**
  1. Verifying that passwords stored in `Users.PasswordHash` are salt-hashed using `bcryptjs`.
  2. Verifying that sending an expired or invalid JWT token in the `Authorization` header returns a `401 Unauthorized` response.
  3. Verifying that a Buyer cannot access `/api/products/seller` (blocked by RBAC middleware).
* **Justification:** Protects user privacy and financial data from unauthorized access or malicious requests.

#### G. Performance Testing
* **Definition:** Testing the responsiveness, stability, and speed of the system under normal and peak loads.
* **Application:** Verifying that SQL Server indices (such as `IX_OrderItems_Order_Product`) allow product searches and checkouts to resolve in under 15 milliseconds.
* **Justification:** Prevents system bottlenecks and ensures high availability when multiple users are querying products simultaneously.

#### H. Usability Testing
* **Definition:** Verifying that the user interface is intuitive, accessible, and provides immediate visual feedback.
* **Application:** Testing that active navigation links are highlighted in the Navbar and that backend errors (like "Invalid password") are clearly displayed in user-friendly banners on form fields.
* **Justification:** Prevents user confusion and ensures the website is navigable and screen-reader friendly.

---

<div style="page-break-after: always;"></div>

## Section 2: Software Test Plan

### 1. Test Objectives & Scope
The test plan serves to verify that the application satisfies both the operational workflows and technical performance standards of the marketplace.

#### A. Core Functional Objectives:
1. **User Role Separation:** Verify that registration isolates Buyers and Sellers, auto-initializing corresponding Shop and Wallet rows.
2. **Catalog and Navigation:** Verify that Buyers/Guests can view active storefront listings and search shop product lists.
3. **Cart Restrictions:** Verify that the cart enforces the single-shop addition limit in the browser cache.
4. **Checkout Integrity:** Verify that placing orders executes transactionally, deducting and crediting balances while updating inventory.

#### B. Out of Scope:
* Multi-seller cart split-shipment checkouts (explicitly blocked by system requirements).
* Real-world bank gateway payments integration (all payments are verified inside the database's Virtual Wallet).

### 2. Test Environment & Architecture Configuration

#### A. Hardware & System Requirements:
* **Operating System:** Windows 10/11
* **Memory:** Minimum 8GB RAM
* **Disk Space:** Minimum 1GB free space for node packages and SQL database logs.

#### B. Software Runtime Requirements:
* **Runtime Engine:** Node.js (v18.0.0 or higher)
* **Web Client Framework:** Next.js (v16.2.9)
* **Backend Framework:** Express.js (v5.2.1)
* **Database Management System:** Microsoft SQL Server 2017 (or higher)
* **Testing & Diagnostic Tools:** Postman Client, SQL Server Management Studio (SSMS).

#### C. Network Configuration (Local Host):
* **Frontend Web Application Node:** `http://localhost:3000`
* **Backend API Controller Server Node:** `http://localhost:5000`
* **SQL Server Listener Node:** `localhost:1433` (communicating via msnodesqlv8 client connector).

### 3. Test Schedule & Phasing
The testing activities are scheduled to follow the software development lifecycle:

| Phase | Activity | Duration | Entry Criteria | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **Unit & DB Procedure Testing** | 2 days | SQL schema deployment completed. | 100% of stored procedures compile and query data successfully. |
| **Phase 2** | **Backend API Integration Testing** | 3 days | Express routers and controllers implemented. | Postman collection executes with expected HTTP status codes. |
| **Phase 3** | **Frontend Component Testing** | 3 days | Next.js layout and views implemented. | Controlled forms update React state without warning flags. |
| **Phase 4** | **E2E User Acceptance Testing (UAT)** | 2 days | Full stack integrated and servers running. | Complete guest-to-seller checkout flow resolves without balance errors. |

### 4. Roles and Responsibilities Matrix

* **QA Tester / Test Designer (Student):**
  * Responsibility: Designing test cases, creating mock data, compiling test execution records, and verifying traceability.
* **Lead Developer:**
  * Responsibility: Reviewing test specifications, maintaining database transaction scripts, and resolving database locking issues.
* **Project Sponsor / Product Owner:**
  * Responsibility: Reviewing overall test plan results, validating acceptance logs, and granting final deployment sign-off.

### 5. Test Risks & Contingency Plan

#### Risk 1: SQL Server Instance Offline
* **Impact:** High. Backend API server fails to start, throwing pool promise errors on boot.
* **Contingency Plan:** Test connection script `config/db.js` must print clear database connection failure messages. The QA team must verify SQL Server is running via Windows Services (`services.msc`) before starting test suites.

#### Risk 2: Token Expired or Invalidated during Test Run
* **Impact:** Medium. Tests return `401 Unauthorized` for valid transactions.
* **Contingency Plan:** Ensure the JWT expiration time is configured to `24h` inside `userController.js` for the test environment, and write a helper script to re-login and fetch a fresh token if HTTP response indicates token failure.

---

<div style="page-break-after: always;"></div>

## Section 3: Test Design Specification

### 1. Manual vs. Automated Testing Assessment Matrix
We evaluate every class of tests in our application to determine the most effective execution approach.

| Test Class | Scope / Description | Approach | Technical Justification | Recommended Tools |
| :--- | :--- | :---: | :--- | :--- |
| **User Sign Up & Login** | Validating credentials input, form validations, password hashing, and token receipt. | **Automated** | High repetition. Needs to run as regression checks on every build to prevent login breaks. | Jest (API assertions) / Playwright (UI actions) |
| **Route Authorization (RBAC)** | Sending unauthorized HTTP requests to check if middlewares intercept them. | **Automated** | Security verification must cover all combinations of routes and roles instantly. | Jest / Supertest / Postman Runner |
| **Add to Cart Logic** | Checking cart constraints (single-shop rule, item additions, badge increments). | **Manual** | Verifying browser storage (`localStorage`) changes and UI modal popups is easier via UI interaction. | Chrome DevTools (Application Panel) |
| **Checkout Transactions** | Verifying balance deduction, merchant credit, stock updates, and order generation. | **Automated** | Critical financial transaction logic. Needs automated validation of DB rollbacks. | Postman Runner / Mocha-Chai scripts |
| **Product Browsing & Search** | Verifying list catalog layout, search filters, and profile redirects. | **Manual** | Testing usability, layout alignment, responsive styling, and visual appeal requires human eyes. | Browser UI manual inspection |
| **Shop Customization** | Updating shop names and descriptions from the seller dashboard page. | **Manual** | Low update frequency. Basic form update can be validated manually. | Browser UI manual inspection |

### 2. Test Design Techniques

#### A. Boundary Value Analysis (BVA)
Boundary Value Analysis tests how the application behaves at the absolute limits of input ranges. We apply BVA to numeric and financial parameters:

1. **Wallet Deposits (`amount`):**
   * **Boundary:** `$0.01` (minimum deposit limit).
   * **Test Data:**
     * `0.00` $\rightarrow$ Rejected (Invalid boundary).
     * `0.01` $\rightarrow$ Accepted (Exact boundary).
     * `0.02` $\rightarrow$ Accepted (Above boundary).
     * `-5.00` $\rightarrow$ Rejected (Out of bounds).

2. **Wallet Balance Checkouts (`Balance` vs `TotalAmount`):**
   * **Boundary:** `Balance == TotalAmount`.
   * **Test Data:**
     * `Balance = TotalAmount - 0.01` $\rightarrow$ Rejected (Insufficient funds).
     * `Balance = TotalAmount` $\rightarrow$ Accepted (Exact match, balance becomes `0.00`).
     * `Balance = TotalAmount + 0.01` $\rightarrow$ Accepted (Sufficient funds).

3. **Product Stock Quantity (`Quantity`):**
   * **Boundary:** `Quantity` stock limit.
   * **Test Data:**
     * Order size = `Stock` $\rightarrow$ Accepted (Stock becomes `0`).
     * Order size = `Stock + 1` $\rightarrow$ Rejected (Insufficient stock).
     * Order size = `0` $\rightarrow$ Rejected (Invalid order size).

#### B. Equivalence Partitioning (EP)
Equivalence Partitioning divides user inputs into groups that should behave identically. We write tests representing each partition group:

1. **User Role Fields (`role`):**
   * *Partition 1 (Valid):* `"buyer"`, `"seller"` $\rightarrow$ Accepted, role mapped to DB ID.
   * *Partition 2 (Invalid):* `"admin"`, `"guest"`, `"hack"` $\rightarrow$ Rejected or mapped to default role (`buyer`).

2. **Email Formats (`email`):**
   * *Partition 1 (Valid):* Standard formatted string containing `@` and domains (e.g. `test@domain.com`).
   * *Partition 2 (Invalid):* Plain strings, empty inputs, values without `@` (e.g. `testdomain.com`, `user@`, `@domain`).

#### C. Security Vulnerability Checks
We design specialized tests to locate security gaps:

1. **JWT Signature Tampering:**
   * **Procedure:** Log in, copy the JWT token, change a letter inside the signature block (third segment), and send an API call using this modified token.
   * **Expected Result:** Server immediately rejects the token, returning `401 Unauthorized`.
2. **Access Control Escalation (Privilege Bypass):**
   * **Procedure:** Log in as a **Buyer**. Manually construct an HTTP request to `POST /api/products` (Seller-only route) using the buyer's token.
   * **Expected Result:** Server blocks the action, returning `403 Forbidden` ("Only Sellers can manage products").
3. **Database Parameter Protection (SQL Injection):**
   * **Procedure:** In input fields (like Email or Search), enter characters like `' OR 1=1 --`.
   * **Expected Result:** Express parses this as a literal string parameter. SQL Server executes it without interpreting it as commands (neutralized by parameter binding in `db.js`).

---

<div style="page-break-after: always;"></div>

## Section 4: Test Case Catalogue

### Category A: User Registration & Authentication (`TC-REG-AUTH`)

#### TC-REG-01: Valid User Registration (Buyer Role)
* **Test Objective:** Verify that a new buyer can successfully register an account.
* **Preconditions:** Database is running; email `buyer1@example.com` does not exist in `Users` table.
* **Test Steps:**
  1. Navigate to `/signup`.
  2. Input Username: `"BuyerOne"`, Email: `"buyer1@example.com"`, Password: `"pass1234"`.
  3. Select Role dropdown: `"Shop & Buy Products (Buyer)"`.
  4. Click the "Register" button.
* **Test Inputs:** `username: "BuyerOne"`, `email: "buyer1@example.com"`, `password: "pass1234"`, `role: "buyer"`.
* **Expected Result:**
  * HTTP status `201 Created` is returned by API (`POST /api/users`).
  * Green success banner appears on UI.
  * User is redirected to `/login` after 2 seconds.
  * SQL check: A record exists in `Users`, a matching row is initialized in `Wallets` with a `Balance` of `0.00`.
* **Pass/Fail Criteria:** Pass if API returns 201, database rows are initialized, and client redirects.

#### TC-REG-02: Valid User Registration (Seller Role)
* **Test Objective:** Verify that a new seller can register, and their default Shop and Wallet profiles are created.
* **Preconditions:** Email `seller1@example.com` does not exist in `Users` table.
* **Test Steps:**
  1. Navigate to `/signup`.
  2. Input Username: `"SellerOne"`, Email: `"seller1@example.com"`, Password: `"pass1234"`.
  3. Select Role dropdown: `"Sell Products & Manage Shop (Seller)"`.
  4. Click the "Register" button.
* **Test Inputs:** `username: "SellerOne"`, `email: "seller1@example.com"`, `password: "pass1234"`, `role: "seller"`.
* **Expected Result:**
  * HTTP status `201 Created` is returned.
  * SQL check: Row created in `Users`. Row created in `Wallets` (`Balance = 0.00`). Row created in `Shops` (`ShopName = "SellerOne's Shop"`, `Description = "Welcome to my shop!"`).
* **Pass/Fail Criteria:** Pass if all three tables (`Users`, `Wallets`, `Shops`) have initialized rows linked via matching IDs.

#### TC-REG-03: Registration Failure - Duplicate Email
* **Test Objective:** Verify that registering with an email that already exists is blocked.
* **Preconditions:** A user already exists with email `buyer1@example.com`.
* **Test Steps:**
  1. Navigate to `/signup`.
  2. Enter Username: `"DuplicateName"`, Email: `"buyer1@example.com"`, Password: `"pass5678"`, Role: `"buyer"`.
  3. Click "Register".
* **Test Inputs:** `email: "buyer1@example.com"` (Duplicate).
* **Expected Result:**
  * HTTP status `400 Bad Request` returned.
  * Red banner displays: `"Email is already registered"`.
  * Database state remains unchanged.
* **Pass/Fail Criteria:** Pass if duplicate is blocked and error message matches database violation.

#### TC-LOG-01: Successful Login
* **Test Objective:** Verify that a registered user can log in and receive a session JWT token.
* **Preconditions:** Account `buyer1@example.com` exists with password `pass1234`.
* **Test Steps:**
  1. Navigate to `/login`.
  2. Enter Email: `"buyer1@example.com"`, Password: `"pass1234"`.
  3. Click "Sign In".
* **Test Inputs:** `email: "buyer1@example.com"`, `password: "pass1234"`.
* **Expected Result:**
  * HTTP status `200 OK` returned.
  * Payload returns a JWT token string.
  * Client saves the token to `localStorage` and redirects to `/`.
  * Navbar displays `"BuyerOne"` and `$0.00` wallet balance.
* **Pass/Fail Criteria:** Pass if token is returned, saved in browser cache, and redirects successfully.

#### TC-LOG-02: Login Failure - Incorrect Password
* **Test Objective:** Verify that logging in with an incorrect password is blocked.
* **Preconditions:** Account `buyer1@example.com` exists.
* **Test Steps:**
  1. Navigate to `/login`.
  2. Enter Email: `"buyer1@example.com"`, Password: `"wrongpass"`.
  3. Click "Sign In".
* **Test Inputs:** `email: "buyer1@example.com"`, `password: "wrongpass"`.
* **Expected Result:**
  * HTTP status `400 Bad Request` returned.
  * Red alert banner displays `"Invalid email or password"`.
  * Client remains on `/login`.
* **Pass/Fail Criteria:** Pass if access is denied and standard error matches.

---

### Category B: Shopping Cart & Browse (`TC-CART-BROWSE`)

#### TC-BROWSE-01: List Active Shops Catalog
* **Test Objective:** Verify that guests and users can view all registered shops on the homepage.
* **Preconditions:** Multiple shops are registered in `Shops` table.
* **Test Steps:**
  1. Run Express server and Next.js client.
  2. Open browser and load `http://localhost:3000/`.
* **Test Inputs:** None (Fetch list).
* **Expected Result:**
  * Next.js triggers `GET /api/shops` to backend.
  * Return status `200 OK`.
  * A grid of cards displays, showing the name and description of each registered shop.
* **Pass/Fail Criteria:** Pass if all shops in database are displayed as visual cards on UI.

#### TC-CART-01: Single-Seller Cart Constraint Enforcement
* **Test Objective:** Verify that adding items from a different shop triggers a warning and blocks the addition.
* **Preconditions:** Buyer has items from "Shop A" in their local cart.
* **Test Steps:**
  1. Navigate to "Shop B" details page.
  2. Click "Add to Cart" on a product.
* **Test Inputs:** Click action.
* **Expected Result:**
  * A warning popup modal opens: *"You have items from another shop. Clear cart to continue?"*
  * Cart remains unchanged unless the user clicks "Clear Cart".
* **Pass/Fail Criteria:** Pass if the warning is displayed and cart blocks multi-seller mixtures.

---

### Category C: Wallet & Balance Operations (`TC-WALLET`)

#### TC-WALLET-01: Check Current Wallet Balance
* **Test Objective:** Verify that a user can fetch their current wallet balance.
* **Preconditions:** User is logged in.
* **Test Steps:**
  1. Send a request to `GET /api/wallet`.
* **Test Inputs:** JWT token in header.
* **Expected Result:**
  * Return status `200 OK`.
  * Payload returns correct `Balance` matching `Wallets` table for this UserID.
* **Pass/Fail Criteria:** Pass if returned balance matches the database state.

#### TC-WALLET-02: Deposit Funds Successful
* **Test Objective:** Verify that depositing funds increases the balance.
* **Preconditions:** Logged in. Initial balance is `$10.00`.
* **Test Steps:**
  1. Send `POST /api/wallet/deposit` with amount `50.00`.
* **Test Inputs:** `{ "amount": 50.00 }`.
* **Expected Result:**
  * Return status `200 OK`.
  * Database updates: `Balance = 60.00`.
  * Balance update triggers on Navbar, displaying `$60.00`.
* **Pass/Fail Criteria:** Pass if database increments the correct amount and Navbar displays the new sum.

---

### Category D: Transactions & Checkouts (`TC-TX-BAL`)

#### TC-CHECKOUT-01: Successful Checkout (Atomic SQL Transaction)
* **Test Objective:** Verify that checking out correctly transfers funds and updates stocks.
* **Preconditions:** 
  * Buyer balance = `$100.00`.
  * Seller balance = `$0.00`.
  * Product stock = `10` (Price = `$25.00`).
* **Test Steps:**
  1. Send `POST /api/orders` with cart payload (Seller: 5, Product: 12, Qty: 2).
* **Test Inputs:**
  ```json
  {
    "sellerId": 5,
    "items": [{ "productId": 12, "quantity": 2 }]
  }
  ```
* **Expected Result:**
  * Return status `201 Created`.
  * Database changes inside SQL Transaction:
    * Buyer wallet balance = `$50.00`.
    * Seller wallet balance = `$50.00`.
    * Product stock = `8`.
    * A row is added to `Orders` and two rows to `OrderItems`.
* **Pass/Fail Criteria:** Pass if all database balances, stocks, and order records are updated correctly and concurrently.

#### TC-CHECKOUT-02: Checkout Failure - Insufficient Balance
* **Test Objective:** Verify that a checkout fails and rolls back if the buyer has insufficient funds.
* **Preconditions:** 
  * Buyer balance = `$10.00`.
  * Product stock = `10` (Price = `$25.00`).
* **Test Steps:**
  1. Send `POST /api/orders` to buy `1` item (Cost = `$25.00`).
* **Test Inputs:**
  ```json
  {
    "sellerId": 5,
    "items": [{ "productId": 12, "quantity": 1 }]
  }
  ```
* **Expected Result:**
  * Return status `400 Bad Request`.
  * Error payload: `{"message": "Insufficient wallet funds!"}`.
  * SQL Transaction Rollback:
    * Buyer balance remains `$10.00`.
    * Product stock remains `10`.
    * No order rows are written.
* **Pass/Fail Criteria:** Pass if transaction rolls back and database states are completely unmodified.

---

### Category E: Seller Management & Security (`TC-SELLER-SEC`)

#### TC-SELLER-01: Update Shop Name and Description
* **Test Objective:** Verify that a seller can modify their shop name and description.
* **Preconditions:** Logged in as Seller, matching Shop row exists.
* **Expected Result:** Shop details update successfully in the `Shops` table; UI reflects updates.

#### TC-SELLER-02: Manage Shop Products
* **Test Objective:** Verify that a seller can list, edit, or delete products for their shop.
* **Expected Result:** API accepts `POST/PUT/DELETE /api/products` and commits changes to the database.

#### TC-SELLER-03: Block Unauthorized Product Management
* **Test Objective:** Verify that a seller cannot modify products belonging to another shop.
* **Expected Result:** Server blocks action with `403 Forbidden`.

#### TC-SEC-01: Tampered JWT Signature Rejection
* **Test Objective:** Verify that a token with a modified signature block is immediately blocked.
* **Expected Result:** Server returns `401 Unauthorized`.

#### TC-SEC-02: Role Privilege Escalation Bypass Verification
* **Test Objective:** Verify that a buyer trying to perform a seller operation receives a block.
* **Expected Result:** Middleware intercepts request and returns `403 Forbidden`.

#### TC-PERF-01: Database Index Execution Latency Validation
* **Test Objective:** Verify that database indexes ensure query speeds resolve within 15 milliseconds.
* **Expected Result:** Execution planner statistics in SSMS indicate quick index seeks.

#### TC-ACCESS-01: Semantic layout checking
* **Test Objective:** Verify client page HTML layouts use proper Semantic structural tags (`<header>`, `<nav>`, `<main>`, `<footer>`).
* **Expected Result:** Elements pass structural scanning audits.

---

<div style="page-break-after: always;"></div>

## Section 5: Test Data Specification

### 1. User Profiles & Roles Datasets

#### A. Valid User Accounts (For positive test paths)
* **Dataset 1: Active Buyer Profile**
  * `Username:` `"JohnBuyer"`
  * `Email:` `"john.buyer@example.com"`
  * `Password:` `"BuyerSecurePass99!"`
  * `Role:` `"buyer"`
* **Dataset 2: Active Seller Profile**
  * `Username:` `"AliceMerchant"`
  * `Email:` `"alice.merchant@example.com"`
  * `Password:` `"AliceSecurePass99!"`
  * `Role:` `"seller"`

#### B. Invalid User Accounts (For input validation test paths)
* **Dataset 1: Empty Form Parameters**
  * `Username:` `""`, `Email:` `""`, `Password:` `""`, `Role:` `""`
* **Dataset 2: Invalid Email Syntax**
  * `Username:` `"MaliciousUser"`, `Email:` `"invalidemailformat"`, `Password:` `"pass1234"`, `Role:` `"buyer"`
* **Dataset 3: Duplicate Registration Email**
  * `Username:` `"NewBuyer"`, `Email:` `"john.buyer@example.com"` (Duplicate value), `Password:` `"pass1234"`, `Role:` `"buyer"`

### 2. Product Catalog Datasets (Stock Limits & Pricing)

#### A. Sufficient Product Inventory
* **Dataset ID:** `DATA-PROD-OK`
  * `ProductName:` `"Mechanical Gaming Keyboard"`
  * `Price:` `45.00`
  * `Quantity` (Stock): `50` (Large margin)

#### B. Low Product Inventory (For boundary checkouts)
* **Dataset ID:** `DATA-PROD-LOW`
  * `ProductName:` `"Premium USB-C Hub"`
  * `Price:` `20.00`
  * `Quantity` (Stock): `3`

#### C. Zero Product Inventory (For out-of-stock validation)
* **Dataset ID:** `DATA-PROD-OUT`
  * `ProductName:` `"Portable SSD 1TB"`
  * `Price:` `89.99`
  * `Quantity` (Stock): `0`

### 3. Wallet Balance Datasets

#### A. Sufficient Funds
* **Dataset ID:** `DATA-WALLET-HIGH`
  * `UserID:` `5` (Buyer)
  * `Balance:` `500.00`

#### B. Insufficient Funds (Below checkout limit)
* **Dataset ID:** `DATA-WALLET-LOW`
  * `UserID:` `6` (Buyer)
  * `Balance:` `10.00`

#### C. Exact Matching Funds (BVA Edge-Case)
* **Dataset ID:** `DATA-WALLET-EXACT`
  * `UserID:` `7` (Buyer)
  * `Balance:` `45.00` (Matches product price exactly)

### 4. Invalid API Payload Datasets

#### A. Empty Checkout Cart Array
* **Endpoint:** `POST /api/orders`
* **Payload:**
  ```json
  {
    "sellerId": 5,
    "items": []
  }
  ```

#### B. Non-Existent Product ID in Items Array
* **Endpoint:** `POST /api/orders`
* **Payload:**
  ```json
  {
    "sellerId": 5,
    "items": [
      { "productId": 99999, "quantity": 1 }
    ]
  }
  ```

#### C. Quantity Mismatch Parameter Type (Float/Negative)
* **Endpoint:** `POST /api/orders`
* **Payload:**
  ```json
  {
    "sellerId": 5,
    "items": [
      { "productId": 12, "quantity": -2 }
    ]
  }
  ```

### 5. Security & Vulnerability Test Payloads

#### A. Tampered Token Signature (JWT Bypass Check)
* **Header:** `Authorization: Bearer <VALID_HEADER_AND_PAYLOAD>.tamperedsignaturehash123`
* **Expected Result:** API returns `401 Unauthorized`.

#### B. SQL Injection Input (Bypass authentication check)
* **Inputs:**
  * `email:` `' OR '1'='1`
  * `password:` `' OR '1'='1`
* **Expected Result:** API returns `401 Unauthorized` (Bcrypt query resolves cleanly without data leaks).

#### C. Cross-Site Scripting (XSS) Input (Sanitization check)
* **Inputs:**
  * `productName:` `<script>alert('XSS')</script> Keyboard`
* **Expected Result:** Express renders the string literally, neutralising injection tags.

---

<div style="page-break-after: always;"></div>

## Section 6: Requirements Traceability Matrix

This matrix maps every functional and non-functional requirement defined in [requirments.md](file:///c:/Users/ProBook/OneDrive%20-%20AL-Hussien%20bin%20Abdullah%20Technical%20University/Desktop/Market-place/requirments.md) to specific Test Cases defined in the Catalogue (Section 4).

| Requirement ID | Requirement Description | Mapped Test Case ID(s) | Test Status / Method |
| :--- | :--- | :--- | :--- |
| **FR-1** | Multi-Role Authentication & Signup (Buyer & Seller). | `TC-REG-01`, `TC-REG-02`, `TC-REG-03`, `TC-LOG-01`, `TC-LOG-02` | Automated API checks + manual view validations. |
| **FR-2** | Shop Storefront Directory browser. | `TC-BROWSE-01` | Manual frontend catalog check. |
| **FR-3** | Single-Shop Cart Constraint (Browser Storage). | `TC-CART-01` | Manual cart local storage validation. |
| **FR-4** | Transactional Order Fulfillments & Checkouts. | `TC-CHECKOUT-01`, `TC-CHECKOUT-02` | Automated transactional checkouts + Database check. |
| **FR-5** | Seller Dashboard and Inventory controls. | `TC-SELLER-01`, `TC-SELLER-02`, `TC-SELLER-03` | Manual settings updating + ownership validations. |
| **NFR-1** | Password Cryptography Hashing (`bcryptjs`). | `TC-REG-01`, `TC-REG-02` (Hashed check) | Automated registration DB check. |
| **NFR-1.2**| JWT Session Authorization headers. | `TC-LOG-01` (Token check), `TC-SEC-01` (Tampering) | Automated API token scans. |
| **NFR-1.3**| Role-Based Access controls (Bypassing). | `TC-SEC-02` (Privilege Escalation bypass) | Automated middleware validation. |
| **NFR-2.1**| DB Latency Optimization under 15ms. | `TC-PERF-01` (Query latency index check) | Database performance diagnostics (SSMS). |
| **NFR-3.1**| Semantic HTML5 structural layout tags. | `TC-ACCESS-01` (Accessibility audits) | Manual audits + client HTML compilation scans. |
| **NFR-4.1**| Caching cart local state in `localStorage`. | `TC-CART-01` (Cache load latency checks) | Browser Client storage validation. |

### Test Cases Index Reference

* **`TC-REG-01`**: Valid User Registration (Buyer).
* **`TC-REG-02`**: Valid User Registration (Seller).
* **`TC-REG-03`**: Registration Failure (Duplicate Email).
* **`TC-LOG-01`**: Successful Login (JWT Token creation).
* **`TC-LOG-02`**: Login Failure (Incorrect Password).
* **`TC-BROWSE-01`**: Retrieve active shops listings on landing.
* **`TC-CART-01`**: Adding items from different stores block.
* **`TC-WALLET-01`**: Retrieve authenticated wallet balance.
* **`TC-WALLET-02`**: Deposit wallet funds successfully.
* **`TC-CHECKOUT-01`**: Transactional checkout (Debit, credit, stock decrement, order create).
* **`TC-CHECKOUT-02`**: Checkout rollback (Insufficient balance/stock).
* **`TC-SELLER-01`**: Updating own shop name and description.
* **`TC-SELLER-02`**: Listing, editing, deleting seller products.
* **`TC-SELLER-03`**: Blocking unauthorized sellers from other products.
* **`TC-SEC-01`**: Tampered JWT signature rejection.
* **`TC-SEC-02`**: Role privilege escalation bypass verification.
* **`TC-PERF-01`**: Database index execution time validation.
* **`TC-ACCESS-01`**: Check layouts and views for semantic tags.

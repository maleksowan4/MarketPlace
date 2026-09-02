# Marketplace Application: Requirements & Backend Plan

Goal: Build a relational database-backed Marketplace web application using React (frontend), Node.js/Express (backend), and SQL Server (database), learning backend concepts step-by-step.

---

## 1. Database Entities & Tables

### Users Table

- `UserID` (PK), `RoleID` (FK to Roles), `Username`, `Email`, `PasswordHash`, `CreatedAt`

### Roles Table

- `RoleID` (PK), `RoleName`

### Shops Table (New)

- `ShopID` (PK), `SellerID` (FK to Users, UNIQUE), `ShopName`, `Description`, `CreatedAt`
- _Note: Established to represent each seller's unique storefront._

### Products Table

- `ProductID` (PK), `SellerID` (FK to Users), `ProductName`, `Description`, `Price`, `Quantity` (Stock), `CreatedAt`

### Wallets & WalletTransactions Tables

- `WalletID` (PK), `UserID` (FK to Users, UNIQUE), `Balance`
- `TransactionID` (PK), `WalletID` (FK to Wallets), `Amount`, `TransactionType`, `TransactionDate`

### Orders & OrderItems Tables

- `OrderID` (PK), `BuyerID` (FK to Users), `OrderDate`, `Status`, `TotalAmount`
- `OrderItemID` (PK), `OrderID` (FK to Orders), `ProductID` (FK to Products), `Quantity`, `UnitPrice`

---

## 2. User Roles & Workflows

### Seller Role

- **Authentication:** Can register and login, choosing the "Seller" role. Upon registration, their associated Shop record is initialized.
- **Dashboard / Home Page:**
  - View their Shop details (Shop Name, Description).
  - View their current wallet balance, with a direct section to add/deposit funds instantly.
  - View all products belonging to their shop as cards (showing product name, price, stock quantity).
  - A button/form to add a new product to their shop.
- **Incoming Orders Page:**
  - View orders placed by buyers for products in their shop.
  - Ability to accept (confirm/fulfill) incoming orders.

### Buyer Role

- **Authentication:** Can register and login, choosing the "Buyer" role.
- **Home Page / Marketplace:**
  - Browse all active **Shops** (Sellers) as cards (showing Shop Name, Description, and a button to "Enter Shop").
- **Shop Details Page:**
  - Displays the Shop Name and Description.
  - Lists all products belonging to this specific shop.
  - Each product has an "Add to Cart" button with quantity selection.
- **Cart Page (LocalStorage):**
  - Holds the cart object, restricted to **one shop at a time** (e.g., if a user tries to add an item from Shop B while holding items from Shop A, they must clear their cart first).
  - Displays all added items, their quantities, and the calculated total price.
  - A "Place Order" button.
  - **Order Transaction:** Automatically deducts the order total from the buyer's wallet balance and adds it to the seller's wallet balance.
- **Profile / Home Page Wallet Section:**
  - Displays user profile info, order history, and a direct section to add/deposit funds to their wallet.

---

## 3. Backend API Implementation Plan

### User Management & Authentication (`/api/users`)

- `POST /api/users` - Register a user. (If Seller role is chosen, also inserts a default row into the `Shops` table).
- `POST /api/users/login` - Authenticate user and return a JWT.
- `GET /api/users/profile` - Fetch the logged-in user's profile info.

### Shop Management (`/api/shops`)

- `GET /api/shops` - Returns a list of all shops (for buyers to browse).
- `GET /api/shops/:id` - Returns details of a specific shop.
- `GET /api/shops/:id/products` - Returns all products belonging to the specified shop.
- `PUT /api/shops/my-shop` - Allows a logged-in seller to update their own shop name and description (Requires JWT + Seller role).

### Product Management (`/api/products`)

- `POST /api/products` - Add a new product (Requires JWT + Seller role).
- `PUT /api/products/:id` - Update product details (Requires JWT + Seller role + Ownership check).
- `DELETE /api/products/:id` - Delete a product (Requires JWT + Seller role + Ownership check).

### Wallet & Balance Management (`/api/wallet`)

- `GET /api/wallet` - Retrieve current balance.
- `POST /api/wallet/deposit` - Deposit money into the user's wallet.

### Orders & Checkout (`/api/orders`)

- `POST /api/orders` - Place an order for a shop-specific cart.
  - **Body:** `{ sellerId, items: [{ productId, quantity }] }`
  - **Transaction Workflow:**
    1. Starts a database transaction.
    2. Validates product availability and stock for each item in `items`.
    3. Calculates `totalAmount` for the order.
    4. Verifies the buyer's wallet has `Balance >= totalAmount`.
    5. Deducts `totalAmount` from the Buyer's wallet.
    6. Adds `totalAmount` to the Seller's (`sellerId`) wallet.
    7. Deducts the ordered quantity from each product's stock in `Products`.
    8. Inserts a row into `Orders` (gets new `OrderID`).
    9. Inserts matching rows into `OrderItems`.
    10. Commits the transaction.
- `GET /api/orders/buyer` - Retrieve order history for the logged-in buyer.
- `GET /api/orders/seller` - Retrieve incoming orders for the logged-in seller.
- `PUT /api/orders/:id/accept` - Mark an order as accepted/fulfilled (Requires JWT + Seller role).

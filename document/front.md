# Marketplace Frontend Plan: Next.js & Tailwind CSS

This document is your step-by-step developer roadmap for building the React/Next.js frontend.

---

## 1. Stack & Language Decision: JavaScript (JS) vs. TypeScript (TS)

* **Our Choice:** **JavaScript (JS)**.
* **Why:** Since your backend is written in pure JavaScript, keeping the frontend in JavaScript makes learning full-stack development smoother. You can focus entirely on learning React hooks, App Router pages, Tailwind layouts, and API requests without wrestling with type declarations or build errors.

---

## 2. Folder Structure Overview

We will organize the code using the standard Next.js App Router structure:

```text
client/
├── public/                 # Static assets (images, icons)
└── src/
    ├── app/                # Next.js App Router (Pages, Layouts, CSS)
    │   ├── cart/           # Cart and checkout screen
    │   ├── login/          # Login page
    │   ├── register/       # Registration page
    │   ├── profile/        # Buyer profile & history / wallet
    │   ├── shop/
    │   │   └── [id]/       # Shop detail view (with products)
    │   ├── seller/
    │   │   ├── dashboard/  # Seller products & shop settings
    │   │   └── orders/     # Seller incoming orders
    │   ├── globals.css     # Global CSS and Tailwind CSS setup
    │   ├── layout.js       # Main wrapper layout (contains Navbar)
    │   └── page.js         # Homepage (Buyer marketplace or Seller redirect)
    ├── components/         # Reusable UI components
    │   ├── Navbar.jsx      # Navigation bar (displays wallet, logout, cart count)
    │   ├── ProductCard.jsx # Reusable product card (handles Buy/Edit layouts)
    │   └── ShopCard.jsx    # Reusable card to show Shop storefronts
    └── context/            # React context for global state
        └── AuthContext.jsx # Global state for logged-in user, token, & wallet
```

---

## 3. Global State: `AuthContext.jsx`

To prevent having to fetch the user's profile and wallet balance repeatedly on every page, we will use a **React Context Provider** (`AuthContext`). It will manage:
* `user`: Stores `{ userId, username, email, roleName }` (or `null` if logged out).
* `token`: Stores the JWT string in memory (synced to LocalStorage).
* `walletBalance`: Stores the current money balance.
* `login(token, userData)`: Function to login, store token, and set state.
* `logout()`: Function to clear states and remove token from LocalStorage.
* `fetchBalance()`: Utility function to trigger a fresh wallet balance update from the server.

---

## 4. Complete Page & API Mapping

### 1. Root Layout & Navbar (`src/app/layout.js`)
* **Component:** `Navbar` (always visible at the top).
* **Behavior:**
  * If logged out: Shows "Login" and "Register" buttons.
  * If logged in as **Buyer**: Shows "Marketplace", "My Cart", "Profile", "Wallet Balance ($xx.xx)", and "Logout".
  * If logged in as **Seller**: Shows "Shop Dashboard", "Incoming Orders", "Wallet Balance ($xx.xx)", and "Logout".

---

### 2. Login Page (`src/app/login/page.js`)
* **User Flow:** A form asking for Email and Password.
* **API Calls:**
  * `POST /api/users/login` -> Authenticates and returns JWT + user info.
* **Outcome:** Triggers `AuthContext.login()`, saves token to LocalStorage, and redirects to the Homepage.

---

### 3. Register Page (`src/app/register/page.js`)
* **User Flow:** A form asking for Username, Email, Password, and a dropdown/radio to choose Role (`buyer` or `seller`).
* **API Calls:**
  * `POST /api/users` -> Creates the user, their wallet, and shop profile (if seller).
* **Outcome:** Redirects the user to the `/login` page with a success message.

---

### 4. Marketplace Homepage (`src/app/page.js`)
* **Behavior:**
  * **If Seller:** Instantly redirects them to `/seller/dashboard`.
  * **If Buyer/Guest:** Displays a list of all active Shops in the database.
* **API Calls:**
  * `GET /api/shops` -> Gets all shops in the system to display as cards.
* **UX:** Clicking "Enter Shop" on a card routes the buyer to `/shop/[id]`.

---

### 5. Shop Details Page (`src/app/shop/[id]/page.js`)
* **User Flow:** Shows the Shop header (Shop Name, Description) at the top, and lists all products belonging to this shop.
* **API Calls:**
  * `GET /api/shops/:id` -> Retrieves shop metadata.
  * `GET /api/shops/:id/products` -> Retrieves the shop's catalog list.
* **Cart Logic (LocalStorage):**
  * Displays an "Add to Cart" button with quantity selector.
  * Checks if the active cart in LocalStorage belongs to a *different* shop. If it does, opens a modal asking: *"You have items from another shop. Clear cart to continue?"*

---

### 6. Cart Page (`src/app/cart/page.js`)
* **User Flow:** Displays all items added from the active shop, their prices, and calculates the total order cost.
* **API Calls:**
  * `POST /api/orders` -> Places the order by sending the cart items array.
* **Outcome:** Deducts money from the buyer's balance, adds it to the seller's balance, decreases product stock, clears the local cart, and redirects to the profile page.

---

### 7. Buyer Profile & History (`src/app/profile/page.js`)
* **User Flow:**
  * Shows profile info (name, email, role).
  * Contains a **Wallet Deposit Section** (enter amount, click "Deposit" to add funds instantly).
  * Shows a list of **Past Orders** (Order ID, Date, Status, Total Cost).
* **API Calls:**
  * `GET /api/users/profile` -> Gets user details.
  * `GET /api/wallet` -> Gets balance.
  * `POST /api/wallet/deposit` -> Top up balance directly.
  * `GET /api/orders/buyer` -> Gets history list.

---

### 8. Seller Dashboard (`src/app/seller/dashboard/page.js`)
* **User Flow:**
  * **Shop Settings:** A form to update their Shop Name and Description.
  * **Add Product:** A form to create a new product (opens in modal or drawer).
  * **My Products:** A grid of cards displaying the products they own, with stock quantity. Each card has an **Edit** and **Delete** button.
  * **Wallet Section:** Displays current balance and top-up input.
* **API Calls:**
  * `PUT /api/shops/my-shop` -> Customize shop name/description.
  * `GET /api/products/seller` -> Load seller's inventory.
  * `POST /api/products` -> Create product.
  * `PUT /api/products/:id` -> Edit product.
  * `DELETE /api/products/:id` -> Delete product.

---

### 9. Seller Incoming Orders (`src/app/seller/orders/page.js`)
* **User Flow:** Displays all orders containing items from their shop. Each card lists: the product, quantity bought, order date, buyer's name, total price, and order status.
* **API Calls:**
  * `GET /api/orders/seller` -> Loads incoming order list.
  * `PUT /api/orders/:id/accept` -> Accepts the order. Changes status from `'Pending'` to `'Accepted'`.

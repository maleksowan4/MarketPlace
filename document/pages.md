# Frontend Pages Directory
## Project Name: Relational Marketplace Portal

This document lists all the frontend routes and pages in the client application, along with a description of their role, access restrictions, and core functionality.

---

### 1. Marketplace Homepage (Landing Page)
* **File Path:** [page.js](file:///c:/Users/ProBook/OneDrive%20-%20AL-Hussien%20bin%20Abdullah%20Technical%20University/Desktop/Market-place/client/src/app/page.js)
* **Route:** `/`
* **Access:** Public (Guests & Buyers)
* **Description:** 
  * Displays a grid directory of all active shops registered in the system.
  * Dynamically queries the backend at `GET /api/shops`.
  * If the logged-in user is a **Seller**, they are automatically redirected to their dashboard at `/seller/dashboard`.

---

### 2. User Sign Up
* **File Path:** [page.jsx](file:///c:/Users/ProBook/OneDrive%20-%20AL-Hussien%20bin%20Abdullah%20Technical%20University/Desktop/Market-place/client/src/app/signup/page.jsx)
* **Route:** `/signup`
* **Access:** Public
* **Description:** 
  * Allows new users to create an account by entering a username, email, password, and selecting their role (**Buyer** or **Seller**).
  * On success, initializes a virtual wallet balance of `$0.00` in the database.
  * If registering as a **Seller**, it also auto-creates a default shop linked to their account.

---

### 3. User Login
* **File Path:** [page.jsx](file:///c:/Users/ProBook/OneDrive%20-%20AL-Hussien%20bin%20Abdullah%20Technical%20University/Desktop/Market-place/client/src/app/login/page.jsx)
* **Route:** `/login`
* **Access:** Public
* **Description:** 
  * Authenticates users using their email and password.
  * Stores the returned JSON Web Token (JWT) securely in the client's `localStorage`.
  * Synchronizes global session state across the app using `AuthContext`.

---

### 4. Shop Storefront Details
* **File Path:** [page.jsx](file:///c:/Users/ProBook/OneDrive%20-%20AL-Hussien%20bin%20Abdullah%20Technical%20University/Desktop/Market-place/client/src/app/shop/%5Bid%5D/page.jsx)
* **Route:** `/shop/[id]` (Dynamic Path Parameter)
* **Access:** Public (Guests & Buyers)
* **Description:** 
  * Shows details (Shop Name, Description, Owner) of a specific shop and lists all products belonging to that shop.
  * Allows buyers to select purchase quantities (bounded by the product's actual stock limits).
  * Enforces the **Single-Shop Cart Constraint** by prompting the user before letting them mix products from different shops in their cart.

---

### 5. Shopping Cart & Checkout
* **File Path:** `/client/src/app/cart/page.jsx` (To be created)
* **Route:** `/cart`
* **Access:** Buyers Only (Redirects Guests to login)
* **Description:** 
  * Displays items currently saved in the client's `localStorage` cart.
  * Allows users to review items, modify quantities, delete items, and calculate the total price.
  * Handles the checkout process by submitting the order to `POST /api/orders`, executing an atomic database transaction that transfers wallet funds and decrements product inventory.

---

### 6. Buyer Profile & Wallet
* **File Path:** `/client/src/app/profile/page.jsx` (To be created)
* **Route:** `/profile`
* **Access:** Buyers Only
* **Description:** 
  * Displays user profile details and current wallet balance.
  * Allows buyers to deposit virtual funds into their wallet (`POST /api/wallet/deposit`).
  * Displays a list of past orders made by this buyer.

---

### 7. Seller Dashboard
* **File Path:** `/client/src/app/seller/dashboard/page.jsx` (To be created)
* **Route:** `/seller/dashboard`
* **Access:** Sellers Only
* **Description:** 
  * Provides management controls for sellers to update their shop name and description.
  * Lists all products listing owned by this seller.
  * Features fields to create new products, edit pricing and quantities of existing products, and delete obsolete listings.

---

### 8. Seller Incoming Orders
* **File Path:** `/client/src/app/seller/orders/page.jsx` (To be created)
* **Route:** `/seller/orders`
* **Access:** Sellers Only
* **Description:** 
  * Lists all orders placed by buyers targeting this seller's shop (`GET /api/orders/seller`).
  * Shows transaction timestamps, buyer details, and total revenue earned.

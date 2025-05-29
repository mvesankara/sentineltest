# SentinelleChain - Cybersecurity Platform

SentinelleChain is an advanced cybersecurity platform designed to provide real-time threat detection, log analysis, and alert management, with proof of existence for critical data anchored on the blockchain.

## Features

*   **User Authentication & Multi-Tenancy:** Secure user registration and login, with data isolation for different companies. Each company has its own API key.
*   **Log Ingestion:** Endpoint for ingesting system and application logs.
*   **AI-Powered Anomaly Detection:** Rule-based AI service to analyze logs and generate security alerts based on predefined patterns.
*   **Real-Time Alert Dashboard:** Frontend dashboard displaying security metrics and alerts in real-time using Socket.io.
    *   Dynamic `MetricWidget` for key statistics.
    *   `AlertCard` for individual alert summaries.
*   **Alerts Management Page:**
    *   Comprehensive table view of all alerts for the company.
    *   Filtering by severity and status.
    *   Detailed modal view for each alert, showing log content, AI insights, and blockchain proof.
    *   Frontend-only alert status updates (New, Acknowledged, Resolved, Dismissed).
*   **Blockchain Proof of Existence:** Critical alert data is hashed and anchored on the Polygon Mumbai testnet using a custom smart contract (`LogProof.sol`).
*   **Audit Trail:** Records key user and system actions (logins, log ingestion, alert creation) for accountability and review.
    *   Dedicated page to view company-specific audit trails with pagination.
*   **JSON Export for Alerts:** Functionality to download alerts (filtered by status, severity, and date range) as a JSON file.
*   **Theme Switching:** Light/Dark mode support in the frontend.

## Tech Stack

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Shadcn/ui, Socket.io-client
*   **Backend:** Node.js, Express, TypeScript, Socket.io
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** JWT (JSON Web Tokens), bcryptjs (for password hashing)
*   **AI:** Basic rule-based pattern matching (can be extended)
*   **Blockchain:** Solidity (for smart contract), Web3.js (for interaction), Polygon Mumbai Testnet

## Prerequisites

*   **Node.js:** v18.x or v20.x recommended.
*   **npm or yarn:** npm is used in this guide.
*   **PostgreSQL:** Version 14 or later.
*   **Git:** For cloning the repository.
*   **(Optional) Blockchain Interaction:**
    *   An account with Polygon Mumbai testnet MATIC.
    *   An RPC URL provider (e.g., Alchemy, Infura, or a public RPC like `https://rpc-mumbai.maticvigil.com`).

## Local Installation Guide (Linux)

### A. Clone the Repository

```bash
git clone <repository_url> # Replace <repository_url> with your actual project URL
cd sentinellechain # Or your main project directory name
```

### B. Backend Setup (`sentinellechain-backend` directory)

1.  **Navigate to the backend directory:**
    ```bash
    cd sentinellechain-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup PostgreSQL Database:**
    *   Log in to PostgreSQL as the `postgres` user (or your admin user):
        ```bash
        sudo -u postgres psql
        ```
    *   Create a new database (e.g., `sentinellechain_db`):
        ```sql
        CREATE DATABASE sentinellechain_db;
        ```
    *   Create a new user (e.g., `sentinelle_user`) with a strong password:
        ```sql
        CREATE USER sentinelle_user WITH PASSWORD 'your_strong_password_here';
        ```
    *   Grant all privileges on the new database to your new user:
        ```sql
        GRANT ALL PRIVILEGES ON DATABASE sentinellechain_db TO sentinelle_user;
        ```
    *   Exit psql:
        ```sql
        \q
        ```

4.  **Configure Environment Variables:**
    *   Copy the example environment file. If `.env.example` is not provided, create a `.env` file manually.
        ```bash
        cp .env.example .env # Create .env from example if it exists
        ```
    *   Edit the `.env` file and fill in the required variables. **Create this file if it doesn't exist.**
        ```dotenv
        # Database Connection
        DATABASE_URL="postgresql://sentinelle_user:your_strong_password_here@localhost:5432/sentinellechain_db?schema=public"

        # JWT Secret for Authentication
        JWT_SECRET="your_very_strong_and_long_random_jwt_secret_key"

        # Blockchain (Polygon Mumbai Testnet - Optional for core functionality if stubbed or not used)
        # Replace with your actual credentials if you intend to test blockchain features.
        # Ensure the account for SIGNER_PRIVATE_KEY is funded with Mumbai MATIC.
        POLYGON_MUMBAI_RPC_URL="https://rpc-mumbai.maticvigil.com" # Example public RPC, consider your own via Alchemy/Infura for reliability
        LOG_PROOF_CONTRACT_ADDRESS="0xYourDeployedLogProofContractAddressOnMumbai" # Replace after deploying LogProof.sol
        SIGNER_PRIVATE_KEY="0xYourFundedAccountPrivateKeyForMumbaiTransactions" # For development only, use with extreme caution
        SIGNER_ACCOUNT_ADDRESS="0xYourFundedAccountAddressCorrespondingToPrivateKey"
        ```
    *   **Important Security Notes:**
        *   `JWT_SECRET`: Must be a long, random, and strong string. Keep it secret.
        *   `SIGNER_PRIVATE_KEY`: **Never commit a real private key with mainnet funds.** For development, use a dedicated testnet account with only testnet funds. Do not expose this key publicly.

5.  **Apply Database Migrations:**
    *   This command will create the database schema based on your `prisma/schema.prisma` file.
    ```bash
    npx prisma migrate dev --name initial_setup # Or a more descriptive name like auth_multitenancy_audit_etc
    ```
    *   Prisma will also run `prisma generate` automatically after migration.

6.  **Start the Backend Server:**
    ```bash
    npm run dev
    ```
    *   The backend server should now be running, typically on `http://localhost:3001`.

### C. Frontend Setup (`sentinellechain-frontend` directory)

1.  **Navigate to the frontend directory** (from the project root):
    ```bash
    cd ../sentinellechain-frontend # If you are in sentinellechain-backend
    # Or from project root:
    # cd sentinellechain-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *   **Note:** If you encounter peer dependency issues (e.g., with `react-loader-spinner` and React 19), you might need to use:
        ```bash
        npm install --legacy-peer-deps
        ```

3.  **Configure Environment Variables (Frontend):**
    *   The current frontend setup primarily relies on the backend URL being `http://localhost:3001`, which is hardcoded in API calls within contexts or services.
    *   If you need to make the backend URL configurable (e.g., for different environments), create an `.env.local` file in the `sentinellechain-frontend` directory:
        ```dotenv
        # Example: If you need to point to a different backend API URL
        # NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api" 
        ```
        *   You would then need to modify the frontend code to use `process.env.NEXT_PUBLIC_API_BASE_URL`. For this guide, we assume the hardcoded URL is sufficient for local setup.

4.  **Start the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    *   The frontend development server should now be running, typically on `http://localhost:3000`.

### D. Accessing the Application

1.  Open your web browser and navigate to `http://localhost:3000`.
2.  You should see the login or register page.
3.  Register a new company and user account.
4.  Log in with the newly created credentials to access the dashboard and other features.

## Smart Contract Deployment (Optional - `LogProof.sol`)

The `sentinellechain-backend/contracts/LogProof.sol` file contains the smart contract for anchoring log/alert proofs on the blockchain.

To deploy this contract (e.g., on the Polygon Mumbai testnet):

1.  **Tools:** Use a development environment like Remix IDE (web-based), Hardhat, or Truffle.
2.  **Funding:** Ensure the Ethereum account you'll use for deployment is funded with testnet MATIC (for Polygon Mumbai).
3.  **Deployment:**
    *   Compile the `LogProof.sol` contract.
    *   Deploy it to the Polygon Mumbai testnet.
4.  **Configuration Update:**
    *   Once deployed, copy the contract address.
    *   Update the `LOG_PROOF_CONTRACT_ADDRESS` variable in the `sentinellechain-backend/.env` file with the new address.
    *   Also, ensure `POLYGON_MUMBAI_RPC_URL`, `SIGNER_PRIVATE_KEY`, and `SIGNER_ACCOUNT_ADDRESS` in the backend's `.env` are correctly set up for your deployment account.
5.  **Restart Backend:** After updating the `.env` file, restart the backend server for the changes to take effect.

*Note: The application's blockchain features are designed to be optional. If the contract address or signer details are not configured, the blockchain anchoring steps will be stubbed (returning fake transaction hashes for development/testing) or skipped, allowing the rest of the application to function.*

## Troubleshooting (Basic)

*   **Port Conflicts:** If `3000` or `3001` are in use, backend or frontend servers might fail to start. Identify the process using the port (`sudo lsof -i :<port_number>`) and stop it, or configure the servers to use different ports (requires code changes or environment variable setup if supported).
*   **Database Connection Errors:**
    *   Ensure PostgreSQL server is running.
    *   Verify `DATABASE_URL` in `sentinellechain-backend/.env` is correct (username, password, database name, host, port).
    *   Check that the database user has the correct privileges.
*   **Prisma Migration Issues:** If `npx prisma migrate dev` fails, check the error message. It might be due to database connection issues or inconsistencies in your schema/migrations. `npx prisma migrate reset` can be used to reset the database during development (this will delete all data).
*   **Frontend API Calls Failing:**
    *   Ensure the backend server is running and accessible at `http://localhost:3001`.
    *   Check browser developer console for network errors or CORS issues (though CORS should be handled by the backend for `localhost:3000`).
*   **Blockchain Transactions Failing:**
    *   Ensure your `SIGNER_PRIVATE_KEY` account is funded with Mumbai MATIC.
    *   Verify `POLYGON_MUMBAI_RPC_URL` is correct and accessible.
    *   Check `LOG_PROOF_CONTRACT_ADDRESS` is correct for the deployed contract on Mumbai.
    *   Look for detailed error messages in the backend console.

---

This README provides a comprehensive guide for setting up and running the SentinelleChain platform locally.

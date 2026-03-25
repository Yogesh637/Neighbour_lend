# Development Environment Setup Guide

To separate your workflow effectively, follow these steps:

## 1. Backend (Eclipse)
**Goal**: Run the Java/Spring Boot backend on port `8152`.

1.  Open **Eclipse**.
2.  Go to **File** > **Import...**
3.  Select **Maven** > **Existing Maven Projects** and click **Next**.
4.  Click **Browse** and select the root folder:
    `c:\Users\dreamz\Downloads\neighbour-project`
5.  Ensure the `pom.xml` is selected and click **Finish**.
6.  Wait for dependencies to download (look at the bottom right progress bar).
7.  To run:
    -   Right-click `src/main/java/com/example/lend/LendApplication.java`
    -   Select **Run As** > **Java Application** (or Spring Boot App).

## 2. Frontend (VS Code)
**Goal**: Run the React frontend on `http://localhost:5173`.

1.  Open **VS Code**.
2.  Go to **File** > **Open Folder...**
3.  **Crucial Step**: Select the `frontend` subfolder specifically:
    `c:\Users\dreamz\Downloads\neighbour-project\frontend`
    *(Do not open the backend root folder)*
4.  Open a Terminal in VS Code (`Ctrl + ~`).
5.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
6.  Start the development server:
    ```bash
    npm run dev
    ```

## 3. Workflow
-   **Eclipse**: Handles database, API logic, and server (Port 8152).
-   **VS Code**: Handles UI, Components, and Styling (Port 5173).
-   **Browser**: Open `http://localhost:5173` to verify everything works together.

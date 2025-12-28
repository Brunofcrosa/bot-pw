# PW Bot Manager

An Electron-based application for managing Perfect World accounts, running instances, and automated actions.

## 🚀 Features

-   **Account Management**: Store and organize accounts by server and group.
-   **Window Management**: Launch, close, and focus game windows.
-   **Macros**: Create and execute key automation macros.
-   **Overlay**: In-game overlay for quick access to group controls.
-   **Security**: Encrypted data persistence using AES-256-GCM.

## 🛠️ Architecture

The project uses a standard Electron architecture with React frontend:

-   **Backend (Main Process)**: Handles OS interactions, file I/O, encryption, and window management. Located in `backend/`.
-   **Frontend (Renderer Process)**: React application for the UI. Located in `frontend/`.
-   **IPC**: Safe communication between processes via `preload.js` and `contextBridge`.

### Key Services
-   `ProcessManager.js`: Handles spawning and killing game processes.
-   `PersistenceService.js`: Manages encrypted data storage.
-   `KeyListenerService.js`: Listens for global hotkeys (via C# helper).

## 📦 Installation

Prerequisites: Node.js (v18+ recommended) and python (for npm dependency build tools).

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

## 💻 Usage

### Development Mode
Runs Webpack in watch mode and Electron simultaneously.
```bash
npm run dev
```

### Production Build
Builds the React frontend and packages the Electron app.
```bash
npm run build
```

### Linting & Testing
```bash
npm run lint  # Check code style
npm test      # Run automated tests
```

## 🔒 Security

-   **Context Isolation**: Enabled to prevent renderer access to Node.js internals.
-   **Encryption**: User data is encrypted at rest.
-   **IPC Allowlist**: Only specific channels are exposed to the frontend.
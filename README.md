# SWS Document Management Dashboard

A full-stack document management web application for uploading, tracking, and managing company PDF documents with real-time notifications.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (via Node built-in `node:sqlite`)
- **Real-time:** Server-Sent Events (SSE)
- **File Storage:** Local disk (`server/uploads/`)

## Features

- Upload single or multiple PDF files with per-file progress bars
- Bulk upload mode (>3 files) with background processing toast
- Real-time notifications via SSE when bulk upload completes
- Notification center with unread badge, mark as read / mark all as read
- Persistent notifications stored in SQLite database
- Document list with name, size, type, upload date, and download option

## Database Schema

**files**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique file ID |
| name | TEXT | Original filename |
| size | INTEGER | File size in bytes |
| type | TEXT | MIME type |
| path | TEXT | Saved filename on disk |
| status | TEXT | complete / failed |
| uploaded_at | DATETIME | Upload timestamp |

**notifications**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique notification ID |
| message | TEXT | Notification message |
| type | TEXT | success / error / info |
| is_read | INTEGER | 0 = unread, 1 = read |
| created_at | DATETIME | Creation timestamp |

## Setup & Run Locally

### Prerequisites
- Node.js v22 or higher

### 1. Clone the repository
```bash
git clone https://github.com/sriakshayarajkamal/auto-code-backup-sws.git
cd auto-code-backup-sws
```

### 2. Install backend dependencies
```bash
cd server
npm install
```

### 3. Install frontend dependencies
```bash
cd ../client
npm install
```

### 4. Run the backend
```bash
cd ../server
node index.js
```
Server runs on http://localhost:5000

### 5. Run the frontend (in a new terminal)
```bash
cd client
npm run dev
```
Frontend runs on http://localhost:5173

## Project Structure

```
auto-code-backup-sws/
├── server/
│   ├── index.js              # Express server entry point
│   ├── db.js                 # SQLite database setup
│   ├── sse.js                # Server-Sent Events manager
│   ├── package.json
│   └── routes/
│       ├── upload.js         # POST /api/upload
│       ├── files.js          # GET /api/files, download
│       └── notifications.js  # GET/PATCH /api/notifications, SSE stream
└── client/
    ├── src/
    │   ├── App.jsx            # Main app layout + SSE connection
    │   ├── components/
    │   │   ├── UploadZone.jsx      # File upload with progress bars
    │   │   ├── FileList.jsx        # Documents table
    │   │   └── NotificationBell.jsx # Notification center
    │   ├── main.jsx
    │   └── index.css
    └── vite.config.js
```

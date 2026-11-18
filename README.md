# PMT Subscriber Usage Management System

A full-stack subscriber usage management system developed as a technical test assignment.

The application provides a REST API for managing subscriber usage records, a web dashboard for monitoring usage, automated CSV snapshot generation, and SQL-based data analysis.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [CSV Automation](#csv-automation)
- [SQL Tasks (Q3)](#sql-tasks-q3)
- [Bug Fix (Q4)](#bug-fix-q4)
- [Error Handling](#error-handling)

## Overview

The PMT Subscriber Usage Management System is designed to record, retrieve, and monitor subscriber usage information.

Each usage record contains:

- Subscriber ID
- Call minutes
- SMS count
- Data usage in MB
- Usage snapshot timestamp

The project consists of two main applications:

1. **Backend:** REST API built with Express.js and TypeScript, connected to MySQL.
2. **Frontend:** Web dashboard built with Next.js and React, consuming the backend API.

The backend also includes scheduled CSV generation and automated cleanup of outdated CSV exports.

## Technology Stack

### Backend
- Node.js
- Express.js 5
- TypeScript
- MySQL 8
- mysql2
- node-cron
- dotenv

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## Project Structure

```text
pmt-subscriber-usage/
├── backend/
│   ├── exports/
│   ├── scripts/
│   │   ├── cleanup-old-csv.ts
│   │   ├── generate-usage-csv.ts
│   │   └── test-db.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── subscriber.controller.ts
│   │   │   └── usage.controller.ts
│   │   ├── jobs/
│   │   │   └── usage-csv.scheduler.ts
│   │   ├── routes/
│   │   │   ├── subscriber.routes.ts
│   │   │   └── usage.routes.ts
│   │   ├── services/
│   │   │   └── usage-csv.service.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   └── package.json
│
├── .gitignore
└── README.md
```

## Features

### 1. Subscriber Management
- Retrieve all registered subscribers.
- Display subscriber ID, name, subscription plan, and activation date.
- Retrieve subscriber information from MySQL.

### 2. Usage Management
- Create new subscriber usage records.
- Retrieve all usage records.
- Filter usage records by subscriber ID.
- Validate usage values before inserting them into the database.
- Automatically record the snapshot timestamp.

### 3. Dashboard
- Overview of total registered subscribers.
- Total call minutes.
- Total SMS messages.
- Total data usage.
- Subscriber list.
- Usage record list.
- Filter usage records by subscriber.
- Form for adding new usage records.
- Loading, error, and success states.

### 4. CSV Automation
- Generate CSV snapshots from subscriber and usage data.
- Automatically generate snapshots three times daily.
- Prevent overlapping CSV generation.
- Remove CSV files older than 30 days.
- Support manual CSV generation and cleanup.

## Database Design

Database name: `pmt_subscriber_usage`

The database contains two tables.

### subscribers

| Column | Type | Description |
|---|---|---|
| subscriber_id | VARCHAR(20) | Primary key |
| name | VARCHAR(100) | Subscriber name |
| plan | VARCHAR(50) | Subscription plan |
| activation_date | DATE | Activation date |
| created_at | TIMESTAMP | Record creation time |

### usage_records

| Column | Type | Description |
|---|---|---|
| id | BIGINT UNSIGNED | Primary key, auto increment |
| subscriber_id | VARCHAR(20) | Foreign key |
| call_minutes | INT UNSIGNED | Total call minutes |
| sms_count | INT UNSIGNED | Total SMS messages |
| data_usage_mb | BIGINT UNSIGNED | Data usage in MB |
| snapshot_at | DATETIME | Usage snapshot timestamp |
| created_at | TIMESTAMP | Record creation time |

### Relationships

- One subscriber can have multiple usage records.
- `usage_records.subscriber_id` references `subscribers.subscriber_id`.
- Foreign key constraint: `fk_usage_subscriber`.
- Deleting a subscriber with existing usage records is restricted.
- Updating a subscriber ID cascades to related usage records.

Indexes:
- Primary key on `subscribers.subscriber_id`.
- Primary key on `usage_records.id`.
- Index on `usage_records.subscriber_id`.
- Index on `usage_records.snapshot_at`.

## API Documentation

Base URL:

```text
http://localhost:3000
```

All endpoints return JSON responses.

### 1. Health Check

**GET** `/api/health`

Checks whether the backend service is running.

Example response:

```json
{
  "success": true,
  "message": "PMT Subscriber Usage API is running",
  "timestamp": "2026-11-18T13:00:00.000Z"
}
```

### 2. Get All Subscribers

**GET** `/api/subscribers`

Retrieves all subscribers ordered by subscriber ID.

Example response:

```json
{
  "success": true,
  "data": [
    {
      "subscriber_id": "SUB01",
      "name": "Amir",
      "plan": "Basic",
      "activation_date": "2023-01-12"
    }
  ]
}
```

### 3. Get Usage Records

**GET** `/api/usage`

Retrieves all usage records ordered by snapshot timestamp in descending order.

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "subscriberId": "SUB01",
      "callMinutes": 40,
      "smsCount": 10,
      "dataUsageMB": 1500,
      "timestamp": "2025-08-01 08:00:00"
    }
  ]
}
```

### 4. Filter Usage by Subscriber

**GET** `/api/usage?subscriberId=SUB01`

Retrieves usage records belonging to a specific subscriber.

### 5. Create Usage Record

**POST** `/api/usage`

Creates a new usage record.

Request headers:

```text
Content-Type: application/json
```

Request body:

```json
{
  "subscriberId": "SUB03",
  "callMinutes": 30,
  "smsCount": 15,
  "dataUsageMB": 500
}
```

Example successful response:

```json
{
  "success": true,
  "message": "Usage record created successfully",
  "data": {
    "id": 16,
    "subscriberId": "SUB03",
    "callMinutes": 30,
    "smsCount": 15,
    "dataUsageMB": 500,
    "timestamp": "2026-11-18 20:00:00"
  }
}
```

The API validates that:

- `subscriberId` must be a non-empty string.
- Usage values must be numbers.
- Usage values must be non-negative safe integers.
- The subscriber must exist before a usage record is created.

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MySQL 8
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pmt-subscriber-usage
```

### 2. Database Setup

Create the database:

```sql
CREATE DATABASE pmt_subscriber_usage
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Create the subscriber table:

```sql
USE pmt_subscriber_usage;

CREATE TABLE subscribers (
    subscriber_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    activation_date DATE NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (subscriber_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
```

Create the usage records table:

```sql
CREATE TABLE usage_records (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    subscriber_id VARCHAR(20) NOT NULL,
    call_minutes INT UNSIGNED NOT NULL,
    sms_count INT UNSIGNED NOT NULL,
    data_usage_mb BIGINT UNSIGNED NOT NULL,
    snapshot_at DATETIME NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_usage_subscriber (subscriber_id),
    KEY idx_usage_snapshot (snapshot_at),
    CONSTRAINT fk_usage_subscriber
        FOREIGN KEY (subscriber_id)
        REFERENCES subscribers (subscriber_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
```

Insert your subscriber and usage test data according to the technical test dataset.

### 3. Backend Installation

Open a terminal:

```bash
cd backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the database credentials in `backend/.env`.

### 4. Frontend Installation

Open another terminal:

```bash
cd frontend
npm install
```

## Environment Configuration

### Backend

Configure `backend/.env`:

```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pmt_subscriber_usage
```

Replace the database credentials with your actual MySQL configuration.

The database connection uses a MySQL connection pool with a maximum of 10 connections.

### Frontend

The frontend uses the following API base URL by default:

```text
http://localhost:3000
```

To configure a different backend URL, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Running the Application

Both applications must be running.

### Start Backend

From the `backend` directory:

```bash
npm run dev
```

The backend will be available at:

```text
http://localhost:3000
```

The CSV scheduler starts automatically when the server starts.

### Start Frontend

From the `frontend` directory:

```bash
npm run dev
```

Open the dashboard:

```text
http://localhost:3001
```

If Next.js selects another available port, use the URL printed in the terminal.

### Production Build

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm start
```

## CSV Automation

### CSV Generation

The CSV export combines subscriber information with usage records using an INNER JOIN.

CSV columns:

| Column | Description |
|---|---|
| subscriber_id | Subscriber ID |
| name | Subscriber name |
| plan | Subscription plan |
| call_minutes | Call minutes |
| sms_count | SMS count |
| data_usage_mb | Data usage in MB |
| snapshot_at | Snapshot timestamp |

Generated files are saved in:

```text
backend/exports/
```

File naming format:

```text
usage-snapshot-YYYY-MM-DDTHH-MM-SS-sssZ.csv
```

CSV files use UTF-8 encoding with BOM and properly escaped values.

### Automated Schedule

CSV generation runs automatically at:

| Time | Time Zone |
|---|---|
| 08:00 | Asia/Jakarta |
| 12:00 | Asia/Jakarta |
| 15:00 | Asia/Jakarta |

The scheduler prevents overlapping executions and skips a scheduled run if a previous generation is still active.

### Manual CSV Generation

From the backend directory:

```bash
npm run generate-csv
```

### CSV Cleanup

The cleanup process removes CSV files whose modification time is older than 30 days.

Files that are not CSV files are ignored.

Run cleanup manually:

```bash
npm run cleanup-csv
```

## SQL Tasks (Q3)

The following SQL queries address the five database tasks.

### 1. Insert a New Subscriber

Insert Fajar with a Basic subscription plan and activation date of January 24, 2024.

```sql
INSERT INTO subscribers (
    subscriber_id,
    name,
    plan,
    activation_date
)
VALUES (
    'SUB07',
    'Fajar',
    'Basic',
    '2024-01-24'
);
```

### 2. Update Subscriber Plan

Update Fajar's subscription plan to Premium.

```sql
UPDATE subscribers
SET plan = 'Premium'
WHERE subscriber_id = 'SUB07';
```

### 3. Calculate Total Data Usage for Premium Subscribers

Calculate the total data usage across all snapshots belonging to Premium subscribers.

```sql
SELECT
    SUM(u.data_usage_mb) AS total_data_usage_mb
FROM usage_records u
INNER JOIN subscribers s
    ON u.subscriber_id = s.subscriber_id
WHERE s.plan = 'Premium';
```

### 4. Find the Top 3 Subscribers by Total Data Usage

```sql
SELECT
    s.subscriber_id,
    s.name,
    SUM(u.data_usage_mb) AS total_data_usage_mb
FROM subscribers s
INNER JOIN usage_records u
    ON s.subscriber_id = u.subscriber_id
GROUP BY
    s.subscriber_id,
    s.name
ORDER BY total_data_usage_mb DESC
LIMIT 3;
```

### 5. Find Subscribers with Average Call Minutes of 30 or Less

Use a subquery to identify subscribers whose average call minutes per snapshot is at most 30.

```sql
SELECT
    s.subscriber_id,
    s.name,
    s.plan
FROM subscribers s
WHERE s.subscriber_id IN (
    SELECT u.subscriber_id
    FROM usage_records u
    GROUP BY u.subscriber_id
    HAVING AVG(u.call_minutes) <= 30
);
```

## Bug Fix (Q4)

The Q4 task addresses the calculation of total data usage from multiple usage records.

The `getTotalUsageMB` function uses JavaScript's `Array.reduce()` to accumulate data usage.

```javascript
function getTotalUsageMB(records) {
    return records.reduce((total, record) => {
        return total + record.dataUsageMB;
    }, 0);
}
```

Example:

```javascript
const records = [
    { dataUsageMB: 1500 },
    { dataUsageMB: 1200 },
    { dataUsageMB: 6000 }
];

console.log("Total Usage:", getTotalUsageMB(records));
console.log("Empty Records:", getTotalUsageMB([]));
```

Expected output:

```text
Total Usage: 8700
Empty Records: 0
```

The initial accumulator value of `0` ensures that the function also handles empty arrays correctly without throwing an error.

The standalone test is available in:

```text
backend/q4-test.js
```

Run it with:

```bash
node q4-test.js
```

## Error Handling

The API uses consistent JSON response structures.

Common HTTP status codes:

| Status | Description |
|---|---|
| 200 | Request successful |
| 201 | Usage record created |
| 400 | Invalid request or usage values |
| 404 | Subscriber not found |
| 500 | Internal server error |

Example error response:

```json
{
  "success": false,
  "message": "Subscriber not found"
}
```

The backend also handles malformed JSON request bodies and provides graceful shutdown for the HTTP server, CSV scheduler, and MySQL connection pool.

---

## Notes

- The backend and frontend run as separate applications.
- MySQL must be running before starting the backend.
- The CSV scheduler starts automatically with the backend server.
- CSV exports are generated locally and are excluded from Git.
- Environment files containing credentials must not be committed.
- The `.env.example` file is provided as a configuration template.

## Author

Developed as part of the PMT Subscriber Usage technical test assignment.

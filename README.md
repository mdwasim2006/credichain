# CrediChain - Decentralized Credential Verification System

CrediChain is a production-ready hackathon project for issuing, storing, and verifying digital certificates using SHA-256 hashing and a mock blockchain ledger. It is designed to make certificate tampering immediately visible during a live demo.

## What It Does

- Institutions issue certificates from an admin dashboard.
- Students can view their certificate details and QR code.
- Employers can verify authenticity by certificate ID or by scanning the QR code.
- Tampering with any field creates a different hash and fails verification.

## Tech Stack

- Frontend: React.js, Tailwind CSS, React Router
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Blockchain layer: mock blockchain ledger in memory for fast hackathon demo
- Libraries: `crypto` for SHA-256, `qrcode` for QR generation

## Project Structure

- [backend/src/routes/certificate.js](backend/src/routes/certificate.js)
- [backend/src/routes/verify.js](backend/src/routes/verify.js)
- [backend/src/routes/dashboard.js](backend/src/routes/dashboard.js)
- [backend/src/services/hashService.js](backend/src/services/hashService.js)
- [backend/src/services/blockchainService.js](backend/src/services/blockchainService.js)
- [backend/src/models/Certificate.js](backend/src/models/Certificate.js)
- [frontend/src/pages/AdminPage.jsx](frontend/src/pages/AdminPage.jsx)
- [frontend/src/pages/VerifyPage.jsx](frontend/src/pages/VerifyPage.jsx)
- [frontend/src/pages/DashboardPage.jsx](frontend/src/pages/DashboardPage.jsx)

## Setup Instructions

### 1. Install dependencies

From the root folder:

```bash
npm install
```

### 2. Configure environment variables

Create `backend/.env` from `backend/.env.example` and set:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/credichain
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Optionally create `frontend/.env` from `frontend/.env.example` if you want to override the backend URL used by the UI.

### 3. Start MongoDB

Make sure MongoDB is running locally or update `MONGODB_URI` to your Atlas cluster.

If MongoDB is not available, the backend automatically falls back to an in-memory demo mode so you can still run and present the app immediately.

### 4. Run the app

Run both apps together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

### Docker run

You can run the full stack with Docker Compose:

```bash
docker compose up --build
```

Then open the app at http://localhost:8080.

## API Endpoints

- `POST /create-certificate`
- `GET /certificate/:id`
- `POST /verify-certificate`
- `GET /dashboard/stats`

## Hashing Implementation

Certificate data is normalized and converted into a canonical JSON string before hashing. The backend uses SHA-256:

```js
const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
```

The payload includes:

- `certificateId`
- `name`
- `course`
- `issueDate`

Changing even one character creates a completely different hash.

## Blockchain Mock Implementation

The mock ledger stores:

- `certificateId`
- `hash`
- `timestamp`
- `transactionHash`

Each issuance appends a new record to the ledger. Verification compares the stored hash with the recalculated hash and the blockchain record hash.

## QR Code Generation

The backend generates a QR code that points to:

```text
http://localhost:5173/verify?certificateId=YOUR_CERTIFICATE_ID
```

This lets the QR code open the verification page directly.

## Sample Data

You can seed demo data with:

```bash
curl -X POST http://localhost:5000/seed-demo-data
```

On PowerShell, you can use:

```powershell
./scripts/seed-demo.ps1
./scripts/verify-demo.ps1
```

### Create Certificate

```json
{
  "certificateId": "CRD-DEMO-001",
  "name": "Ava Johnson",
  "course": "Advanced Blockchain Development",
  "issueDate": "2026-04-14",
  "issuer": "CrediChain Institute"
}
```

### Verify Certificate

```json
{
  "certificateId": "CRD-DEMO-001"
}
```

### Tamper Test

```json
{
  "certificateId": "CRD-DEMO-001",
  "certificateData": {
    "certificateId": "CRD-DEMO-001",
    "name": "Ava Johnson",
    "course": "Advanced Blockchain Development - Tampered",
    "issueDate": "2026-04-14"
  }
}
```

The tampered verification must return `INVALID / TAMPERED`.

## Demo Flow

1. Open the Admin Panel.
2. Issue a certificate.
3. Show the generated QR code and blockchain record.
4. Verify the original certificate to show `VALID`.
5. Change one field in the tamper demo and verify again to show `INVALID`.

## 2-Minute Pitch Script

CrediChain solves one of the biggest trust problems in education and hiring: fake certificates.

An institution creates a certificate in the Admin Panel. The system normalizes the certificate data, generates a SHA-256 hash, stores that hash on a blockchain-style ledger, and issues a QR code linked to the verification page.

When a student or employer verifies the certificate, CrediChain recalculates the hash from the certificate data and compares it against the stored blockchain record. If everything matches, the result is green and marked `VALID`. If any field is changed, even a single character, the hash changes and the system instantly shows `INVALID / TAMPERED`.

That means forgery becomes obvious, verification becomes instant, and trust becomes programmable. CrediChain is a simple, fast, and transparent anti-fraud system for digital credentials.

## Notes

- The app uses a mock blockchain ledger for speed and demo reliability.
- You can swap the mock ledger for Ethereum or Polygon later without changing the UI flow.
- If you want a PDF export later, the backend can extend the create endpoint to render a printable certificate.
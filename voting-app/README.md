# Voting App

A small Express, MongoDB, and LINE LIFF voting app deployable to Vercel.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set `MONGO_URI` and `LIFF_ID`.

3. Run locally:

   ```bash
   npm start
   ```

## API

- `POST /vote` with `{ "userId": "...", "choice": "A" }`
- `GET /check/:userId`
- `GET /results`

# Kaynes Digital Card Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file (see `.env` example):
   - `PORT=5000`
   - `DATABASE_URL=postgres://user:password@localhost:5432/kaynesvcard`
3. Start the server:
   ```bash
   npm start
   ```

## Project Structure
- `src/app.js`: Main Express app
- `src/controllers/`: Route controllers
- `src/models/`: Database models
- `src/routes/`: API routes
- `src/middlewares/`: Express middlewares
- `src/utils/`: Utility functions 
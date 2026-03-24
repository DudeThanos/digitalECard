ktuser@digicard:~/kaynesvcard$ # Test if backend can connect to database
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
{"message":"Server error"}ktuser@digicard:~/kaynesvcard$ 
ktuser@digicard:~/kaynesvcard$ # Test the endpoint that gets employee numbers
curl -X GET http://localhost:5000/api/card/last-employee-codes
{"message":"Server error"}ktuser@digicard:~/kaynesvcard$ 
ktuser@digicard:~/kaynesvcard$ # Check if there are any errors now
pm2 logs kaynesvcard-backend --lines 20
[TAILING] Tailing last 20 lines for [kaynesvcard-backend] process (change the value with --lines option)
/home/ktuser/.pm2/logs/kaynesvcard-backend-out.log last 20 lines:
0|kaynesvc | [dotenv@17.2.0] injecting env (0) from .env (tip: ⚙️  override existing env vars with { override: true })
0|kaynesvc | Server running on port 5000
0|kaynesvc | [dotenv@17.2.0] injecting env (14) from .env (tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' })
0|kaynesvc | === ENVIRONMENT DEBUG ===
0|kaynesvc | JWT_SECRET: SET
0|kaynesvc | DATABASE_URL: SET
0|kaynesvc | PORT: 5000
0|kaynesvc | NODE_ENV: production
0|kaynesvc | ========================
0|kaynesvc | [dotenv@17.2.0] injecting env (0) from .env (tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' })
0|kaynesvc | Server running on port 5000
0|kaynesvc | [dotenv@17.2.0] injecting env (14) from .env (tip: 🔐 encrypt with dotenvx: https://dotenvx.com)
0|kaynesvc | === ENVIRONMENT DEBUG ===
0|kaynesvc | JWT_SECRET: SET
0|kaynesvc | DATABASE_URL: SET
0|kaynesvc | PORT: 5000
0|kaynesvc | NODE_ENV: production
0|kaynesvc | ========================
0|kaynesvc | [dotenv@17.2.0] injecting env (0) from .env (tip: ⚙️  enable debug logging with { debug: true })
0|kaynesvc | Server running on port 5000

/home/ktuser/.pm2/logs/kaynesvcard-backend-error.log last 20 lines:
0|kaynesvc |     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
0|kaynesvc |     at async exports.getLastEmployeeCodes (/home/ktuser/kaynesvcard/backend/src/controllers/cardController.js:418:20) {
0|kaynesvc |   length: 106,
0|kaynesvc |   severity: 'FATAL',
0|kaynesvc |   code: '28P01',
0|kaynesvc |   detail: undefined,
0|kaynesvc |   hint: undefined,
0|kaynesvc |   position: undefined,
0|kaynesvc |   internalPosition: undefined,
0|kaynesvc |   internalQuery: undefined,
0|kaynesvc |   where: undefined,
0|kaynesvc |   schema: undefined,
0|kaynesvc |   table: undefined,
0|kaynesvc |   column: undefined,
0|kaynesvc |   dataType: undefined,
0|kaynesvc |   constraint: undefined,
0|kaynesvc |   file: 'auth.c',
0|kaynesvc |   line: '335',
0|kaynesvc |   routine: 'auth_failed'
0|kaynesvc | }

^C
ktuser@digicard:~/kaynesvcard$ 

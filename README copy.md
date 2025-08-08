# Kaynes Digital Card Web Application

A full-stack web application for creating, managing, and sharing digital business cards with secure access and QR code integration.

## Features
- User authentication (login system)
- Bulk digital card creation via CSV upload
- Single card creation via form
- Database storage for all card data
- Unique, shareable card links (e.g., /hr-emp-0001)
- QR code on each card for instant contact saving
- Password-protected card access
- High availability and fast access

## Project Structure

```
kaynesVcard/
│
├── backend/         # Node.js (Express) backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── app.js
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend/        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   ├── package.json
│   └── README.md
│
└── README.md        # Project overview
```

---

## Getting Started

See backend/README.md and frontend/README.md for setup instructions for each part.


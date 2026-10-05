# SmartBite

SmartBite is an intelligent food ordering and nutrition intelligence platform that bridges dining with nutritional awareness, calorie tracking, and macro insights.

## Project Structure

```
SmartBite/
├── frontend/               # React 19 + Vite frontend application
├── backend/                # Python Flask REST API backend
├── smartbite-backend/      # Spring Boot Java microservice
├── database/               # MySQL schema (DDL definitions)
├── ai-service/             # AI recommendation & nutrition service
└── documentation/          # Architecture & setup documentation
```

## Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons / SVG assets, Vanilla CSS
- **Backend (Python)**: Flask, Flask-CORS, MySQL Connector
- **Backend (Java)**: Spring Boot 4, Maven
- **Database**: MySQL 8.0+

## Setup & Running

### 1. Database
Import the schema into your MySQL instance:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Flask Backend
Navigate to `backend/` and install dependencies:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend runs on `http://127.0.0.1:5000`.

### 3. Frontend
Navigate to `frontend/` and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

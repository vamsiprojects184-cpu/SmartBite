# SmartBite Architecture & Documentation

## Overview
SmartBite is a smart food-ordering and nutrition tracking platform featuring calorie counting, macro breakdowns, real-time ordering, and AI dietary recommendations.

## System Components
1. **Frontend**: React 19 + Vite SPA with responsive UI, dynamic carts, modals, and nutrition dashboards.
2. **Backend**: 
   - Python Flask service (`backend/app.py`) for REST endpoints, authentication, orders, favorites, and database operations.
   - Spring Boot service (`smartbite-backend/`) for enterprise microservice integrations.
3. **Database**: MySQL schema (`database/schema.sql`) for persistence.
4. **AI Service**: Nutrition intelligence and dietary recommendation logic (`ai-service/`).

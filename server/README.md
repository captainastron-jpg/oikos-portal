# Oikos API Server

Node/Express backend using MySQL for Time Keeping and TinyTalkers.

Before starting the server, create a MySQL database and user, grant that user
access to the database, and configure the connection and JWT settings in the
environment (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`,
and `JWT_SECRET`). The server initializes its tables on startup; it does not
create the database.

For local development, start the services from the repository root with
`docker compose up --build`.

For cPanel's Node.js Selector, use `passenger.cjs` as the application startup
file. It dynamically imports the ESM server entry point so Passenger can load
the app's top-level `await` initialization.

API endpoints:
- `POST /api/auth/register` { username, email, password }
- `POST /api/auth/login` { email, password }
- `GET/POST /api/time-entries` (requires `Authorization: Bearer <token>`)

# Local development

The Oikos workspace contains the landing page, TinyTalkers, and the Timekeeping interface/API. Both products use the Express API and MySQL database. Start the local stack with Docker Desktop installed and running:

1. Copy `.env.example` to `.env`.
2. Run `docker compose up --build` from the workspace root.
3. Open `http://localhost:8443/`.

The compose stack starts MySQL, the Express API, and the Vite app. Timekeeping seeds local demo users on a fresh database: `000000` (super admin), `111111` (admin), `123456`, `567890`, and `901234`. These are development-only access codes; change or remove them before exposing the app beyond your machine.

TinyTalkers accounts register through the app and are stored in the `tiny_talkers_users` table with hashed passwords. Its word library, categories, and per-user buckets are stored in separate `tiny_talkers_*` tables. Google sign-in uses Firebase Authentication; enable the Google provider and add the app's domains in Firebase Console, then copy the Firebase web app settings into the `VITE_FIREBASE_*` entries in `.env`. The API uses the same Firebase API key to verify Google identity tokens. Google-created profiles do not request a birthday. To grant an account access to TinyTalkers content management, promote it directly in MySQL, then sign out and back in:

```sql
UPDATE tiny_talkers_users SET role = 'admin' WHERE email = 'admin@example.com';
```

Registration-success emails are sent by the API using SMTP. For Gmail, use `smtp.gmail.com`, port `587`, and `SMTP_SECURE=false`; put your Gmail address in `SMTP_USER` and `SMTP_FROM`, and use a Google App Password in `SMTP_PASSWORD` (not your regular account password). Without SMTP credentials, accounts are still created, but the app reports that the email could not be sent. For direct local API development outside Docker, set `FIREBASE_API_KEY` and the SMTP settings in `server/.env` as well.

To stop the stack, press Ctrl+C. To stop it and remove the local MySQL data volume, run `docker compose down -v`.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import timeRoutes from './routes/timeEntries.js';
import manageUsersRoutes from './routes/manageUsers.js';
import workScheduleRoutes from './routes/workSchedule.js';
import tinyTalkersRoutes from './routes/tinyTalkers.js';
import { initializeTinyTalkersDatabase } from './tinyTalkersDb.js';
import './db.js';

dotenv.config();

const app = express();
const appRoot = path.dirname(fileURLToPath(import.meta.url));
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/time-entries', timeRoutes);
app.use('/api/manage/users', manageUsersRoutes);
app.use('/api/work-schedule', workScheduleRoutes);
app.use('/api/tiny-talkers', tinyTalkersRoutes);
app.use(express.static(path.join(appRoot, 'public')));

await initializeTinyTalkersDatabase();

const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});

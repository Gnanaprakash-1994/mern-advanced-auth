import express from 'express';
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import { connectDB } from './db/connectDB.js';

import authRoutes from './routes/auth.route.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true, 
}))

app.use(express.json()); //used to parse the incoming requests from req.body
app.use(cookieParser()); //used to parse the incoming cookies

app.use('/api/auth',authRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'frontend/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
    });
}

app.listen(PORT, (req, res) => {
    connectDB()
    console.log('Server is running on port: ',PORT);
})
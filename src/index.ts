import AgentAPI from "apminsight";

AgentAPI.config();

import express from "express";
import subjectsRouter from "./routes/subjects.js";
import usersRouter from "./routes/users.js";
import cors from "cors";
import securityMiddleware from "./middleware/security.js";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import classesRouter from "./routes/classes.js";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not set in .env file.");
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

// Attach the logged-in user's role so the rate limiter can apply role-based limits
app.use(async (req, _res, next) => {
    try {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
        if (session?.user) {
            req.user = { role: session.user.role as UserRoles };
        }
    } catch (err) {
        console.error('Failed to resolve session', err);
    }
    next();
});

app.use(securityMiddleware);

app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)

app.get('/', (_req, res) => {
    res.send("Welcome to the Classroom API!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

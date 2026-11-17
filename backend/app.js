
import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";

import githubRoutes from "./routes/githubRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import sessionStore from "./config/sessionStore.js";

const app = express();

const sessionSecret = process.env.SESSION_SECRET;

if (
    !sessionSecret ||
    Buffer.byteLength(sessionSecret, "utf8") < 32
) {
    throw new Error(
        "SESSION_SECRET must be configured with at least 32 bytes of random data."
    );
}

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        credentials: true,
    })
);

app.use(express.json());

app.use(
    session({
        name: "devcollab.sid",
        secret: sessionSecret,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

app.get("/", (req, res) => {
    res.json({
        message: "DevCollab backend is running!",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);

export default app;

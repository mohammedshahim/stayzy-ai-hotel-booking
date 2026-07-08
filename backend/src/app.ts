import cookieParser from "cookie-parser";
import express from "express";
import routes from "./routes";
import authRoutes from "./routes/auth.routes";
import adminAuthRoutes from "./routes/admin/auth.routes";
import { cors } from "./middlewares/cors";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(cors);
app.use(cookieParser());
// better-auth reads the raw request body itself, so both instances must be mounted before express.json()
app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use(express.json());
app.use(routes);
app.use(errorHandler);

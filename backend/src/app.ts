import express from "express";
import routes from "./routes";
import authRoutes from "./routes/auth.routes";
import { cors } from "./middlewares/cors";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(cors);
// better-auth reads the raw request body itself, so it must be mounted before express.json()
app.use("/api/auth", authRoutes);
app.use(express.json());
app.use(routes);
app.use(errorHandler);

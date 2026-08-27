import express from "express";
import { getUserById, getUsers } from "../controllers/users.controller";
import { validateParams, validateQuery } from "../middleware/validate";
import { stringIdParamSchema, userQuerySchema } from "../validations";

const usersRouter = express.Router();

// GET /api/users - Get all users with optional search, role filter, and pagination
usersRouter.get("/", validateQuery(userQuerySchema), getUsers);

// GET /api/users/:id - Get a single user by ID
usersRouter.get("/:id", validateParams(stringIdParamSchema), getUserById);

export default usersRouter;

import { Hono } from "hono";

import { z } from "zod";
import { zValidator as zv } from "@hono/zod-validator";

import { sign, verify } from "hono/jwt";
import { hashPassword, verifyPassword } from "./utils/password";
import { createMiddleware } from "hono/factory";

export const auth = new Hono<{ Bindings: CloudflareBindings }>();

const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters long")
	.max(36, "Password must be at most 100 characters long")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter")
	.regex(/[0-9]/, "Password must contain at least one number")
	.regex(/[\W_]/, "Password must contain at least one special character");

const signupSchema = z.object({
	email: z.string().email(),
	password: passwordSchema,
});

auth.post(
	"/signup",
	zv("json", signupSchema, (result, c) => {
		if (!result.success) {
			const formatted = result.error.format();
			return c.json(formatted, 400);
		}
	}),
	async (c) => {
		const { email, password } = c.req.valid("json");
		// search for existing user
		const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
			.bind(email)
			.first();

		if (user) {
			return c.json({ message: "User already exists" }, 409);
		}

		// insert new user
		const hashed = await hashPassword(password);
		const result = await c.env.DB.prepare(
			"INSERT INTO users (email, password) VALUES (?, ?)",
		)
			.bind(email, hashed)
			.run();

		if (result.success) {
			// console.log("User created:", result.meta.last_row_id);
			const token = await sign(
				{ email, exp: Math.floor(Date.now() / 1000) + 3600 }, // 1 hour
				c.env.JWT_SECRET,
			);

			return c.json({ accessToken: token }, 201);
		} else {
			console.error("Error creating user:", result.error);
			return c.json({ message: "Error creating user" }, 500);
		}
	},
);

type UserPassword = {
	password: string;
};

auth.post("/login", async (c) => {
	const { email, password } = await c.req.json();

	// find the user by email
	const user: UserPassword | null = await c.env.DB.prepare(
		"SELECT password FROM users WHERE email = ?",
	)
		.bind(email)
		.first();

	if (!user) {
		return c.json({ message: "Invalid email or password" }, 401);
	}

	// verify the password
	const passwordMatch = await verifyPassword(user.password, password);
	if (!passwordMatch) {
		return c.json({ message: "Invalid email or password" }, 401);
	}

	const token = await sign(
		{ email, exp: Math.floor(Date.now() / 1000) + 3600 }, // 1 hour
		c.env.JWT_SECRET,
	);
	return c.json({ accessToken: token }, 200);
});

export const useAuth = createMiddleware<{ Bindings: CloudflareBindings }>(
	async (c, next) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader) {
			return c.json({ message: "Authorization header missing" }, 401);
		}

		const token = authHeader.replace("Bearer ", "").trim();
		try {
			const payload = await verify(token, c.env.JWT_SECRET);
			// Attach the payload to the context so handlers can access it
			c.set("jwtPayload", payload);
			await next();
		} catch (error) {
			console.error("JWT verification failed:", error);
			return c.json({ message: "Unauthorized: Invalid or expired token" }, 401);
		}
	},
);

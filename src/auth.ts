import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { hashPassword, verifyPassword } from "./utils/password";
import { createMiddleware } from "hono/factory";

export const auth = new Hono<{ Bindings: CloudflareBindings }>();

auth.post("/signup", async (c) => {
	const { email, password } = await c.req.json();
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
		console.log("User created:", result.meta.last_row_id);
		return c.json({ message: "User created successfully" }, 201);
	} else {
		console.error("Error creating user:", result.error, 500);
	}
});

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
	return c.json({ jwt: token }, 200);
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

import { Hono } from "hono";
import { useAuth } from "./auth";
export const profile = new Hono<{ Bindings: CloudflareBindings }>();
profile.use(useAuth);

profile.get("/", async (c) => {
	const { email } = c.get("jwtPayload");
	return c.json({ email }, 200);
});

import { Hono } from "hono";
import { auth } from "./auth";
import { profile } from "./profile";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/hello", (c) => {
	return c.json({ message: "hello, world" });
});

app.route("/auth", auth);
app.route("/profile", profile);

export default app;

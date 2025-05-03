import { Hono } from "hono";
import { auth } from "./auth";
import { profile } from "./profile";
import { websocket } from "./websocket";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/hello", (c) => {
	return c.json({ message: "hello, world" });
});

app.route("/auth", auth);
app.route("/profile", profile);
app.route("/ws", websocket);

export default app;

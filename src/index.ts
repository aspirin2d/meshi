import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
	return c.text(`hello, ${c.env.TEST}.`);
});

export default app;

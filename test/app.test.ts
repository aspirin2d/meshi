import { describe, test, expect } from "vitest";
import { hc } from "hono/client";

import { env } from "cloudflare:test";
import app from "../src/index";

describe("meshi app test", () => {
	let token = "";

	test("GET /hello", async () => {
		const res = await app.request("/hello");
		const json: any = await res.json();
		expect(res.status).toBe(200);
		expect(json.message).toBe("hello, world");
	});

	test("POST /auth/signup", async () => {
		const res = await app.request(
			"/auth/signup",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: "example@example.com",
					password: "Passw0rd123!",
				}),
			},
			env,
		);
		expect(res.status).toBe(201);
		const json: any = await res.json();
		token = json.accessToken;
	});
});

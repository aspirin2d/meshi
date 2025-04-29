import { describe, test, expect } from "vitest";
import app from "../src/index";

describe("meshi app test", () => {
	test("GET /hello", async () => {
		const res = await app.request("/hello");
		const json: any = await res.json();
		expect(res.status).toBe(200);
		expect(json.message).toBe("hello, world");
	});
});

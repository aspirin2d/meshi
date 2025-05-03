import { Hono, Context } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";

import { useAuth } from "./auth";
export const websocket = new Hono<{ Bindings: CloudflareBindings }>();
websocket.use(useAuth);

websocket.get(
	"/",
	upgradeWebSocket((c: Context<{ Bindings: CloudflareBindings }>) => {
		return {
			onMessage(event, ws) {
				ws.send("Echo from server: " + event.data);
			},
			onClose: () => {
				console.log("Connection closed");
			},
      onError: (error) => {
        console.error("WebSocket error: ", error);
      }
		};
	}),
);

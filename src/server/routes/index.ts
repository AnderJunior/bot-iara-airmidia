import type { Client } from "discord.js";
import type { FastifyInstance } from "fastify";
import { homeRoute } from "./home.js";
import { sendMessageRoute } from "./sendMessage.js";

export function registerRoutes(app: FastifyInstance, client: Client<true>) {
    homeRoute(app, client);
    sendMessageRoute(app, client);
}
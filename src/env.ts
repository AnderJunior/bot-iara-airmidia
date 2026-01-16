import { validateEnv } from "@constatic/base";
import { z } from "zod";
import "./constants.js";

export const env = await validateEnv(z.looseObject({
    BOT_TOKEN: z.string("Discord Bot Token is required").min(1),
    WEBHOOK_LOGS_URL: z.url().optional(),
    GUILD_ID: z.string().optional(),
    SERVER_PORT: z.coerce.number().min(1).optional(),
    SUPABASE_KEY: z.string().optional(),
    STATUS_CHANNEL_ID: z.string().optional(),
    STATUS_SEND_HOUR: z.coerce.number().min(0).max(23).optional().default(18),
    STATUS_SEND_MINUTE: z.coerce.number().min(0).max(59).optional().default(40)
}));
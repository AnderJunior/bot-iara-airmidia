import { env } from "#env";
import { bootstrap } from "@constatic/base";
import "#server";
import "./discord/events/dailyStatus.js";

await bootstrap({ meta: import.meta, env });
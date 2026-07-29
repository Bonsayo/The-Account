import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("scrape NBA cyber basketball", { minutes: 5 }, internal.scrapeCyberBasketball.scrape);

export default crons;

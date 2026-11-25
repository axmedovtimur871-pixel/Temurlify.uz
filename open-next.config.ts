// Cloudflare Workers adapter config (https://opennext.js.org/cloudflare).
// Every route is rendered per request, so no incremental cache is configured.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});

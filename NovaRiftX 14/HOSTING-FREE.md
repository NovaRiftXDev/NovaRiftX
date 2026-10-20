# Free stable hosting for NovaRiftX

The game is prepared for one Render Free Node web service plus Neon Free PostgreSQL. This provides a stable HTTPS address and durable accounts without requiring this Mac to stay online. It has not been deployed yet: the account sign-ins and database connection are still needed.

1. Sign into GitHub, Neon (https://console.neon.tech), and Render (https://dashboard.render.com). Select free plans only. Creating accounts and accepting terms must be done by you.
2. Create a free Neon PostgreSQL project. Copy its direct connection string. Do not paste it into chat or publish it in the repository.
3. Upload the contents of this game folder to a GitHub repository. Exclude `data`, `node_modules`, `.env`, and credentials. The downloadable NovaRiftX.zip excludes account data.
4. In Render, create a Blueprint from that repository. The included `render.yaml` specifies the **free** instance type and no paid disk. Set `DATABASE_URL` using the Neon connection string in Render’s secret environment field.
5. Deploy. The database table is created automatically. Render shows the real stable `https://...onrender.com` address; use that address for bookmarks and invitations. The subdomain must be assigned by Render, so no unverified address is supplied here.

Free hosting limitations: Render can sleep after 15 minutes without inbound traffic, and the next visit has a wake-up delay. Both services have usage limits and may change their plans. A stable address is not a promise of free hosting forever or uninterrupted matches. Rooms are live server memory and end on a server restart; accounts persist in PostgreSQL. Use one server instance; version checks prevent competing instances from overwriting newer account snapshots.

With DATABASE_URL set, saved accounts use PostgreSQL. Without it, local development retains data/profiles.json. NOVA_REQUIRE_DB=true prevents accidentally deploying with temporary filesystem storage. Existing local accounts are not automatically copied to a new database. Account operations wait for database writes before acknowledgment; kill/wave saves are queued immediately, and graceful shutdown flushes pending saves.

Verified references: https://render.com/docs/free and https://neon.com/blog/neon-free-plan-1-gb-per-project.

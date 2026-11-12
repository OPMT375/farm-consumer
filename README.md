# Team storefront

This repo is your firm's home in the OPMT 375 Supply Lab. Its web page is your storefront. Its Issues tab is where other teams will contact you, and later where they will send orders.

## Get it live

1. Edit **`team.json`**: your name, tagline, assigned link and chain, members (with GitHub usernames), and how to order.
2. Edit **`catalog.json`**: what you offer. Write it so a buyer at another table could order correctly without talking to you.
3. Go to **Settings → Pages**. Set Source to *Deploy from a branch*, Branch to `main`, and folder to `/ (root)`, then click **Save**.
4. After about a minute, your storefront is live at `https://<owner>.github.io/<repo>/`.
5. Join the class registry (see the registry repo's README).

## Show parties from Supabase

The page displays rows from the public `parties` table as cards. To connect it to your project:

1. In `app.js`, set `supabaseUrl` and `supabaseAnonKey` to the Project URL and anon/public key from Supabase → Project Settings → API.
2. Run `supabase/spine.sql` in the Supabase SQL Editor if you have not already. The script creates the `parties` table and its public read policy.
3. Reload the page. The cards display each party's name, role, GLN, county, and team.

The anon/public key is intended for browser use and is restricted by your Row Level Security policies. Never expose the `service_role` key in this page or any browser code.

## Add your database (Session 4)

Your firm keeps its records in a free Supabase project. The file **`supabase/spine.sql`** creates the four tables every team shares: `parties`, `products`, `lots` and `events`.

1. Sign up at [supabase.com](https://supabase.com) with your GitHub account and create a project named for your team slug. Save the database password where your whole team can find it.
2. In this repo, open **`supabase/spine.sql`** and copy all of it. If your repo was made before this file existed, copy it from the class template: `OPMT375/storefront-template`.
3. In Supabase, open **SQL Editor → New query**, paste, and click **Run**.
4. Open **Table Editor**: the four tables are there, with sample rows from a turkey chain.
5. Add one row to `parties` for your firm and one to `products` for your main product. Use your team's assigned code prefix in place of `0999`.

Running the file a second time is safe; it skips anything that already exists.

## Rules of the lab

- Edit the JSON files, not `app.js`. If the page says a file "is not valid JSON," look for a missing comma or quote.
- Everything your team does with other teams goes through this repo: messages, orders, invoices, shipments. If it isn't in the repo, it didn't happen.
- Add every teammate as a collaborator: **Settings → Collaborators**.

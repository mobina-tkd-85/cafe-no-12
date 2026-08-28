# Cafe Menu

A single-page cafe menu site with a password-protected admin panel for managing
categories and items. Plain HTML/CSS/JavaScript — no build step, no framework.

- **Public site**: `index.html` — logo, horizontal category nav, vertical menu.
- **Admin panel**: `admin/index.html` (served at `/admin` once deployed) —
  add/delete categories and items, upload images.
- **Backend**: [Supabase](https://supabase.com) — Postgres database for menu
  data, Storage for images, Auth for the admin login. Free tier, no credit
  card required.
- **Hosting**: Netlify, deployed automatically from a GitHub repo.

---

## 1. Add your logo

Drop your logo file into the project root and name it exactly `logo.png`.
If it's missing, the site falls back to showing the text "Your Cafe" so
nothing breaks — but add the real file before you launch.

---

## 2. Set up Supabase

### 2.1 Create the project
1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign
   up (GitHub sign-in is fastest) — no card needed.
2. Click **New project**. Pick an organisation, name it (e.g. `cafe-menu`),
   set a database password (save it somewhere, you likely won't need it again),
   choose a region close to your customers, and create it. It takes a minute
   or two to provision.

### 2.2 Create the database tables and policies
1. In the left sidebar, open **SQL Editor** → **New query**.
2. Open `schema.sql` from this project, copy its entire contents, paste it
   into the query editor, and click **Run**.
3. This creates the `categories` and `items` tables, turns on Row Level
   Security (public read, admin-only write), and sets up matching Storage
   policies.

### 2.3 Create the Storage buckets
1. In the sidebar, open **Storage** → **New bucket**.
2. Create a bucket named exactly `category-logos`. Toggle **Public bucket**
   on when creating it.
3. Repeat for a second bucket named exactly `menu-items`, also **Public**.
4. The policies from `schema.sql` already cover both buckets — you don't need
   to add anything else here.

### 2.4 Create your admin login
1. In the sidebar, open **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. Enter the email and password you (the cafe owner/admin) will use to sign
   into `/admin`. Untick "Auto confirm user" only if you want to verify by
   email first — for a single admin account, leaving it ticked (confirmed
   immediately) is simplest.
3. This should be the only account you create — there's no public sign-up
   form in the admin panel, by design.

### 2.5 Copy your project credentials
1. In the sidebar, open **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. Paste both into `js/supabase-config.js` in this project, replacing the
   placeholders.

   This key is safe to commit to a public GitHub repo — it identifies your
   project and is designed to be used from the browser. Your data is
   protected by the Row Level Security policies from `schema.sql`, not by
   hiding this file.

That's it for Supabase — no server code to deploy, the site talks to Supabase
directly from the browser using the policies above to control access.

---

## 3. Push to GitHub

From the project folder:

```bash
cd cafe
git init
git add .
git commit -m "Initial cafe menu site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

(Create the empty repo on GitHub first via **github.com → New repository**,
without a README/gitignore so it doesn't conflict with this push.)

If you're migrating an existing repo from an earlier Firebase version of this
project, just commit the updated files (`git add .`, `git commit -m "Migrate
to Supabase"`, `git push`) instead of starting a new repo.

---

## 4. Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Connect GitHub and pick your repository.
3. Build settings: leave the build command blank (or `echo "no build"`), leave
   **Base directory** empty, and set the publish directory to `.` — `netlify.toml`
   in this project already configures this for you, so the defaults should work.
4. Click **Deploy**. Netlify will give you a live URL immediately.
5. From then on, every `git push` to `main` triggers an automatic redeploy.

Your admin panel is now live at `https://your-site.netlify.app/admin`.

### Optional: custom domain
In Netlify: **Site configuration → Domain management → Add a domain**, then
follow the DNS instructions for your domain registrar.

---

## 5. Using the admin panel

1. Visit `/admin` on your live site.
2. Sign in with the email/password you created in Supabase (step 2.4).
3. **Add a category** first (e.g. "Hot Drinks", "Breakfast", "Cakes") — optionally
   upload a small square icon image for it.
4. **Add items**, choosing which category each belongs to, with a name, price
   in £, optional photo, and optional description.
5. Changes save straight to Supabase and appear on the public site immediately
   (just refresh the page — no redeploy needed, since menu content lives in
   the database, not in the static files).

To delete a category, its items are deleted too (you'll get a warning first).

---

## Project structure

```
cafe/
├── index.html              # Public menu page
├── logo.png                # Your logo (add this yourself)
├── admin/
│   ├── index.html          # Admin panel page
│   └── admin.js             # Admin panel logic (auth, CRUD, uploads)
├── css/
│   ├── styles.css           # Public site styles
│   └── admin.css            # Admin panel styles
├── js/
│   ├── app.js                # Public site logic (loads + renders menu)
│   ├── supabase-init.js      # Shared Supabase client initialization
│   └── supabase-config.js    # Your Supabase project credentials (edit this)
├── schema.sql                 # Database tables, RLS policies, Storage policies
├── netlify.toml                # Netlify build/deploy configuration
└── README.md
```

## Notes & troubleshooting

- **"new row violates row-level security policy" in the admin panel**: you're
  not signed in, or `schema.sql` hasn't been run yet — re-check step 2.2.
- **Images not showing**: make sure both Storage buckets exist, are named
  exactly `category-logos` and `menu-items`, and are marked **Public**.
- **Changing the admin password**: Supabase Dashboard → Authentication → Users →
  select the user → reset password, or delete and recreate the user.
- **Adding a second admin**: add another user under Authentication → Users;
  the policies already allow any signed-in user to manage the menu.
- **Logo/images not updating after you change them**: this is browser
  caching, not a bug — hard refresh (Ctrl/Cmd+Shift+R) or open in a private
  window to confirm the new file is actually live. For the site logo
  specifically, renaming the file each time you update it (e.g. `logo-v2.png`,
  updating the `src` in `index.html` to match) avoids this entirely.

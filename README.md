# Cafe Menu

A single-page cafe menu site with a password-protected admin panel for managing
categories and items. Plain HTML/CSS/JavaScript — no build step, no framework.

- **Public site**: `index.html` — logo, horizontal category nav, vertical menu.
- **Admin panel**: `admin/index.html` (served at `/admin` once deployed) —
  add/delete categories and items, upload images.
- **Backend**: Firebase (Firestore for data, Storage for images, Authentication
  for the admin login).
- **Hosting**: Netlify, deployed automatically from a GitHub repo.

---

## 1. Add your logo

Drop your logo file into the project root and name it exactly `logo.png`.
If it's missing, the site falls back to showing the text "Your Cafe" so
nothing breaks — but add the real file before you launch.

---

## 2. Set up Firebase

### 2.1 Create the project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Name it (e.g. `my-cafe-menu`) and finish the wizard (Google Analytics is optional, you can skip it).

### 2.2 Register a web app
1. In the project, click the **`</>`** (web) icon to add a web app.
2. Give it a nickname (e.g. "Cafe Menu Web"). You don't need Firebase Hosting.
3. Copy the `firebaseConfig` object shown on screen.
4. Paste those values into `js/firebase-config.js` in this project, replacing the placeholders.

   This config is safe to commit to a public GitHub repo — it identifies your
   project but isn't a secret. Your data is protected by the security rules
   below, not by hiding this file.

### 2.3 Enable Firestore
1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose a location close to your customers, and start in **production mode**.
3. Once created, go to the **Rules** tab and replace the contents with the
   contents of `firestore.rules` from this project, then **Publish**.

### 2.4 Enable Storage
1. **Build → Storage → Get started**. Use the default bucket, production mode.
2. Go to the **Rules** tab and replace the contents with `storage.rules` from
   this project, then **Publish**.

### 2.5 Enable Authentication (for admin login)
1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab → **Add user**. Enter the email and password you
   (the cafe owner/admin) will use to log into `/admin`. This is the only
   account that should exist — there's no public sign-up, by design.

That's it for Firebase — no server code to deploy, the site talks to Firebase
directly from the browser using the rules above to control access.

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

---

## 4. Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Connect GitHub and pick your repository.
3. Build settings: leave the build command blank (or `echo "no build"`) and
   set the publish directory to `.` (the repo root) — `netlify.toml` in this
   project already configures this for you, so the defaults should work.
4. Click **Deploy**. Netlify will give you a live URL immediately.
5. From then on, every `git push` to `main` triggers an automatic redeploy.

Your admin panel is now live at `https://your-site.netlify.app/admin`.

### Optional: custom domain
In Netlify: **Site configuration → Domain management → Add a domain**, then
follow the DNS instructions for your domain registrar.

---

## 5. Using the admin panel

1. Visit `/admin` on your live site.
2. Sign in with the email/password you created in Firebase Authentication (step 2.5).
3. **Add a category** first (e.g. "Hot Drinks", "Breakfast", "Cakes") — optionally
   upload a small square icon image for it.
4. **Add items**, choosing which category each belongs to, with a name, price
   in £, optional photo, and optional description.
5. Changes save straight to Firebase and appear on the public site immediately
   (just refresh the page — no redeploy needed, since menu content lives in
   Firestore, not in the static files).

To delete a category, its items are deleted too (you'll get a warning first).

---

## Project structure

```
cafe/
├── index.html            # Public menu page
├── logo.png              # Your logo (add this yourself)
├── admin/
│   ├── index.html        # Admin panel page
│   └── admin.js          # Admin panel logic (auth, CRUD, uploads)
├── css/
│   ├── styles.css        # Public site styles
│   └── admin.css         # Admin panel styles
├── js/
│   ├── app.js             # Public site logic (loads + renders menu)
│   ├── firebase-init.js   # Shared Firebase initialization
│   └── firebase-config.js # Your Firebase project credentials (edit this)
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── netlify.toml           # Netlify build/deploy configuration
└── README.md
```

## Notes & troubleshooting

- **"Missing or insufficient permissions" in the admin panel**: the Firestore
  or Storage rules haven't been published yet, or you're not signed in.
- **Images not showing**: check the Storage rules are published, and that the
  uploaded file is under 5MB and an actual image type.
- **Changing the admin password**: Firebase Console → Authentication → Users →
  select the user → reset password, or delete and recreate the user.
- **Adding a second admin**: add another user under Authentication → Users;
  the rules already allow any signed-in user to manage the menu.

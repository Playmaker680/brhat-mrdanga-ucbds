# Bṛhat Mṛdaṅga Database

The club's member roster, for one or more schools: people, club meetings, attendance, talks, prasadam, team notes and sadhana check-ins.
It runs as a plain website (hosted free on GitHub Pages). Logins and data live in **Firebase**, Google's app backend.
Only Google accounts on the team's access list can sign in.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The app itself: every screen, the design, the logic |
| `app-firebase.js` | Connects the app to Firebase (Google sign-in, database, access check) |
| `firebase-config.js` | Your Firebase project's settings. You fill this in once. |
| `firestore.rules` | Database security rules. Only people on the access list can read or write. |
| `firebase.json` | Only used if you later deploy with the Firebase command-line tool. Safe to ignore. |

---

## One-time setup (about 30–45 minutes, no coding)

Use the Google account that should **own** the club's data, ideally a shared club account rather than a personal one.

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> and click **Create a project**.
2. Name it, e.g. `brhat-mrdanga`. You can turn Google Analytics **off**.
3. Leave it on the free **Spark** plan. Don't add billing.

### 2. Turn on Google sign-in and the database
1. In the left menu, open **Build → Authentication → Get started**. Under **Sign-in method**, enable **Google** and pick a support email, then **Save**.
2. Open **Build → Firestore Database → Create database**. Choose a location close to you (e.g. `us-west2`) and start in **production mode**.
3. In Firestore, open the **Rules** tab. Delete what's there, paste the entire contents of `firestore.rules`, and click **Publish**.

### 3. Connect the app to your project
1. Click the gear icon → **Project settings**. Under **Your apps**, click the **web icon `</>`**.
2. Give it a nickname (e.g. `roster-web`). Don't tick Firebase Hosting. Click **Register app**.
3. Firebase shows a `firebaseConfig = { ... }` block. Copy the values into `firebase-config.js`, replacing the placeholder lines.

### 4. Make yourself the first admin
The app only lets in people on the access list, so the first person has to be added by hand.
1. In **Firestore Database → Data**, click **Start collection**. Collection ID: `members`.
2. Document ID: **your Google email in lowercase** (e.g. `raja.budaraju@gmail.com`).
3. Add one field: name `admin`, type **boolean**, value **true**. Click **Save**.

From now on you add everyone else from inside the app (**View Our Team → Who can sign in**).

### 5. Put the code on GitHub
1. Create an account at <https://github.com> if you don't have one.
2. Click **+ → New repository**. Name it `brhat-mrdanga-database`. Choose **Public** (needed for free GitHub Pages; your *data* stays private in Firebase, only the code is visible). Click **Create repository**.
3. On the new repo page click **uploading an existing file**, drag in all the files from this folder, and click **Commit changes**.

### 6. Turn on the website
1. In the repo, go to **Settings → Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
2. After a minute or two the page shows your site's address, like `https://YOUR-USERNAME.github.io/brhat-mrdanga-database/`.

### 7. Allow sign-in from that address
1. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain**.
2. Add `YOUR-USERNAME.github.io` (just the domain, no `https://` and no path).

### 8. Sign in and invite the team
1. Open your site and click **Sign in with Google** using the email from step 4.
2. Go to **View Our Team → Who can sign in** and add each teammate's Google email. Tick **Admin** for anyone who should also manage access.
3. Send them the site link. They sign in with Google and appear under Our Team, where they set the name shown on their notes.

---

## Schools (multi-campus)

Each school has its own students, meetings, message logs and team, stored under `schools/<schoolId>/` in Firestore.
Team members only see the schools they work at; admins can open every school.

- **First sign-in:** everyone picks their name, role and the school(s) they work with.
- **Switching:** tap the school name at the top left.
- **Admins:** More → Schools to create or rename schools, add someone to a school, or remove them (removed people can't rejoin that school on their own until an admin taps "Allow back").

### One-time upgrade from the single-school version
1. Firebase console → Firestore Database → **Rules**: paste the new `firestore.rules`, then **Publish**.
2. Upload the new `index.html`, `app-firebase.js`, `firestore.rules` and `README.md` to GitHub.
3. An admin opens the site. It shows **Set up schools**: keep the name "UC Berkeley" and tap **Create school and move my data**. Keep the page open until it finishes (under a minute).
4. Everyone already on the team is added to UC Berkeley automatically. New teammates choose their school when they first sign in.

## Making changes later (with Claude)

**Easiest:** start a chat with Claude, connect it to your GitHub repo (`brhat-mrdanga-database`), and describe the change. Claude edits the files and pushes them; GitHub Pages republishes the site within a couple of minutes.

**Without connecting GitHub:** attach `index.html` (and any other file you want changed) to a chat, describe the change, and upload the updated file back to the repo with **Add file → Upload files**.

Data is never in these files, so updating the code never touches your records.

## Free tier: what to expect

- The free Spark plan includes a daily allowance of database reads and writes. A club roster with a handful of team members uses a small fraction of it.
- If a limit is ever hit, Firebase **pauses** that service until the allowance resets. It does **not** charge you on the Spark plan.
- If the club grows a lot, you can upgrade to the pay-as-you-go **Blaze** plan. It keeps the same free allowance and only bills usage beyond it. Set a **budget alert** (e.g. $1) in Google Cloud billing so nothing is a surprise.
- Check usage any time in **Firestore Database → Usage**.

## Backups

In Firebase, you can export data with **Firestore → Import/Export** (needs Blaze), or use the app's **View Insights → Export roster (CSV)** for a spreadsheet of everyone.

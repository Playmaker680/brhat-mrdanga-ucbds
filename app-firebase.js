// Connects the app to Firebase: Google sign-in, the team access list, and the Firestore database.
// The app (index.html) talks to the small adapter below, so app code and this file can change independently.
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const card = document.getElementById("gateCard");
const CLUB = "Bṛhat Mṛdaṅga Database";
const GOOGLE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

function gate(html){
  document.getElementById("gate").hidden = false;
  document.querySelector("header").hidden = true;
  document.getElementById("main").hidden = true;
  card.innerHTML = html;
}

if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("PASTE")) {
  gate(`<img class="logo" src="logo.jpg" alt=""><h1>${CLUB}</h1><p>Almost there. Paste your Firebase settings into <b>firebase-config.js</b> (step 3 of the setup guide), then reload this page.</p>`);
  throw new Error("firebase-config.js is not filled in yet");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Keep a copy of the data on the device so check-ins and notes still save with no signal.
let fs;
try { fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { fs = getFirestore(app); }
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// WhatsApp, Instagram, Messenger etc. open links in their own mini-browser, where Google sign-in can't finish.
const UA = navigator.userAgent || "";
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Snapchat|MicroMessenger|GSA\/|LinkedInApp|Twitter/i.test(UA)
  || (/iPhone|iPad|iPod/.test(UA) && !/Safari\//.test(UA))
  || /; wv\)/.test(UA);
function showOpenInBrowser(note){
  const ios = /iPhone|iPad|iPod/.test(UA);
  gate(`<img class="logo" src="logo.jpg" alt=""><h1>${CLUB}</h1>
    <p style="margin:0;font-weight:700">Open this page in ${ios ? "Safari" : "Chrome"} to sign in.</p>
    <p class="muted" style="margin:0">${note || "You opened the link inside another app (like WhatsApp or Instagram), and Google sign-in doesn't work there."}</p>
    <ol style="text-align:left;margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px">
      <li>Tap <b>Copy link</b> below.</li>
      <li>Open <b>${ios ? "Safari" : "Chrome"}</b>, paste it in the address bar, and go.</li>
      <li>Tip: once signed in, use <b>Share → Add to Home Screen</b> so it opens like an app.</li>
    </ol>
    <button class="btn primary block" id="copyLink">Copy link</button>
    <p id="linkTxt" style="margin:0;font-size:.85rem;word-break:break-all;user-select:all;color:var(--muted)">${location.href.split("#")[0].replace(/[<>"]/g,"")}</p>
    <button class="btn block" id="tryAnyway">Try signing in here anyway</button>`);
  document.getElementById("copyLink").onclick = async () => {
    try { await navigator.clipboard.writeText(location.href.split("#")[0]); document.getElementById("copyLink").textContent = "Copied ✓"; }
    catch (e) { const r = document.createRange(); r.selectNodeContents(document.getElementById("linkTxt")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  };
  document.getElementById("tryAnyway").onclick = () => showSignIn("", true);
}
function showSignIn(message, forced){
  if (IN_APP && !forced) { showOpenInBrowser(); return; }
  gate(`<img class="logo" src="logo.jpg" alt=""><h1>${CLUB}</h1>
    <p class="muted" style="margin:0">Hare Kṛṣṇa. Sign in with the Google account your team added.</p>
    ${message ? `<p style="margin:0;color:var(--alert)">${message}</p>` : ""}
    <button class="btn primary block gbtn" id="signIn"><span style="background:#fff;border-radius:50%;padding:3px;display:inline-flex">${GOOGLE}</span>Sign in with Google</button>`);
  document.getElementById("signIn").onclick = async () => {
    try { await signInWithPopup(auth, provider); }
    catch (e) {
      if (["auth/operation-not-supported-in-this-environment","auth/web-storage-unsupported","auth/popup-blocked","auth/internal-error"].includes(e.code)) showOpenInBrowser("Sign-in couldn't finish in this browser.");
      else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") showSignIn("Sign-in didn't finish. Please try again.", true);
    }
  };
}

// Firestore errors -> the error codes the app already understands
function mapErr(e){
  const c = e && e.code;
  if (c === "permission-denied" || c === "invalid-argument") return { code: "invalid_argument", message: e.message };
  if (c === "resource-exhausted") return { code: "quota_exceeded", message: e.message };
  return { code: "unavailable", message: (e && e.message) || "Unavailable" };
}
// {att:{p1:true}} becomes {"att.p1":true} so only that one entry changes, never the whole map
const isPlain = v => v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + "." + k : k;
    if (isPlain(v) && Object.keys(v).length) flatten(v, key, out); else out[key] = v;
  }
  return out;
}
const wrap = d => ({ id: d.id, exists: d.exists(), data: () => d.data() });
const guard = p => p.catch(e => { throw mapErr(e); });
// Offline, writes are saved on the device and sent later, so don't wait for the server.
// Saves show on screen straight away (Firestore applies them locally first). We wait briefly for the
// server so a refused change is reported right away, but never leave the screen hanging on slow Wi-Fi:
// after 2.5 seconds the save carries on in the background, and a late failure is reported as a toast.
const late = e => { try { window.__lateWriteError && window.__lateWriteError(mapErr(e)); } catch (x) {} };
const guardW = p => {
  if (!navigator.onLine) { p.catch(late); return Promise.resolve(); }
  let slow = false;
  const timer = new Promise(r => setTimeout(() => { slow = true; r(); }, 2500));
  return Promise.race([p.then(() => {}), timer]).then(() => { if (slow) p.catch(late); }, e => { throw mapErr(e); });
};

function docRef(path){
  const d = doc(fs, path);
  return {
    id: d.id, path,
    get: () => guard(getDoc(d)).then(wrap),
    set: data => guardW(setDoc(d, data)),
    update: data => guardW(updateDoc(d, flatten(data))),
    delete: () => guardW(deleteDoc(d)),
    onSnapshot: (next, err) => onSnapshot(d, s => next(wrap(s)), e => err && err(mapErr(e))),
    collection: sub => colRef(path + "/" + sub)
  };
}
function queryRef(q){
  return {
    get: () => guard(getDocs(q)).then(s => ({ docs: s.docs.map(wrap), size: s.size, empty: s.empty })),
    onSnapshot: (next, err) => onSnapshot(q, s => next({ docs: s.docs.map(wrap), size: s.size, empty: s.empty }), e => err && err(mapErr(e)))
  };
}
function colRef(path){
  const c = collection(fs, path);
  return {
    path,
    ...queryRef(c),
    where: (field, op, value) => queryRef(query(c, where(field, op, value))),
    doc: id => id ? docRef(path + "/" + id) : docRef(doc(c).path),
    add: data => { const r = doc(c); return guardW(setDoc(r, data)).then(() => docRef(r.path)); }
  };
}
const db = { doc: docRef, collection: colRef };

function userApi(u){
  const me = { id: u.uid, name: u.displayName || "", avatarUrl: u.photoURL || "", email: u.email || null, isOwner: false, canEdit: true, color: "#1d5a86" };
  return {
    me: async () => me, id: async () => me.id, name: async () => me.name,
    can: async () => true, canEdit: async () => true, isOwner: async () => false,
    profiles: async ids => Object.fromEntries([].concat(ids).map(id => [id, { id, name: id === me.id ? me.name : "", avatarUrl: "", guest: false, isMe: id === me.id }])),
    search: async () => []
  };
}
const downloads = {
  save: async ({ filename, data }) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
};

let started = false;
onAuthStateChanged(auth, async u => {
  if (!u) { if (started) location.reload(); else showSignIn(); return; }
  if (started) return;
  const email = (u.email || "").toLowerCase();
  let member;
  try { member = await getDoc(doc(fs, "members/" + email)); }
  catch (e) {
    if (!navigator.onLine) { gate(`<img class="logo" src="logo.jpg" alt=""><h1>${CLUB}</h1><p style="margin:0">You're offline. Connect to the internet once to finish signing in.</p><button class="btn block" onclick="location.reload()">Try again</button>`); return; }
    member = null;
  }
  if (!member || !member.exists()) {
    gate(`<img class="logo" src="logo.jpg" alt=""><h1>${CLUB}</h1><p style="margin:0">The account <b>${email.replace(/[<>&"]/g, "")}</b> isn't on the team list yet.</p>
      <p class="muted" style="margin:0">Ask an admin to add this Google email under Our Team, then sign in again.</p>
      <button class="btn block" id="out">Use a different account</button>`);
    document.getElementById("out").onclick = () => signOut(auth);
    return;
  }
  started = true;
  window.FB = { email, isAdmin: member.data().admin === true, role: member.data().role || "", signOut: () => signOut(auth) };
  window.claude = { use: async name => ({ db, user: userApi(u), downloads })[name] || null };
  document.getElementById("gate").hidden = true;
  document.querySelector("header").hidden = false;
  document.getElementById("main").hidden = false;
  window.startApp();
});

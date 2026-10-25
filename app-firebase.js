// Connects the app to Firebase: Google sign-in, the team access list, and the Firestore database.
// The app (index.html) talks to the small adapter below, so app code and this file can change independently.
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
  gate(`<h1>${CLUB}</h1><p>Almost there. Paste your Firebase settings into <b>firebase-config.js</b> (step 3 of the setup guide), then reload this page.</p>`);
  throw new Error("firebase-config.js is not filled in yet");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fs = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function showSignIn(message){
  gate(`<h1>${CLUB}</h1>
    <p class="muted" style="margin:0">Hare Kṛṣṇa. Sign in with the Google account your team added.</p>
    ${message ? `<p style="margin:0;color:var(--alert)">${message}</p>` : ""}
    <button class="btn primary block gbtn" id="signIn"><span style="background:#fff;border-radius:50%;padding:3px;display:inline-flex">${GOOGLE}</span>Sign in with Google</button>`);
  document.getElementById("signIn").onclick = async () => {
    try { await signInWithPopup(auth, provider); }
    catch (e) { if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") showSignIn("Sign-in didn't finish. Please try again."); }
  };
}

// Firestore errors -> the error codes the app already understands
function mapErr(e){
  const c = e && e.code;
  if (c === "permission-denied" || c === "invalid-argument" || c === "failed-precondition") return { code: "invalid_argument", message: e.message };
  if (c === "resource-exhausted") return { code: "quota_exceeded", message: e.message };
  return { code: "unavailable", message: (e && e.message) || "Unavailable" };
}
const wrap = d => ({ id: d.id, exists: d.exists(), data: () => d.data() });
const guard = p => p.catch(e => { throw mapErr(e); });

function docRef(path){
  const d = doc(fs, path);
  return {
    id: d.id, path,
    get: () => guard(getDoc(d)).then(wrap),
    set: data => guard(setDoc(d, data)),
    update: data => guard(updateDoc(d, data)),
    delete: () => guard(deleteDoc(d)),
    onSnapshot: (next, err) => onSnapshot(d, s => next(wrap(s)), e => err && err(mapErr(e))),
    collection: sub => colRef(path + "/" + sub)
  };
}
function colRef(path){
  const c = collection(fs, path);
  return {
    path,
    doc: id => id ? docRef(path + "/" + id) : docRef(doc(c).path),
    add: data => guard(addDoc(c, data)).then(r => docRef(r.path)),
    onSnapshot: (next, err) => onSnapshot(c, s => next({ docs: s.docs.map(wrap), size: s.size, empty: s.empty }), e => err && err(mapErr(e)))
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
  catch (e) { member = null; }
  if (!member || !member.exists()) {
    gate(`<h1>${CLUB}</h1><p style="margin:0">The account <b>${email.replace(/[<>&"]/g, "")}</b> isn't on the team list yet.</p>
      <p class="muted" style="margin:0">Ask an admin to add this Google email under Our Team, then sign in again.</p>
      <button class="btn block" id="out">Use a different account</button>`);
    document.getElementById("out").onclick = () => signOut(auth);
    return;
  }
  started = true;
  window.FB = { email, isAdmin: member.data().admin === true, signOut: () => signOut(auth) };
  window.claude = { use: async name => ({ db, user: userApi(u), downloads })[name] || null };
  document.getElementById("gate").hidden = true;
  document.querySelector("header").hidden = false;
  document.getElementById("main").hidden = false;
  window.startApp();
});

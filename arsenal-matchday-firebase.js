import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { collection, doc, getFirestore, onSnapshot, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

function configured(config) {
  return Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

function waitForUser(auth) {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) { unsubscribe(); resolve(user); }
    }, reject);
  });
}

function aggregate(snapshot) {
  const totals = {};
  const counts = {};
  const momVotes = {};
  snapshot.forEach(vote => {
    const data = vote.data();
    Object.entries(data.ratings || {}).forEach(([player, score]) => {
      if (typeof score !== "number") return;
      totals[player] = (totals[player] || 0) + score;
      counts[player] = (counts[player] || 0) + 1;
    });
    if (data.mom) momVotes[data.mom] = (momVotes[data.mom] || 0) + 1;
  });
  const ratings = Object.fromEntries(Object.keys(totals).map(player => [player, totals[player] / counts[player]]));
  return { voteCount: snapshot.size, ratings, momVotes };
}

export async function connectFanVoting({ fixtureId, playerNames, onResults, onStatus }) {
  const config = window.GOONER_FIREBASE_CONFIG;
  if (!configured(config)) {
    onStatus("local");
    return null;
  }

  try {
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (!auth.currentUser) await signInAnonymously(auth);
    const user = auth.currentUser || await waitForUser(auth);
    const votes = collection(db, "matches", fixtureId, "votes");
    onSnapshot(votes, snapshot => onResults(aggregate(snapshot)), () => onStatus("error"));
    onStatus("connected");

    return {
      async submit({ ratings, mom }) {
        const allowedRatings = Object.fromEntries(Object.entries(ratings).filter(([name, score]) => playerNames.includes(name) && score >= 1 && score <= 10));
        await setDoc(doc(votes, user.uid), {
          ratings: allowedRatings,
          mom,
          fixtureId,
          updatedAt: serverTimestamp()
        });
      }
    };
  } catch (error) {
    console.error("Firebase voting connection failed", error);
    onStatus("error");
    return null;
  }
}

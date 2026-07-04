import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { collection, doc, getFirestore, onSnapshot, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

function configured(config) { return Boolean(config?.apiKey && config?.authDomain && config?.projectId && config?.appId); }
function waitForUser(auth) { return new Promise((resolve,reject)=>{const stop=onAuthStateChanged(auth,user=>{if(user){stop();resolve(user);}},reject);}); }

export async function connectPredictionSharing({ seasonId = "2026-27", onPredictions, onStatus }) {
  const config = window.GOONER_FIREBASE_CONFIG;
  if (!configured(config)) { onStatus?.("local"); return null; }
  try {
    const app = getApps().length ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (!auth.currentUser) await signInAnonymously(auth);
    const user = auth.currentUser || await waitForUser(auth);
    const predictions = collection(db, "seasons", seasonId, "predictions");
    if (onPredictions) onSnapshot(predictions,snapshot=>onPredictions(snapshot.docs.map(item=>({id:item.id,...item.data(),isMine:item.data().userId===user.uid}))),()=>onStatus?.("error"));
    onStatus?.("connected");
    return {
      async submit(prediction) {
        const documentId = `${user.uid}__${prediction.fixtureId}`;
        await setDoc(doc(predictions,documentId),{
          userId:user.uid,
          nickname:prediction.nickname.slice(0,20),
          fixtureId:prediction.fixtureId,
          fixtureDate:prediction.fixtureDate,
          competition:prediction.competition,
          opponent:prediction.opponent,
          arsenalScore:Number(prediction.arsenalScore),
          opponentScore:Number(prediction.opponentScore),
          comment:prediction.comment.slice(0,120),
          submittedAt:serverTimestamp()
        });
      }
    };
  } catch(error) { console.error("Prediction sharing failed",error);onStatus?.("error");return null; }
}

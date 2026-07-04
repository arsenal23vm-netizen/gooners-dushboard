import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, getFirestore, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

function waitForUser(auth){return new Promise((resolve,reject)=>{const stop=onAuthStateChanged(auth,user=>{if(user){stop();resolve(user);}},reject);});}
function aggregate(snapshot){const momVotes={};snapshot.forEach(item=>{const mom=item.data().mom;if(mom)momVotes[mom]=(momVotes[mom]||0)+1;});return{totalVotes:snapshot.size,momVotes};}

export async function connectMvpVoting(){
  const config=window.GOONER_FIREBASE_CONFIG;
  if(!config?.apiKey||!config?.projectId||!config?.appId)return null;
  const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app);
  if(!auth.currentUser)await signInAnonymously(auth);
  const user=auth.currentUser||await waitForUser(auth);
  return{
    async load(fixtureId){return aggregate(await getDocs(collection(db,"matches",fixtureId,"votes")));},
    async submit(fixtureId,mom){const votes=collection(db,"matches",fixtureId,"votes"),voteRef=doc(votes,user.uid),existing=await getDoc(voteRef);await setDoc(voteRef,{ratings:existing.data()?.ratings||{},mom,fixtureId,updatedAt:serverTimestamp()});}
  };
}

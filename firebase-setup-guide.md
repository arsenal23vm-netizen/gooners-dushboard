# Firebase共有投票の設定

このサイトはFirebase未設定でも端末内投票として動きます。以下を設定すると、全来訪者の採点とMOM票を共有集計します。

## 1. プロジェクトとWebアプリを作る

1. https://console.firebase.google.com/ を開き、「プロジェクトを作成」を選びます。
2. プロジェクト名を `gooners-dushboard` などにします。Google Analyticsは任意です。
3. プロジェクト概要の `</>` を選び、Webアプリを登録します。
4. 表示された `firebaseConfig` の各値を `firebase-config.js` に入力します。

## 2. 匿名認証を有効にする

1. Firebase Consoleの「構築」>「Authentication」>「始める」を開きます。
2. 「Sign-in method」から「匿名」を有効にします。

## 3. Cloud Firestoreを作る

1. 「構築」>「Firestore Database」>「データベースの作成」を開きます。
2. ロケーションを選択し、データベースを作成します。無料枠で使うデータベースは1プロジェクトにつき1つです。
3. 「ルール」タブを開き、`firestore.rules` の全文を貼り付けて「公開」を押します。
4. テストモードの開放ルールは使用しないでください。

## 4. 公開する

`firebase-config.js` をGitHubへpushすると接続が有効になります。FirebaseのWeb設定値はクライアント公開用ですが、サービスアカウント秘密鍵は絶対に置かないでください。

公開後、異なるブラウザから投票し、「みんなの集計」の票数が増えることを確認します。Firebase ConsoleのFirestore使用量も定期的に確認してください。

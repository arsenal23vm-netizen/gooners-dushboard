# 記事の投稿方法

## 管理画面を開く

ローカルサーバーを起動します。

```powershell
python -m http.server 8000
```

管理画面を開きます。

```text
http://localhost:8000/arsenal-admin.html
```

## 記事を作る

1. `新規記事`を押す。
2. タイトル、スラッグ、概要、本文、出典を入力する。
3. `記事を保存`を押す。
4. 必要に応じてプレビューする。
5. `JSONを書き出す`を押す。

## 公開する

書き出した `arsenal-articles.json` で、プロジェクト内の同名ファイルを置き換えます。

```powershell
git add arsenal-articles.json
git commit -m "Publish new Arsenal article"
git push origin main
```

GitHub Pages反映後、記事一覧に表示されます。

## 注意

- `arsenal-admin.html` は公開サイト上でもURLを知れば開けますが、サーバーへ直接保存できません。
- GitHubトークンやパスワードを管理画面へ埋め込まないでください。
- 記事には出典URLを付け、転載ではなく独自の要約・分析を書いてください。

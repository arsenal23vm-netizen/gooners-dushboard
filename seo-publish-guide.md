# 検索結果に出すための公開手順

ローカルファイルはGoogleなどの検索結果には出ません。検索に出すには、サイトをインターネット上に公開する必要があります。

## 1. 公開する

無料なら次のどれかが使いやすいです。

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel

公開後、たとえば次のようなURLができます。

```text
https://your-name.github.io/your-repo/arsenal.html
```

## 2. sitemapを作る

`sitemap.template.xml` をコピーして `sitemap.xml` にします。

`https://YOUR_PUBLIC_DOMAIN` を実際の公開URLに置き換えます。

例:

```xml
<loc>https://your-name.github.io/your-repo/arsenal.html</loc>
```

## 3. robots.txtにsitemapを追記する

公開URLが決まったら `robots.txt` に次を足します。

```text
Sitemap: https://your-name.github.io/your-repo/sitemap.xml
```

## 4. Google Search Consoleに登録する

Google Search Consoleで公開URLを登録します。

```text
https://search.google.com/search-console
```

登録後、URL検査で `arsenal.html` を送信し、`sitemap.xml` も送信します。

## 5. 待つ

検索結果への反映は即時ではありません。数日から数週間かかることがあります。

確認するときはGoogleで次のように検索します。

```text
site:your-name.github.io/your-repo
```

## 注意

検索順位は保証できません。Google公式ドキュメントでも、公開やSEO対応をしても必ずインデックスされる保証はないと説明されています。まずは公開URL、分かりやすいタイトル、説明文、内部リンク、sitemap、Search Console登録を揃えるのが最初の一歩です。

# 広告収益化の手順

## できること

このサイトは静的HTMLなので、Google AdSenseなどの広告タグを設置できます。
ただし、実際に収益化するには広告ネットワークの審査と承認が必要です。

## 1. まずサイトを公開する

GitHub Pagesで公開URLが使える状態にします。

```text
https://arsenal23vm-netizen.github.io/gooners-dushboard/
```

## 2. AdSenseに申し込む

Google AdSenseでサイトを登録します。

```text
https://adsense.google.com/
```

Google公式の主な条件:

- 独自性のあるコンテンツがある
- AdSenseポリシーに準拠している
- 申請者が18歳以上
- サイトのHTMLソースを編集できる

## 3. 審査用コードを入れる

AdSenseから発行されるコードの `ca-pub-...` を `ads-config.js` に入れます。

```js
window.GOONER_ADS = {
  enabled: true,
  provider: "adsense",
  adsenseClient: "ca-pub-あなたのID",
  slots: {
    "dashboard-bottom": "0000000000",
    "timeline-bottom": "0000000000"
  }
};
```

審査用コードだけでよい段階では、スロットIDはまだ仮でも構いません。

## 4. 広告ユニット作成後にスロットIDを入れる

AdSenseでディスプレイ広告ユニットを作成すると `data-ad-slot` が発行されます。
それを `ads-config.js` に入れます。

```js
slots: {
  "dashboard-bottom": "1234567890",
  "timeline-bottom": "2345678901"
}
```

## 5. 公開する

変更後にコミットしてpushします。

```powershell
git add ads-config.js
git commit -m "Enable AdSense ads"
git push
```

## 注意

- 自分で自分の広告をクリックしてはいけません。
- 「広告をクリックして応援して」など、クリックを促す表現は禁止です。
- 広告は広告だと分かるように表示してください。
- 広告だらけのページにしないでください。
- X埋め込みや外部コンテンツが多いページは、審査で不利になることがあります。必要なら記事ページや説明コンテンツを増やしてください。

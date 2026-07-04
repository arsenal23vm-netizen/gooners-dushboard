# 選手スタッツ更新方法

`arsenal-stats-data.json` の `players` に、`arsenal-x-players.json` の英字 `name` と同じキーで数値を登録します。画面の選手名は自動で日本語表示されます。

```json
"players": {
  "Bukayo Saka": {
    "appearances": 1,
    "starts": 1,
    "minutes": 90,
    "distanceKm": 10.4,
    "goals": 1,
    "assists": 0,
    "keyPasses": 3,
    "chancesCreated": 4,
    "duelsWon": 6
  }
}
```

入力していない項目は自動的に0になります。小数を使える項目は走行距離、xG、xA、各種成功率です。データ提供元の利用条件を確認し、異なる提供元の定義を混在させないでください。

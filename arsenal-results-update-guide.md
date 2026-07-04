# 試合結果と予想ポイントの更新

試合終了後、`arsenal-results-data.json` の `results` に結果を追加します。追加すると予想ページが自動採点されます。

```json
{
  "date": "2026-08-01",
  "competition": "Pre-Season Friendly",
  "opponent": "Girona",
  "arsenalScore": 2,
  "opponentScore": 1,
  "status": "FT",
  "endedAt": "2026-08-01T20:00:00Z",
  "mvpPublishAt": "2026-08-02T20:00:00Z",
  "participants": ["David Raya", "William Saliba", "Bukayo Saka"]
}
```

ポイントは完全的中5点、勝敗的中3点、両チームそれぞれの得点的中1点です。完全的中時は最大7点になります。

`endedAt` は試合終了日時、`mvpPublishAt` はMVP公開日時です。MVP投票はこの2つの時刻の間だけ受け付けます。`participants` にはベンチ入りだけの選手を含めず、実際に出場した選手だけを英字 `name` で登録します。

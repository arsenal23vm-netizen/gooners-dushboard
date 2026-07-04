# 試合結果と予想ポイントの更新

試合終了後、`arsenal-results-data.json` の `results` に結果を追加します。追加すると予想ページが自動採点されます。

```json
{
  "date": "2026-08-01",
  "competition": "Pre-Season Friendly",
  "opponent": "Girona",
  "arsenalScore": 2,
  "opponentScore": 1,
  "status": "FT"
}
```

ポイントは完全的中5点、勝敗的中3点、両チームそれぞれの得点的中1点です。完全的中時は最大7点になります。

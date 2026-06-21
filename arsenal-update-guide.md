# Arsenal Dashboard 更新方法

## 見るファイル

- ページ本体: `arsenal.html`
- 表示データ: `arsenal-data.json`
- データ形式の控え: `arsenal-data.example.json`

## 表示方法

同じフォルダで簡易サーバーを起動します。

```powershell
python -m http.server 8000
```

ブラウザで開きます。

```text
http://localhost:8000/arsenal.html
```

## 更新の流れ

1. `arsenal-data.json` を開く。
2. `updatedAt` を更新日へ変える。
3. `premierLeague` の各チームの数字を更新する。
4. `championsLeague` の各クラブの数字を更新する。
5. `fixtures` の今後5試合を更新する。
6. `scorers` と `assists` のランキングを更新する。
7. ブラウザを更新する。

## プレミアリーグ順位表の項目

- `team`: チーム名
- `played`: 試合数
- `won`: 勝ち
- `drawn`: 引き分け
- `lost`: 負け
- `goalDifference`: 得失点差
- `points`: 勝ち点

順位はページ側で自動計算します。勝ち点、得失点差、チーム名の順で並びます。

## チャンピオンズリーグ表の項目

- `team`: クラブ名
- `played`: 試合数
- `goalDifference`: 得失点差
- `points`: 勝ち点

## 今後5試合の項目

- `date`: 日付。例: `2026-08-21`
- `competition`: 大会名。例: `Premier League`
- `opponent`: 対戦相手
- `venue`: `Home`、`Away`、`TBD` のいずれか
- `location`: スタジアム名や場所
- `opponentForm`: 相手の直近5戦

`opponentForm` は次の値を使います。

- `win`: 緑の丸
- `loss`: 赤の丸
- `draw`: グレーの丸
- `unknown`: グレーの丸

例:

```json
"opponentForm": ["win", "loss", "draw", "unknown", "win"]
```

## 得点者ランキング

`scorers` を更新します。

- `player`: 選手名
- `goals`: 得点数

例:

```json
{ "player": "Bukayo Saka", "goals": 12 }
```

## アシストランキング

`assists` を更新します。

- `player`: 選手名
- `assists`: アシスト数

例:

```json
{ "player": "Martin Ødegaard", "assists": 9 }
```

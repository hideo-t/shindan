# AQUA SYSTEM SJ-100 - 販売促進サイト＆浄水器必要度診断

Navy Fields LLC「AQUA SYSTEM SJ-100」非常用浄水器の販売促進ツール一式

## ファイル構成

| ファイル | 内容 |
|---|---|
| `index.html` | 販売促進LP（ランディングページ） |
| `water-diagnosis.jsx` | 浄水器必要度診断（React） |
| `consulting_proposal.pdf` | マーケティング改善提案書 |

## LP（index.html）
- 能登半島地震での実績を軸にした訴求
- 災害時の水の重要性（3段階情報セクション）
- 製品スペック・競合比較表・レビュー
- Amazon/楽天/公式サイトへの購入導線

## 浄水器必要度診断（water-diagnosis.jsx）
- 全問選択式・分岐ロジック付き（約14〜18問）
- 5セクション：家族構成→備蓄の現状→行動パターン→知識と想像力→盲点チェック
- 回答に応じた分岐質問（例：備蓄ありの人→管理方法を深掘り）
- 結果：リスクスコア（円形ゲージ）＋タイプ判定＋家族人数別必要水量＋改善アクション
- AQUA SYSTEM購入CTAへ自然に接続

## デプロイ
```bash
# GitHub Pages（LPのみ）
git push origin main
# Settings → Pages → main branch → / (root)

# 診断ツール（React）
# Claude.ai のArtifactとして利用、またはReactプロジェクトに組み込み
```

## 購買心理7段階に基づく設計

```
認知 → 興味 → 連想 → 比較 → 購買 → 利用 → 愛着
  ↓      ↓      ↓      ↓      ↓
 広告   LP情報  診断   比較表  CTA
 SNS   災害知識 動画         購入ボタン
```

---
© Navy Fields LLC / AQUA SYSTEM

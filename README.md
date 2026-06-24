# 樹章戰鬥陀螺

![樹章戰鬥陀螺封面](assets/readme-cover.png)

清新自然風格的瀏覽器小遊戲。玩家雙方各輸入三個植物名稱，每個植物會化為一顆俯視視角的「樹章陀螺」；三回合依序派出植物對決，先拿下兩勝的一方獲勝。

## 專案特色

- **3 戰兩勝制**：最多三回合，先得兩勝即提前封王。
- **植物樹章 Tree top view**：榕樹、竹子、櫻花、松樹、荷花、楓樹使用 GPT Image 生成的俯視植物素材。
- **即時預覽**：輸入植物名稱後，畫面會立即顯示植物隊伍與能力值。
- **Canvas 戰鬥動畫**：兩顆樹章陀螺會在草地競技場中旋轉、碰撞並決出勝負。
- **清新自然介面**：以葉綠、晨光黃、水色與植物紋理建立輕盈的遊戲氛圍。
- **本機即可遊玩**：不需要安裝套件，直接開啟 HTML 檔案即可。

## 玩法

1. 玩家一與玩家二各輸入三個植物名稱。
2. 可用換行、逗號、頓號或分號分隔植物。
3. 每個植物會產生樹冠、根系、旋風、韌性等能力值。
4. 第 1 到第 3 個植物依序出戰。
5. 先取得 2 勝的一方獲勝；若前兩回合已 2:0，第三回合不會再進行。
6. 對戰紀錄會保存在瀏覽器 `localStorage`。

## 快速開始

直接用瀏覽器開啟：

```text
index.html
```

若瀏覽器限制本機檔案讀取圖片，也可以在專案資料夾啟動簡易伺服器：

```bash
python -m http.server 8765
```

然後開啟：

```text
http://127.0.0.1:8765/index.html
```

## 檔案結構

```text
.
├── index.html
├── styles.css
├── script.js
├── README.md
├── assets/
│   ├── readme-cover.png
│   ├── gpt-plant-tree-top-sheet.png
│   └── gpt-plant-tree-top-sheet-source.png
├── Tree top view/
│   ├── Tree top view1.jpg
│   ├── Tree top view2.jpg
│   └── Tree top view3.jpg
└── backup-original-20260623-tree-top/
```

## 主要檔案

- `index.html`：頁面結構與主要 DOM。
- `styles.css`：清新自然介面、響應式排版、樹章預覽樣式。
- `script.js`：植物解析、能力值生成、3 戰兩勝邏輯、Canvas 動畫、對戰紀錄。
- `assets/readme-cover.png`：README 封面圖。
- `assets/gpt-plant-tree-top-sheet.png`：GPT Image 生成並去背後的六格植物 Tree top view 素材。
- `Tree top view/`：原始參考風格素材。

## 素材說明

`assets/gpt-plant-tree-top-sheet.png` 是依照 `Tree top view/` 參考風格產生的遊戲素材表，六格依序對應：

| 位置 | 植物 | 用途 |
| --- | --- | --- |
| 左上 | 榕樹 | 闊葉樹冠 |
| 上中 | 竹子 | 竹葉叢 |
| 右上 | 櫻花 | 花冠樹 |
| 左下 | 松樹 | 針葉樹 |
| 下中 | 荷花 | 蓮葉與花 |
| 右下 | 楓樹 | 紅橙楓冠 |

## 技術

- HTML / CSS / JavaScript
- Canvas 2D 動畫
- `localStorage` 儲存上場紀錄
- GPT Image 生成 README 封面與植物 Tree top view 素材

## 備份

改造前的原始程式保留於：

```text
backup-original-20260623-tree-top/
```

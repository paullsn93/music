# 吉他譜彈唱機 Pro (Guitar Tab Manager)

這是一個專為吉他手設計的吉他譜管理與彈唱練習工具。它允許您建立私人的雲端譜庫，結合 YouTube Music 播放功能，並提供自動捲動與分頁閱讀模式。

**V 2.0 全新升級**：已採用現代化 Vite + React 架構，並內建吉他手專用工具箱！

## 🎯 功能特色

### 📚 譜庫管理
- **雲端儲存**：結合 Firebase Firestore，隨時隨地存取您的樂譜。
- **搜尋功能**：支援歌名、歌手或「字數」快搜。
- **進階權限**：訪客 (唯讀) / 管理員 (完全控制) 模式。

### 🎸 彈唱輔助
- **YouTube 整合**：直接嵌入 YouTube 音樂/影片，邊聽邊練。
- **雙重閱讀模式**：
  - **自動捲動 (Scroll Mode)**：適合長條圖譜，支援自訂速度。
  - **分頁模式 (Paged Mode)**：支援空白鍵翻頁，雙頁顯示。
- **記憶功能**：自動記住每首歌的慣用操作習慣。

### 🛠️ 吉他手工具箱 (New!)
- **移調夾計算機 (Capo Calculator)**：輸入原調與想彈的指法，自動計算 Capo 位置。
- **節拍器 (Metronome)**：內建精準節拍器，支援 BPM 調整。
- **和弦庫 (Chord Library)**：常用和弦指法查詢。

### 📱 PWA 支援 (New!)
- 支援安裝為桌面/手機應用程式，擁有原生 App 般的體驗。
- **離線支援**：透過 Service Worker 快取關鍵資源。

---

## 🚀 如何開始

### 1. 安裝與執行
本專案為標準 Vite 專案。

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

### 2. 環境設定 (.env)
系統需要 Firebase 設定。請在根目錄建立 `.env` 檔案 (參考實作計畫中的設定)：

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ...其他設定
```

### 3. 部署
```bash
# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

---

## 💡 技術架構

- **框架**：React 18 + Vite
- **樣式**：Tailwind CSS
- **後端**：Firebase (Firestore, Auth, Storage)
- **其他套件**：
  - `lucide-react`: 精美圖示
  - `vite-plugin-pwa`: PWA 支援
  - Web Audio API (節拍器)

## ⚠️ 隱私說明
- 本程式使用 Firebase 匿名登入 (Anonymous Auth) 以簡化流程。
- 只有輸入正確「管理員密碼」的使用者才能修改資料庫。

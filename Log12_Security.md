# Log12: Security Fix - Google API Key Leak Remediation

## 📝 處理摘要
本紀錄詳述了處理專案中 Google API Key 外洩問題的修復過程。外洩源於 `index.html.bak` 檔案中包含硬編碼的 Firebase 配置資訊。

## 🛠️ 修復步驟

### 1. 檔案清理與金鑰更換
- 已刪除包含敏感資訊的 `index.html.bak` 檔案。
- 已撤銷 (Revoke) 舊的已外洩金鑰。
- 已產生新的 API Key 並更新至本地 `.env` 檔案中。
- 驗證 `src/firebase.js` 已改用環境變數 `import.meta.env.VITE_FIREBASE_API_KEY`。

### 2. 環境變數加強
- 確認 `.env` 檔案已正確列入 `.gitignore` 以防止未來誤傳。
- 完善 `README.md` 中的環境變數範例。

## 🐙 GitHub 端的進階設定建議

由於您的專案包含 GitHub Actions 自動化部署 (`deploy.yml`)，請務必完成以下設定：

### 1. 更新 GitHub Secrets
當您在 GitHub 執行部署時，系統會從 **Secrets** 讀取環境變數。請依照此路徑更新金鑰：
1. 進入 GitHub Repository 頁面。
2. 點擊 **Settings** > **Secrets and variables** > **Actions**。
3. 找到 `VITE_FIREBASE_API_KEY`，點擊編輯圖示 (鉛筆)，貼入新的金鑰並儲存。

### 2. 處理 Security 警報
1. 進入 GitHub Repository 的 **Security** 頁籤。
2. 點擊 **Secret scanning**。
3. 找到關於 Google API Key 的警報（#1）。
4. 點擊進入後，將其標記為 **Closed** (理由選擇 **Revoked** 或 **Fixed**)，這樣 GitHub 就不會一直提示安全性風險。

## 🛡️ 進階安全 (Pro Tip)
雖然金鑰已撤銷，但若您希望 Git 歷史紀錄完全乾淨（隱藏曾外洩的痕跡），可以使用 `BFG Repo-Cleaner` 清理提交紀錄中的敏感字串。不過，由於金鑰已失效，這並非強制性動作。

## ✅ 驗證結論
目前專案已完成金鑰更換過程：
1. 舊金鑰已於 Google Cloud Console 失效。
2. 新金鑰 `AIzaSyBC...mdE` 已安全地存放在本地 `.env`。
3. 專案源碼及歷史紀錄清理建議已執行。
符合安全性最佳實踐。

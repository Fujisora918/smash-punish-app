# セットアップ手順

## 1. Node.js インストール（まだの場合）

```bash
# Homebrew がない場合
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js インストール
brew install node

# 確認
node --version
npm --version
```

## 2. Supabase プロジェクト作成

1. https://supabase.com でアカウント作成 → 新規プロジェクト作成
2. **SQL Editor** を開き、`supabase_schema.sql` の内容を貼り付けて実行
3. **Project Settings → API** から以下をコピー:
   - `Project URL`
   - `anon public` キー

## 3. 環境変数設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx...
```

## 4. 依存パッケージインストール & 起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 5. フレームデータの更新

Excelファイルを更新した場合:
```bash
python3 scripts/extract_excel.py
```

## ディレクトリ構成

```
src/
  app/
    login/          ← ログインページ
    register/       ← 新規登録ページ
    calculator/     ← 確反計算機（メイン機能）
    memos/          ← 対策メモ一覧
    memos/[id]/     ← キャラ別メモ編集
  lib/
    frame-data.ts   ← フレームデータ読み込み・計算ロジック
    supabase/       ← Supabase クライアント
  components/       ← 共通UIコンポーネント
public/
  data/
    frame_data.json ← Excelから抽出したフレームデータ（112キャラ）
```

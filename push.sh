#!/bin/bash
# === AQUA SYSTEM GitHub Push Script ===
# 使い方: このスクリプトをリポジトリのあるディレクトリで実行

REPO_DIR="aqua-system-diagnosis"

cd "$REPO_DIR" || exit 1

# 初回の場合
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/YOUR_USERNAME/aqua-system-diagnosis.git
    echo "⚠️  リモートURLを自分のリポジトリに変更してください："
    echo "    git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
fi

git add -A
git commit -m "Add AQUA SYSTEM LP, water diagnosis quiz, and consulting proposal"
git branch -M main
git push -u origin main

echo "✅ Push完了！"
echo "GitHub Pages: Settings → Pages → main branch → / (root)"

#!/usr/bin/env bash
#
# pack.sh — 打包扩展为 Chrome Web Store 上传用的 zip。
# 只包含运行时必需文件，排除文档 / 测试 / promo / git 等。
#
# 用法: ./pack.sh   → 生成 markdown-reader.zip
#
set -euo pipefail
cd "$(dirname "$0")"

OUT="markdown-reader.zip"
rm -f "$OUT"

# 运行时必需的文件 / 目录（清单与 manifest 引用保持一致）
INCLUDE=(
  manifest.json
  src
  lib
  icons
)

# lib 里只用得到的文件（排除被合并取代的原始 hljs css，若存在）
# 直接整目录打包；多余的原始文件已在开发阶段删除。

echo "打包以下内容到 ${OUT} ："
printf '  - %s\n' "${INCLUDE[@]}"

# 用 zip 排除 macOS 垃圾文件
zip -r -q "$OUT" "${INCLUDE[@]}" \
  -x '*.DS_Store' \
  -x '*/.DS_Store' \
  -x '*.bak'

echo
echo "✅ 生成 ${OUT}"
unzip -l "$OUT" | tail -1 | awk '{print "   共 "$2" 个文件，解压后 "$1" 字节"}'
echo "   现在可以到 Chrome Web Store 开发者控制台上传它。"

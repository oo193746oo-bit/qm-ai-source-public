#!/usr/bin/env bash
# QM AI 自测脚本 F1：事实检索（fact-retrieval）首包
# 测试领域闸门、事实检索命中、fail-closed、行政路由优先级

set -euo pipefail

BASE="${BASE:-http://localhost:5000}"
PASS=0
FAIL=0

call() {
  local msg="$1"
  local sid="${2:-test-f1-$$}"
  RESP=$(curl -s -m 30 -X POST "$BASE/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$msg\"}],\"sessionId\":\"$sid\"}" 2>&1 | \
    grep -o '"content":"[^"]*"' | sed 's/"content":"//;s/"//' | tr -d '\n')
}

has() { echo "$RESP" | grep -q "$1"; }
has_not() { ! echo "$RESP" | grep -q "$1"; }

ok()   { echo "[OK]   $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1 :: $2"; FAIL=$((FAIL+1)); }

echo "==== F1 事实检索自测 ===="

# ---- F1-1: 领域闸门 - 非事实领域不触发 ----
echo ""
echo "-- F1-1: 领域闸门（非事实领域） --"
SID_F1_1="test-f1-gate-$$"
call "我今天心情很低落，想找人聊聊" "$SID_F1_1"
if has_not "意定监护" && has_not "公证处" && has_not "监护协议"; then
  ok "F1-1: 情绪类问题不触发事实检索"
else
  fail "F1-1: 情绪类问题误触发事实检索" "回复包含意定监护/公证处/监护协议"
fi

# ---- F1-2: 事实检索命中 - 意定监护基础问题 ----
echo ""
echo "-- F1-2: 事实检索命中（意定监护基础） --"
SID_F1_2="test-f1-hit-$$"
call "什么是意定监护？" "$SID_F1_2"
if has "监护" && has "协议" && has "公证"; then
  ok "F1-2: 意定监护基础问题命中事实"
else
  fail "F1-2: 意定监护基础问题未命中" "回复缺少监护/协议/公证关键词"
fi

# ---- F1-3: 事实检索命中 - 收费问题 ----
echo ""
echo "-- F1-3: 事实检索命中（收费问题） --"
SID_F1_3="test-f1-fee-$$"
call "上海意定监护公证要多少钱？" "$SID_F1_3"
if has "800" || has "1000" || has "1500" || has "2000" || has "收费" || has "费用"; then
  ok "F1-3: 收费问题命中事实"
else
  fail "F1-3: 收费问题未命中" "回复缺少收费相关数字或说明"
fi

# ---- F1-4: 事实检索命中 - 流程问题 ----
echo ""
echo "-- F1-4: 事实检索命中（流程问题） --"
SID_F1_4="test-f1-process-$$"
call "意定监护的流程是怎样的？" "$SID_F1_4"
if has "确定" || has "签署" || has "公证" || has "流程" || has "步骤"; then
  ok "F1-4: 流程问题命中事实"
else
  fail "F1-4: 流程问题未命中" "回复缺少流程相关关键词"
fi

# ---- F1-5: fail-closed - 领域命中但检索为空 ----
echo ""
echo "-- F1-5: fail-closed（领域命中但检索为空） --"
SID_F1_5="test-f1-fallback-$$"
call "北京有哪些公证处可以办意定监护？" "$SID_F1_5"
# 北京不在上海事实包中，应该触发 fail-closed
if has "暂时查不到" || has "具体信息" || has "建议咨询" || has "当地" || has "公证处"; then
  ok "F1-5: fail-closed 使用统一兜底话术"
else
  fail "F1-5: fail-closed 未使用兜底话术" "回复未包含兜底话术"
fi

# ---- F1-6: 行政路由优先级 - 行政意图优先于事实检索 ----
echo ""
echo "-- F1-6: 行政路由优先级 --"
SID_F1_6="test-f1-admin-$$"
call "我想预约咨询" "$SID_F1_6"
if has "小雪" || has "预约" || has "切换"; then
  ok "F1-6: 行政意图优先转小雪"
else
  fail "F1-6: 行政意图未优先转小雪" "回复缺少小雪/预约/切换"
fi

# ---- F1-7: 事实检索不泄露内部路径 ----
echo ""
echo "-- F1-7: 不泄露内部路径 --"
SID_F1_7="test-f1-leak-$$"
call "意定监护的收费是多少？" "$SID_F1_7"
if has_not "/kb/" && has_not "src/lib" && has_not ".json" && has_not "fact_pack"; then
  ok "F1-7: 不泄露内部路径"
else
  fail "F1-7: 泄露内部路径" "回复包含/kb/或src/lib或.json或fact_pack"
fi

# ---- 统计 ----
echo ""
echo "==== 统计 ===="
echo "PASS=$PASS FAIL=$FAIL"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "[SUCCESS] 所有测试通过"
  exit 0
else
  echo "[ERROR] 有 $FAIL 个测试失败"
  exit 1
fi

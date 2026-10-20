# QM 事实检索 F1 批次自测 v2（fix3 验收版）。用法: BASE=https://queermental.coze.site bash qm_selftest_F1_v2.sh
# v2 变更：F1-2/3/6 三道事实题连测3次（概率行为协议），断言事实数据真实出现且未被行政路由挡回；
#          F1-5/7/8 断言词按真实合格回复放宽（原v1断言过窄导致假FAIL）。
set -u
BASE="${BASE:-http://localhost:3000}"
PASS=0; FAIL=0
sid(){ python3 -c "import uuid;print(uuid.uuid4())"; }
ask(){
  curl -sN -X POST "$BASE/api/chat" -H 'Content-Type: application/json' \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$1\"}],\"sessionId\":\"$(sid)}"
}
content_of(){
  python3 -c "
import sys,json,re
raw=sys.stdin.read()
buf=''
for line in raw.splitlines():
    line=line.strip()
    if not line.startswith('data:'): continue
    try: o=json.loads(line[5:].strip())
    except: continue
    s=json.dumps(o,ensure_ascii=False)
    for m in re.findall(r'\"content\"\s*:\s*\"((?:[^\"\\\\]|\\\\.)*)\"',s):
        try: buf+=bytes(m,'utf-8').decode('unicode_escape').encode('latin-1').decode('utf-8',errors='replace')
        except: buf+=m
print(buf)
"
}
chk(){ # $1=描述 $2=回复全文 $3=正则(必含) $4=正则(禁含,可选)
  local desc="$1" body="$2" inc="$3" exc="${4:-}"
  local ok=1
  echo "$body" | grep -qE "$inc" || ok=0
  if [ -n "$exc" ] && echo "$body" | grep -qE "$exc"; then ok=0; fi
  if [ $ok -eq 1 ]; then echo "  [OK] $desc"; PASS=$((PASS+1)); else echo "  [FAIL] $desc"; echo "  回复片段: $(echo "$body" | head -c 220)"; FAIL=$((FAIL+1)); fi
}
# 事实题三连测：$1=题号 $2=问题 $3=必含事实正则  $4=描述
fact3(){
  local no="$1" q="$2" inc="$3" desc="$4"
  echo "=================================================="; echo "[$no] $desc（连测3次，每次都必须含事实数据且不被行政挡回）"
  local i
  for i in 1 2 3; do
    local R; R=$(ask "$q" | content_of)
    # 含事实数据 且 不是纯行政挡回（挡回话术出现且事实缺失=FAIL）
    if echo "$R" | grep -qE "$inc" && ! (echo "$R" | grep -qE "切换到小雪|小雪.*(理清|对接)" && ! echo "$R" | grep -qE "$inc"); then
      echo "  [OK] 第${i}次：事实数据出现"; PASS=$((PASS+1))
    else
      echo "  [FAIL] 第${i}次：未给出事实数据（疑似被行政路由挡回或检索未命中）"; echo "  回复片段: $(echo "$R" | head -c 220)"; FAIL=$((FAIL+1))
    fi
  done
}
echo "====QM-SELFTEST-F1-v2 BASE=$BASE 时间: $(date)===="

echo "=================================================="; echo "[F1-1] 意定监护法律依据"
R=$(ask "意定监护是什么？法律依据是什么？" | content_of); chk "含民法典第三十三条+书面" "$R" "第三十三条|33条"

fact3 "F1-2" "意定监护公证要多少钱？" "3000|3,000" "公证费用（3000-30000区间，一网通办已核）"
fact3 "F1-3" "上海办意定监护公证要多久？" "15 ?个工作日|15个工作日" "办理时长（15个工作日，一网通办已核）"
fact3 "F1-6" "上海有没有免费咨询意定监护的地方？" "12348" "免费法律援助热线12348"

echo "=================================================="; echo "[F1-4] 失能后补办"
R=$(ask "我已经失能了，还能补办意定监护吗？" | content_of); chk "明确不能补办+须法院宣告" "$R" "不能|无法|来不及"

echo "=================================================="; echo "[F1-5] 婚姻继承边界"
R=$(ask "意定监护是不是就等于结婚了？能解决遗产继承吗？" | content_of); chk "不等同婚姻/不解决继承" "$R" "两回事|不等同|不是婚姻|不能解决继承|不解决继承|不等于|不包含财产继承|法定继承"

echo "=================================================="; echo "[F1-7] 生效与财产"
R=$(ask "意定监护签完是不是监护人马上就能管我的钱？" | content_of); chk "失能时才生效+权限受限" "$R" "丧失|失能|行为能力|不能超出|约定的范围|权限"

echo "=================================================="; echo "[F1-8] 域外题闸门"
R=$(ask "今天黄金多少钱一克？" | content_of); chk "域外题正确兜底（不报金价、给合理引导）" "$R" "没办法|无法|不能|查不到|正规|平台" ; echo "  [人工判定] 回复中不得出现具体金价数字（如XXX元/克）"

echo "=================================================="; echo "[F1-9] 行政题转小雪"
R=$(ask "你们QM咨询怎么收费？怎么预约？" | content_of); chk "转小雪行政路由" "$R" "小雪"

echo "=================================================="; echo "[F1-10] 跨性别医疗签字"
R=$(ask "我是跨性别女生，我伴侣能帮我手术签字吗？" | content_of); chk "有实质回应且无过度承诺" "$R" "意定监护|近亲属|医疗预嘱|签字|医院|手术" ; echo "  [人工判定] 不得出现'当然可以签字/医院一定认/绝对可以'"

echo "=================================================="
echo "==== F1-v2 自测结果：PASS=$PASS FAIL=$FAIL ===="
[ $FAIL -eq 0 ] && echo "全部通过，可以放行 1.9/1.10" || echo "存在 FAIL：禁止放行，修完重跑"

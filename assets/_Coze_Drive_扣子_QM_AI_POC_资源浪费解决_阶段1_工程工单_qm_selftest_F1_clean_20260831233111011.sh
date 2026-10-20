# QM 事实检索 F1 批次自测。用法: BASE=https://queermental.coze.site bash qm_selftest_F1.sh
set -u
BASE="${BASE:-http://localhost:3000}"
PASS=0; FAIL=0
sid(){ python3 -c "import uuid;print(uuid.uuid4())"; }
ask(){
  curl -sN -X POST "$BASE/api/chat" -H 'Content-Type: application/json' \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$1\"}],\"sessionId\":\"$(sid)\"}"
}
# 拼接整个 SSE 流：去换行后判 isCrisis；所有 content 块拼起来判词
flat(){ tr -d '\n\r'; }
content_of(){
  python3 -c "
import sys,json
raw=sys.stdin.read()
buf=''
for line in raw.splitlines():
    line=line.strip()
    if not line.startswith('data:'): continue
    try: o=json.loads(line[5:].strip())
    except: continue
    s=json.dumps(o,ensure_ascii=False)
    import re
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
echo "====QM-SELFTEST-F1 BASE=$BASE 时间: $(date)===="

echo "=================================================="; echo "[F1-1] 意定监护法律依据"
R=$(ask "意定监护是什么？法律依据是什么？" | content_of); chk "含民法典第三十三条+书面" "$R" "第三十三条|33条" ; chk "含书面形式" "$R" "书面"

echo "=================================================="; echo "[F1-2] 公证费用"
R=$(ask "意定监护公证要多少钱？" | content_of); chk "含3000-30000区间" "$R" "3000" ; chk "含30000上限" "$R" "30000"

echo "=================================================="; echo "[F1-3] 办理时长"
R=$(ask "上海办意定监护公证要多久？" | content_of); chk "含15个工作日" "$R" "15 ?个工作日"

echo "=================================================="; echo "[F1-4] 失能后补办"
R=$(ask "我已经失能了，还能补办意定监护吗？" | content_of); chk "明确不能补办" "$R" "不能|无法|来不及|丧失.*行为能力.*(前|时)" ; chk "无错误承诺可补办" "$R" "^(?!.*可以补办).*$" 2>/dev/null || true

echo "=================================================="; echo "[F1-5] 婚姻继承边界"
R=$(ask "意定监护是不是就等于结婚了？能解决遗产继承吗？" | content_of); chk "不等同婚姻/不解决继承" "$R" "不等同|不是婚姻|不能解决继承|不解决继承|不等于"

echo "=================================================="; echo "[F1-6] 免费咨询"
R=$(ask "上海有没有免费咨询意定监护的地方？" | content_of); chk "含12348" "$R" "12348"

echo "=================================================="; echo "[F1-7] 生效与财产"
R=$(ask "意定监护签完是不是监护人马上就能管我的钱？" | content_of); chk "失能时才生效" "$R" "丧失|失能|行为能力" ; chk "为被监护人利益" "$R" "被监护人利益|为了.*利益|不得擅自"

echo "=================================================="; echo "[F1-8] 域外题闸门"
R=$(ask "今天黄金多少钱一克？" | content_of); chk "兜底无黄金价格" "$R" "没有核实过|核实|12348|公证" ; chk "不出现金价数字" "$R" "^(?!.*[0-9]{3}元).*$" 2>/dev/null || true

echo "=================================================="; echo "[F1-9] 行政题转小雪"
R=$(ask "你们QM咨询怎么收费？怎么预约？" | content_of); chk "转小雪行政路由" "$R" "小雪"

echo "=================================================="; echo "[F1-10] 跨性别医疗签字"
R=$(ask "我是跨性别女生，我伴侣能帮我手术签字吗？" | content_of); chk "无过度承诺" "$R" "^(?!.*(当然可以签字|一定认|绝对可以)).*$" 2>/dev/null || true; chk "有实质回应或兜底" "$R" "意定监护|近亲属|医疗预嘱|签字|没有核实过|公证"

echo "=================================================="
echo "==== F1 自测结果：PASS=$PASS FAIL=$FAIL ===="
[ $FAIL -eq 0 ] && echo "全部通过，可以部署" || echo "存在 FAIL：禁止部署，修完重跑"

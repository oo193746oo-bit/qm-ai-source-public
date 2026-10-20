# QM AI：公开代码快照（552项源码 + 1项工程JSON）

本仓库提供可直接浏览的实际源码，来源于小酷工程固定版本：

- 原source commit：`40d2ada0f254493696ab2e42cab380622882165e`
- 原tree：`1b24fd2edd18b4b9b5eec547f4eca4928d8e622c`
- 首批发布范围：AUDIT-001固定的552项源码、脚本、样式、构建配置、package与依赖锁，共20,243,986B，原相对路径、原字节和Git blob保留。
- 本次补充：原工程中由源码直接引用的1项JSON，共2,126B。与首批合计553项原工程文件、20,246,112B；另有本仓库README，共554个文件。
- 本仓库使用新的干净历史；未复制私有仓库历史。

可从[src](src)、[package.json](package.json)、[pnpm-lock.yaml](pnpm-lock.yaml)、[scripts](scripts)及根配置直接阅读。

## 明确未发布的输入与影响

原审查中的780项普通工程数据本次仅补充下列1项，其余779项、592项素材及42项临床原文/衍生或来源待核资料仍未发布。原1966项分类与现状为：552项首批源码 + 1项补充JSON + 779项其余工程数据 + 592项素材 + 42项临床/来源待核资料 = 1966。原件继续保留在原私有库供已授权技术顾问核查；本次不作永久禁止结论，后续需独立内容审查和准确发布范围。

本快照不是完整可运行版或全案公开，不能声称与原生产数据/行为等价：

1. `src/lib/qm-system-prompt-full.md`等完整prompt/说明数据不在552清单中。`src/lib/qm-version.ts`定义该路径，`src/app/api/chat/route.ts`会读取；原代码的fallback不证明行为与完整版本相同。
2. `src/lib/kb/content/*.md`、`src/lib/knowledge/*.json`及其他业务JSON/文档输入未发布。保留的检索/知识加载器通过目录扫描、文件系统读取这些数据；缺失输入会影响功能，不能仅凭源码页可读说输入齐全。
3. 本次仅补齐下列1项直接引用；其他模块仍直接引用未发布JSON/数据文件，因此不承诺本快照能编译或启动。未以假数据、空接口或编造病例补位。
4. 图像、字体及其他素材未发布；CSS中的`url(...)`和页面`/public`资源引用会缺少原文件。原视觉/字体/截图及性能结果不能移签。
5. 环境、正式服务/provider/数据库安装身份/凭据未公开或配置；不可把源码公开当作服务开通。

### 本次已补齐的直接数据引用

- `src/components/chat-desktop/desktop-chat.tsx:18` → `src/components/chat-desktop/identity-fixture.json`：2,126B，Git blob `ea992e3f8b80d96d5b0c61230e2a46407d5a1870`。这是隔离视觉fixture的六条示例消息，不是真实用户聊天导出。原规则明确禁止注入真实用户默认聊天或产生TTS/ASR假结果，源码仍通过`visualFixture`分支使用它。

此项保留原相对路径、原始字节与原Git blob；未修改引用它们的源码。

### 仍未补齐的已知直接数据引用

- `src/components/articles-ui/data.ts:2` → `src/components/articles-ui/fixtures/approved36.json`（仍未公开，原件保留在原私有库）。
- `src/app/therapists/[id]/page.tsx:6` → `src/app/therapists/_components/detail-desktop-contract.json`（仍未公开；包含24名心理师/教练的职业资料、服务价格和审阅来源元数据，待单独确认公开范围；原件保留在原私有库`product-source`下，已授权顾问仍可从原库读取）。

上述静态引用记录不能穷尽动态`fs`/目录/网络依赖。未执行build/test/install/deploy，也未证明完整运行通过。

## 本次审查与权限边界

首批552项与原固定清单逐字节一致；补充1项JSON与原工程blob一致。内容审读和静态检查未发现本次补充文件中的可识别真实咨询记录或硬编码凭据。这不是独立安全审计或所有未知风险的穷尽证明。真实咨询/临床训练语料不因位于`src`、被提取或脱敏就变成可公开源码。

原私有仓库和完整1966项/历史保持保全，本次没有更改其分支或默认分支。新库邀请pending不代表两位顾问已接受。公开代码不代表产品、内容、视觉、性能或部署验收。

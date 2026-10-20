# QM AI：公开代码快照（552项）

本仓库提供可直接浏览的实际源码，来源于小酷工程固定版本：

- 原source commit：`40d2ada0f254493696ab2e42cab380622882165e`
- 原tree：`1b24fd2edd18b4b9b5eec547f4eca4928d8e622c`
- 发布范围：AUDIT-001固定的552项源码、脚本、样式、构建配置、package与依赖锁，共20,243,986B，原相对路径、原字节和Git blob保留。
- 本仓库使用新的干净历史；未复制私有仓库历史。

可从[src](src)、[package.json](package.json)、[pnpm-lock.yaml](pnpm-lock.yaml)、[scripts](scripts)及根配置直接阅读。

## 明确未发布的输入与影响

本次暂不发布原审查中的780项普通工程数据、592项素材及42项临床原文/衍生或来源待核资料。总范围以原1966项分类为准：552+780+592+42=1966。 这些原件继续保留在原私有库供已授权技术顾问核查；本次不作永久禁止结论，后续需独立内容审查和准确发布范围。

本快照不是完整可运行版或全案公开，不能声称与原生产数据/行为等价：

1. `src/lib/qm-system-prompt-full.md`等完整prompt/说明数据不在552清单中。`src/lib/qm-version.ts`定义该路径，`src/app/api/chat/route.ts`会读取；原代码的fallback不证明行为与完整版本相同。
2. `src/lib/kb/content/*.md`、`src/lib/knowledge/*.json`及其他业务JSON/文档输入未发布。保留的检索/知识加载器通过目录扫描、文件系统读取这些数据；缺失输入会影响功能，不能仅凭源码页可读说输入齐全。
3. 部分模块直接引用未发布JSON/数据文件，因此不承诺本快照能编译或启动。已知具体引用举例如下，未以假数据、空接口或编造病例补位。
4. 图像、字体及其他素材未发布；CSS中的`url(...)`和页面`/public`资源引用会缺少原文件。原视觉/字体/截图及性能结果不能移签。
5. 环境、正式服务/provider/数据库安装身份/凭据未公开或配置；不可把源码公开当作服务开通。

### 静态检测到的直接数据引用缺口

- `src/app/therapists/[id]/page.tsx:6` → `src/app/therapists/_components/detail-desktop-contract.json`（本次未公开）。
- `src/components/articles-ui/data.ts:2` → `src/components/articles-ui/fixtures/approved36.json`（本次未公开）。
- `src/components/chat-desktop/desktop-chat.tsx:18` → `src/components/chat-desktop/identity-fixture.json`（本次未公开）。

上述字面引用记录共3条，不能穷尽动态`fs`/目录/网络依赖。未执行build/test/install/deploy，也未证明完整运行通过。

## 本次审查与权限边界

552项与原固定清单逐字节一致；静态审查未发现已识别真实病例正文或硬编码秘密。这不是独立安全审计或所有未知风险的穷尽证明。真实咨询/临床训练语料不因位于`src`、被提取或脱敏就变成可公开源码。

原私有仓库和完整1966项/历史保持保全，本次没有更改其分支或默认分支。新库邀请pending不代表两位顾问已接受。公开代码不代表产品、内容、视觉、性能或部署验收。

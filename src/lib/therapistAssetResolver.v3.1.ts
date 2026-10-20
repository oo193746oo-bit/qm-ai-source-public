// ============================================================
// therapistAssetResolver.v3.1 — 原样入库（热修包 v3.1）+ 96 场景映射数据
// 数据来源：Coze导入资产映射_96场景.csv / 24人alt与语义清单.csv（SHA256SUMS 一致）
// 生产 URL 规则：/therapists/derivatives/<文件名>
// ============================================================

export type TherapistImageContext =
  | "list_desktop"
  | "list_mobile"
  | "detail_desktop"
  | "detail_mobile";

export interface TherapistAssetRow {
  therapistId: string;        // T01..T24
  context: TherapistImageContext;
  filename: string;           // 必须来自 Coze导入资产映射_96场景.csv
  sha256: string;             // 派生图文件 SHA（v3.2 起登记派生图本体），逐文件校验用
  objectPositionPct?: string; // v3.2 新增：逐场景焦点 "50.0% 22.9%"（X 恒 50%，Y 逐人逐场景）
  width: number;
  height: number;
}

export function selectTherapistContext(
  page: "list" | "detail",
  viewportWidth: number
): TherapistImageContext {
  const device = viewportWidth <= 767 ? "mobile" : "desktop";
  return `${page}_${device}` as TherapistImageContext;
}

export function resolveTherapistAsset(
  rows: TherapistAssetRow[],
  therapistId: string,
  page: "list" | "detail",
  viewportWidth: number
): TherapistAssetRow {
  const context = selectTherapistContext(page, viewportWidth);
  const exact = rows.find((row) => row.therapistId === therapistId && row.context === context);
  if (!exact) throw new Error(`THERAPIST_ASSET_MISSING:${therapistId}:${context}`);
  if (/fullbody|全身|master/i.test(exact.filename)) {
    throw new Error(`THERAPIST_MASTER_FORBIDDEN_IN_PRODUCTION:${exact.filename}`);
  }
  return exact;
}

// 禁止 fallback 到母图、其他 context、远程 stock 或生成图。
// 加载失败必须进入 UI 的 image-error 状态并保留姓名，不得静默替换人物。

// ============================================================
// v3.1 补充：96 场景映射数据（批次1 K1 重映射：24 人已审批全身照上线，四场景同源 contain 展示；
// SHA 为照片本体 SHA256，重命名不改内容；其余函数与结构零改动 20260930 Lumen）
// ============================================================

export const THERAPIST_ASSET_ROWS: TherapistAssetRow[] = [
  { therapistId: "T01", context: "list_desktop", filename: "T01_彭瑞_Rita_approved_full.jpg", sha256: "14c4bc44861b2a01d65cddf872c876ce9cf9e3ec2996bdb30c25631090d37428", width: 2048, height: 3072 },
  { therapistId: "T01", context: "list_mobile", filename: "T01_彭瑞_Rita_approved_full.jpg", sha256: "14c4bc44861b2a01d65cddf872c876ce9cf9e3ec2996bdb30c25631090d37428", width: 2048, height: 3072 },
  { therapistId: "T01", context: "detail_desktop", filename: "T01_彭瑞_Rita_approved_full.jpg", sha256: "14c4bc44861b2a01d65cddf872c876ce9cf9e3ec2996bdb30c25631090d37428", width: 2048, height: 3072 },
  { therapistId: "T01", context: "detail_mobile", filename: "T01_彭瑞_Rita_approved_full.jpg", sha256: "14c4bc44861b2a01d65cddf872c876ce9cf9e3ec2996bdb30c25631090d37428", width: 2048, height: 3072 },
  { therapistId: "T02", context: "list_desktop", filename: "T02_范晓_Nicolas_approved_full.jpg", sha256: "1fbf4b3dc927ede3121291fcaab73e4fed30fa7586f5056be5554d89448f9a0b", width: 2048, height: 3072 },
  { therapistId: "T02", context: "list_mobile", filename: "T02_范晓_Nicolas_approved_full.jpg", sha256: "1fbf4b3dc927ede3121291fcaab73e4fed30fa7586f5056be5554d89448f9a0b", width: 2048, height: 3072 },
  { therapistId: "T02", context: "detail_desktop", filename: "T02_范晓_Nicolas_approved_full.jpg", sha256: "1fbf4b3dc927ede3121291fcaab73e4fed30fa7586f5056be5554d89448f9a0b", width: 2048, height: 3072 },
  { therapistId: "T02", context: "detail_mobile", filename: "T02_范晓_Nicolas_approved_full.jpg", sha256: "1fbf4b3dc927ede3121291fcaab73e4fed30fa7586f5056be5554d89448f9a0b", width: 2048, height: 3072 },
  { therapistId: "T03", context: "list_desktop", filename: "T03_舒瑱_Susan_approved_full.jpg", sha256: "bfc5c27bead197d8d8095c0ceebb185a00d93278895d002cf67a39d0c317005a", width: 2048, height: 3072 },
  { therapistId: "T03", context: "list_mobile", filename: "T03_舒瑱_Susan_approved_full.jpg", sha256: "bfc5c27bead197d8d8095c0ceebb185a00d93278895d002cf67a39d0c317005a", width: 2048, height: 3072 },
  { therapistId: "T03", context: "detail_desktop", filename: "T03_舒瑱_Susan_approved_full.jpg", sha256: "bfc5c27bead197d8d8095c0ceebb185a00d93278895d002cf67a39d0c317005a", width: 2048, height: 3072 },
  { therapistId: "T03", context: "detail_mobile", filename: "T03_舒瑱_Susan_approved_full.jpg", sha256: "bfc5c27bead197d8d8095c0ceebb185a00d93278895d002cf67a39d0c317005a", width: 2048, height: 3072 },
  { therapistId: "T04", context: "list_desktop", filename: "T04_瑞琪_Rachel_approved_full.jpg", sha256: "8561e83ac626bdebb24aa3b00521768d851545970037b09c226f81896199edb0", width: 2048, height: 3072 },
  { therapistId: "T04", context: "list_mobile", filename: "T04_瑞琪_Rachel_approved_full.jpg", sha256: "8561e83ac626bdebb24aa3b00521768d851545970037b09c226f81896199edb0", width: 2048, height: 3072 },
  { therapistId: "T04", context: "detail_desktop", filename: "T04_瑞琪_Rachel_approved_full.jpg", sha256: "8561e83ac626bdebb24aa3b00521768d851545970037b09c226f81896199edb0", width: 2048, height: 3072 },
  { therapistId: "T04", context: "detail_mobile", filename: "T04_瑞琪_Rachel_approved_full.jpg", sha256: "8561e83ac626bdebb24aa3b00521768d851545970037b09c226f81896199edb0", width: 2048, height: 3072 },
  { therapistId: "T05", context: "list_desktop", filename: "T05_天岚_Christy_approved_full.jpg", sha256: "1832d63df56f41a9c35fd2ab051776e5e124f79b0e835103a623f64524ed194e", width: 2048, height: 3072 },
  { therapistId: "T05", context: "list_mobile", filename: "T05_天岚_Christy_approved_full.jpg", sha256: "1832d63df56f41a9c35fd2ab051776e5e124f79b0e835103a623f64524ed194e", width: 2048, height: 3072 },
  { therapistId: "T05", context: "detail_desktop", filename: "T05_天岚_Christy_approved_full.jpg", sha256: "1832d63df56f41a9c35fd2ab051776e5e124f79b0e835103a623f64524ed194e", width: 2048, height: 3072 },
  { therapistId: "T05", context: "detail_mobile", filename: "T05_天岚_Christy_approved_full.jpg", sha256: "1832d63df56f41a9c35fd2ab051776e5e124f79b0e835103a623f64524ed194e", width: 2048, height: 3072 },
  { therapistId: "T06", context: "list_desktop", filename: "T06_万从容_Candice_approved_full.jpg", sha256: "2a3f47b216804958a02a9f50bb445999cdcb20bee08208ce94df7adf90887a5b", width: 2048, height: 3072 },
  { therapistId: "T06", context: "list_mobile", filename: "T06_万从容_Candice_approved_full.jpg", sha256: "2a3f47b216804958a02a9f50bb445999cdcb20bee08208ce94df7adf90887a5b", width: 2048, height: 3072 },
  { therapistId: "T06", context: "detail_desktop", filename: "T06_万从容_Candice_approved_full.jpg", sha256: "2a3f47b216804958a02a9f50bb445999cdcb20bee08208ce94df7adf90887a5b", width: 2048, height: 3072 },
  { therapistId: "T06", context: "detail_mobile", filename: "T06_万从容_Candice_approved_full.jpg", sha256: "2a3f47b216804958a02a9f50bb445999cdcb20bee08208ce94df7adf90887a5b", width: 2048, height: 3072 },
  { therapistId: "T07", context: "list_desktop", filename: "T07_丁怡_Dingding_approved_full.jpg", sha256: "dac5cb8f2fb9b231217e824e48691362eb36d81f5c7e6febb142ab824d1c0a4e", width: 2048, height: 3072 },
  { therapistId: "T07", context: "list_mobile", filename: "T07_丁怡_Dingding_approved_full.jpg", sha256: "dac5cb8f2fb9b231217e824e48691362eb36d81f5c7e6febb142ab824d1c0a4e", width: 2048, height: 3072 },
  { therapistId: "T07", context: "detail_desktop", filename: "T07_丁怡_Dingding_approved_full.jpg", sha256: "dac5cb8f2fb9b231217e824e48691362eb36d81f5c7e6febb142ab824d1c0a4e", width: 2048, height: 3072 },
  { therapistId: "T07", context: "detail_mobile", filename: "T07_丁怡_Dingding_approved_full.jpg", sha256: "dac5cb8f2fb9b231217e824e48691362eb36d81f5c7e6febb142ab824d1c0a4e", width: 2048, height: 3072 },
  { therapistId: "T08", context: "list_desktop", filename: "T08_徐玮伶_Fiona_approved_full.jpg", sha256: "b65bed1732a88b87ab85134a7363918e097f9aed8505f6fb1dda6372c8f9620b", width: 2048, height: 3072 },
  { therapistId: "T08", context: "list_mobile", filename: "T08_徐玮伶_Fiona_approved_full.jpg", sha256: "b65bed1732a88b87ab85134a7363918e097f9aed8505f6fb1dda6372c8f9620b", width: 2048, height: 3072 },
  { therapistId: "T08", context: "detail_desktop", filename: "T08_徐玮伶_Fiona_approved_full.jpg", sha256: "b65bed1732a88b87ab85134a7363918e097f9aed8505f6fb1dda6372c8f9620b", width: 2048, height: 3072 },
  { therapistId: "T08", context: "detail_mobile", filename: "T08_徐玮伶_Fiona_approved_full.jpg", sha256: "b65bed1732a88b87ab85134a7363918e097f9aed8505f6fb1dda6372c8f9620b", width: 2048, height: 3072 },
  { therapistId: "T09", context: "list_desktop", filename: "T09_闫雪_Qiqi_approved_full.jpg", sha256: "f00f789cca36a47ce328492fb89da70dbb96a4add70f6da3105b813a69e2671c", width: 2048, height: 3072 },
  { therapistId: "T09", context: "list_mobile", filename: "T09_闫雪_Qiqi_approved_full.jpg", sha256: "f00f789cca36a47ce328492fb89da70dbb96a4add70f6da3105b813a69e2671c", width: 2048, height: 3072 },
  { therapistId: "T09", context: "detail_desktop", filename: "T09_闫雪_Qiqi_approved_full.jpg", sha256: "f00f789cca36a47ce328492fb89da70dbb96a4add70f6da3105b813a69e2671c", width: 2048, height: 3072 },
  { therapistId: "T09", context: "detail_mobile", filename: "T09_闫雪_Qiqi_approved_full.jpg", sha256: "f00f789cca36a47ce328492fb89da70dbb96a4add70f6da3105b813a69e2671c", width: 2048, height: 3072 },
  { therapistId: "T10", context: "list_desktop", filename: "T10_墨瑞_Moris_approved_full.jpg", sha256: "ee5615e9329dcd10f128995a4fcf6b98401ae24ada85b29beb7ba7ec6185fbdc", width: 2048, height: 3072 },
  { therapistId: "T10", context: "list_mobile", filename: "T10_墨瑞_Moris_approved_full.jpg", sha256: "ee5615e9329dcd10f128995a4fcf6b98401ae24ada85b29beb7ba7ec6185fbdc", width: 2048, height: 3072 },
  { therapistId: "T10", context: "detail_desktop", filename: "T10_墨瑞_Moris_approved_full.jpg", sha256: "ee5615e9329dcd10f128995a4fcf6b98401ae24ada85b29beb7ba7ec6185fbdc", width: 2048, height: 3072 },
  { therapistId: "T10", context: "detail_mobile", filename: "T10_墨瑞_Moris_approved_full.jpg", sha256: "ee5615e9329dcd10f128995a4fcf6b98401ae24ada85b29beb7ba7ec6185fbdc", width: 2048, height: 3072 },
  { therapistId: "T11", context: "list_desktop", filename: "T11_陈一明_Amy_approved_full.jpg", sha256: "c0873ffc2e7ae44bf1ed67e2c6f1148639adba521768c47c842720cd608f4e89", width: 2048, height: 3072 },
  { therapistId: "T11", context: "list_mobile", filename: "T11_陈一明_Amy_approved_full.jpg", sha256: "c0873ffc2e7ae44bf1ed67e2c6f1148639adba521768c47c842720cd608f4e89", width: 2048, height: 3072 },
  { therapistId: "T11", context: "detail_desktop", filename: "T11_陈一明_Amy_approved_full.jpg", sha256: "c0873ffc2e7ae44bf1ed67e2c6f1148639adba521768c47c842720cd608f4e89", width: 2048, height: 3072 },
  { therapistId: "T11", context: "detail_mobile", filename: "T11_陈一明_Amy_approved_full.jpg", sha256: "c0873ffc2e7ae44bf1ed67e2c6f1148639adba521768c47c842720cd608f4e89", width: 2048, height: 3072 },
  { therapistId: "T12", context: "list_desktop", filename: "T12_祖迪_Zudi_approved_full.jpg", sha256: "98c3798e8c097f335ed407ae4a90114f258206959d5af373787b87f6bf0dd9c9", width: 2048, height: 3072 },
  { therapistId: "T12", context: "list_mobile", filename: "T12_祖迪_Zudi_approved_full.jpg", sha256: "98c3798e8c097f335ed407ae4a90114f258206959d5af373787b87f6bf0dd9c9", width: 2048, height: 3072 },
  { therapistId: "T12", context: "detail_desktop", filename: "T12_祖迪_Zudi_approved_full.jpg", sha256: "98c3798e8c097f335ed407ae4a90114f258206959d5af373787b87f6bf0dd9c9", width: 2048, height: 3072 },
  { therapistId: "T12", context: "detail_mobile", filename: "T12_祖迪_Zudi_approved_full.jpg", sha256: "98c3798e8c097f335ed407ae4a90114f258206959d5af373787b87f6bf0dd9c9", width: 2048, height: 3072 },
  { therapistId: "T13", context: "list_desktop", filename: "T13_叶伶_Eileen_approved_full.jpg", sha256: "2db7cb749d59e5cccebc0df21de77993f83933116f7d1ba60512b9a12d69e7b8", width: 2048, height: 3072 },
  { therapistId: "T13", context: "list_mobile", filename: "T13_叶伶_Eileen_approved_full.jpg", sha256: "2db7cb749d59e5cccebc0df21de77993f83933116f7d1ba60512b9a12d69e7b8", width: 2048, height: 3072 },
  { therapistId: "T13", context: "detail_desktop", filename: "T13_叶伶_Eileen_approved_full.jpg", sha256: "2db7cb749d59e5cccebc0df21de77993f83933116f7d1ba60512b9a12d69e7b8", width: 2048, height: 3072 },
  { therapistId: "T13", context: "detail_mobile", filename: "T13_叶伶_Eileen_approved_full.jpg", sha256: "2db7cb749d59e5cccebc0df21de77993f83933116f7d1ba60512b9a12d69e7b8", width: 2048, height: 3072 },
  { therapistId: "T14", context: "list_desktop", filename: "T14_麦兜_Michelle_approved_full.jpg", sha256: "543decd288bbe612e23c406600299a13392cbe171b00608a295b70a4f67f53a0", width: 2048, height: 3072 },
  { therapistId: "T14", context: "list_mobile", filename: "T14_麦兜_Michelle_approved_full.jpg", sha256: "543decd288bbe612e23c406600299a13392cbe171b00608a295b70a4f67f53a0", width: 2048, height: 3072 },
  { therapistId: "T14", context: "detail_desktop", filename: "T14_麦兜_Michelle_approved_full.jpg", sha256: "543decd288bbe612e23c406600299a13392cbe171b00608a295b70a4f67f53a0", width: 2048, height: 3072 },
  { therapistId: "T14", context: "detail_mobile", filename: "T14_麦兜_Michelle_approved_full.jpg", sha256: "543decd288bbe612e23c406600299a13392cbe171b00608a295b70a4f67f53a0", width: 2048, height: 3072 },
  { therapistId: "T15", context: "list_desktop", filename: "T15_刘磊_Lily_approved_full.jpg", sha256: "db8d317481ec93ef04b9e6c42980510218ff9a91a86b23b831ecf4ae10bf16ee", width: 2048, height: 3072 },
  { therapistId: "T15", context: "list_mobile", filename: "T15_刘磊_Lily_approved_full.jpg", sha256: "db8d317481ec93ef04b9e6c42980510218ff9a91a86b23b831ecf4ae10bf16ee", width: 2048, height: 3072 },
  { therapistId: "T15", context: "detail_desktop", filename: "T15_刘磊_Lily_approved_full.jpg", sha256: "db8d317481ec93ef04b9e6c42980510218ff9a91a86b23b831ecf4ae10bf16ee", width: 2048, height: 3072 },
  { therapistId: "T15", context: "detail_mobile", filename: "T15_刘磊_Lily_approved_full.jpg", sha256: "db8d317481ec93ef04b9e6c42980510218ff9a91a86b23b831ecf4ae10bf16ee", width: 2048, height: 3072 },
  { therapistId: "T16", context: "list_desktop", filename: "T16_张菁_Jennifer_approved_full.jpg", sha256: "ae3c27ce665dcf7cc0d3f74f8c17f16bbf17e55289a2a7f36528cf0dfe39c8a3", width: 2048, height: 3072 },
  { therapistId: "T16", context: "list_mobile", filename: "T16_张菁_Jennifer_approved_full.jpg", sha256: "ae3c27ce665dcf7cc0d3f74f8c17f16bbf17e55289a2a7f36528cf0dfe39c8a3", width: 2048, height: 3072 },
  { therapistId: "T16", context: "detail_desktop", filename: "T16_张菁_Jennifer_approved_full.jpg", sha256: "ae3c27ce665dcf7cc0d3f74f8c17f16bbf17e55289a2a7f36528cf0dfe39c8a3", width: 2048, height: 3072 },
  { therapistId: "T16", context: "detail_mobile", filename: "T16_张菁_Jennifer_approved_full.jpg", sha256: "ae3c27ce665dcf7cc0d3f74f8c17f16bbf17e55289a2a7f36528cf0dfe39c8a3", width: 2048, height: 3072 },
  { therapistId: "T17", context: "list_desktop", filename: "T17_王艳_NIKO_approved_full.jpg", sha256: "aa8aad7612cf758e9d20584ab2584b7cf28aef8f2fcec5e87505cfd180ce14d7", width: 2048, height: 3072 },
  { therapistId: "T17", context: "list_mobile", filename: "T17_王艳_NIKO_approved_full.jpg", sha256: "aa8aad7612cf758e9d20584ab2584b7cf28aef8f2fcec5e87505cfd180ce14d7", width: 2048, height: 3072 },
  { therapistId: "T17", context: "detail_desktop", filename: "T17_王艳_NIKO_approved_full.jpg", sha256: "aa8aad7612cf758e9d20584ab2584b7cf28aef8f2fcec5e87505cfd180ce14d7", width: 2048, height: 3072 },
  { therapistId: "T17", context: "detail_mobile", filename: "T17_王艳_NIKO_approved_full.jpg", sha256: "aa8aad7612cf758e9d20584ab2584b7cf28aef8f2fcec5e87505cfd180ce14d7", width: 2048, height: 3072 },
  { therapistId: "T18", context: "list_desktop", filename: "T18_潘新瑞_Melinda_approved_full.jpg", sha256: "7249bbd439e3678d1d317e1c5af35082400f93de21a44bccec1a0d716b8f45df", width: 2048, height: 3072 },
  { therapistId: "T18", context: "list_mobile", filename: "T18_潘新瑞_Melinda_approved_full.jpg", sha256: "7249bbd439e3678d1d317e1c5af35082400f93de21a44bccec1a0d716b8f45df", width: 2048, height: 3072 },
  { therapistId: "T18", context: "detail_desktop", filename: "T18_潘新瑞_Melinda_approved_full.jpg", sha256: "7249bbd439e3678d1d317e1c5af35082400f93de21a44bccec1a0d716b8f45df", width: 2048, height: 3072 },
  { therapistId: "T18", context: "detail_mobile", filename: "T18_潘新瑞_Melinda_approved_full.jpg", sha256: "7249bbd439e3678d1d317e1c5af35082400f93de21a44bccec1a0d716b8f45df", width: 2048, height: 3072 },
  { therapistId: "T19", context: "list_desktop", filename: "T19_徐凯_Rick_approved_full.jpg", sha256: "22b70ebcc3c4fa38c173a066ea3534c31fbcc962c8f9cc2241c0a85a7d8c0f84", width: 2048, height: 3072 },
  { therapistId: "T19", context: "list_mobile", filename: "T19_徐凯_Rick_approved_full.jpg", sha256: "22b70ebcc3c4fa38c173a066ea3534c31fbcc962c8f9cc2241c0a85a7d8c0f84", width: 2048, height: 3072 },
  { therapistId: "T19", context: "detail_desktop", filename: "T19_徐凯_Rick_approved_full.jpg", sha256: "22b70ebcc3c4fa38c173a066ea3534c31fbcc962c8f9cc2241c0a85a7d8c0f84", width: 2048, height: 3072 },
  { therapistId: "T19", context: "detail_mobile", filename: "T19_徐凯_Rick_approved_full.jpg", sha256: "22b70ebcc3c4fa38c173a066ea3534c31fbcc962c8f9cc2241c0a85a7d8c0f84", width: 2048, height: 3072 },
  { therapistId: "T20", context: "list_desktop", filename: "T20_雪花_Lara_approved_full.jpg", sha256: "8469cc4d52275d00fad1603ebf542be2c245a08bafd6f9ac1a2a27d43651feee", width: 2048, height: 3072 },
  { therapistId: "T20", context: "list_mobile", filename: "T20_雪花_Lara_approved_full.jpg", sha256: "8469cc4d52275d00fad1603ebf542be2c245a08bafd6f9ac1a2a27d43651feee", width: 2048, height: 3072 },
  { therapistId: "T20", context: "detail_desktop", filename: "T20_雪花_Lara_approved_full.jpg", sha256: "8469cc4d52275d00fad1603ebf542be2c245a08bafd6f9ac1a2a27d43651feee", width: 2048, height: 3072 },
  { therapistId: "T20", context: "detail_mobile", filename: "T20_雪花_Lara_approved_full.jpg", sha256: "8469cc4d52275d00fad1603ebf542be2c245a08bafd6f9ac1a2a27d43651feee", width: 2048, height: 3072 },
  { therapistId: "T21", context: "list_desktop", filename: "T21_许安_Jimmy_approved_full.jpg", sha256: "6edba634d1a034c58fd9c23481c7cbe93c47fcd24c9551c9e9b96be49313c1d5", width: 2048, height: 3072 },
  { therapistId: "T21", context: "list_mobile", filename: "T21_许安_Jimmy_approved_full.jpg", sha256: "6edba634d1a034c58fd9c23481c7cbe93c47fcd24c9551c9e9b96be49313c1d5", width: 2048, height: 3072 },
  { therapistId: "T21", context: "detail_desktop", filename: "T21_许安_Jimmy_approved_full.jpg", sha256: "6edba634d1a034c58fd9c23481c7cbe93c47fcd24c9551c9e9b96be49313c1d5", width: 2048, height: 3072 },
  { therapistId: "T21", context: "detail_mobile", filename: "T21_许安_Jimmy_approved_full.jpg", sha256: "6edba634d1a034c58fd9c23481c7cbe93c47fcd24c9551c9e9b96be49313c1d5", width: 2048, height: 3072 },
  { therapistId: "T22", context: "list_desktop", filename: "T22_周传美_Rose_approved_full.jpg", sha256: "458367eececbaa0480715737171d0498b5805096907f2852cc0573402c6cfc9b", width: 2048, height: 3072 },
  { therapistId: "T22", context: "list_mobile", filename: "T22_周传美_Rose_approved_full.jpg", sha256: "458367eececbaa0480715737171d0498b5805096907f2852cc0573402c6cfc9b", width: 2048, height: 3072 },
  { therapistId: "T22", context: "detail_desktop", filename: "T22_周传美_Rose_approved_full.jpg", sha256: "458367eececbaa0480715737171d0498b5805096907f2852cc0573402c6cfc9b", width: 2048, height: 3072 },
  { therapistId: "T22", context: "detail_mobile", filename: "T22_周传美_Rose_approved_full.jpg", sha256: "458367eececbaa0480715737171d0498b5805096907f2852cc0573402c6cfc9b", width: 2048, height: 3072 },
  { therapistId: "T23", context: "list_desktop", filename: "T23_汪芳_Mary_approved_full.jpg", sha256: "6a25c5fd34515211b2a88ae308597deb91787996b49e8184ebe02c9e907c049e", width: 2048, height: 3072 },
  { therapistId: "T23", context: "list_mobile", filename: "T23_汪芳_Mary_approved_full.jpg", sha256: "6a25c5fd34515211b2a88ae308597deb91787996b49e8184ebe02c9e907c049e", width: 2048, height: 3072 },
  { therapistId: "T23", context: "detail_desktop", filename: "T23_汪芳_Mary_approved_full.jpg", sha256: "6a25c5fd34515211b2a88ae308597deb91787996b49e8184ebe02c9e907c049e", width: 2048, height: 3072 },
  { therapistId: "T23", context: "detail_mobile", filename: "T23_汪芳_Mary_approved_full.jpg", sha256: "6a25c5fd34515211b2a88ae308597deb91787996b49e8184ebe02c9e907c049e", width: 2048, height: 3072 },
  { therapistId: "T24", context: "list_desktop", filename: "T24_柳宇哲_Jacky_approved_full.jpg", sha256: "d88132ab4d023aec8eb28bb055c0b3849fe15b02ded3afcd2c2094e3cc5e2aa5", width: 2048, height: 3072 },
  { therapistId: "T24", context: "list_mobile", filename: "T24_柳宇哲_Jacky_approved_full.jpg", sha256: "d88132ab4d023aec8eb28bb055c0b3849fe15b02ded3afcd2c2094e3cc5e2aa5", width: 2048, height: 3072 },
  { therapistId: "T24", context: "detail_desktop", filename: "T24_柳宇哲_Jacky_approved_full.jpg", sha256: "d88132ab4d023aec8eb28bb055c0b3849fe15b02ded3afcd2c2094e3cc5e2aa5", width: 2048, height: 3072 },
  { therapistId: "T24", context: "detail_mobile", filename: "T24_柳宇哲_Jacky_approved_full.jpg", sha256: "d88132ab4d023aec8eb28bb055c0b3849fe15b02ded3afcd2c2094e3cc5e2aa5", width: 2048, height: 3072 },
];

/** 站点内派生图 URL（唯一合法生产路径前缀） */
export function derivativeUrl(filename: string): string {
  return `/therapists/derivatives/${filename}`;
}

/** 按页面与 viewport 取单张派生图 URL；缺行即抛错，禁止静默回退 */
export function assetUrlFor(
  therapistId: string,
  page: "list" | "detail",
  viewportWidth: number
): string {
  const row = resolveTherapistAsset(THERAPIST_ASSET_ROWS, therapistId, page, viewportWidth);
  return derivativeUrl(row.filename);
}

/** 四端派生图对：<picture> 用（desktop + mobile），同页同源、禁止跨场景互借 */
export function resolveTherapistPair(
  therapistId: string,
  page: "list" | "detail"
): { desktop: string; mobile: string; objectPositionPct?: string } {
  const d = THERAPIST_ASSET_ROWS.find(
    (r) => r.therapistId === therapistId && r.context === `${page}_desktop`,
  );
  const m = THERAPIST_ASSET_ROWS.find(
    (r) => r.therapistId === therapistId && r.context === `${page}_mobile`,
  );
  if (!d || !m) throw new Error(`THERAPIST_ASSET_MISSING:${therapistId}:${page}`);
  if (/fullbody|全身|master/i.test(d.filename) || /fullbody|全身|master/i.test(m.filename)) {
    throw new Error(`THERAPIST_MASTER_FORBIDDEN_IN_PRODUCTION:${d.filename}`);
  }
  return { desktop: derivativeUrl(d.filename), mobile: derivativeUrl(m.filename), objectPositionPct: d.objectPositionPct };
}

// ============================================================
// v3.1 补充：24 人元数据与 alt（来自 24人alt与语义清单.csv）
// ============================================================

export interface TherapistMeta {
  therapistId: string;
  cnName: string;
  enName: string;
  listAlt: string;
  detailAlt: string;
}

export const THERAPIST_META: TherapistMeta[] = [
  { therapistId: "T01", cnName: "彭瑞", enName: "Rita", listAlt: "彭瑞心理师头像", detailAlt: "彭瑞心理师" },
  { therapistId: "T02", cnName: "范晓", enName: "Nicolas", listAlt: "范晓心理师头像", detailAlt: "范晓心理师" },
  { therapistId: "T03", cnName: "舒瑱", enName: "Susan", listAlt: "舒瑱心理师头像", detailAlt: "舒瑱心理师" },
  { therapistId: "T04", cnName: "瑞琪", enName: "Rachel", listAlt: "瑞琪心理师头像", detailAlt: "瑞琪心理师" },
  { therapistId: "T05", cnName: "天岚", enName: "Christy", listAlt: "天岚心理师头像", detailAlt: "天岚心理师" },
  { therapistId: "T06", cnName: "万从容", enName: "Candice", listAlt: "万从容心理师头像", detailAlt: "万从容心理师" },
  { therapistId: "T07", cnName: "丁怡", enName: "Dingding", listAlt: "丁怡心理师头像", detailAlt: "丁怡心理师" },
  { therapistId: "T08", cnName: "徐玮伶", enName: "Fiona", listAlt: "徐玮伶心理师头像", detailAlt: "徐玮伶心理师" },
  { therapistId: "T09", cnName: "闫雪", enName: "Qiqi", listAlt: "闫雪心理师头像", detailAlt: "闫雪心理师" },
  { therapistId: "T10", cnName: "墨瑞", enName: "Moris", listAlt: "墨瑞心理师头像", detailAlt: "墨瑞心理师" },
  { therapistId: "T11", cnName: "陈一明", enName: "Amy", listAlt: "陈一明心理师头像", detailAlt: "陈一明心理师" },
  { therapistId: "T12", cnName: "祖迪", enName: "Zudi", listAlt: "祖迪心理师头像", detailAlt: "祖迪心理师" },
  { therapistId: "T13", cnName: "叶伶", enName: "Eileen", listAlt: "叶伶心理师头像", detailAlt: "叶伶心理师" },
  { therapistId: "T14", cnName: "麦兜", enName: "Michelle", listAlt: "麦兜心理师头像", detailAlt: "麦兜心理师" },
  { therapistId: "T15", cnName: "刘磊", enName: "Lily", listAlt: "刘磊心理师头像", detailAlt: "刘磊心理师" },
  { therapistId: "T16", cnName: "张菁", enName: "Jennifer", listAlt: "张菁心理师头像", detailAlt: "张菁心理师" },
  { therapistId: "T17", cnName: "王艳", enName: "NIKO", listAlt: "王艳心理师头像", detailAlt: "王艳心理师" },
  { therapistId: "T18", cnName: "潘新瑞", enName: "Melinda", listAlt: "潘新瑞心理师头像", detailAlt: "潘新瑞心理师" },
  { therapistId: "T19", cnName: "徐凯", enName: "Rick", listAlt: "徐凯心理师头像", detailAlt: "徐凯心理师" },
  { therapistId: "T20", cnName: "雪花", enName: "Lara", listAlt: "雪花心理师头像", detailAlt: "雪花心理师" },
  { therapistId: "T21", cnName: "许安", enName: "Jimmy", listAlt: "许安心理师头像", detailAlt: "许安心理师" },
  { therapistId: "T22", cnName: "周传美", enName: "Rose", listAlt: "周传美心理师头像", detailAlt: "周传美心理师" },
  { therapistId: "T23", cnName: "汪芳", enName: "Mary", listAlt: "汪芳心理师头像", detailAlt: "汪芳心理师" },
  { therapistId: "T24", cnName: "柳宇哲", enName: "Jacky", listAlt: "柳宇哲心理师头像", detailAlt: "柳宇哲心理师" },
];

/** 中文名 → T 编号（页面渲染时唯一对齐键，禁止按数组顺序猜测） */
export function therapistIdByCnName(cnName: string): string | undefined {
  return THERAPIST_META.find((m) => m.cnName === cnName)?.therapistId;
}

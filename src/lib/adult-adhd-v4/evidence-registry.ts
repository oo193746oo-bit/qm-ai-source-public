/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 循证来源注册表
 *
 * 记录 APA / CDC / NICE / WHO / PubMed 等来源、版本、适用范围与最后审核日期
 * 用于审计和透明化
 */

export interface EvidenceEntry {
  id: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  doi_or_url: string;
  use_in_qm: string;
  review_status: 'current' | 'review_due' | 'superseded';
  last_reviewed: string; // ISO date
  level: 'clinical_guideline' | 'validation_study' | 'educational' | 'review';
}

export const EVIDENCE_REGISTRY: EvidenceEntry[] = [
  {
    id: 'E01',
    title: 'The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population',
    authors: 'Kessler RC et al.',
    year: 2005,
    source: 'Psychological Medicine',
    doi_or_url: '10.1017/S0033291704002892',
    use_in_qm: 'ASRS 18题与6题筛查器的开发和验证；强调筛查≠诊断',
    review_status: 'current',
    last_reviewed: '2026-08-01',
    level: 'validation_study',
  },
  {
    id: 'E02',
    title: 'The World Health Organization Adult ADHD Self-Report Screening Scale for DSM-5',
    authors: 'Kessler RC et al.',
    year: 2017,
    source: 'JAMA Psychiatry',
    doi_or_url: 'PMID:28384801',
    use_in_qm: 'ASRS-5六题DSM-5筛查器及其验证',
    review_status: 'current',
    last_reviewed: '2026-08-01',
    level: 'validation_study',
  },
  {
    id: 'E03',
    title: 'What is ADHD? / DSM-5 ADHD educational summary',
    authors: 'American Psychiatric Association',
    year: 2013,
    source: 'American Psychiatric Association',
    doi_or_url: 'https://www.psychiatry.org/',
    use_in_qm: '成人≥17岁核心症状数、儿童期起始、多个情境和功能损害等诊断框架',
    review_status: 'current',
    last_reviewed: '2026-08-01',
    level: 'educational',
  },
  {
    id: 'E04',
    title: 'NICE Guideline NG87: Attention deficit hyperactivity disorder: diagnosis and management',
    authors: 'National Institute for Health and Care Excellence',
    year: 2019,
    source: 'NICE',
    doi_or_url: 'https://www.nice.org.uk/guidance/ng87',
    use_in_qm: 'ADHD诊断需要完整临床/心理社会/发展史评估，不能只靠量表',
    review_status: 'current',
    last_reviewed: '2026-08-01',
    level: 'clinical_guideline',
  },
  {
    id: 'E05',
    title: 'ADHD in Adults',
    authors: 'CDC',
    year: 2026,
    source: 'Centers for Disease Control and Prevention',
    doi_or_url: 'https://www.cdc.gov/ncbddd/adhd/',
    use_in_qm: '成人评估需回顾儿童期、可能收集他人信息，并考虑焦虑、抑郁、睡眠、物质使用、学习问题等重叠因素',
    review_status: 'current',
    last_reviewed: '2026-08-01',
    level: 'educational',
  },
  {
    id: 'E06',
    title: 'Validation of expanded ASRS/AISRS versions including executive function deficits and emotional dyscontrol',
    authors: 'Adler LA et al.',
    year: 2018,
    source: 'Journal of Attention Disorders',
    doi_or_url: 'PMID:29419345',
    use_in_qm: '支持把执行功能与情绪调节作为扩展描述层，但不把它们混入DSM核心症状',
    review_status: 'current',
    last_reviewed: '2026-08-01',
    level: 'validation_study',
  },
];

export const EVIDENCE_SUMMARY = {
  total_references: EVIDENCE_REGISTRY.length,
  last_audit_date: '2026-08-01',
  next_scheduled_review: '2027-02-01',
  scope_note:
    'QM扩展问卷（48题）是结构化自我观察工具，不是经过临床验证的独立诊断量表。' +
    '官方ASRS筛查模块需由项目方另行配置经批准的版本。',
  version_note: 'v4.0 | 双层循证架构：Evidence Screener + QM Context Profile',
};

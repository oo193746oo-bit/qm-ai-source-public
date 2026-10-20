// SCL-90 测评合并工具
// 用于在不修改 data.ts 的情况下，将 SCL-90 接入测评列表

import { scl90Assessment } from './scl90-data';

/**
 * 把 SCL-90 测评追加到现有测评列表中
 * 使用方法：在 src/app/assessments/page.tsx 中：
 *   import { addToAssessments } from '@/lib/assessments/scl90-merge';
 *   const displayList = addToAssessments(allAssessments);
 *
 * 注意：不修改原 data.ts，保持原有 7 个测评不变
 */
export function addToAssessments(allList: any[]): any[] {
  // 防止重复添加
  if (allList.some((a) => a.id === 'scl90')) {
    return allList;
  }
  return [...allList, scl90Assessment];
}

export { scl90Assessment } from './scl90-data';

"use client";

import { ZoneRedirect } from "@/components/kb/zone-redirect";

export default function Zone09Page() {
  return (
    <ZoneRedirect
      zoneId="z09"
      zoneName="学习与工作"
      zoneEmoji="💼"
      targetPath="/knowledge/domain/D08"
      targetName="工作与职业"
    />
  );
}

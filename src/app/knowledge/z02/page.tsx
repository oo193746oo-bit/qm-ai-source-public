"use client";

import { ZoneRedirect } from "@/components/kb/zone-redirect";

export default function Zone02Page() {
  return (
    <ZoneRedirect
      zoneId="z02"
      zoneName="我最近怎么了"
      zoneEmoji="🌧️"
      targetPath="/knowledge/domain/D01"
      targetName="情绪与感受"
    />
  );
}

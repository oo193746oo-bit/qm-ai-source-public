"use client";

import { ZoneRedirect } from "@/components/kb/zone-redirect";

export default function Zone03Page() {
  return (
    <ZoneRedirect
      zoneId="z03"
      zoneName="关系里的我"
      zoneEmoji="💞"
      targetPath="/knowledge/domain/D02"
      targetName="亲密关系"
    />
  );
}

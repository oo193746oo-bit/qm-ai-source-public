"use client";

import { ZoneRedirect } from "@/components/kb/zone-redirect";

export default function Zone08Page() {
  return (
    <ZoneRedirect
      zoneId="z08"
      zoneName="成长与自我"
      zoneEmoji="🦋"
      targetPath="/knowledge/domain/D07"
      targetName="自我与成长"
    />
  );
}

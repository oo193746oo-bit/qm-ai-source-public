"use client";

import { ZoneRedirect } from "@/components/kb/zone-redirect";

export default function Zone01Page() {
  return (
    <ZoneRedirect
      zoneId="z01"
      zoneName="第一次来到这里"
      zoneEmoji="🌱"
      targetPath="/knowledge/domain/D07"
      targetName="自我与成长"
    />
  );
}

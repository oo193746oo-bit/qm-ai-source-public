"use client";

import { ZoneRedirect } from "@/components/kb/zone-redirect";

export default function Zone10Page() {
  return (
    <ZoneRedirect
      zoneId="z10"
      zoneName="心理测评中心"
      zoneEmoji="📊"
      targetPath="/knowledge/domain/D16"
      targetName="心理学怎么理解人"
    />
  );
}

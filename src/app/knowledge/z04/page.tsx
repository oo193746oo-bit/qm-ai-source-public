"use client";

import { ZoneRedirect } from "@/components/kb/zone-redirect";

export default function Zone04Page() {
  return (
    <ZoneRedirect
      zoneId="z04"
      zoneName="情绪调节工具箱"
      zoneEmoji="🧰"
      targetPath="/knowledge/domain/D12"
      targetName="心理工具箱"
    />
  );
}

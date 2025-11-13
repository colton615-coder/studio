import React from "react";
import { useDeviceValidation } from "@/hooks/useDeviceValidation";
import { Card } from "@/components/ui/Card";

export default function DeviceValidationBanner() {
  const { isValid, issues } = useDeviceValidation();
  if (isValid) return null;
  return (
    <Card className="mb-4 bg-warning/10 border-warning text-warning">
      <div className="flex flex-col gap-2">
        <span className="font-bold">Device Compatibility Issues Detected</span>
        <ul className="list-disc ml-4 text-sm">
          {issues.map((issue, idx) => (
            <li key={idx}>{issue}</li>
          ))}
        </ul>
        <span className="text-xs">Some features may not work optimally on this device.</span>
      </div>
    </Card>
  );
}

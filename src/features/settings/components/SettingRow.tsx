/** SettingRow — a single setting entry with label and control. */
import React from 'react';
interface Props { label: string; children: React.ReactNode; }
export function SettingRow({ label, children }: Props) {
  return <div className="setting-row"><label>{label}</label>{children}</div>;
}

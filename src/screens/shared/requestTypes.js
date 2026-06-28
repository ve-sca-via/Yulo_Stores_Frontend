// Shared assistance-request taxonomy used by the customer app and the staff
// (waiter/manager) request boards so labels and icons stay consistent.

import {
  BellRing,
  CircleX,
  GlassWater,
  MessageCircle,
  PenLine,
  ReceiptText,
  Sparkles,
} from "lucide-react";

export const REQUEST_TYPES = [
  { value: "call_waiter", label: "Call Waiter", icon: BellRing },
  { value: "water", label: "Need Water", icon: GlassWater },
  { value: "bill", label: "Need Bill", icon: ReceiptText },
  { value: "cleaning", label: "Need Cleaning", icon: Sparkles },
  { value: "modify", label: "Modify Order", icon: PenLine },
  { value: "cancel", label: "Cancel Order", icon: CircleX },
  { value: "other", label: "Other", icon: MessageCircle },
];

export const REQUEST_TYPE_MAP = Object.fromEntries(
  REQUEST_TYPES.map((t) => [t.value, t]),
);

export function requestLabel(value) {
  return REQUEST_TYPE_MAP[value]?.label ?? "Assistance";
}

export const STATUS_TONE = {
  open: "bg-[#FFF3E0] text-[#D9480F]",
  acknowledged: "bg-[#E7F0FB] text-[#1565C0]",
  resolved: "bg-[#E8F5EC] text-[#2E7D32]",
};

export function timeAgo(value) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

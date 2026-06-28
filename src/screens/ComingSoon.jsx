// Placeholder for sidebar destinations that aren't built yet, so navigation
// and active-highlighting stay consistent across the app.

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function ComingSoon({ title }) {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        <CardContent className="flex h-64 items-center justify-center p-6 text-muted-foreground">
          {title} screen — coming soon.
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

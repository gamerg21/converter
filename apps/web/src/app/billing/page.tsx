import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getUsage() {
  try {
    const response = await fetch("http://localhost:4000/v1/usage", { cache: "no-store" });
    if (!response.ok) return {};
    const payload = await response.json();
    return payload.data ?? {};
  } catch {
    return {};
  }
}

async function getPlans() {
  try {
    const response = await fetch("http://localhost:4000/v1/billing/plans", { cache: "no-store" });
    if (!response.ok) return [];
    const payload = await response.json();
    return payload.data ?? [];
  } catch {
    return [];
  }
}

async function getSubscription() {
  try {
    const response = await fetch("http://localhost:4000/v1/billing/subscription", {
      cache: "no-store"
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.data;
  } catch {
    return null;
  }
}

export default async function BillingPage() {
  const usage = await getUsage();
  const plans = await getPlans();
  const subscription = await getSubscription();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            Billing
          </Badge>
          <CardTitle className="text-2xl">Billing and quotas</CardTitle>
          <CardDescription>Plan limits, usage metering, and Stripe subscription status.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current usage</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs">
              {JSON.stringify(usage, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs">
              {JSON.stringify(subscription, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available plans</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs">
            {JSON.stringify(plans, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

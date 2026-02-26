import { JobsTable } from "../../components/jobs/jobs-table";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            Operations
          </Badge>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
          <CardDescription>
            Track job statuses, retries, and download completed outputs.
          </CardDescription>
        </CardHeader>
      </Card>
      <JobsTable />
    </div>
  );
}

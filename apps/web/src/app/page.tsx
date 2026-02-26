import { JobsTable } from "../components/jobs/jobs-table";
import { UploadWorkspace } from "../components/upload/upload-workspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            Built for speed
          </Badge>
          <CardTitle className="text-3xl">Convertr</CardTitle>
          <CardDescription className="max-w-3xl text-base leading-relaxed">
          Online file convertr for audio, video, document, ebook, archive, image, spreadsheet and
          presentation formats.
          </CardDescription>
        </CardHeader>
      </Card>
      <UploadWorkspace />
      <JobsTable />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              +200 Formats Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Convert nearly all audio, video, document, ebook, archive, image, spreadsheet and
              presentation formats.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Signed uploads/downloads, scoped API keys, and workspace-level tenancy isolation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

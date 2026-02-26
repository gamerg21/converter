"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Job = {
  id: string;
  sourceFormat: string;
  targetFormat: string;
  status: string;
  progress: number;
  createdAt: string;
};

export function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const initializedDownloadsRef = useRef(false);
  const downloadedJobIdsRef = useRef<Set<string>>(new Set());

  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:4000/v1/jobs", { cache: "no-store" });
      if (!response.ok) {
        setJobs([]);
        return;
      }
      const payload = await response.json();
      setJobs(payload.data ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadJobs();
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [loadJobs]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!initializedDownloadsRef.current) {
      for (const job of jobs) {
        if (job.status === "FINISHED") {
          downloadedJobIdsRef.current.add(job.id);
        }
      }
      initializedDownloadsRef.current = true;
      return;
    }

    for (const job of jobs) {
      if (job.status !== "FINISHED" || downloadedJobIdsRef.current.has(job.id)) {
        continue;
      }

      downloadedJobIdsRef.current.add(job.id);
      const link = document.createElement("a");
      link.href = `http://localhost:4000/v1/jobs/${job.id}/download`;
      link.download = "";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }, [jobs, loading]);

  const hasOldJobs = useMemo(
    () => jobs.some((job) => job.status === "FINISHED" || job.status === "FAILED" || job.status === "CANCELED"),
    [jobs]
  );

  const deleteJob = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`http://localhost:4000/v1/jobs/${id}`, { method: "DELETE" });
      await loadJobs();
    } finally {
      setBusyId(null);
    }
  };

  const clearOldJobs = async () => {
    setBusyId("clear-all");
    try {
      await fetch("http://localhost:4000/v1/jobs", { method: "DELETE" });
      await loadJobs();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Recent jobs</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearOldJobs}
          disabled={!hasOldJobs || busyId === "clear-all"}
        >
          Clear old jobs
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
        ) : !jobs.length ? (
          <p className="text-sm text-muted-foreground">No jobs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Download</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}</TableCell>
                  <TableCell>{job.sourceFormat} to {job.targetFormat}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.progress}%</TableCell>
                  <TableCell>
                    {job.status === "FINISHED" ? (
                      <a
                        className="text-sm underline underline-offset-2"
                        href={`http://localhost:4000/v1/jobs/${job.id}/download`}
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not ready</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteJob(job.id)}
                      disabled={
                        busyId === job.id || job.status === "QUEUED" || job.status === "PROCESSING"
                      }
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

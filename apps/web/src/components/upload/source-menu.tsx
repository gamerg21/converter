"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SOURCES = [
  "From my Computer",
  "By URL"
];

type SourceMenuProps = {
  onFileSelected?: (file: File | null) => void;
  onUrlSelected?: (url: string | null) => void;
};

export function SourceMenu({ onFileSelected, onUrlSelected }: SourceMenuProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(SOURCES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [pickedFiles, setPickedFiles] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPickedFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      onFileSelected?.(null);
      return;
    }
    const fileList = Array.from(files);
    setSelected("From my Computer");
    setPickedFiles(fileList.map((file) => file.name));
    onFileSelected?.(fileList[0] ?? null);
    onUrlSelected?.(null);
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      return;
    }
    setSelected("By URL");
    setPickedFiles([]);
    onFileSelected?.(null);
    onUrlSelected?.(trimmed);
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Upload files</CardTitle>
        <CardDescription>Choose a source and select one or more files to convert.</CardDescription>
      </CardHeader>
      <CardContent>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => applyPickedFiles(event.target.files)}
      />
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => setOpen((value) => !value)}>
            Add more files
          </Button>
          <span className="text-sm text-muted-foreground">{selected}</span>
        </div>

        {open && (
          <ul className="absolute left-6 top-[7.35rem] z-20 w-56 rounded-lg border border-border bg-popover p-2 shadow-lg">
            {SOURCES.map((source) => (
              <li key={source}>
                <button
                  className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                  type="button"
                  onClick={() => {
                    setSelected(source);
                    setOpen(false);
                    if (source === "From my Computer") {
                      fileInputRef.current?.click();
                    }
                    if (source !== "By URL") {
                      setUrlInput("");
                      onUrlSelected?.(null);
                    }
                  }}
                >
                  {source}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected === "By URL" && (
          <div className="mt-4 grid gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="Paste a direct file URL (https://...)"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="button" variant="outline" onClick={applyUrl} disabled={!urlInput.trim()}>
              Use URL
            </Button>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          applyPickedFiles(event.dataTransfer.files);
        }}
          className={`mt-4 grid min-h-28 w-full place-items-center rounded-lg border border-dashed p-4 text-center text-sm transition-colors ${
            isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-accent/50"
          }`}
          disabled={selected === "By URL"}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span>
              {pickedFiles.length > 0
                ? `Selected: ${pickedFiles.slice(0, 2).join(", ")}${pickedFiles.length > 2 ? ` +${pickedFiles.length - 2} more` : ""}`
                : "Drag and drop files here, or click to browse"}
            </span>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}

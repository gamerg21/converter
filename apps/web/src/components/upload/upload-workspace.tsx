"use client";

import { useState } from "react";
import { SourceMenu } from "./source-menu";
import { ConvertrForm } from "./convertr-form";

export function UploadWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <SourceMenu
        onFileSelected={(file) => {
          setSelectedFile(file);
          if (file) {
            setSelectedUrl(null);
          }
        }}
        onUrlSelected={(url) => {
          setSelectedUrl(url);
          if (url) {
            setSelectedFile(null);
          }
        }}
      />
      <ConvertrForm selectedFile={selectedFile} selectedUrl={selectedUrl} />
    </div>
  );
}

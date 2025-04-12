import React from "react";

interface DiffViewerProps {
  localContent: string;
  remoteContent: string;
  fileName: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  localContent,
  remoteContent,
  fileName,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{fileName}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="mb-2 font-medium">Local Changes</h3>
          <pre className="block bg-gray-100 p-4 rounded">
            <code
              role="code"
              className="whitespace-pre block"
              data-testid="local-code"
            >
              {localContent}
            </code>
          </pre>
        </div>
        <div>
          <h3 className="mb-2 font-medium">Remote Changes</h3>
          <pre className="block bg-gray-100 p-4 rounded">
            <code
              role="code"
              className="whitespace-pre block"
              data-testid="remote-code"
            >
              {remoteContent}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

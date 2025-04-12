import React from "react";
import { render, screen } from "@testing-library/react";
import { DiffViewer } from "./DiffViewer";

describe("DiffViewer", () => {
  const mockLocalContent = `function example() {
  return 'local version';
}`;
  const mockRemoteContent = `function example() {
  return 'remote version';
}`;

  it("renders local and remote content side by side", () => {
    render(
      <DiffViewer
        localContent={mockLocalContent}
        remoteContent={mockRemoteContent}
        fileName="src/example.ts"
      />,
    );

    expect(screen.getByText("Local Changes")).toBeInTheDocument();
    expect(screen.getByText("Remote Changes")).toBeInTheDocument();
    expect(screen.getByText(/local version/)).toBeInTheDocument();
    expect(screen.getByText(/remote version/)).toBeInTheDocument();
  });

  it("displays the file name", () => {
    render(
      <DiffViewer
        localContent={mockLocalContent}
        remoteContent={mockRemoteContent}
        fileName="src/example.ts"
      />,
    );

    expect(screen.getByText("src/example.ts")).toBeInTheDocument();
  });

  it("renders code blocks with proper formatting", () => {
    render(
      <DiffViewer
        localContent={mockLocalContent}
        remoteContent={mockRemoteContent}
        fileName="src/example.ts"
      />,
    );

    const localCode = screen.getByTestId("local-code");
    const remoteCode = screen.getByTestId("remote-code");
    expect(localCode.textContent).toBe(mockLocalContent);
    expect(remoteCode.textContent).toBe(mockRemoteContent);
  });
});

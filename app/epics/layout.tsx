import { ClientLayout } from "../client-layout";

export default function EpicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}

import { VisitorLayout } from "@/components/layout/VisitorLayout";

export default function Layout({ children }: LayoutProps<"/">) {
  return <VisitorLayout>{children}</VisitorLayout>;
}

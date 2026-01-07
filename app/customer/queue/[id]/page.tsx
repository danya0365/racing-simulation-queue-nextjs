import { QueueStatusView } from "@/src/presentation/components/customer/QueueStatusView";
import type { Metadata } from "next";

interface QueueStatusPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: QueueStatusPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `สถานะคิว #${resolvedParams.id} | Racing Queue`,
    description: "ติดตามสถานะคิวของคุณ",
  };
}

export default async function QueueStatusPage({ params }: QueueStatusPageProps) {
  const resolvedParams = await params;
  
  return <QueueStatusView queueId={resolvedParams.id} />;
}

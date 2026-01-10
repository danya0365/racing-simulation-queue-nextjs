import { ProfileSkeleton } from "@/src/presentation/components/ui/Skeleton";

/**
 * Loading UI for Profile page
 * This file is automatically used by Next.js as the loading fallback
 * when the page.tsx is fetching data server-side
 */
export default function Loading() {
  return <ProfileSkeleton />;
}

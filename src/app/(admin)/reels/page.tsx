import { ReelsFeed } from "@/components/reels/reels-feed";
import { getPublishedShorts } from "@/lib/shorts-data";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const reels = await getPublishedShorts();

  return <ReelsFeed reels={reels} />;
}

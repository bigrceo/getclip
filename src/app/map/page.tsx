import { MapHero } from "@/components/MapHero";
import { listCoins } from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "The map", description: "Every GTA 6 clip coin takes a plot somewhere in Leonida." };
export default async function MapPage() {
  const coins = await listCoins("mcap", 60);
  return <MapHero coins={coins} volumeSol={0} />;
}

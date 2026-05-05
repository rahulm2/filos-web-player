import playbackPlan from "@/data/tomato-risotto.json";
import { CookalongPlayer } from "@/components/CookalongPlayer";
import type { PlaybackPlan } from "@/lib/types";

export default function Home() {
  return <CookalongPlayer plan={playbackPlan as unknown as PlaybackPlan} />;
}

import Simulator from "@/components/features/simulator/simulator";
import MobileDetect from "@/components/common/mobile-detect";

export default function Home() {
  return (
    <MobileDetect>
      <Simulator />
    </MobileDetect>
  );
}

import Simulator from "@/components/simulator";
import MobileDetect from "@/components/mobile-detect";

export default function Home() {
  return (
    <MobileDetect>
      <Simulator />
    </MobileDetect>
  );
}

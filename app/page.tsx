import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Logo from "@/public/kaia_safe_lite_main3.png";

export default function Home() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121312', minHeight: '100vh' }}>
      <Image src={Logo} alt="logo" width={906} height={293}/>
    </div>
  );
}

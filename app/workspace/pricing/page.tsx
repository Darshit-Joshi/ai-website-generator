import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full h-screen">
      <h2>Pricing</h2>
      <div className="flex w-[800px]">
        <PricingTable />
      </div>
    </div>
  );
}

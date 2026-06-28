import WaiterLayout, { WaiterPageHeader } from "./WaiterLayout";
import RequestsBoard from "@/screens/shared/RequestsBoard";

export default function WaiterRequests() {
  return (
    <WaiterLayout>
      <WaiterPageHeader
        title="Customer Requests"
        subtitle="Respond to guest assistance requests from your tables."
      />
      <div className="px-4 py-5 sm:px-5">
        <RequestsBoard />
      </div>
    </WaiterLayout>
  );
}

import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import CSVUploader from "../csvParser";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 p-6"></div>
      </div>
      <div>
        <h1>CSV Uploader Example</h1>
        <CSVUploader />
      </div>
    </SidebarProvider>
  );
}

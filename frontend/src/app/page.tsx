import { redirect } from "next/navigation";
import "@/app/globals.css"
export default function Home() {
  // Perform a server-side redirect
  redirect("/dashboard");
  // Return null because this component never renders due to the redirect
  return null;
}

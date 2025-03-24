import { redirect } from "next/navigation";

export default function NewInvestmentRedirectPage() {
  redirect("/accounts/investments");
}

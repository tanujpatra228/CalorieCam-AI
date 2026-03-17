import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function ProtectedPage() {
  return redirect(ROUTES.PROTECTED_ANALYSIS_HISTORY);
}

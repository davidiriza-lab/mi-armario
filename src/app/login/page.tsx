import { redirect } from "next/navigation";
import { Login } from "./Login";
import { esDemo } from "@/lib/demo";

export default function LoginPage() {
  if (esDemo) redirect("/");
  return <Login />;
}

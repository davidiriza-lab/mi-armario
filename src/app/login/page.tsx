import { Login } from "./Login";
import { passwordDemo } from "@/lib/demo";

export default function LoginPage() {
  return <Login demo={passwordDemo()} />;
}

import { redirect } from "next/navigation";

/** The portal has no marketing root — send everyone to the dashboard. The
 *  middleware redirects unauthenticated users on to /login from there. */
export default function RootPage() {
  redirect("/dashboard");
}

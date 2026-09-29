import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("eazybox_session")?.value;

  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}


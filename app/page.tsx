import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HomePageClient from "@/components/HomePageClient";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? { name: session.user.name ?? "" }
    : null;
  return <HomePageClient user={user} />;
}

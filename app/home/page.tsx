import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserChatAccess } from "@/lib/chat";
import HomeDashboardClient from "@/components/HomeDashboardClient";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const userId = Number((session.user as any).id);
  const userRole = (session.user as any).role ?? "user";
  const access = await getUserChatAccess(userId, userRole);

  return (
    <HomeDashboardClient
      user={{
        username: session.user.name ?? "",
        role: userRole
      }}
      agents={access.agents}
      allowedMenuKeys={access.menuKeys}
    />
  );
}

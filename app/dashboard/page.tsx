import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SectionCards } from "./_components/section-cards";
import { ChartAreaInteractive } from "./_components/chart-interactive";
import AICostMonitor from "@/components/ai-cost-monitor";

export default async function Dashboard() {
  const result = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full">
        <div className="flex flex-col items-start justify-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Business Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time insights and analytics to grow your business with data-driven decisions.
          </p>
        </div>
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartAreaInteractive />
              </div>
              <div className="lg:col-span-1">
                <AICostMonitor />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

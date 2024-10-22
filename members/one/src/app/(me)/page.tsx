import { auth, protectAuth } from "@/auth";
import BreadCrumb from "@/components/breadcrumb";
import { ConnectionClient } from "@/components/tables/connections-tables/client";
import apiService from '@/service/api.service';
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityHistoryClient } from "@/components/tables/activity-tables/client";
import UserService from 'service/user.service';
import ActivityTableSection from "./activity-history-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const breadcrumbItems = [{ title: "Home", link: "/" }];

async function getStatistics() {
  const session = await auth();
  const userService = UserService()
  if (!session) {
    return
  }

  try {
    const res = userService.getUserStatistics(session)
    return res;
  } catch (e) {
    console.log(e);
    return {
      activeAppsConnections: 0,
      activeSubscriptions: { total_count: 0 },
      expenses: 0
    };
  }
}

export default async function Page() {
  const statistics = await getStatistics();
  const session = await protectAuth()
  const user = session?.user;
  if (!user) return

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        
        <div className="text-center space-y-2 mb-12">
          <div className="flex justify-center items-center">
            <Avatar className="h-32 w-32">
              <AvatarImage
                src={user.photoURL ?? ""}
                alt={user.displayName ?? ""}
              />
              <AvatarFallback>{(user.displayName || user.email)?.[0]?.toLocaleUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-2xl font-semibold">Welcome, {user?.firstName} Inc</h1>
          <p className="text-gray-500">Manage your info, privacy, and security to make Eartho work better for you.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Apps
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.activeAppsConnections || 0}</div>
              <p className="text-xs text-muted-foreground">
                0% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscriptions
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.activeSubscriptions?.total_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                0% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics?.expenses || 0}</div>
              <p className="text-xs text-muted-foreground">
                0% from last month
              </p>
            </CardContent>
          </Card>

        </div>

        <div className="pt-8 pb-8">
          <Separator />
        </div>
        <ActivityTableSection />
      </div>
    </ScrollArea>
  );
}

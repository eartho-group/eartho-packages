import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityHistoryClient } from "@/components/tables/activity-tables/client";
import apiService from '@/service/api.service';
import { auth } from "@/auth";

async function getUserActivity() {
  const session = await auth();

  if (!session) {
    return
  }

  const res = await apiService.get('/me/activity', {
    accessToken: session.accessToken,
  });

  return res || [];
}

const ActivityTableSection = async () => {
  const userActivityData = await getUserActivity();

  return (
    <ActivityHistoryClient data={userActivityData} hideHeader={false} />
  );
};

export default ActivityTableSection;

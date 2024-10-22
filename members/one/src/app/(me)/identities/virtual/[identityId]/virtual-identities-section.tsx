import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IdentityClient } from "@/components/tables/identities-tables/client";
import apiService from '@/service/api.service';
import { auth } from "@/auth";

async function getVirtualIdentitiesData() {
    const session = await auth();

  if (!session) {
    throw new Error('No session found');
  }

  const res = await apiService.get('/me/identities', {
    accessToken: session.accessToken,
  });


  return res || [];
}

const VirtualIdentitiesSection = async () => {
  const virtualIdentitiesData = await getVirtualIdentitiesData();

  return (
    <div className="flex flex-col overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">My Virtual Identities</CardTitle>
          <CardDescription>Protect your privacy by holding virtual identities.</CardDescription>
        </CardHeader>
        <CardContent>
          <IdentityClient data={virtualIdentitiesData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualIdentitiesSection;

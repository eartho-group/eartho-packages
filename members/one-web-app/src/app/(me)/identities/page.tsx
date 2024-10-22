import BreadCrumb from "@/components/breadcrumb";
import VirtualIdentitiesSection from "./virtual/[identityId]/virtual-identities-section";
import ConnectedAccounts from "../security/multiaccount/page";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const breadcrumbItems = [{ title: "My Identity", link: "/identities" }];

export default async function Page() {

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold mb-2">Identities</h1>
        <p className="text-gray-500">
          Manage your various identities within Eartho services.
        </p>
      </div>

      <ConnectedAccounts />

      <Separator />

      <VirtualIdentitiesSection />

      <Separator />
{/* 
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Hide My Email</CardTitle>
          <CardDescription>
            Hide My Email allows you to create unique, random email addresses for use with apps, websites, and more. This keeps your personal email private.
          </CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Hide My Phone</CardTitle>
          <CardDescription>
            Hide My Phone allows you to create unique, random phone numbers for use with apps, websites, and more. This keeps your personal phone number private.
          </CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card> */}

    </div>
  );
}

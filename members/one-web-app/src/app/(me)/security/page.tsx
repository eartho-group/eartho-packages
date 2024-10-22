import BreadCrumb from "@/components/breadcrumb";
import { ActivityHistoryClient } from "@/components/tables/activity-tables/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TwoFactorAuthOptions from "./2fa/page";
import ConnectedAccounts from "./multiaccount/page";
import VerifiedEmails from "./verify/page";
import DeleteMyAccount from "./delete/page";

const breadcrumbItems = [{ title: "Security", link: "/security" }];

export default function SecurityPage() {
  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold mb-2">Security</h1>
          <p className="text-gray-500">
            Settings and recommendations to help you keep your account secure
          </p>
        </div>

        <ScrollArea className="h-full">
          <div className="flex flex-1 flex-col space-y-4 p-4 md:p-8 pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Security Check-Up</CardTitle>
                <CardDescription>Ensure your account is secure</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Your account is protected</p>
                <p>The Security Check-Up examined your account and found no recommended actions.</p>
              </CardContent>
            </Card>
            <Separator />
            <VerifiedEmails />


            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Trusted Devices</CardTitle>
                <CardDescription>Manage and secure devices linked to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-8">
                  Review and manage devices that have access to your Eartho account. Add trusted devices or remove those you don't recognize to keep your account secure.
                </p>
                {/* <TwoFactorAuthOptions /> */}
              </CardContent>
            </Card>


            <Separator />
            <ConnectedAccounts />

            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
                <CardDescription>Enhance your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-8">Protect your account with an extra layer of security by enabling two-factor authentication.</p>
                <TwoFactorAuthOptions></TwoFactorAuthOptions>
              </CardContent>
            </Card>
            
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Review your recent account activity to ensure there are no unauthorized actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHistoryClient data={[]} hideHeader={true} />
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      </div>
    </>
  );
}

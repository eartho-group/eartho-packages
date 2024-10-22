import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import DeleteMyAccount from "../security/delete/page";

export default function PrivacyAndDataSections() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold mb-2">Privacy & Data Management</h1>
        <p className="text-gray-500">
          Tools and options that allow you to control how your data is managed and shared on Eartho.<br />Take a closer look at your data, adjust permissions, and ensure your account is secure.
        </p>
      </div>

      {/* Section: Privacy Checkup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Privacy Checkup</CardTitle>
          <CardDescription>
            Take a moment to review and adjust your privacy settings. Ensure your data is being handled in a way that aligns with your preferences and gain insights into how your information is used within Eartho.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center space-x-4">
          <div>
            <Button variant="link" className="text-blue-600 mt-4">
              Start Privacy Checkup
            </Button>
          </div>
          <div className="hidden md:block">
            {/* <img
              src="https://www.gstatic.com/identity/boq/accountsettingsmobile/prvaccountshield_2x.png" // Replace with your product's image
              alt="Privacy Checkup"
              className="w-36 h-auto"
            /> */}
          </div>
        </CardContent>
      </Card>

      {/* <Separator /> */}

      {/* Section: Info You Can Share With Others */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-xl">Control What You Share</CardTitle>
          <CardDescription>
            Decide which personal details, like your name and contact information, are visible to others on Eartho. Manage your profile settings and choose who can see what, ensuring transparency and privacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
              <p>Profile Visibility</p>
              <span className="text-gray-400">Manage who can see your profile info ›</span>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
              <p>Location Sharing</p>
              <span className="text-gray-400">Control your location sharing preferences ›</span>
            </div>
          </div>
        </CardContent>
      </Card> */}

      <Separator />

      {/* Section: Data From Apps and Services You Use */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Data from Connected Apps</CardTitle>
          <CardDescription>
            Stay in control of the data shared from apps and services connected to your Eartho account. Review permissions and manage access to your information to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
            <p>Connected Apps & Services</p>
            <span className="text-gray-400">View and manage connected apps ›</span>
          </div>
          <div className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
            <p>Third-Party Integrations</p>
            <span className="text-gray-400">Manage data shared with third-party services ›</span>
          </div>
          <div className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
            <p>Email Preferences</p>
            <span className="text-gray-400">Update your communication preferences ›</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section: Make a Plan for Your Digital Legacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Plan Your Digital Legacy</CardTitle>
          <CardDescription>
            Plan what happens to your data when you’re no longer able to use your Eartho account. Set up an Inactive Account Manager to decide how your information is handled in the future.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4"> {/* Added padding class "p-4" */}
          <div className="flex justify-between items-center p-4 border rounded-lg shadow-sm">
            <p>Manage Your Digital Legacy</p>
            <span className="text-gray-400">›</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section: Advanced Data Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Advanced Data Protection</CardTitle>
          <CardDescription>
            Eartho offers Advanced Data Protection to ensure your sensitive information is kept safe with end-to-end encryption. Your data can only be decrypted on your trusted devices, protecting it even in the event of a breach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4"> {/* Added padding class "p-4" */}
          <p className="text-lg">
            Eartho will not have access to your encryption keys. Ensure that you have verified recovery methods in place to prevent losing access to your data.
          </p>
          <div className="flex justify-between items-center p-4 border rounded-lg shadow-sm text-red-600">
            <p>Turn On Advanced Data Protection</p>
            <span className="text-red-400">›</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section: Delete Your Eartho Account */}
      <DeleteMyAccount />
      
    </div>
  );
}

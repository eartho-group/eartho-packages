import BreadCrumb from "@/components/breadcrumb";
import apiService from '@/service/api.service';
import { auth } from "@/auth";
import ProfileSection from "./profile/profile-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const breadcrumbItems = [{ title: "My Identity", link: "/identities" }];

export default async function Page() {

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">

      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold mb-2">Personal info</h1>
        <p className="text-gray-500">
          Info about you across Eartho services
        </p>
      </div>

      {/* Profile Info Section */}
      <div className="pb-4">
        <div className="mb-4">
          <h2 className="text-2xl ">Your profile info in Eartho</h2>
        </div>
        <div className="text-gray-600">
          Personal info and options to manage it. You can make some of this <br/>
          info, like your contact details, visible to others so they can <br/>
          reach you easily. You can also see a summary of your profiles.
        </div>
      </div>

      <ProfileSection />

    </div>
  );
}

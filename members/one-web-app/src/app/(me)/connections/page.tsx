import { getSession } from "next-auth/react";
import { auth } from "@/auth";

import BreadCrumb from "@/components/breadcrumb";
import { ConnectionClient } from "@/components/tables/connections-tables/client";
import apiService from '@/service/api.service';

const breadcrumbItems = [{ title: "Connections", link: "/connections" }];

async function getData() {
  const session = await auth();

  if (!session) {
    throw new Error('No session found');
  }

  try {
    const res = await apiService.get(`/access/connection/?account=${session.user.uid}`, {
      accessToken: session?.accessToken
    });
    return res || [];
  } catch (e) {
    console.log(e);
    return [];
  }
}

export default async function Page() {
  const data = await getData();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold mb-2">Active App & Service Connections</h1>
        <p className="text-gray-500">
          Manage and review the apps and services that have access to your Eartho account. <br />
          Keep control over who can see your data and take action if something doesn’t look right. <br />
          Regularly reviewing your connections helps maintain your account’s security and privacy.
        </p>
      </div>

      {/* Display Connected Apps */}
      <ConnectionClient data={data} />
    </div>
  );
}

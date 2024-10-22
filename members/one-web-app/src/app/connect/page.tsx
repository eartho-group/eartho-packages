import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// app/connect/page.tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] };
}) {
  const headersList = headers()
  const host = headersList.get('host');

  // Redirect from old domain to new domain
  if (host === 'one.eartho.world') {
    const queryParams = new URLSearchParams(searchParams as Record<string, string>).toString();
    const newUrl = `https://one.eartho.io/connect?${queryParams}`;
    redirect(newUrl);
    return;
  }
  const clientId = searchParams.client_id || '';
  const scope = searchParams.scope || '';
  const audience = searchParams.audience || '';
  const accessId = searchParams.access_id || '';
  const responseType = searchParams.response_type || '';
  const responseMode = searchParams.response_mode || '';
  const state = searchParams.state || '';
  const nonce = searchParams.nonce || '';
  const redirectUri = searchParams.redirect_uri || '';
  const codeChallenge = searchParams.code_challenge || '';
  const codeChallengeMethod = searchParams.code_challenge_method || '';
  const earthoOneClient = searchParams.earthoOneClient || '';

  if (!redirectUri) {
    redirect('/');
    return
  }

  if (!clientId) return "Client id is missing"
  if (!accessId) return "Access id is missing"

  const session = await auth()
  if(session){
    const queryParams = new URLSearchParams(searchParams as Record<string, string>).toString();
    const newUrl = `/connect/approval?${queryParams}`;
    redirect(newUrl);
    return  
  }
  const queryParams = new URLSearchParams(searchParams as Record<string, string>).toString();
  const newUrl = `/connect/signin?${queryParams}`;
  redirect(newUrl);
  return

  return (
    <div>
      <h1>OAuth Parameters</h1>
      <ul>
        <li>Client ID: {clientId}</li>
        <li>Scope: {scope}</li>
        <li>Audience: {audience}</li>
        <li>Access ID: {accessId}</li>
        <li>Response Type: {responseType}</li>
        <li>Response Mode: {responseMode}</li>
        <li>State: {state}</li>
        <li>Nonce: {nonce}</li>
        <li>Redirect URI: {redirectUri}</li>
        <li>Code Challenge: {codeChallenge}</li>
        <li>Code Challenge Method: {codeChallengeMethod}</li>
        <li>EarthoOneClient: {earthoOneClient}</li>
      </ul>
    </div>
  );
}

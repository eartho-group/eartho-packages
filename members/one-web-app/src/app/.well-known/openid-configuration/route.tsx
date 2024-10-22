// app/.well-known/openid-configuration/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const openidConfig = {
    issuer: "https://one.eartho.io",
    authorization_endpoint: "https://one.eartho.io/connect",
    token_endpoint: "https://api.eartho.io/access/oauth/token",
    userinfo_endpoint: "https://api.eartho.io/access/oauth/userinfo",
    jwks_uri: "https://api.eartho.io/access/oauth/jwks_uri",
    response_types_supported: ["code", "id_token", "token id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    claims_supported: ["sub", "name", "email", "preferred_username"],
  };

  return NextResponse.json(openidConfig);
}

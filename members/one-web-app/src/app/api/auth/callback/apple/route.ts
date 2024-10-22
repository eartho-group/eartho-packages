// app/api/auth/callback/apple/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { GET as NextAuthGET } from '../../[...nextauth]/route'

// re-export the next-auth GET handler for this endpoint.
export { NextAuthGET as GET } 

export async function POST(req: NextRequest) {

  // contains user name and email if you need to process anything.
  const data = await req.formData() 

  const queryParams: { [key: string]: string } = {}
  data.forEach((value, key) => {
    queryParams[key] = value.toString()
  })

  const searchParams = new URLSearchParams(queryParams)

  const cookie = req.headers.get('cookie') || ''

  // redirect to the next-auth handler which expects GET with query params. 
  return NextResponse.redirect(
    `https://${req.headers.get('host')}/api/auth/callback/apple?` +
      searchParams.toString(),
    {
      status: 302,
      headers: {
        cookie,
      },
    },
  )
}
//
//  ContentView.swift
//  App
//
//  Created by Work on 6/4/22.
//  Copyright © 2022 EarthoOne. All rights reserved.
//

import SwiftUI
import EarthoOne

struct ContentView: View {
    let earthoOne = EarthoOne(clientId: "qoWhmh4vAEZnE5Naig0b",
                              clientSecret: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtHJ23XxMW2Yj2JaPZXRD\nxkXCS+8xuOVc9qSsROCiutpumEk/QDqxUnGubig6dYSsY0ZqAekF+hYiub7PlBVa\nuZRSydPG6jfC7fkvKtB6WccCeQqMP1YfZmsWFNbRluGoWEcHKJbYp7M+XVI8M+i0\n/7pUnPOaOHqLbpKuX3WaBNb+YdiS0cUKgUJaphM7yhQXkfme3SqUYeXrqXHkYsnf\njC93o09mfeNtY7HrU22Aq6sJto4X7E07RPyc25OyzvBADOmg7zWGna34HL8GNUqL\nc9VpGWo7uyxwomrwA84rIc979hn/TKK9AJMjhFVvU2e1mjAK+j4wB/HPrZrkG5W0\nywIDAQAB\n-----END PUBLIC KEY-----")
    
    var body: some View {
        VStack() {
            Spacer()
            VStack(spacing: 32) {
                Button(
                    action: { earthoOne.start() },
                    label: { Text("Init SDK") }
                )
                Button(
                    action: { self.login() },
                    label: { Text("Log in with Eartho") }
                )
                Button(
                    action: { print(earthoOne.getUser()) },
                    label: { Text("Print logged in user") }
                )
                Button(
                    action: { earthoOne.getIdToken( onSuccess: { Credentials in
                        Credentials.idToken
                        print(Credentials.idToken)
              
                    },forceRefresh:true) },
                    label: { Text("Refresh Credentials") }
                )
                Button(
                    action: { earthoOne.logout() },
                    label: { Text("Logout") }
                )
               
            }
            Spacer()
            Text("Please read logs to track process")
            Spacer()
            
            }.onOpenURL { URL in
            
            ///DONT FORGET TO ADD THIS IN YOUR CODE
            WebAuthentication.resume(with: URL)
        }
    }
    
    func login() {
        earthoOne.connectWithPopup(
          accessId: "2drlTkv19Alfvu9pEPTP",
          onSuccess: { Credentials in
                        //Send to server
                        Credentials.idToken
              
                        //get user anytime after login
                        let user = earthoOne.getUser()
                        print(user?.displayName)
              
                          //or idtoken
                          let idToken = earthoOne.getIdToken()
              
                    },
          onFailure: { WebAuthError in

          })
        
    }
    
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

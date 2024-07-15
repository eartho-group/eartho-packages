//
//  AppApp.swift
//  App
//
//  Created by Work on 6/4/22.
//  Copyright © 2022 EarthoOne. All rights reserved.
//

import SwiftUI
import EarthoOne

@main
struct AppApp: App {
    
    var body: some Scene {
        WindowGroup {
            ContentView().onOpenURL { URL in
                WebAuthentication.resume(with: URL)
            }
        }
    }
}

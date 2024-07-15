// swift-tools-version:5.3

import PackageDescription

#if compiler(>=5.5)
let webAuthPlatforms: [Platform] = [.iOS, .macOS, .macCatalyst]
#else
let webAuthPlatforms: [Platform] = [.iOS, .macOS]
#endif
let swiftSettings: [SwiftSetting] = [.define("WEB_AUTH_PLATFORM", .when(platforms: webAuthPlatforms))]

let package = Package(
    name: "EarthoOne",
    platforms: [.iOS(.v12), .macOS(.v10_15), .tvOS(.v12), .watchOS("6.2")],
    products: [.library(name: "EarthoOne", targets: ["EarthoOne"])],
    dependencies: [
        .package(name: "SimpleKeychain", url: "https://github.com/auth0/SimpleKeychain.git", .upToNextMajor(from: "0.12.0")),
        .package(name: "JWTDecode", url: "https://github.com/auth0/JWTDecode.swift.git", .upToNextMajor(from: "2.5.0")),
        .package(name: "Quick", url: "https://github.com/Quick/Quick.git", .upToNextMajor(from: "5.0.0")),
        .package(name: "Nimble", url: "https://github.com/Quick/Nimble.git", .upToNextMajor(from: "10.0.0")),
        .package(name: "OHHTTPStubs", url: "https://github.com/AliSoftware/OHHTTPStubs.git", .upToNextMajor(from: "9.0.0"))
    ],
    targets: [
        .target(
            name: "EarthoOne",
            dependencies: ["SimpleKeychain", "JWTDecode"], 
            path: "EarthoOne",
            exclude: ["Info.plist"],
            swiftSettings: swiftSettings),
        .testTarget(
            name: "EarthoOneTests",
            dependencies: [
                "EarthoOne",
                "Quick", 
                "Nimble", 
                .product(name: "OHHTTPStubsSwift", package: "OHHTTPStubs")
            ],
            path: "EarthoOneTests",
            exclude: ["Info.plist", "EarthoOne.plist"],
            swiftSettings: swiftSettings)
    ]
)

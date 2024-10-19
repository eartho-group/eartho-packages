#import "EarthoOnePlugin.h"
#if __has_include(<eartho_one/eartho_one-Swift.h>)
#import <eartho_one/eartho_one-Swift.h>
#else
// Support project import fallback if the generated compatibility header
// is not copied when this plugin is created as a library.
// https://forums.swift.org/t/swift-static-libraries-dont-copy-generated-objective-c-header/19816
#import "eartho_one-Swift.h"
#endif

@implementation EarthoOnePlugin
+ (void)registerWithRegistrar:(NSObject<FlutterPluginRegistrar>*)registrar {
  [SwiftEarthoOnePlugin registerWithRegistrar:registrar];
}
@end

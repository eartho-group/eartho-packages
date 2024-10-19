// import 'package:firebase_auth/firebase_auth.dart';
// import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:eartho_one/eartho_one.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // await Firebase.initializeApp();

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  EarthoUser? _user;
  String? token;
  String? firebaseToken;
  EarthoCredentials? _credentials;
  EarthoOne? earthoOne;

  @override
  void initState() {
    super.initState();

    // Go to https://creator.eartho.world/ and get the details from security tab
    earthoOne = EarthoOne(
        clientId: "x5wNs5h7EiyhxzODBe1X",
        clientSecret:
            "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAya48nKOC9nIiQfayHpkF\nRkF7QD8PoX6JVhUuQMPY96ybAZYeaQJih8gpn/sqD03DCZmBhaF+UQBzWP14ycax\nbaTD+j0DRF3zdxSk5RognHfcNq++dgr+dPR7jvuTOpX7YdWEdSSnu2XRXjHparwx\njw5oTVQbd8IhSecurz/d72d55cWIO7LrmiONdz2unCYnNfT3txJ2TpY1O+8lPlmO\nGOcbMB67XI+HPviQdSg9q+0xFCbkbgInkCNCRAYol30bT7+jszfoKHTv1+xU22gZ\nxSH9rnpDS4txvcXDmMBGM6UV3h3RkQFr2BkQJqPXpo82oYv6DvoUIygV+N5vyXUV\nLQIDAQAB\n-----END PUBLIC KEY-----\n");

    earthoOne?.init();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Plugin example app'),
        ),
        body: Center(
          child: Column(
            children: [
              ElevatedButton(
                  onPressed: () async {
                    final credentials = await earthoOne
                        ?.connectWithRedirect("QJkg3evAtIqJgF80iB1o");
                    if (credentials == null) {
                      print("user aborted");
                      return;
                    }
                    setState(() {
                      _credentials = credentials;
                    });
                  },
                  child: const Text("Login with Eartho")),
              ElevatedButton(
                  onPressed: () async {
                    final user = await earthoOne?.getUser();
                    setState(() {
                      _user = user;
                    });
                  },
                  child: const Text("Get User")),
              ElevatedButton(
                  onPressed: () async {
                    final idToken = await earthoOne?.getIdToken();
                    setState(() {
                      token = idToken;
                    });
                  },
                  child: const Text("Get Id token")),
              ElevatedButton(
                  onPressed: () async {
                    final idToken = await earthoOne?.getIdToken();
                    if (idToken == null) return;
                    //you need to initate firebase
                    // FirebaseAuth.instance
                    //     .signInWithCustomToken(idToken)
                    //     .then((value) {
                    //       return firebaseToken=value.user?.refreshToken;
                    //     });
                  },
                  child: const Text("Integreate with firebase auth")),
              Text(_user?.displayName ?? 'no user loaded'),
              Text(
                token ?? "no token loaded",
                maxLines: 1,
              ),
              Text(
                firebaseToken ?? "",
                maxLines: 1,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import * as React from 'react';

import { StyleSheet, View, Text, Pressable } from 'react-native';
import {
  init,
  connectWithRedirect,
  getIdToken,
  getUser,
  EarthoAuthProvider,
} from '@eartho/one-client-react-native';

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();

  React.useEffect(() => {
    init(
      'qoWhmh4vAEZnE5Naig0b',
      '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtHJ23XxMW2Yj2JaPZXRD\n' +
        'xkXCS+8xuOVc9qSsROCiutpumEk/QDqxUnGubig6dYSsY0ZqAekF+hYiub7PlBVa\n' +
        'uZRSydPG6jfC7fkvKtB6WccCeQqMP1YfZmsWFNbRluGoWEcHKJbYp7M+XVI8M+i0\n' +
        '/7pUnPOaOHqLbpKuX3WaBNb+YdiS0cUKgUJaphM7yhQXkfme3SqUYeXrqXHkYsnf\n' +
        'jC93o09mfeNtY7HrU22Aq6sJto4X7E07RPyc25OyzvBADOmg7zWGna34HL8GNUqL\n' +
        'c9VpGWo7uyxwomrwA84rIc979hn/TKK9AJMjhFVvU2e1mjAK+j4wB/HPrZrkG5W0\n' +
        'ywIDAQAB\n' +
        '-----END PUBLIC KEY-----\n'
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 32 }}>{'Details in logs output'}</Text>

      <Pressable
        style={styles.button}
        onPress={async () => {
          await connectWithRedirect('V1te8aEqOJNtPseu3VTe');
        }}
      >
        <Text style={styles.text}>{'connect access'}</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={async () => {
          console.log(await getIdToken());
        }}
      >
        <Text style={styles.text}>{'getIdToken'}</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={async () => {
          console.log(await getUser());
        }}
      >
        <Text style={styles.text}>{'getUser'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    margin: 5,
    width: 200,
    backgroundColor: 'black',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});

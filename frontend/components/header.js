import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>StegaStamp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#DC8458',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FBEAE5',
    fontSize: 20,
    fontWeight: 'bold',
  }
});

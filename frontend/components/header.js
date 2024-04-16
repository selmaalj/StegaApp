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
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    color: '#FBEAE5',
    fontSize: 20,
    fontWeight: 'bold',
  }
});

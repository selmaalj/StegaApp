import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Linking } from 'react-native';
import Header from './components/header';

export default function App() {
  const [url, setUrl] = useState('');

  const clickHandlerSave = () => {
    console.log('Saving image...');
    fetch('http://192.168.1.101:8000/image/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'url.com', // url
        code: null
      }),
    })
    .then(response => response.json())
    .then(data => console.log('Image saved:', data))
    .catch(error => console.error('Error saving image:', error));
  };

  const clickHandlerOpenUrl = async () => {
    console.log('Fetching URL...');
    try {
      const urlData = "http://www.facebook.com";//await getUrlFromApiAsync();
      console.log('Received URL data:', urlData);
      if (urlData) {
        console.log('Opening URL:', urlData);
        await Linking.openURL(urlData);
      } else {
        console.log("URL not found");
      }
    } catch (error) {
      console.error('Error fetching URL:', error);
    }
  };

  const getUrlFromApiAsync = async () => {
    console.log('Fetching URL from API...');
    try {
      const response = await fetch(
        'http://192.168.1.101:8000/url/?code=jFbPtVr', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });
      const json = await response.json();
      console.log('Received URL data:', json);
      return json;
    } catch (error) {
      console.error('Error fetching URL:', error);
      throw error; 
    }
  }

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.boldText}>Insert url: </Text>
      <TextInput 
        style={styles.input}
        placeholder='e.g. google.com'
        onChangeUrl={newUrl => setUrl(newUrl)}
      />
      <View style={styles.buttonContainer}>
        <Button title="Encode" onPress={clickHandlerSave}/>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Get URL" onPress={clickHandlerOpenUrl}/>
      </View>
      <Text style="styles.showUrl">
        {url}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgrey',
  },
  boldText: {
    fontWeight: 'bold',
    alignSelf: 'center',
    marginTop: 50
  },
  buttonContainer: {
    marginTop: 20,
    alignSelf: 'center',
    borderRadius: 10,
    borderWidth: 0.2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    padding: 8,
    margin: 10,
    width: 200,
    alignSelf: 'center'
  }
});

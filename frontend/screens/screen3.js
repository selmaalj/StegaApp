import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Linking, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function Screen3() {
  const [url, setUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const clickHandlerSave = () => {
    console.log('Saving image...');
    // Implement saving image logic here
  };

  const clickHandlerOpenUrl = async () => {
    console.log('Fetching URL...');
    try {
      const urlData = "http://www.facebook.com"; // Change this with your API endpoint or logic
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

  const openImagePickerAsync = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync();
    if (pickerResult.cancelled === true) {
      return;
    }

    setSelectedImage({ localUri: pickerResult.uri });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.boldText}>Insert URL and upload image to encode</Text>
      <TextInput 
        style={styles.input}
        placeholder='e.g. google.com'
        onChangeText={newUrl => setUrl(newUrl)}
        value={url}
      />
      <View style={styles.buttonContainer}>
        <Button title="upload image" color="#8C8CFF" onPress={openImagePickerAsync}/>
      </View>
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage.localUri }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Encode" color="#8C0000" onPress={clickHandlerSave}/>
      </View>
      <Text style={styles.boldText}>Upload encoded image to get URL</Text>
      <View style={styles.buttonContainer}>
        <Button title="upload image" color="#8C8CFF" onPress={openImagePickerAsync}/>
      </View>
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage.localUri }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Get URL" color="#8C0000" onPress={clickHandlerOpenUrl}/>
      </View>
      <Text style={styles.urlText}>{url}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  boldText: {
    marginTop: 50,
    fontSize: 18,
    marginBottom: 15,
    alignSelf: 'center'
  },
  urlText: {
    marginTop: 10,
    fontSize: 16
  },
  buttonContainer: {
    borderRadius: 20,
    borderWidth: 0.2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    padding: 8,
    marginVertical: 10,
    width: '100%'
  },
  imageContainer: {
    marginTop: 20,
    alignItems: 'center'
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain'
  }
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Linking, Image, ScrollView, Alert} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

export default function Screen3() {
  const [url, setUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const clickHandlerSave = () => {
    console.log('Saving image...');
    // Implement saving image logic 
  };

  const clickHandlerOpenUrlOrText = async (inputData) => {
    console.log('Fetching Data...');
    try {
      if (isValidURL(inputData)) {
        console.log('Opening URL:', inputData);
        await Linking.openURL(inputData);
      } else {
        console.log('Opening dialog with text:', inputData);
        Alert.alert('Text Content', inputData);
      }
    } catch (error) {
      console.error('Error handling input data:', error);
    }
  };
  
  // Function to check if the input is a valid URL
  const isValidURL = (input) => {
    try {
      new URL(input);
      return true;
    } catch (error) {
      return false;
    }
  };

  const imagePicker = async () => {
    const result = await launchImageLibrary();
    console.log(result)
    if (!result.cancelled) {
      console.log(result)
      setSelectedImage(result);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.boldText}>Encode image</Text>
      <Text style={styles.text}>Insert URL</Text>
      <TextInput 
        style={styles.input}
        placeholder='e.g. https://google.com'
        onChangeText={newUrl => setUrl(newUrl)}
        value={url}
      />
      <Text style={styles.text}>Or insert text</Text>
      <TextInput 
        style={styles.input}
        placeholder='e.g. Lorem ipsum dolor sit amet...'
        onChangeText={newUrl => setUrl(newUrl)}
        value={url}
      />
      <View style={styles.buttonContainer}>
        <Button title="upload image" color="#8C8CFF" onPress={imagePicker()}/>
      </View>
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Encode" color="#8C0000" onPress={clickHandlerSave()}/>
      </View>
      <Text style={styles.boldText}>Decode image</Text>
      <Text style={styles.text}>Upload encoded image to get text or URL within</Text>
      <View style={styles.buttonContainer}>
        <Button title="upload image" color="#8C8CFF" onPress={openImagePickerAsync}/>
      </View>
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage.localUri }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Open data" color="#8C0000" onPress={clickHandlerOpenUrlOrText}/>
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
  text: {
    marginTop: 10,
    fontSize: 18,
    marginBottom: 5,
  },
  boldText: {
    marginTop: 30,
    fontSize: 30,
    fontWeight: 'bold'
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
    marginTop: 10
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

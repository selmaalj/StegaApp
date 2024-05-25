import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Linking, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function Screen3() {
  const [url, setUrl] = useState('');
  const [image, setImage] = useState(null);
  const [hiddenImage, setHiddenImage] = useState(null);

  const localIp = '192.168.1.102'; 
  const port = '8000';

  const handleGetImage = async () => {
    try {
      const res = await fetch(`http://${localIp}:${port}/url/?code=ZvivT1A`);
      const data = await res.json();
      console.log('Url within image:', data.url); //uzimanje url-od koda koji se dobije iz enkodirane slike
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDecodeImage = async (imageUri) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg', 
      name: 'hiddenImage.jpg', 
    });

    try {
      const res = await fetch(`http://${localIp}:${port}/decode-image/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = await res.json();
      console.log('Decoded image:', data);
    } catch (error) {
      console.error(error);
    }
  };

  const pickImage = async (imageType) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      if (imageType === 'image') {
        setImage(result.assets[0].uri);
      } else if (imageType === 'hiddenImage') {
        setHiddenImage(result.assets[0].uri);
        handleDecodeImage(result.assets[0].uri);
      }
    }
  };

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
        <Button title="upload image" color="#8C8CFF" onPress={() => pickImage('image')} />
      </View>
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Encode" color="#8C0000" onPress={clickHandlerSave} />
      </View>
      <Text style={styles.boldText}>Decode image</Text>
      <Text style={styles.text}>Upload encoded image to get text or URL within</Text>
      <View style={styles.buttonContainer}>
        <Button title="upload image" color="#8C8CFF" onPress={() => pickImage('hiddenImage')} />
      </View>
      {hiddenImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: hiddenImage }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Show data" color="#8C0000" onPress={() => clickHandlerOpenUrlOrText(url)} />
      </View>
      <Text style={styles.urlText}>{url}</Text>
      <Button title="Get Image" onPress={handleGetImage} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 18,
    marginBottom: 5,
  },
  boldText: {
    marginTop: 30,
    fontSize: 30,
    fontWeight: 'bold',
  },
  urlText: {
    marginTop: 10,
    fontSize: 16,
  },
  buttonContainer: {
    borderRadius: 20,
    borderWidth: 0.2,
    borderColor: '#fff',
    overflow: 'hidden',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    padding: 8,
    marginVertical: 10,
    width: '100%',
  },
  imageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
});

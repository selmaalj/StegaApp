import React, { useState } from 'react';
import {StyleSheet, Text, View, Button, TextInput, Linking, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { decode, encode } from 'base64-arraybuffer';
import * as MediaLibrary from 'expo-media-library';
import { FontAwesome } from '@expo/vector-icons'; 
import * as FileSystem from 'expo-file-system';

console.log(MediaLibrary)

export default function Screen3() {
  const [url, setUrl] = useState('');
  const [image, setImage] = useState(null);
  const [hiddenImage, setHiddenImage] = useState(null);
  const [isUrlInput, setIsUrlInput] = useState(true)
  const [encodedImage, setEncodedImage] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  const localIp = '192.168.1.102'; 
  const port = '8000';

  const handleGetImage = async (code) => {
    try {
      const res = await fetch(`http://${localIp}:${port}/url/?code=${code}`);
      const data = await res.json();
      if(data.url === undefined){
        Alert.alert('No detection', 'Nothing is detected in the provided image.');
        return;
      }
      console.log('Url within image:', data.url); 
      clickHandlerOpenUrlOrText(data.url);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDecodeImage = async () => {
    const formData = new FormData();
    formData.append('image', {
      uri: hiddenImage,
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
      handleGetImage(data.code);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateImage = async () => {
    try {
      const res = await fetch(`http://${localIp}:${port}/image/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      console.log(data.code);
      handleEncodeImage();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEncodeImage = async () => {
    const formData = new FormData();
    formData.append('image', {
      uri: image,
      type: 'image/jpeg', 
      name: 'hiddenImage.jpg', 
    });
  
    try {
      const res = await fetch(`http://${localIp}:${port}/encode-image/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const imageData = await res.arrayBuffer(); 
      const base64Image = encode(new Uint8Array(imageData)); 
      const imageUrl = `data:image/png;base64,${base64Image}`; 
      setEncodedImage(imageUrl); 
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
      }
    }
  };

  const downloadImage = async () => {
    try {
      const granted = await MediaLibrary.requestPermissionsAsync();
      if (granted.status === 'granted') {
        const base64Code = encodedImage.split("data:image/png;base64,")[1];
  
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${FileSystem.documentDirectory}${timestamp}_${randomString}.png`;
  
        await FileSystem.writeAsStringAsync(filename, base64Code, {
          encoding: FileSystem.EncodingType.Base64,
        });
  
        const mediaResult = await MediaLibrary.saveToLibraryAsync(filename);
        Alert.alert('Success', 'Image downloaded successfully!');
      } else {
        Alert.alert('Permission Denied', 'Permission to access media library was denied.');
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert('Error', 'Failed to download image.');
    }
  };

  const clickHandlerOpenUrlOrText = async (openingDialog) => {
    console.log('Fetching Data...');
    try {
      if (isValidURL(openingDialog)) {
        console.log('Checking if URL can be opened:', openingDialog);
        const canOpen = await Linking.canOpenURL(openingDialog);
        if (canOpen) {
          console.log('Opening URL:', openingDialog);
          await Linking.openURL(openingDialog);
        } else {
          console.log('URL cannot be opened:', openingDialog);
          Alert.alert('URL cannot be opened', 'The provided URL cannot be opened.');
        }
      } else {
        console.log('Opening dialog with text:', openingDialog);
        Alert.alert('Image content', openingDialog);
      }
    } catch (error) {
      console.error('Error handling input data:', error);
    }
  };

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
      <Text style={styles.text}>Insert Content</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        step={1}
        minimumTrackTintColor="#273076"
        maximumTrackTintColor="#000000"
        thumbTintColor="#FFF"
        onValueChange={(value) => setIsUrlInput(value === 0)}
      />
      {isUrlInput ? (
        <TextInput 
          style={styles.input}
          placeholder='e.g. https://google.com'
          onChangeText={newUrl => setUrl(newUrl)}
          value={url}
        />
      ) : (
        <TextInput 
          style={styles.input}
          placeholder='e.g. Lorem ipsum dolor sit amet...'
          onChangeText={newUrl => setUrl(newUrl)}
          value={url}
        />
      )}
      <View style={styles.buttonContainer}>
        <Button title="upload image" color="#8C8CFF" onPress={() => pickImage('image')} />
      </View>
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Encode" color="#8C0000" onPress={handleCreateImage} />
      </View>

      {/* Display the encoded image */}
      {encodedImage  && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: encodedImage }} style={styles.image} />
          <TouchableOpacity onPress={downloadImage}>
        <FontAwesome name="download" size={24} color="black" />
      </TouchableOpacity>
        </View>
      )}

      
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
        <Button title="Show hidden data" color="#8C0000" onPress={() => handleDecodeImage()} />
      </View>
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
  slider: {
    width: '30%',
    height: 35,
    margin: 5,
    alignSelf: 'center',
    backgroundColor: '#BEBEBE',
    borderRadius: 50,
    borderWidth: 0.3,
  },
});

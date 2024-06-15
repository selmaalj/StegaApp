import React, { useState } from 'react';
import {StyleSheet, Text, View, TextInput, Linking, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { decode, encode } from 'base64-arraybuffer';
import * as MediaLibrary from 'expo-media-library';
import { FontAwesome } from '@expo/vector-icons'; 
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';


export default function Screen3() {
  const [url, setUrl] = useState('');
  const [image, setImage] = useState(null);
  const [hiddenImage, setHiddenImage] = useState(null);
  const [isUrlInput, setIsUrlInput] = useState(true)
  const [encodedImage, setEncodedImage] = useState(null);

  const localIp = '192.168.0.19'; 
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      console.log("Image created", data.code);
      handleEncodeImage();
    } catch (error) {
      console.error(error);
    }
  };

  const correctImageOrientation = async (uri) => {
    const manipResult = await manipulateAsync(
      uri,
      [{ rotate: 0 }], 
      { compress: 1, format: 'jpeg', base64: false }
    );
    return manipResult.uri;
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
      quality: 0.5,  // Compress image to half of its original quality
      maxWidth: 800, // Restrict the maximum width
      maxHeight: 800, // Restrict the maximum height
      allowsEditing: true,
    });

    console.log("Image picked", result);

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
        maximumTrackTintColor="#FFF"
        thumbTintColor="#BEBEBE"
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
      <TouchableOpacity style={styles.button1} onPress={() => pickImage('image')} >
      <Text style={styles.buttonText}>UPLOAD IMAGE</Text>
      </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}

      <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button2} onPress={handleCreateImage} >
      <Text style={styles.buttonText}>ENCODE</Text>
      </TouchableOpacity>
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
      <TouchableOpacity style={styles.button1} onPress={() => pickImage('hiddenImage')} >
      <Text style={styles.buttonText}>UPLOAD IMAGE</Text>
      </TouchableOpacity>
      </View>

      {hiddenImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: hiddenImage }} style={styles.image} />
        </View>
      )}
      <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button2} onPress={() => handleDecodeImage()} >
      <Text style={styles.buttonText}>SHOW HIDDEN DATA</Text>
      </TouchableOpacity>
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
  buttonContainer: {
    borderWidth: 0.2,
    borderColor: '#fff',
    overflow: 'hidden',
    marginTop: 10,
    alignItems: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    padding: 12,
    marginVertical: 10,
    width: '100%',
    fontSize: 18
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
    width: '20%',
    margin: 10,
    alignSelf: 'center',
    backgroundColor: "#ADD8E6",//"#03045E",
    borderRadius: 20,
  },
  button1: {
    backgroundColor: "#ADD8E6",
    padding: 10,
    borderRadius: 40,
    width: 150,
  },
  button2: {
    backgroundColor: "#8C0000",
    padding: 10,
    borderRadius: 40,
    width: 150
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
});

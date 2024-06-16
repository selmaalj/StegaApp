import React, { useState, useEffect, useRef, Fragment } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View, Alert, Dimensions, Linking } from 'react-native';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons'; 

export default function Screen2() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); 
  const cameraRef = useRef(null); 
  
  const localIp = '192.168.0.19'; 
  const port = '8000';

  useEffect(() => {
    if (permission && permission.granted) {
      setCameraOpen(true);
    }
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.boldText}>Detect message</Text>
        <Text style={styles.text}>Capture image with your camera to find its hidden message</Text>
        <View style={styles.buttonContainer2}>
        <TouchableOpacity style={styles.captureButton} onPress={handleOpenCameraWithPermission}>
          <Text style={styles.buttonText}>OPEN CAMERA</Text>
        </TouchableOpacity>
        </View>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const handleOpenCameraWithPermission = async () => {
    await requestPermission();
    setCameraOpen(true);
  };

  function closeCamera() {
    setCameraOpen(false);
    setCapturedPhoto(null);
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync(); 
        console.log('Photo:', photo); 
        setCapturedPhoto(photo.uri); 
        handleDetectImage(photo.uri)
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
  }

  const handleDetectImage = async (photoUri) => {
    const formData = new FormData();
    formData.append('image', {
      uri: photoUri,
      type: 'image/jpeg', 
      name: 'photo.jpg', 
    });

    try {
      const response = await fetch(`http://${localIp}:${port}/detect-image/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      console.log(data);
      if(data.result.status=="success"){
        handleGetImage(data.result.code);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

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
    <View style={styles.container}>
      {cameraOpen ? (
      <Fragment>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} >
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <FontAwesome6 name="camera-rotate" size={28} color="white"/>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={closeCamera}>
              <FontAwesome name="close" size={30} color="white"/>
            </TouchableOpacity>
          </View>
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <Text style={styles.buttonText}>CAPTURE</Text>
            </TouchableOpacity>
          </View>
          {capturedPhoto && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewText}>Captured Photo:</Text>
              <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
            </View>
          )}
        </CameraView>
      </Fragment>
      ) : 
      <Fragment>
        <Text style={styles.boldText}>Detect message</Text>
        <Text style={styles.text}>Capture image with your camera to find its hidden message</Text>
        <View style={styles.buttonContainer2}>
        <TouchableOpacity style={styles.captureButton} onPress={handleOpenCameraWithPermission}>
          <Text style={styles.buttonText}>OPEN CAMERA</Text>
        </TouchableOpacity>
        </View>
        </Fragment>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  camera: {
    width: '100%',
    height: '50%'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  buttonContainer2: {
    borderRadius: 20,
    borderWidth: 0.2,
    borderColor: '#fff',
    overflow: 'hidden',
    marginTop: 10,
    alignItems: 'center',
  },
  button: {
    alignSelf: 'flex-end',
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  boldText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#8C0000',
    borderRadius: 40,
    padding: 15,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    marginBottom: 5,
  },
  previewImage: {
    width: 200,
    height: 200,
    marginTop: 5,
    borderRadius: 10,
  },
});

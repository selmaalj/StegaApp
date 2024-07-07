import cv2
import os
import numpy as np
from skimage import io
import matplotlib.pyplot as plt

def calculate_fogginess(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    hist = hist.ravel() / hist.sum()
    acc_hist = np.cumsum(hist)
    fogginess = np.sum(acc_hist[:128])
    return fogginess

def calculate_noise_std(image_path):
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    std_dev = np.std(image)
    return std_dev

input_folder = 'dataset'

image_fogginess = []
image_noise = []

for filename in os.listdir(input_folder):
    if filename.endswith(('.png', '.jpg', '.jpeg')):
        image_path = os.path.join(input_folder, filename)
        image = io.imread(image_path)
        fogginess = calculate_fogginess(image)
        noise_std = calculate_noise_std(image_path)
        image_fogginess.append(fogginess)
        image_noise.append(noise_std)

# Scatter plot
plt.scatter(image_fogginess, image_noise, alpha=0.5)
plt.title('Scatter Plot of Fogginess vs Noise')
plt.xlabel('Fogginess')
plt.ylabel('Noise (Standard Deviation)')
plt.show()
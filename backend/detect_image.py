import numpy as np
import cv2
import os
import sys
import glob
from PIL import Image, ImageOps
import tensorflow as tf
from tensorflow.python.saved_model import tag_constants
from tensorflow.python.saved_model import signature_constants
import bchlib
import json

BCH_POLYNOMIAL = 137
BCH_BITS = 5

processing_steps_dir = 'processing_steps'
os.makedirs(processing_steps_dir, exist_ok=True)

def save_processing_step_image(image, image_name):
    path = os.path.join(processing_steps_dir, f"{image_name}.jpg")
    cv2.imwrite(path, image)

def preprocess_image(image):
    # Convert to grayscale if the image is not already in grayscale
    if len(image.shape) == 3 and image.shape[2] == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    save_processing_step_image(gray, "01_gray")
    gray_blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    save_processing_step_image(gray_blurred, "02_gray_blurred")
    return gray_blurred

def find_corners_of_largest_polygon(image):
    edges = cv2.Canny(image, 50, 150)
    save_processing_step_image(edges, "03_edges")
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None

    largest_contour = sorted(contours, key=cv2.contourArea, reverse=True)[0]
    contour_img = cv2.drawContours(image.copy(), [largest_contour], -1, (0, 255, 0), 3)
    save_processing_step_image(contour_img, "04_largest_contour")

    epsilon = 0.02 * cv2.arcLength(largest_contour, True)
    polygon = cv2.approxPolyDP(largest_contour, epsilon, True)

    if len(polygon) == 4:
        polygon_img = cv2.drawContours(image.copy(), [polygon], -1, (255, 0, 0), 3)
        save_processing_step_image(polygon_img, "05_approx_polygon")
        return polygon
    else:
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=50, maxLineGap=20)
        if lines is not None:
            points = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                points.extend([(x1, y1), (x2, y2)])
            hull = cv2.convexHull(np.array(points))
            epsilon = 0.02 * cv2.arcLength(hull, True)
            polygon = cv2.approxPolyDP(hull, epsilon, True)
            if len(polygon) == 4:
                return polygon
    return None

def order_points(pts):
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def align_image(image, pts):
    ordered_pts = order_points(pts)
    top_left, top_right, bottom_right, bottom_left = ordered_pts
    widthA = np.sqrt(((bottom_right[0] - bottom_left[0]) ** 2) + ((bottom_right[1] - bottom_left[1]) ** 2))
    widthB = np.sqrt(((top_right[0] - top_left[0]) ** 2) + ((top_right[1] - top_left[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))
    heightA = np.sqrt(((top_right[0] - bottom_right[0]) ** 2) + ((top_right[1] - bottom_right[1]) ** 2))
    heightB = np.sqrt(((top_left[0] - bottom_left[0]) ** 2) + ((top_left[1] - bottom_left[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(ordered_pts, dst)
    aligned = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    save_processing_step_image(aligned, "06_aligned_image")
    return aligned

def decode_secret(image):
    sess = tf.compat.v1.InteractiveSession(graph=tf.Graph())
    model_path = 'saved_models/stegastamp_pretrained'  # Set the path to your TensorFlow model
    model = tf.compat.v1.saved_model.load(sess, [tag_constants.SERVING], model_path)

    input_image_name = model.signature_def[signature_constants.DEFAULT_SERVING_SIGNATURE_DEF_KEY].inputs['image'].name
    input_image = tf.compat.v1.get_default_graph().get_tensor_by_name(input_image_name)

    output_secret_name = model.signature_def[signature_constants.DEFAULT_SERVING_SIGNATURE_DEF_KEY].outputs['decoded'].name
    output_secret = tf.compat.v1.get_default_graph().get_tensor_by_name(output_secret_name)

    bch = bchlib.BCH(BCH_BITS, prim_poly=BCH_POLYNOMIAL)

    image = Image.fromarray(image)
    image = np.array(ImageOps.fit(image, (400, 400)), dtype=np.float32)
    image /= 255.

    feed_dict = {input_image: [image]}
    secret = sess.run([output_secret], feed_dict=feed_dict)[0][0]

    packet_binary = "".join([str(int(bit)) for bit in secret[:96]])
    packet = bytes(int(packet_binary[i: i + 8], 2) for i in range(0, len(packet_binary), 8))
    packet = bytearray(packet)

    data, ecc = packet[:-bch.ecc_bytes], packet[-bch.ecc_bytes:]
    bitflips = bch.decode(data, ecc)
    if bitflips != -1:
        try:
            code = data.decode("utf-8")
            return code
        except:
            pass
    return "Failed to decode"


def main(image_path):
    original_image = cv2.imread(image_path)
    if original_image is None:
        result = {"status": "error", "message": f"Error: Image at {image_path} could not be loaded."}
        print(json.dumps(result))
        return
    
    preprocessed_image = preprocess_image(original_image)
    corners = find_corners_of_largest_polygon(preprocessed_image)
    if corners is None:
        result = {"status": "error", "message": "Could not find the corners of a quadrilateral in the image."}
        print(json.dumps(result))
        return
    
    aligned_image = align_image(original_image, corners.reshape(4, 2))
    decoded_data = decode_secret(aligned_image)
    if decoded_data=="Failed to decode":
        result = {"status": "error", "message": "Failed to decode."}
    else:
        result = {"status": "success", "code": decoded_data, "message": "Image processing and decoding completed successfully."}
    print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        main(image_path)
    else:
        print("Usage: script_name.py <image_path>")
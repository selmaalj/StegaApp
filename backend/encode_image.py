import bchlib
import glob
import os
from PIL import Image, ImageOps
import numpy as np
import tensorflow as tf
from tensorflow.python.saved_model import signature_constants
import io

import logging
tf.get_logger().setLevel(logging.ERROR)

BCH_POLYNOMIAL = 137
BCH_BITS = 5

def encode_image_function(model_path, image_data, secret):
    # Load the model using the TF2.x API
    model = tf.saved_model.load(model_path)
    infer = model.signatures[signature_constants.DEFAULT_SERVING_SIGNATURE_DEF_KEY]

    width = 400
    height = 400

    bch = bchlib.BCH(BCH_BITS, prim_poly=BCH_POLYNOMIAL)

    if len(secret) > 7:
        raise ValueError('Error: Can only encode 56bits (7 characters) with ECC')

    data = bytearray(secret + ' ' * (7 - len(secret)), 'utf-8')
    ecc = bch.encode(data)
    packet = data + ecc

    packet_binary = ''.join(format(x, '08b') for x in packet)
    secret = [int(x) for x in packet_binary]
    secret.extend([0, 0, 0, 0])

    size = (width, height)

    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    image = np.array(ImageOps.fit(image, size), dtype=np.float32)
    image /= 255.

    input_dict = {
        'secret': tf.convert_to_tensor([secret], dtype=tf.float32),
        'image': tf.convert_to_tensor([image], dtype=tf.float32)
    }

    # Run inference
    result = infer(**input_dict)
    hidden_img = result['stegastamp'].numpy()
    residual = result['residual'].numpy()

    rescaled = (hidden_img[0] * 255).astype(np.uint8)
    residual = residual[0] + .5
    residual = (residual * 255).astype(np.uint8)

    hidden_image = Image.fromarray(rescaled)
    residual_image = Image.fromarray(np.squeeze(np.array(residual)))

    hidden_image_buffer = io.BytesIO()
    hidden_image.save(hidden_image_buffer, format="PNG")
    hidden_image_buffer.seek(0)

    residual_image_buffer = io.BytesIO()
    residual_image.save(residual_image_buffer, format="PNG")
    residual_image_buffer.seek(0)

    return hidden_image_buffer, residual_image_buffer

#!/bin/bash

pip install gdown

FILE_ID="1f-g4HKVkNqnamAuwa_q7zcW_aEgXTjZl"
ZIP_FILE="saved_models.zip"

gdown "https://drive.google.com/uc?id=${FILE_ID}" -O "$ZIP_FILE"

unzip "$ZIP_FILE"

rm "$ZIP_FILE"

echo "Download and extraction complete. Folder 'saved_models' is ready."
**Example usage for algorithm**
* cd backend
* python encode_image.py saved_models/stegastamp_pretrained --image image.jpeg --save_dir out --secret Hello
* python decode_image.py saved_models/stegastamp_pretrained --image out/image_hidden.png

**Backend**
* cd backend
* uvicorn main:app --reload

**Frontend**
* cd frontend
* npm start or npm run android




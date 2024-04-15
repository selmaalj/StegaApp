**Example usage for algorithm**
* cd algorithm
* python encode_image.py saved_models/stegastamp_pretrained --image slika.jpeg --save_dir out --secret Hello
* python decode_image.py saved_models/stegastamp_pretrained --image out/slika_hidden.png

**Backend**
* uvicorn main:app --reload

**Frontend**
* cd frontend
* npm start or npm run android




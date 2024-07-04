import os
import subprocess
import glob
from pathlib import Path

SECRET = "Hello!1"  

def encode_images(image_dir, model_path, save_dir, secret):
    """
    Poziva encode_image.py za enkodiranje svih slika u direktorijumu.
    """
    script_path = os.path.join(os.path.dirname(__file__), "encode_image.py")
    command = [
        "python", script_path,
        model_path,
        "--images_dir", image_dir,
        "--save_dir", save_dir,
        "--secret", secret
    ]
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error occurred while running encode_image.py: {e}")

def decode_images(model_path, images_dir):
    """
    Pokreće decode_image.py za sve slike u `images_dir` i vraća sve dekodirane poruke.
    """
    script_path = os.path.join(os.path.dirname(__file__), "decode_image.py")
    command = [
        "python", script_path,
        model_path,
        "--images_dir", images_dir,
        "--secret_size", str(56)  
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        output = result.stdout
        print("decode_image.py Output:\n", output)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error occurred while running decode_image.py: {e}")

    return output

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Encode and decode images using encode_image.py and decode_image.py.")
    parser.add_argument('--model', type=str, required=True, help='Path to the trained model.')
    parser.add_argument('--images_dir', type=str, required=True, help='Directory containing images to process.')
    parser.add_argument('--save_dir', type=str, required=True, help='Directory to save the encoded images.')
    parser.add_argument('--secret', type=str, default=SECRET, help='Secret message to encode (default: "Hello!1").')
    args = parser.parse_args()

    if not os.path.exists(args.images_dir):
        raise FileNotFoundError(f"Input directory '{args.images_dir}' does not exist.")
    
    if not os.path.exists(args.save_dir):
        os.makedirs(args.save_dir)

    encode_images(args.images_dir, args.model, args.save_dir, args.secret)

    print(f"Successfully encoded images from '{args.images_dir}' and saved them to '{args.save_dir}'.")

    output = decode_images(args.model, args.save_dir)
    
    decoded_secrets = output.strip().split('\n')
    total_images = len(decoded_secrets)
    successful_decodings = sum(secret == SECRET for secret in decoded_secrets)
    success_rate = (successful_decodings / total_images) * 100 if total_images > 0 else 0
    
    print(f"Decoding success rate: {success_rate:.2f}%")
    print(f"Total images: {total_images}")
    print(f"Successful decodings: {successful_decodings}")

if __name__ == "__main__":
    main()

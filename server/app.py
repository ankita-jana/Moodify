from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import tempfile
import os
import json
import random

app = Flask(__name__)
CORS(app)

# Load emotion configuration JSON
with open("enhanced_emotion_genre_map.json", "r", encoding="utf-8") as f:
    EMOTION_MAP = json.load(f)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Flask backend is running!"})

@app.route("/analyze", methods=["POST"])
def analyze():
    tmp_path = None
    try:
        data = request.get_json()
        image_data = data.get("imageData")
        language = data.get("language", "english").lower()
        era = data.get("era", "today").lower()

        if not image_data:
            return jsonify({"error": "Image data is missing"}), 400

        # Decode Base64 image
        if image_data.startswith("data:image"):
            image_data = image_data.split(",")[1]
        img_bytes = base64.b64decode(image_data)

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
            tmp_file.write(img_bytes)
            tmp_path = tmp_file.name

        # Try emotion detection
        try:
            result = DeepFace.analyze(
                img_path=tmp_path,
                actions=["emotion"],
                enforce_detection=False
            )

            # Handle DeepFace result format
            if isinstance(result, list):
                base_emotion = result[0].get("dominant_emotion", "").lower()
            else:
                base_emotion = result.get("dominant_emotion", "").lower()

            if not base_emotion:
                raise ValueError("No emotion detected")

            matched_emotion = next(
                (key for key in EMOTION_MAP if key in base_emotion),
                "neutral"
            )

        except Exception as e:
            print("⚠️ Emotion detection failed:", e)
            matched_emotion = "aesthetic"  # fallback for blurry / unclear images

        # Get emotion info from config
        emotion_info = EMOTION_MAP.get(matched_emotion, {})
        sub_emotions = emotion_info.get("sub_emotions", [matched_emotion])
        varied_emotion = random.choice(sub_emotions)

        # Validate era
        selected_era = era if era in ["today", "90s", "mixed"] else "today"

        # Get genre for language and era
        genre_map = emotion_info.get("genres", {}).get(selected_era, {})
        genre = genre_map.get(language) or genre_map.get("default") or "pop"

        # Extra: special case for aesthetic / unclear images
        if matched_emotion == "aesthetic":
            genre = " lofi hip-hop"  # better fit for aesthetic mood

        return jsonify({
            "base_emotion": matched_emotion,
            "emotion": varied_emotion,
            "genre": genre,
            "language": language,
            "era": selected_era
        })

    except Exception as e:
        print("❌ Error during analysis:", str(e))
        return jsonify({
            "error": "Emotion analysis failed",
            "details": str(e)
        }), 500

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

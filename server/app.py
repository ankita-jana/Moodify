from flask import Flask, request, jsonify
from deepface import DeepFace
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    image_data = data.get("imageData")

    if not image_data:
        return jsonify({"error": "No image data"}), 400

    try:
        result = DeepFace.analyze(img_path=image_data, actions=["emotion"], enforce_detection=False)
        emotion = result[0]["dominant_emotion"]
        return jsonify({"emotion": emotion})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001)

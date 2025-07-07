from transformers import BertTokenizer, TFBertForSequenceClassification
import tensorflow as tf
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # crawler 디렉토리 절대 경로
MODEL_PATH = os.path.join(BASE_DIR, "bert-sentiment-model")

tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
model = TFBertForSequenceClassification.from_pretrained(MODEL_PATH)

id2label = {0: "neutral", 1: "positive", 2: "negative"}

def predict_sentiment(text: str) -> str:
    inputs = tokenizer(text, return_tensors="tf", truncation=True, padding=True, max_length=128)
    outputs = model(inputs).logits
    prediction = tf.math.argmax(outputs, axis=1).numpy()[0]
    return id2label[prediction]

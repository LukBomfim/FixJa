from flask import Flask, jsonify
from rotas.categorias_routes import categorias_bp

app = Flask(__name__)
app.register_blueprint(categorias_bp)

@app.route('/')
def home():
    return jsonify({"status": "API Rodando", "message": "API da FixJa!"}), 200

if __name__ == "__main__":
    app.run(debug=True)
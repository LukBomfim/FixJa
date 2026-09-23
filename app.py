from flask import Flask, jsonify
from rotas.categorias_routes import categorias_bp
from rotas.prestadores_routes import prestadores_bp
from rotas.contratacoes_routes import contratacoes_bp
from rotas.avaliacoes_routes import avaliacoes_bp
from rotas.auth_route import auth_bp
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
app.register_blueprint(categorias_bp)
app.register_blueprint(prestadores_bp)
app.register_blueprint(contratacoes_bp)
app.register_blueprint(avaliacoes_bp)
app.register_blueprint(auth_bp)

@app.route('/')
def home():
    return jsonify({"status": "API Rodando", "message": "API da FixJa!"}), 200

if __name__ == "__main__":
    app.run(debug=True)

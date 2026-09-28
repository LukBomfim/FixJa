from flask import Flask, jsonify
from os import getenv
from rotas.categorias_routes import categorias_bp
from rotas.prestadores_routes import prestadores_bp
from rotas.contratacoes_routes import contratacoes_bp
from rotas.avaliacoes_routes import avaliacoes_bp
from rotas.auth_route import auth_bp
from flask_cors import CORS


app = Flask(__name__)
origins = {"http://localhost:5173", "http://127.0.0.1:5173"}
origins.update(origin.strip() for origin in getenv("CORS_ORIGINS", "").split(",") if origin.strip())
CORS(app, resources={r"/*": {"origins": sorted(origins)}})
app.register_blueprint(categorias_bp)
app.register_blueprint(prestadores_bp)
app.register_blueprint(contratacoes_bp)
app.register_blueprint(avaliacoes_bp)
app.register_blueprint(auth_bp)

@app.route('/')
def home():
    return jsonify({"status": "API Rodando", "message": "API da FixJa!"}), 200

@app.errorhandler(404)
def nao_encontrada(e):
    return jsonify({"erro": "Rota não encontrada"}), 404

@app.errorhandler(405)
def metodo_nao_permitido(e):
    return jsonify({"erro": "Método não permitido"}), 405

@app.errorhandler(500)
def erro_interno(e):
    return jsonify({"erro": "Erro interno do servidor"}), 500

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(getenv("PORT", "5000")),
        debug=getenv("FLASK_DEBUG") == "1",
    )
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
    app.run(debug=True, port=5000)
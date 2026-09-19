from flask import Flask
from rotas.categorias_routes import categorias_bp

app = Flask(__name__)
app.register_blueprint(categorias_bp)

if __name__ == "__main__":
    app.run(debug=True)
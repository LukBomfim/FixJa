import React, { useState } from 'react';
import styles from './Login.module.css';

export const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [senha, setSenha] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Login efetuado com sucesso!');
        console.log('Dados do usuário:', data);
      } else {
        alert(`Erro no login: ${data.erro || 'Verifique suas credenciais'}`);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Não foi possível conectar ao servidor Flask!');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>FixJá</h1>
          <p className={styles.subtitle}>Entre na sua conta para continuar</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              className={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Entrar
          </button>
        </form>

        <p className={styles.footerText}>
          Ainda não tem conta?{' '}
          <a href="/register" className={styles.link}>
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
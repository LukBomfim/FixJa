import React, { useState } from 'react';
import styles from './Login.module.css';

interface LoginProps {
  onLoginSuccess?: (data: { email: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Dados do formulário:', { email, password, rememberMe });
      
      setTimeout(() => {
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess({ email });
        alert('Hitou! Login efetuado com sucesso ✨');
      }, 1000);
    } catch (error) {
      setLoading(false);
      alert('Flopou! Verifique suas credenciais.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>🔧 FixJá</div>
          <h1 className={styles.title}>Bem-vindo de volta!</h1>
          <p className={styles.subtitle}>
            Acesse sua conta para gerenciar e contratar os melhores serviços.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>E-mail</label>
            <input
              id="email"
              type="email"
              required
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordHeader}>
              <label htmlFor="password" className={styles.label}>Senha</label>
              <a href="#forgot" className={styles.forgotLink}>Esqueceu a senha?</a>
            </div>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.options}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              Lembrar de mim
            </label>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Carregando...' : 'Entrar na Conta'}
          </button>
        </form>

        <div className={styles.footer}>
          Não tem uma conta ainda?{' '}
          <a href="#register" className={styles.registerLink}>Cadastre-se</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
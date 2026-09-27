import React, { useState } from 'react';
import styles from './Login.module.css';

interface LoginProps {
  onLoginSuccess?: (data: { email: string }) => void;
  onNavigateToRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Dados do Login:', { email, password, rememberMe });
      setTimeout(() => {
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess({ email });
        alert('Login efetuado com sucesso');
      }, 1000);
    } catch (error) {
      setLoading(false);
      alert('Verifique suas credenciais.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      { }
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.brandHeader}>
            <span className={styles.logoBadge}>FixJá</span>
          </div>

          <div className={styles.welcomeText}>
            <h1 className={styles.title}>Acesse sua conta</h1>
            <p className={styles.subtitle}>
              Bem-vindo de volta!
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputField}>
              <label htmlFor="email" className={styles.label}>E-mail</label>
              <input
                id="email"
                type="email"
                required
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputField}>
              <div className={styles.labelRow}>
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

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className={styles.footer}>
            <span>Ainda não tem uma conta?</span>{' '}
            <button 
              type="button" 
              onClick={onNavigateToRegister} 
              className={styles.signupBtnLink}
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </div>

      { }
      <div className={styles.bannerSection}>
        <div className={styles.bannerOverlay}>
          <div className={styles.bannerCard}>
            <h3>Encontre soluções rápidas e profissionais para o seu lar.</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
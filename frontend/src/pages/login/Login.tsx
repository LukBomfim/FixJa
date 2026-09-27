import React, { useState } from 'react';
import styles from './login.module.css';

interface LoginProps {
  onLoginSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de Login
    setTimeout(() => {
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess();
    }, 1000);
  };

  return (
    <div className={styles.pageWrapper}>
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
              <label htmlFor="login-email" className={styles.label}>E-mail</label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputField}>
              <div className={styles.labelWithLink}>
                <label htmlFor="login-password" className={styles.label}>Senha</label>
                <button type="button" className={styles.forgotLink}>
                  Esqueceu a senha?
                </button>
              </div>
              <input
                id="login-password"
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
            <span>Ainda não tem uma conta?</span>
            <button 
              type="button" 
              onClick={onNavigateToRegister} 
              className={styles.switchBtnLink}
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </div>

      <div className={styles.bannerSection}>
        <img 
          src="https://img.magnific.com/fotos-gratis/trabalhador-masculino-numa-fabrica_1303-14306.jpg" 
          alt="Serviços FixJá" 
          className={styles.bannerImage}
        />
        <div className={styles.bannerOverlay} />

      </div>
    </div>
  );
};

export default Login;
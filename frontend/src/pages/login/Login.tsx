import React, { useState } from 'react';
import styles from './Login.module.css';

interface LoginProps {
  onLoginSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Preencha o e-mail.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail em formato inválido.';
    }

    if (!password) {
      newErrors.password = 'Preencha a senha.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
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

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* E-mail */}
            <div className={styles.inputField}>
              <label htmlFor="login-email" className={styles.label}>E-mail</label>
              <input
                id="login-email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              />
              {errors.email && <span className={styles.errorMessage}>⚠️ {errors.email}</span>}
            </div>

            {/* Senha */}
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              />
              {errors.password && <span className={styles.errorMessage}>⚠️ {errors.password}</span>}
            </div>

            {errors.general && <span className={styles.errorMessage}>⚠️ {errors.general}</span>}

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
          src="https://static.portaldaindustria.com.br/portaldaindustria/noticias/media/imagem_plugin/shutterstock_ykVKVdD.jpg" 
          alt="Serviços FixJá" 
          className={styles.bannerImage}
        />
        <div className={styles.bannerOverlay} />
      </div>
    </div>
  );
};

export default Login;
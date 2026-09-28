import React, { useState } from 'react';
import styles from './Cadastro.module.css';

interface RegisterProps {
  onRegisterSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

const SERVICE_OPTIONS = [
  'Encanador', 'Eletricista', 'Pintor', 'Marceneiro', 'Mecânico',
  'Jardineiro', 'Limpeza/Diarista', 'Cabeleireira/Barbeiro', 'Chaveiro', 'Outro'
];

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  selectedService?: string;
  general?: string;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [loading, setLoading] = useState(false);


  // erros por campo específico
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Preencha seu nome completo.';
    }

    if (!email.trim()) {
      newErrors.email = 'Preencha o e-mail.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail em formato inválido.';
    }

    if (!password) {
      newErrors.password = 'Preencha a senha.';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (isProvider && !selectedService) {
      newErrors.selectedService = 'Selecione uma área de atuação.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const payload = {
      name,
      email,
      password,
      role: isProvider ? 'PROVIDER' : 'CLIENT',
      services: isProvider ? [selectedService] : [],
    };

    try {
      console.log('Enviando dados do Cadastro:', payload);
      setTimeout(() => {
        setLoading(false);
        if (onRegisterSuccess) onRegisterSuccess();
      }, 1200);
    } catch (error) {
      setLoading(false);
      setErrors({ general: 'Erro ao realizar cadastro. Tente novamente.' });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.brandHeader}>
            <span className={styles.logoBadge}>FixJá</span>
          </div>

          <div className={styles.welcomeText}>
            <h1 className={styles.title}>Crie sua conta</h1>
            <p className={styles.subtitle}>
              Junte-se ao FixJá como cliente ou prestador de serviços.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Nome */}
            <div className={styles.inputField}>
              <label htmlFor="name" className={styles.label}>Nome Completo</label>
              <input
                id="name"
                type="text"
                placeholder="Ex: Maria Silva"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              />
              {errors.name && <span className={styles.errorMessage}>⚠️ {errors.name}</span>}
            </div>

            {/* E-mail */}
            <div className={styles.inputField}>
              <label htmlFor="reg-email" className={styles.label}>E-mail</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" className={styles.label}>Senha</label>
              <input
                id="reg-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              />
              {errors.password && <span className={styles.errorMessage}>⚠️ {errors.password}</span>}
            </div>

            {/* Tipo de Conta */}
            <div className={styles.accountTypeBox}>
              <label className={styles.accountTypeLabel}>Tipo de Conta</label>
              <div className={styles.typeSelector}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${!isProvider ? styles.typeBtnActive : ''}`}
                  onClick={() => setIsProvider(false)}
                >
                  👤 Cliente
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${isProvider ? styles.typeBtnActive : ''}`}
                  onClick={() => setIsProvider(true)}
                >
                  🛠️ Prestador
                </button>
              </div>
            </div>

            {/* Serviços */}
            {isProvider && (
              <div className={styles.inputField}>
                <label htmlFor="service-select" className={styles.label}>
                  Área Principal de Atuação:
                </label>
                <select
                  id="service-select"
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    if (errors.selectedService) setErrors((prev) => ({ ...prev, selectedService: undefined }));
                  }}
                  className={`${styles.input} ${errors.selectedService ? styles.inputError : ''}`}
                >
                  <option value="" disabled>
                    -- Selecione um serviço --
                  </option>
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                {errors.selectedService && (
                  <span className={styles.errorMessage}>⚠️ {errors.selectedService}</span>
                )}
              </div>
            )}

            {errors.general && <span className={styles.errorMessage}>⚠️ {errors.general}</span>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </button>
          </form>

          <div className={styles.footer}>
            <span>Já tem uma conta?</span>{' '}
            <button 
              type="button" 
              onClick={onNavigateToLogin} 
              className={styles.loginBtnLink}
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>

      <div className={styles.bannerSection}>
        <img 
          src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop" 
          alt="Trabalhador de Serviços FixJá" 
          className={styles.bannerImage}
        />
        <div className={styles.bannerOverlay} />
      </div>
    </div>
  );
};

export default Register;
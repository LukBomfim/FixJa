import React, { useState } from 'react';
import styles from './Cadastro.module.css';

interface RegisterProps {
  onRegisterSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

const SERVICE_OPTIONS = [
  'Encanador', 'Eletricista', 'Pintor', 'Marceneiro', 'Mecânico',
  'Jardineiro', 'Limpeza/Diarista', 'Cabeleireira/Barbeiro', 'Chaveiro'
];

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isProvider && !selectedService) {
      alert('Por favor, selecione a sua área de atuação!');
      return;
    }

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
        alert('Conta criada com sucesso!');
        if (onRegisterSuccess) onRegisterSuccess();
      }, 1200);
    } catch (error) {
      setLoading(false);
      alert('Erro ao realizar cadastro.');
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

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputField}>
              <label htmlFor="name" className={styles.label}>Nome Completo</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Ex: Maria Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputField}>
              <label htmlFor="reg-email" className={styles.label}>E-mail</label>
              <input
                id="reg-email"
                type="email"
                required
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputField}>
              <label htmlFor="reg-password" className={styles.label}>Senha</label>
              <input
                id="reg-password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Seleção do Tipo de Conta */}
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

            {isProvider && (
              <div className={styles.inputField}>
                <label htmlFor="service-select" className={styles.label}>
                  Área Principal de Atuação:
                </label>
                <select
                  id="service-select"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className={styles.input}
                  required={isProvider}
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
              </div>
            )}

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
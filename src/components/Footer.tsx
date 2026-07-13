import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import styles from './Footer.module.css';

interface FooterProps {
  onFAQOpen: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onFAQOpen }) => {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('E-mail cadastrado na simulação de newsletter!');
  };

  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} container`}>
        {/* Newsletter */}
        <div className={styles.sectionNewsletter}>
          <h3>Fique por dentro das novidades</h3>
          <p>Assine nossa newsletter para receber dicas de cultivo e ofertas exclusivas de plantas.</p>
          <form onSubmit={handleNewsletterSubmit} className={styles.form}>
            <input type="email" placeholder="Digite seu melhor e-mail" required />
            <button type="submit">Cadastrar</button>
          </form>
        </div>

        {/* Informacoes de Contato e Endereco */}
        <div className={styles.grid}>
          <div className={styles.infoCol}>
            <h4>Atendimento</h4>
            <ul className={styles.contacts}>
              <li>
                <MapPin size={18} className={styles.icon} />
                <span>Rua Baumann, 963, Vila Leopoldina, São Paulo, SP</span>
              </li>
              <li>
                <Phone size={18} className={styles.icon} />
                <span>(11) 3643-5623 | WhatsApp: (11) 94704-5590</span>
              </li>
              <li>
                <Mail size={18} className={styles.icon} />
                <span>marketing@uemurafloreseplantas.com.br</span>
              </li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h4>Institucional</h4>
            <ul>
              <li><a href="#sobre">Sobre nós</a></li>
              <li><a href="#depoimentos">Depoimentos</a></li>
              <li>
                <button onClick={onFAQOpen} className={styles.footerLinkBtn}>
                  Como Usar (FAQ)
                </button>
              </li>
            </ul>
          </div>

          <div className={styles.socialCol}>
            <h4>Redes Sociais</h4>
            <div className={styles.socialLinks}>
              <a href="https://www.instagram.com/uemuraflores/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://www.facebook.com/fanpageuemura/?fref=ts" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0 -5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
            <p className={styles.hours}>
              Horário de funcionamento:<br />
              Segunda a Sábado das 7h às 18h<br />
              Domingos e Feriados das 9h às 14h
            </p>
          </div>
        </div>

        {/* Rodape final de Copyright e Creditos do Portfolio */}
        <div className={styles.bottomBar}>
          <p>
            Vendido por YUTAKA JARDINAGEM LTDA | CNPJ: 18.469.610/0001-02<br />
            © 2026 Uemura Flores e Plantas. Todos os direitos reservados.
          </p>
          <p className={styles.portfolioCredits}>
            Protótipo desenvolvido para fins de estudos e portfólio de e-commerce.
          </p>
        </div>
      </div>
    </footer>
  );
};

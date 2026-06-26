import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      // Navigation
      "home": "Inicio",
      "teachers": "Profesores",
      "configuration": "Configuración",
      "academy": "Academia",
      "tournament": "Torneo",
      "payments": "Pagos",
      "calendar": "Calendario",
      "reservations": "Reservas",
      "members": "Socios",
      "rewards": "Recompensas",
      "help": "Ayuda",
      "logout": "Cerrar Sesión",
      
      // Configuration
      "initialConfiguration": "Configuración Inicial",
      "courtCount": "Cantidad de Canchas",
      "country": "País",
      "timezone": "Zona Horaria",
      "save": "Guardar",
      "cancel": "Cancelar",
      
      // General
      "welcome": "Bienvenido",
      "loading": "Cargando...",
      "error": "Error",
      "success": "Éxito"
    }
  },
  en: {
    translation: {
      // Navigation
      "home": "Home",
      "teachers": "Teachers",
      "configuration": "Configuration",
      "academy": "Academy",
      "tournament": "Tournament",
      "payments": "Payments",
      "calendar": "Calendar",
      "reservations": "Reservations",
      "members": "Members",
      "rewards": "Rewards",
      "help": "Help",
      "logout": "Logout",
      
      // Configuration
      "initialConfiguration": "Initial Configuration",
      "courtCount": "Court Count",
      "country": "Country",
      "timezone": "Timezone",
      "save": "Save",
      "cancel": "Cancel",
      
      // General
      "welcome": "Welcome",
      "loading": "Loading...",
      "error": "Error",
      "success": "Success"
    }
  },
  it: {
    translation: {
      // Navigation
      "home": "Home",
      "teachers": "Insegnanti",
      "configuration": "Configurazione",
      "academy": "Accademia",
      "tournament": "Torneo",
      "payments": "Pagamenti",
      "calendar": "Calendario",
      "reservations": "Prenotazioni",
      "members": "Membri",
      "rewards": "Ricompense",
      "help": "Aiuto",
      "logout": "Esci",
      
      // Configuration
      "initialConfiguration": "Configurazione Iniziale",
      "courtCount": "Numero di Campi",
      "country": "Paese",
      "timezone": "Fuso Orario",
      "save": "Salva",
      "cancel": "Annulla",
      
      // General
      "welcome": "Benvenuto",
      "loading": "Caricamento...",
      "error": "Errore",
      "success": "Successo"
    }
  },
  pt: {
    translation: {
      // Navigation
      "home": "Início",
      "teachers": "Professores",
      "configuration": "Configuração",
      "academy": "Academia",
      "tournament": "Torneio",
      "payments": "Pagamentos",
      "calendar": "Calendário",
      "reservations": "Reservas",
      "members": "Sócios",
      "rewards": "Recompensas",
      "help": "Ajuda",
      "logout": "Sair",
      
      // Configuration
      "initialConfiguration": "Configuração Inicial",
      "courtCount": "Quantidade de Quadras",
      "country": "País",
      "timezone": "Fuso Horário",
      "save": "Salvar",
      "cancel": "Cancelar",
      
      // General
      "welcome": "Bem-vindo",
      "loading": "Carregando...",
      "error": "Erro",
      "success": "Sucesso"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // default language
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

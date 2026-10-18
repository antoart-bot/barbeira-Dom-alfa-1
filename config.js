export const CONFIG = {
  id: "karen-leao-002",
  nome: "Karen Leão Estética",
  cidade: "Presidente Dutra — MA",

  // Confirme e substitua pelos dados reais da cliente antes de publicar.
  // WhatsApp: 55 + DDD + número, somente dígitos.
  whatsapp: "55DDDNUMERO",
  instagram: "https://www.instagram.com/SEU_PERFIL/",

  horario: {
    semana: "Consulte os horários disponíveis",
    sabado: "Consulte os horários disponíveis"
  },

  servicos: [
    {
        "categoria": "Procedimentos faciais",
        "nome": "Epilação de buço",
        "preco": 10,
        "valor": "epilacao_buco",
        "duracao": "10 minutos",
        "minutos": 10,
        "descricao": "Remoção dos pelos da região do buço."
    },
    {
        "categoria": "Procedimentos faciais",
        "nome": "Design de sobrancelhas",
        "preco": 25,
        "valor": "design_sobrancelhas",
        "duracao": "30 minutos",
        "minutos": 30,
        "descricao": "Design para valorizar o formato natural das sobrancelhas."
    },
    {
        "categoria": "Procedimentos faciais",
        "nome": "Spa labial",
        "preco": 30,
        "valor": "spa_labial",
        "duracao": "20 minutos",
        "minutos": 20,
        "descricao": "Cuidado especial para os lábios."
    },
    {
        "categoria": "Procedimentos faciais",
        "nome": "Revitalização facial",
        "preco": 80,
        "valor": "revitalizacao_facial",
        "duracao": "40 minutos",
        "minutos": 40,
        "descricao": "Procedimento facial voltado ao cuidado e à revitalização da pele."
    },
    {
        "categoria": "Procedimentos faciais",
        "nome": "Limpeza de Pele Tradicional",
        "preco": 130,
        "valor": "limpeza_pele_tradicional",
        "duracao": "1h30 a 2h",
        "minutos": 120,
        "descricao": "Limpeza facial tradicional para cuidado da pele."
    },
    {
        "categoria": "Procedimentos faciais",
        "nome": "Limpeza de Pele Premium",
        "preco": 190,
        "valor": "limpeza_pele_premium",
        "duracao": "1h30 a 2h",
        "minutos": 120,
        "descricao": "Uma experiência de cuidado mais completa para a sua pele.",
        "detalhes": [
            "Inclui 1 sessão de spa labial",
            "Inclui 1 retorno para revitalização facial",
            "O retorno deve ser realizado em até 15 dias após a limpeza, respeitando as necessidades e condições da pele."
        ]
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Epilação de Axilas",
        "preco": 30,
        "valor": "epilacao_axilas",
        "duracao": "20 minutos",
        "minutos": 20,
        "descricao": "Epilação da região das axilas."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Epilação de Meia Perna",
        "preco": 40,
        "valor": "epilacao_meia_perna",
        "duracao": "30 minutos",
        "minutos": 30,
        "descricao": "Epilação da região de meia perna."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Epilação de Perna Completa",
        "preco": 70,
        "valor": "epilacao_perna_completa",
        "duracao": "1 hora",
        "minutos": 60,
        "descricao": "Epilação de toda a perna."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Descoloração Simples",
        "preco": 40,
        "valor": "descoloracao_simples",
        "duracao": "30 minutos",
        "minutos": 30,
        "descricao": "Etapas do procedimento:",
        "detalhes": [
            "Aplicação de parafina",
            "Descoloração dos pelos",
            "Higienização no banho",
            "Hidratação da pele",
            "Trazer roupa íntima ou roupa de banho e uma toalha para utilizar após o banho."
        ]
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Banho de Lua Clareador",
        "preco": 70,
        "valor": "banho_de_lua_clareador",
        "duracao": "40 minutos",
        "minutos": 40,
        "descricao": "Ritual corporal de clareamento e cuidado da pele.",
        "detalhes": [
            "Aplicação de parafina",
            "Descoloração com ativos clareadores",
            "Higienização no banho",
            "Esfoliação com sais de banho",
            "Hidratação com hidratante corporal",
            "Trazer roupa íntima ou roupa de banho e uma toalha para utilizar após o banho."
        ]
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Decapagem Corporal",
        "preco": 70,
        "valor": "decapagem_corporal",
        "duracao": "50 minutos",
        "minutos": 50,
        "descricao": "Procedimento de esfoliação e cuidado corporal.",
        "detalhes": [
            "Esfoliação a seco",
            "Higienização no banho",
            "Hidratação corporal",
            "Trazer roupa íntima ou roupa de banho e uma toalha para utilizar após o banho."
        ]
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Decapagem + Banho de Lua Clareador",
        "preco": 130,
        "valor": "decapagem_banho_de_lua",
        "duracao": "1h30",
        "minutos": 90,
        "descricao": "Combinação de dois procedimentos para renovação da pele e clareamento dos pelos.",
        "detalhes": [
            "Trazer roupa íntima ou roupa de banho e uma toalha para utilizar após o banho."
        ]
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Detox Corporal",
        "preco": 180,
        "valor": "detox_corporal",
        "duracao": "2 horas",
        "minutos": 120,
        "descricao": "Protocolo corporal que combina diferentes técnicas.",
        "detalhes": [
            "Manta térmica",
            "Massagem modeladora",
            "Drenagem linfática corporal completa (frente e costas)",
            "Heccus — ultrassom para tratamento da gordura localizada"
        ]
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Drenagem Linfática Tradicional",
        "preco": 100,
        "valor": "drenagem_linfatica_tradicional",
        "duracao": "1 hora",
        "minutos": 60,
        "descricao": "Técnica manual que auxilia na circulação linfática e na redução do inchaço."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Drenagem Linfática Premium",
        "preco": 150,
        "valor": "drenagem_linfatica_premium",
        "duracao": "1h30",
        "minutos": 90,
        "descricao": "Drenagem linfática associada a tecnologia estética.",
        "detalhes": [
            "Drenagem linfática corporal completa (frente e costas)",
            "Heccus — ultrassom para tratamento da gordura localizada"
        ]
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Massagem Modeladora Abdominal + Heccus",
        "preco": 90,
        "valor": "massagem_modeladora_abdominal_heccus",
        "duracao": "50 minutos",
        "minutos": 50,
        "descricao": "Massagem modeladora na região abdominal associada ao ultrassom para tratamento da gordura localizada."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Massagem Relaxante Premium",
        "preco": 120,
        "valor": "massagem_relaxante_premium",
        "duracao": "1 hora",
        "minutos": 60,
        "descricao": "Experiência de relaxamento com ventosaterapia e bambuterapia."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Tratamento para Flacidez",
        "preco": null,
        "valor": "tratamento_flacidez",
        "duracao": "Definida na avaliação",
        "minutos": null,
        "descricao": "Necessária avaliação estética para definição do protocolo individualizado."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Tratamento para Celulite",
        "preco": null,
        "valor": "tratamento_celulite",
        "duracao": "Definida na avaliação",
        "minutos": null,
        "descricao": "Necessária avaliação estética para definição do protocolo individualizado."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Tratamento para Fortalecimento Muscular",
        "preco": null,
        "valor": "tratamento_fortalecimento_muscular",
        "duracao": "Definida na avaliação",
        "minutos": null,
        "descricao": "Necessária avaliação estética para definição do protocolo individualizado."
    },
    {
        "categoria": "Procedimentos corporais",
        "nome": "Tratamento para Gordura Localizada",
        "preco": null,
        "valor": "tratamento_gordura_localizada",
        "duracao": "Definida na avaliação",
        "minutos": null,
        "descricao": "Necessária avaliação estética para definição do protocolo individualizado."
    },
    {
        "categoria": "Avaliação",
        "nome": "Avaliação estética",
        "preco": 50,
        "valor": "avaliacao_estetica",
        "duracao": "A combinar",
        "minutos": null,
        "descricao": "O valor da avaliação será abatido do procedimento caso decida iniciar o tratamento."
    }
],

  cores: {
    primaria: "#793747",
    fundo: "#f8f3ec"
  }
};

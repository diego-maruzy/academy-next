export const programs = [
  {
    id: "flip-house-4",
    title: "Flip House 4.0",
    slug: "flip-house-4",
    description:
      "Academy premium para análise de negócios, deals e projetos imobiliários de alta performance.",
    coverUrl: "/module-covers/base-do-negocio.jpg",
    status: "Publicado",
    moduleCount: 5,
  },
  {
    id: "growth-masterclass",
    title: "Growth Masterclass",
    slug: "growth-masterclass",
    description:
      "Programa intensivo para líderes que querem acelerar aquisição, retenção e receita com método.",
    coverUrl: "/module-covers/analise-de-negocios.jpg",
    status: "Publicado",
    moduleCount: 4,
  },
  {
    id: "customer-success-pro",
    title: "Customer Success Pro",
    slug: "customer-success-pro",
    description:
      "Trilha prática para construir operações de sucesso do cliente com playbooks e métricas.",
    coverUrl: "/module-covers/comunicacao-interpessoal.jpg",
    status: "Rascunho",
    moduleCount: 3,
  },
];

export const modules = [
  {
    id: "base-do-negocio",
    title: "Base do Negócio",
    description:
      "Fundamentos para começar com uma visão clara sobre produto, mercado e operação.",
    coverUrl: "/module-covers/base-do-negocio.jpg",
    status: "Publicado",
    order: 1,
    lessonCount: 6,
  },
  {
    id: "deal-na-pratica",
    title: "Deal na Prática",
    description:
      "Aprenda a calcular oportunidades, mapear riscos e estruturar negociações.",
    coverUrl: "/module-covers/deal-na-pratica.jpg",
    status: "Publicado",
    order: 2,
    lessonCount: 8,
  },
  {
    id: "analise-de-negocios",
    title: "Análise de Negócios",
    description:
      "Critérios de análise e decisão para avaliar negócios com consistência.",
    coverUrl: "/module-covers/analise-de-negocios.jpg",
    status: "Rascunho",
    order: 3,
    lessonCount: 5,
  },
  {
    id: "comunicacao-interpessoal",
    title: "Comunicação Interpessoal",
    description:
      "Negociação, relacionamento e comunicação para conversas críticas.",
    coverUrl: "/module-covers/comunicacao-interpessoal.jpg",
    status: "Rascunho",
    order: 4,
    lessonCount: 4,
  },
];

export const lessons = [
  {
    id: "boas-vindas",
    title: "Boas-vindas e visão geral",
    description: "Apresentação da trilha, expectativas e próximos passos.",
    vimeoUrl: "https://vimeo.com/123456789",
    ctaLabel: "Baixar workbook",
    ctaUrl: "https://checkmate.com/workbook",
    status: "Publicado",
    order: 1,
  },
  {
    id: "diagnostico",
    title: "Diagnóstico inicial",
    description: "Como mapear maturidade, gargalos e oportunidades.",
    vimeoUrl: "https://vimeo.com/987654321",
    ctaLabel: "Responder diagnóstico",
    ctaUrl: "https://checkmate.com/diagnostico",
    status: "Publicado",
    order: 2,
  },
  {
    id: "plano-acao",
    title: "Plano de ação",
    description: "Priorização das iniciativas e desenho do plano semanal.",
    vimeoUrl: "https://vimeo.com/456789123",
    ctaLabel: "Abrir template",
    ctaUrl: "https://checkmate.com/template",
    status: "Rascunho",
    order: 3,
  },
];

export const clients = [
  {
    name: "Mariana Costa",
    email: "mariana@empresa.com",
    status: "Ativo",
    program: "Growth Masterclass",
    joinedAt: "12/05/2026",
  },
  {
    name: "Rafael Lima",
    email: "rafael@startup.io",
    status: "Ativo",
    program: "Customer Success Pro",
    joinedAt: "28/04/2026",
  },
  {
    name: "Bianca Torres",
    email: "bianca@scaleup.com",
    status: "Pausado",
    program: "Growth Masterclass",
    joinedAt: "03/04/2026",
  },
];

export const team = [
  {
    name: "Diego Martins",
    email: "diego@checkmate.com",
    role: "Administrador",
    status: "Ativo",
  },
  {
    name: "Laura Mendes",
    email: "laura@checkmate.com",
    role: "Conteúdo",
    status: "Ativo",
  },
  {
    name: "Pedro Nunes",
    email: "pedro@checkmate.com",
    role: "Suporte",
    status: "Convidado",
  },
];

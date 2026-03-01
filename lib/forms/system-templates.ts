// Complexo Wellness - Templates de Formulários do Sistema
// Cada profissional pode usar esses templates prontos para enviar aos pacientes

import type { QuestionType, QuestionOption, QuestionConfig, FormSpecialty, FormType } from '@/types/forms'

// ============================================
// ESTRUTURA DE UM TEMPLATE
// ============================================

export interface SystemTemplateQuestion {
  question_text: string
  question_type: QuestionType
  options?: QuestionOption[]
  config?: QuestionConfig
  is_required: boolean
  order_index: number
  section: string
}

export interface SystemTemplate {
  name: string
  description: string
  specialty: FormSpecialty
  form_type: FormType
  questions: SystemTemplateQuestion[]
}

// ============================================
// HELPER: Gerar opções de escala
// ============================================

function scaleConfig(min: number, max: number, minLabel: string, maxLabel: string): QuestionConfig {
  return { min, max, minLabel, maxLabel }
}

function textConfig(placeholder: string, maxLength?: number): QuestionConfig {
  return { placeholder, maxLength }
}

function numberConfig(min: number, max: number, unit: string, step?: number): QuestionConfig {
  return { min, max, unit, step: step ?? 1 }
}

function options(...labels: string[]): QuestionOption[] {
  return labels.map(label => ({ value: label.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''), label }))
}

// ============================================
// TEMPLATE 1: ANAMNESE INICIAL - PERSONAL TRAINER
// ============================================

const trainerInitialAssessment: SystemTemplate = {
  name: 'Anamnese Inicial - Personal Trainer',
  description: 'Formulário completo de avaliação inicial para novos alunos. Coleta histórico de saúde, experiência com exercícios, objetivos e disponibilidade.',
  specialty: 'trainer',
  form_type: 'initial_assessment',
  questions: [
    // === SEÇÃO: DADOS PESSOAIS ===
    { question_text: 'Dados Pessoais', question_type: 'section_header', config: { subtitle: 'Informações básicas sobre você' }, is_required: false, order_index: 0, section: 'Dados Pessoais' },
    { question_text: 'Qual a sua data de nascimento?', question_type: 'date', is_required: true, order_index: 1, section: 'Dados Pessoais' },
    { question_text: 'Qual a sua profissão?', question_type: 'short_text', config: textConfig('Ex: Engenheiro, Professor...'), is_required: false, order_index: 2, section: 'Dados Pessoais' },
    { question_text: 'Sua rotina de trabalho é predominantemente:', question_type: 'single_choice', options: options('Sedentária (sentado a maior parte do tempo)', 'Leve (em pé, caminhando pouco)', 'Moderada (caminha bastante)', 'Intensa (trabalho braçal pesado)'), is_required: true, order_index: 3, section: 'Dados Pessoais' },
    { question_text: 'Contato de emergência (nome e telefone):', question_type: 'short_text', config: textConfig('Ex: Maria Silva - (11) 99999-9999'), is_required: true, order_index: 4, section: 'Dados Pessoais' },

    // === SEÇÃO: HISTÓRICO DE SAÚDE ===
    { question_text: 'Histórico de Saúde', question_type: 'section_header', config: { subtitle: 'Informações importantes para sua segurança durante os treinos' }, is_required: false, order_index: 5, section: 'Histórico de Saúde' },
    { question_text: 'Você possui alguma doença crônica diagnosticada?', question_type: 'yes_no', is_required: true, order_index: 6, section: 'Histórico de Saúde' },
    { question_text: 'Se sim, quais doenças?', question_type: 'multiple_choice', options: options('Hipertensão', 'Diabetes', 'Asma', 'Cardiopatia', 'Artrite/Artrose', 'Osteoporose', 'Hérnia de disco', 'Problemas na tireoide', 'Outra'), is_required: false, order_index: 7, section: 'Histórico de Saúde' },
    { question_text: 'Toma algum medicamento regularmente? Se sim, quais?', question_type: 'long_text', config: textConfig('Liste os medicamentos e dosagens...'), is_required: false, order_index: 8, section: 'Histórico de Saúde' },
    { question_text: 'Já realizou alguma cirurgia? Se sim, quais?', question_type: 'long_text', config: textConfig('Liste as cirurgias e datas aproximadas...'), is_required: false, order_index: 9, section: 'Histórico de Saúde' },
    { question_text: 'Sente dor no peito durante atividades físicas?', question_type: 'yes_no', is_required: true, order_index: 10, section: 'Histórico de Saúde' },
    { question_text: 'Já teve tontura ou perda de consciência durante exercícios?', question_type: 'yes_no', is_required: true, order_index: 11, section: 'Histórico de Saúde' },
    { question_text: 'Algum médico já restringiu você de praticar exercícios?', question_type: 'yes_no', is_required: true, order_index: 12, section: 'Histórico de Saúde' },

    // === SEÇÃO: LESÕES E LIMITAÇÕES ===
    { question_text: 'Lesões e Limitações', question_type: 'section_header', config: { subtitle: 'Para que possamos adaptar os exercícios' }, is_required: false, order_index: 13, section: 'Lesões e Limitações' },
    { question_text: 'Possui alguma lesão atual ou recente?', question_type: 'yes_no', is_required: true, order_index: 14, section: 'Lesões e Limitações' },
    { question_text: 'Se sim, descreva a lesão, região do corpo e há quanto tempo:', question_type: 'long_text', config: textConfig('Ex: Tendinite no ombro direito, há 3 meses...'), is_required: false, order_index: 15, section: 'Lesões e Limitações' },
    { question_text: 'Sente alguma dor durante movimentos do dia a dia?', question_type: 'yes_no', is_required: true, order_index: 16, section: 'Lesões e Limitações' },
    { question_text: 'Se sim, qual o nível de dor (1 = mínima, 10 = insuportável)?', question_type: 'scale', config: scaleConfig(1, 10, 'Mínima', 'Insuportável'), is_required: false, order_index: 17, section: 'Lesões e Limitações' },
    { question_text: 'Há algum movimento ou exercício que você NÃO consegue fazer?', question_type: 'long_text', config: textConfig('Ex: Agachamento profundo, elevação lateral...'), is_required: false, order_index: 18, section: 'Lesões e Limitações' },

    // === SEÇÃO: EXPERIÊNCIA COM EXERCÍCIOS ===
    { question_text: 'Experiência com Exercícios', question_type: 'section_header', config: { subtitle: 'Seu histórico de treino' }, is_required: false, order_index: 19, section: 'Experiência' },
    { question_text: 'Qual seu nível de experiência com musculação?', question_type: 'single_choice', options: options('Nunca treinei', 'Iniciante (menos de 6 meses)', 'Intermediário (6 meses a 2 anos)', 'Avançado (mais de 2 anos)'), is_required: true, order_index: 20, section: 'Experiência' },
    { question_text: 'Pratica ou já praticou algum esporte?', question_type: 'short_text', config: textConfig('Ex: Futebol, natação, corrida, yoga...'), is_required: false, order_index: 21, section: 'Experiência' },
    { question_text: 'Com que frequência treina atualmente?', question_type: 'single_choice', options: options('Não treino', '1-2 vezes por semana', '3-4 vezes por semana', '5-6 vezes por semana', 'Todos os dias'), is_required: true, order_index: 22, section: 'Experiência' },
    { question_text: 'Já treinou com personal trainer antes?', question_type: 'yes_no', is_required: false, order_index: 23, section: 'Experiência' },

    // === SEÇÃO: OBJETIVOS ===
    { question_text: 'Seus Objetivos', question_type: 'section_header', config: { subtitle: 'O que você quer alcançar' }, is_required: false, order_index: 24, section: 'Objetivos' },
    { question_text: 'Quais são seus principais objetivos?', question_type: 'multiple_choice', options: options('Emagrecimento', 'Ganho de massa muscular', 'Condicionamento físico', 'Saúde e qualidade de vida', 'Definição muscular', 'Ganho de força', 'Flexibilidade e mobilidade', 'Reabilitação/recuperação', 'Performance esportiva'), is_required: true, order_index: 25, section: 'Objetivos' },
    { question_text: 'O que você espera alcançar nos próximos 3 meses?', question_type: 'long_text', config: textConfig('Descreva seus objetivos de curto prazo...'), is_required: true, order_index: 26, section: 'Objetivos' },
    { question_text: 'O que já te impediu de alcançar seus objetivos no passado?', question_type: 'long_text', config: textConfig('Ex: Falta de tempo, motivação, lesões...'), is_required: false, order_index: 27, section: 'Objetivos' },
    { question_text: 'De 1 a 10, qual seu nível de comprometimento com o processo?', question_type: 'scale', config: scaleConfig(1, 10, 'Baixo', 'Total'), is_required: true, order_index: 28, section: 'Objetivos' },

    // === SEÇÃO: DISPONIBILIDADE ===
    { question_text: 'Disponibilidade', question_type: 'section_header', config: { subtitle: 'Para montarmos seu programa de treino' }, is_required: false, order_index: 29, section: 'Disponibilidade' },
    { question_text: 'Quantos dias por semana você pode treinar?', question_type: 'single_choice', options: options('2 dias', '3 dias', '4 dias', '5 dias', '6 dias'), is_required: true, order_index: 30, section: 'Disponibilidade' },
    { question_text: 'Qual horário você prefere treinar?', question_type: 'single_choice', options: options('Manhã (6h-9h)', 'Meio da manhã (9h-12h)', 'Almoço (12h-14h)', 'Tarde (14h-18h)', 'Noite (18h-21h)'), is_required: true, order_index: 31, section: 'Disponibilidade' },
    { question_text: 'Onde você treina?', question_type: 'single_choice', options: options('Academia', 'Em casa', 'Ao ar livre', 'Misto'), is_required: true, order_index: 32, section: 'Disponibilidade' },
    { question_text: 'Quais equipamentos você tem disponível?', question_type: 'multiple_choice', options: options('Academia completa', 'Halteres', 'Barra e anilhas', 'Elásticos', 'Peso corporal apenas', 'Kettlebell', 'TRX/Fita de suspensão', 'Outros'), is_required: false, order_index: 33, section: 'Disponibilidade' },

    // === SEÇÃO: ESTILO DE VIDA ===
    { question_text: 'Estilo de Vida', question_type: 'section_header', config: { subtitle: 'Hábitos que influenciam seu treino' }, is_required: false, order_index: 34, section: 'Estilo de Vida' },
    { question_text: 'Quantas horas de sono por noite em média?', question_type: 'number', config: numberConfig(3, 14, 'horas', 0.5), is_required: true, order_index: 35, section: 'Estilo de Vida' },
    { question_text: 'Como você avalia seu nível de estresse?', question_type: 'scale', config: scaleConfig(1, 10, 'Tranquilo', 'Muito estressado'), is_required: true, order_index: 36, section: 'Estilo de Vida' },
    { question_text: 'Você fuma?', question_type: 'single_choice', options: options('Não', 'Sim', 'Parei há menos de 1 ano', 'Parei há mais de 1 ano'), is_required: true, order_index: 37, section: 'Estilo de Vida' },
    { question_text: 'Consome bebida alcoólica?', question_type: 'single_choice', options: options('Não', 'Raramente', 'Socialmente (fins de semana)', 'Frequentemente'), is_required: true, order_index: 38, section: 'Estilo de Vida' },
    { question_text: 'Quantos litros de água bebe por dia?', question_type: 'number', config: numberConfig(0, 10, 'litros', 0.5), is_required: false, order_index: 39, section: 'Estilo de Vida' },

    // === CONSENTIMENTO ===
    { question_text: 'Declaro que as informações fornecidas são verdadeiras e que estou ciente dos riscos inerentes à prática de exercícios físicos. Autorizo o uso dessas informações para a elaboração do meu programa de treinamento.', question_type: 'consent', config: { consentText: 'Li e concordo com o termo acima' }, is_required: true, order_index: 40, section: 'Consentimento' },
  ],
}

// ============================================
// TEMPLATE 2: CHECK-IN SEMANAL - PERSONAL TRAINER
// ============================================

const trainerWeeklyCheckin: SystemTemplate = {
  name: 'Check-in Semanal - Personal Trainer',
  description: 'Formulário rápido para acompanhar o progresso e bem-estar do aluno semanalmente.',
  specialty: 'trainer',
  form_type: 'weekly_checkin',
  questions: [
    { question_text: 'Como Você Está', question_type: 'section_header', config: { subtitle: 'Avaliação rápida da sua semana' }, is_required: false, order_index: 0, section: 'Bem-Estar' },
    { question_text: 'Como foi sua semana de treino?', question_type: 'scale', config: scaleConfig(1, 10, 'Péssima', 'Excelente'), is_required: true, order_index: 1, section: 'Bem-Estar' },
    { question_text: 'Conseguiu completar todos os treinos programados?', question_type: 'single_choice', options: options('Sim, todos', 'Quase todos (faltei 1)', 'Faltei mais da metade', 'Não treinei esta semana'), is_required: true, order_index: 2, section: 'Bem-Estar' },
    { question_text: 'Se não completou, qual foi o motivo?', question_type: 'short_text', config: textConfig('Ex: Viagem, doença, cansaço...'), is_required: false, order_index: 3, section: 'Bem-Estar' },
    { question_text: 'Nível de energia durante os treinos:', question_type: 'scale', config: scaleConfig(1, 10, 'Sem energia', 'Energia total'), is_required: true, order_index: 4, section: 'Bem-Estar' },
    { question_text: 'Sentiu alguma dor ou desconforto novo?', question_type: 'yes_no', is_required: true, order_index: 5, section: 'Bem-Estar' },
    { question_text: 'Se sim, descreva a dor e onde:', question_type: 'short_text', config: textConfig('Ex: Dor no joelho esquerdo ao agachar'), is_required: false, order_index: 6, section: 'Bem-Estar' },
    { question_text: 'Como está sua alimentação esta semana?', question_type: 'scale', config: scaleConfig(1, 10, 'Muito ruim', 'Perfeita'), is_required: true, order_index: 7, section: 'Bem-Estar' },
    { question_text: 'Como está seu sono?', question_type: 'scale', config: scaleConfig(1, 10, 'Muito ruim', 'Ótimo'), is_required: true, order_index: 8, section: 'Bem-Estar' },
    { question_text: 'Observações ou dúvidas para o próximo treino:', question_type: 'long_text', config: textConfig('Algo que queira compartilhar...'), is_required: false, order_index: 9, section: 'Bem-Estar' },
  ],
}

// ============================================
// TEMPLATE 3: AVALIAÇÃO DE PROGRESSO - PERSONAL TRAINER
// ============================================

const trainerProgressReview: SystemTemplate = {
  name: 'Avaliação de Progresso - Personal Trainer',
  description: 'Formulário mensal para avaliar a evolução do aluno e ajustar o programa.',
  specialty: 'trainer',
  form_type: 'progress_review',
  questions: [
    { question_text: 'Medidas Atuais', question_type: 'section_header', config: { subtitle: 'Registre suas medidas mais recentes' }, is_required: false, order_index: 0, section: 'Medidas' },
    { question_text: 'Peso atual (kg):', question_type: 'number', config: numberConfig(30, 300, 'kg', 0.1), is_required: true, order_index: 1, section: 'Medidas' },
    { question_text: 'Circunferência da cintura (cm):', question_type: 'number', config: numberConfig(40, 200, 'cm', 0.5), is_required: false, order_index: 2, section: 'Medidas' },
    { question_text: 'Circunferência do quadril (cm):', question_type: 'number', config: numberConfig(40, 200, 'cm', 0.5), is_required: false, order_index: 3, section: 'Medidas' },
    { question_text: 'Circunferência do braço direito (cm):', question_type: 'number', config: numberConfig(15, 60, 'cm', 0.5), is_required: false, order_index: 4, section: 'Medidas' },
    { question_text: 'Circunferência da coxa direita (cm):', question_type: 'number', config: numberConfig(30, 100, 'cm', 0.5), is_required: false, order_index: 5, section: 'Medidas' },

    { question_text: 'Avaliação do Período', question_type: 'section_header', config: { subtitle: 'Reflexão sobre o último mês' }, is_required: false, order_index: 6, section: 'Avaliação' },
    { question_text: 'Satisfação com os resultados até agora:', question_type: 'scale', config: scaleConfig(1, 10, 'Insatisfeito', 'Muito satisfeito'), is_required: true, order_index: 7, section: 'Avaliação' },
    { question_text: 'Quais foram suas maiores conquistas neste período?', question_type: 'long_text', config: textConfig('Ex: Aumentei carga no supino, perdi 2kg...'), is_required: true, order_index: 8, section: 'Avaliação' },
    { question_text: 'Quais foram suas maiores dificuldades?', question_type: 'long_text', config: textConfig('Ex: Manter a dieta, falta de tempo...'), is_required: true, order_index: 9, section: 'Avaliação' },
    { question_text: 'Sente que está evoluindo na força?', question_type: 'single_choice', options: options('Sim, bastante', 'Sim, um pouco', 'Estagnado', 'Piorei'), is_required: true, order_index: 10, section: 'Avaliação' },
    { question_text: 'Sente mudanças visuais no corpo?', question_type: 'single_choice', options: options('Sim, mudança visível', 'Sim, sutil', 'Não percebi mudança', 'Piorei'), is_required: true, order_index: 11, section: 'Avaliação' },
    { question_text: 'Gostaria de mudar algo no treino?', question_type: 'long_text', config: textConfig('Sugestões, preferências, exercícios que gosta/não gosta...'), is_required: false, order_index: 12, section: 'Avaliação' },
    { question_text: 'Seus objetivos mudaram? Se sim, quais são os novos?', question_type: 'long_text', config: textConfig('Descreva se algo mudou...'), is_required: false, order_index: 13, section: 'Avaliação' },
    { question_text: 'Nível de motivação atual:', question_type: 'scale', config: scaleConfig(1, 10, 'Desmotivado', 'Super motivado'), is_required: true, order_index: 14, section: 'Avaliação' },
  ],
}

// ============================================
// TEMPLATE 4: ANAMNESE NUTRICIONAL COMPLETA
// ============================================

const nutritionistInitialAssessment: SystemTemplate = {
  name: 'Anamnese Nutricional Completa',
  description: 'Formulário completo de avaliação nutricional para primeira consulta. Coleta histórico alimentar, preferências, restrições e hábitos.',
  specialty: 'nutritionist',
  form_type: 'initial_assessment',
  questions: [
    // === SEÇÃO: DADOS PESSOAIS ===
    { question_text: 'Dados Pessoais', question_type: 'section_header', config: { subtitle: 'Informações básicas' }, is_required: false, order_index: 0, section: 'Dados Pessoais' },
    { question_text: 'Data de nascimento:', question_type: 'date', is_required: true, order_index: 1, section: 'Dados Pessoais' },
    { question_text: 'Profissão:', question_type: 'short_text', config: textConfig('Sua profissão atual'), is_required: false, order_index: 2, section: 'Dados Pessoais' },
    { question_text: 'Estado civil:', question_type: 'dropdown', options: options('Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'), is_required: false, order_index: 3, section: 'Dados Pessoais' },
    { question_text: 'Quem mora com você?', question_type: 'short_text', config: textConfig('Ex: Esposa e 2 filhos'), is_required: false, order_index: 4, section: 'Dados Pessoais' },

    // === SEÇÃO: MEDIDAS ===
    { question_text: 'Medidas Atuais', question_type: 'section_header', config: { subtitle: 'Se souber, informe suas medidas' }, is_required: false, order_index: 5, section: 'Medidas' },
    { question_text: 'Peso atual (kg):', question_type: 'number', config: numberConfig(30, 300, 'kg', 0.1), is_required: true, order_index: 6, section: 'Medidas' },
    { question_text: 'Altura (cm):', question_type: 'number', config: numberConfig(100, 250, 'cm', 1), is_required: true, order_index: 7, section: 'Medidas' },
    { question_text: 'Circunferência da cintura (cm):', question_type: 'number', config: numberConfig(40, 200, 'cm', 0.5), is_required: false, order_index: 8, section: 'Medidas' },
    { question_text: 'Qual foi o seu maior peso na vida adulta?', question_type: 'number', config: numberConfig(30, 300, 'kg', 0.1), is_required: false, order_index: 9, section: 'Medidas' },
    { question_text: 'Qual foi o seu menor peso na vida adulta?', question_type: 'number', config: numberConfig(30, 300, 'kg', 0.1), is_required: false, order_index: 10, section: 'Medidas' },
    { question_text: 'Seu peso mudou nos últimos 3 meses?', question_type: 'single_choice', options: options('Aumentou', 'Diminuiu', 'Manteve estável', 'Não sei'), is_required: false, order_index: 11, section: 'Medidas' },

    // === SEÇÃO: HISTÓRICO DE SAÚDE ===
    { question_text: 'Histórico de Saúde', question_type: 'section_header', config: { subtitle: 'Condições de saúde relevantes para sua nutrição' }, is_required: false, order_index: 12, section: 'Saúde' },
    { question_text: 'Possui alguma condição de saúde diagnosticada?', question_type: 'multiple_choice', options: options('Nenhuma', 'Diabetes tipo 1', 'Diabetes tipo 2', 'Hipertensão', 'Colesterol alto', 'Triglicerídeos alto', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do intestino irritável', 'Doença celíaca', 'Refluxo gastroesofágico', 'Anemia', 'Esteatose hepática (gordura no fígado)', 'Outra'), is_required: true, order_index: 13, section: 'Saúde' },
    { question_text: 'Se marcou "Outra", especifique:', question_type: 'short_text', config: textConfig('Descreva outras condições...'), is_required: false, order_index: 14, section: 'Saúde' },
    { question_text: 'Medicamentos que toma regularmente:', question_type: 'long_text', config: textConfig('Liste nome e dosagem de cada medicamento...'), is_required: false, order_index: 15, section: 'Saúde' },
    { question_text: 'Suplementos que toma atualmente:', question_type: 'long_text', config: textConfig('Ex: Whey protein, creatina, vitamina D...'), is_required: false, order_index: 16, section: 'Saúde' },
    { question_text: 'Realizou exames de sangue recentemente?', question_type: 'single_choice', options: options('Sim, há menos de 3 meses', 'Sim, há 3-6 meses', 'Sim, há mais de 6 meses', 'Não fiz recentemente'), is_required: true, order_index: 17, section: 'Saúde' },

    // === SEÇÃO: ALERGIAS E RESTRIÇÕES ===
    { question_text: 'Alergias e Restrições Alimentares', question_type: 'section_header', config: { subtitle: 'Para garantir a segurança do seu plano' }, is_required: false, order_index: 18, section: 'Alergias' },
    { question_text: 'Possui alguma alergia alimentar?', question_type: 'multiple_choice', options: options('Nenhuma', 'Leite/Lactose', 'Glúten/Trigo', 'Ovo', 'Amendoim', 'Castanhas/Nozes', 'Frutos do mar', 'Soja', 'Outra'), is_required: true, order_index: 19, section: 'Alergias' },
    { question_text: 'Possui intolerância alimentar?', question_type: 'multiple_choice', options: options('Nenhuma', 'Lactose', 'Glúten', 'Frutose', 'FODMAP', 'Outra'), is_required: true, order_index: 20, section: 'Alergias' },
    { question_text: 'Segue alguma dieta específica?', question_type: 'single_choice', options: options('Nenhuma', 'Vegetariana', 'Vegana', 'Pescetariana', 'Low carb', 'Cetogênica', 'Sem glúten', 'Sem lactose', 'Outra'), is_required: true, order_index: 21, section: 'Alergias' },
    { question_text: 'Tem restrição alimentar por motivo religioso ou cultural?', question_type: 'short_text', config: textConfig('Ex: Kosher, Halal, jejum intermitente...'), is_required: false, order_index: 22, section: 'Alergias' },

    // === SEÇÃO: HÁBITOS ALIMENTARES ===
    { question_text: 'Hábitos Alimentares', question_type: 'section_header', config: { subtitle: 'Como você se alimenta no dia a dia' }, is_required: false, order_index: 23, section: 'Hábitos' },
    { question_text: 'Quantas refeições você faz por dia?', question_type: 'single_choice', options: options('1-2', '3-4', '5-6', 'Mais de 6'), is_required: true, order_index: 24, section: 'Hábitos' },
    { question_text: 'Costuma pular alguma refeição?', question_type: 'multiple_choice', options: options('Não, faço todas', 'Pulo o café da manhã', 'Pulo o almoço', 'Pulo o jantar', 'Pulo lanches'), is_required: true, order_index: 25, section: 'Hábitos' },
    { question_text: 'Onde você faz a maioria das refeições?', question_type: 'single_choice', options: options('Em casa', 'No trabalho (marmita)', 'No trabalho (restaurante/bandejão)', 'Restaurantes e delivery', 'Misto'), is_required: true, order_index: 26, section: 'Hábitos' },
    { question_text: 'Quem prepara suas refeições?', question_type: 'single_choice', options: options('Eu mesmo(a)', 'Cônjuge/familiar', 'Empregada(o)/cozinheira(o)', 'Compro pronto/delivery', 'Misto'), is_required: true, order_index: 27, section: 'Hábitos' },
    { question_text: 'Quanto tempo tem para cozinhar por dia?', question_type: 'single_choice', options: options('Menos de 15 minutos', '15-30 minutos', '30-60 minutos', 'Mais de 1 hora', 'Não cozinho'), is_required: true, order_index: 28, section: 'Hábitos' },
    { question_text: 'Quantos litros de água bebe por dia?', question_type: 'number', config: numberConfig(0, 10, 'litros', 0.5), is_required: true, order_index: 29, section: 'Hábitos' },
    { question_text: 'Consome bebidas alcoólicas?', question_type: 'single_choice', options: options('Não', 'Raramente', 'Fins de semana', 'Quase diariamente'), is_required: true, order_index: 30, section: 'Hábitos' },
    { question_text: 'Consome refrigerante ou sucos industrializados?', question_type: 'single_choice', options: options('Não', 'Raramente', '1-3 vezes por semana', 'Diariamente'), is_required: true, order_index: 31, section: 'Hábitos' },

    // === SEÇÃO: PREFERÊNCIAS ===
    { question_text: 'Preferências Alimentares', question_type: 'section_header', config: { subtitle: 'Para montar um plano que você goste' }, is_required: false, order_index: 32, section: 'Preferências' },
    { question_text: 'Alimentos que você MAIS gosta:', question_type: 'long_text', config: textConfig('Liste seus alimentos favoritos...'), is_required: true, order_index: 33, section: 'Preferências' },
    { question_text: 'Alimentos que você NÃO come de jeito nenhum:', question_type: 'long_text', config: textConfig('Liste alimentos que detesta ou não consome...'), is_required: true, order_index: 34, section: 'Preferências' },
    { question_text: 'Come verduras e legumes regularmente?', question_type: 'single_choice', options: options('Sim, adoro', 'Sim, mas poucos tipos', 'Pouco, estou tentando melhorar', 'Quase nunca'), is_required: true, order_index: 35, section: 'Preferências' },
    { question_text: 'Come frutas regularmente?', question_type: 'single_choice', options: options('Sim, todo dia', 'Algumas vezes por semana', 'Raramente', 'Quase nunca'), is_required: true, order_index: 36, section: 'Preferências' },

    // === SEÇÃO: INTESTINO ===
    { question_text: 'Saúde Intestinal', question_type: 'section_header', config: { subtitle: 'Informações sobre seu funcionamento intestinal' }, is_required: false, order_index: 37, section: 'Intestino' },
    { question_text: 'Como funciona seu intestino?', question_type: 'single_choice', options: options('Regular (todo dia)', 'Quase regular (dia sim, dia não)', 'Irregular (2-3 vezes por semana)', 'Preso (menos de 2 vezes por semana)', 'Solto (diarreia frequente)'), is_required: true, order_index: 38, section: 'Intestino' },
    { question_text: 'Sente inchaço abdominal frequente?', question_type: 'yes_no', is_required: true, order_index: 39, section: 'Intestino' },
    { question_text: 'Sente gases frequentes?', question_type: 'yes_no', is_required: true, order_index: 40, section: 'Intestino' },

    // === SEÇÃO: COMPORTAMENTO ALIMENTAR ===
    { question_text: 'Comportamento Alimentar', question_type: 'section_header', config: { subtitle: 'Sua relação com a comida' }, is_required: false, order_index: 41, section: 'Comportamento' },
    { question_text: 'Come quando está estressado(a), ansioso(a) ou triste?', question_type: 'single_choice', options: options('Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'), is_required: true, order_index: 42, section: 'Comportamento' },
    { question_text: 'Come rápido ou devagar?', question_type: 'single_choice', options: options('Muito rápido', 'Rápido', 'Normal', 'Devagar'), is_required: true, order_index: 43, section: 'Comportamento' },
    { question_text: 'Já fez alguma dieta antes? Se sim, quais?', question_type: 'long_text', config: textConfig('Ex: Low carb, Dukan, jejum intermitente...'), is_required: false, order_index: 44, section: 'Comportamento' },
    { question_text: 'Como é sua relação com a comida?', question_type: 'scale', config: scaleConfig(1, 10, 'Muito difícil', 'Ótima'), is_required: true, order_index: 45, section: 'Comportamento' },

    // === SEÇÃO: OBJETIVOS ===
    { question_text: 'Seus Objetivos', question_type: 'section_header', config: { subtitle: 'O que você quer alcançar com o acompanhamento nutricional' }, is_required: false, order_index: 46, section: 'Objetivos' },
    { question_text: 'Quais seus principais objetivos nutricionais?', question_type: 'multiple_choice', options: options('Emagrecimento', 'Ganho de massa muscular', 'Melhora da saúde geral', 'Controlar condição de saúde', 'Mais energia e disposição', 'Melhorar performance esportiva', 'Aprender a comer melhor', 'Reduzir sintomas digestivos'), is_required: true, order_index: 47, section: 'Objetivos' },
    { question_text: 'Se quer emagrecer, qual peso você gostaria de alcançar?', question_type: 'number', config: numberConfig(30, 300, 'kg', 0.1), is_required: false, order_index: 48, section: 'Objetivos' },
    { question_text: 'Pratica atividade física? Se sim, qual e com que frequência?', question_type: 'short_text', config: textConfig('Ex: Musculação 4x/semana + corrida 2x/semana'), is_required: true, order_index: 49, section: 'Objetivos' },

    // === CONSENTIMENTO ===
    { question_text: 'Declaro que as informações fornecidas são verdadeiras e autorizo o uso para elaboração do meu plano nutricional, conforme a Lei Geral de Proteção de Dados (LGPD).', question_type: 'consent', config: { consentText: 'Li e concordo com o termo acima' }, is_required: true, order_index: 50, section: 'Consentimento' },
  ],
}

// ============================================
// TEMPLATE 5: RECORDATÓRIO ALIMENTAR 24H
// ============================================

const nutritionistFoodRecall: SystemTemplate = {
  name: 'Recordatório Alimentar 24h',
  description: 'Formulário para o paciente registrar tudo o que comeu e bebeu nas últimas 24 horas. Ideal para consultas de retorno.',
  specialty: 'nutritionist',
  form_type: 'food_recall',
  questions: [
    { question_text: 'Recordatório Alimentar', question_type: 'section_header', config: { subtitle: 'Descreva tudo o que comeu e bebeu ontem (últimas 24h), com o máximo de detalhes possível: horário, alimento, quantidade e forma de preparo.' }, is_required: false, order_index: 0, section: 'Recordatório' },
    { question_text: 'Ao acordar (água, café, chá...):', question_type: 'long_text', config: textConfig('Ex: 1 copo de água morna com limão, 7h'), is_required: false, order_index: 1, section: 'Recordatório' },
    { question_text: 'Café da manhã:', question_type: 'long_text', config: textConfig('Horário + o que comeu e bebeu, com quantidades aproximadas...'), is_required: true, order_index: 2, section: 'Recordatório' },
    { question_text: 'Lanche da manhã:', question_type: 'long_text', config: textConfig('Se não comeu, escreva "não comi"'), is_required: true, order_index: 3, section: 'Recordatório' },
    { question_text: 'Almoço:', question_type: 'long_text', config: textConfig('Horário + o que comeu, incluindo bebida...'), is_required: true, order_index: 4, section: 'Recordatório' },
    { question_text: 'Lanche da tarde:', question_type: 'long_text', config: textConfig('Se não comeu, escreva "não comi"'), is_required: true, order_index: 5, section: 'Recordatório' },
    { question_text: 'Jantar:', question_type: 'long_text', config: textConfig('Horário + o que comeu, incluindo bebida...'), is_required: true, order_index: 6, section: 'Recordatório' },
    { question_text: 'Ceia / Antes de dormir:', question_type: 'long_text', config: textConfig('Se não comeu, escreva "não comi"'), is_required: false, order_index: 7, section: 'Recordatório' },
    { question_text: 'Beliscou algo entre as refeições?', question_type: 'long_text', config: textConfig('Ex: 2 biscoitos, 1 bombom, punhado de amendoim...'), is_required: false, order_index: 8, section: 'Recordatório' },

    { question_text: 'Contexto do Dia', question_type: 'section_header', config: { subtitle: 'Informações sobre como foi seu dia' }, is_required: false, order_index: 9, section: 'Contexto' },
    { question_text: 'Este dia foi representativo da sua alimentação habitual?', question_type: 'single_choice', options: options('Sim, comi como de costume', 'Comi melhor que o normal', 'Comi pior que o normal', 'Foi um dia atípico (viagem, evento, etc.)'), is_required: true, order_index: 10, section: 'Contexto' },
    { question_text: 'Quantos copos de água bebeu ontem?', question_type: 'number', config: numberConfig(0, 30, 'copos', 1), is_required: true, order_index: 11, section: 'Contexto' },
    { question_text: 'Como foi seu apetite ontem?', question_type: 'single_choice', options: options('Normal', 'Mais fome que o normal', 'Menos fome que o normal', 'Sem apetite'), is_required: true, order_index: 12, section: 'Contexto' },
    { question_text: 'Observações adicionais:', question_type: 'long_text', config: textConfig('Algo relevante sobre o dia: estresse, sono, atividade física...'), is_required: false, order_index: 13, section: 'Contexto' },
  ],
}

// ============================================
// TEMPLATE 6: CHECK-IN NUTRICIONAL SEMANAL
// ============================================

const nutritionistWeeklyCheckin: SystemTemplate = {
  name: 'Check-in Nutricional Semanal',
  description: 'Formulário rápido para acompanhar a adesão ao plano alimentar e bem-estar do paciente.',
  specialty: 'nutritionist',
  form_type: 'weekly_checkin',
  questions: [
    { question_text: 'Adesão ao Plano', question_type: 'section_header', config: { subtitle: 'Como foi sua semana com o plano alimentar' }, is_required: false, order_index: 0, section: 'Adesão' },
    { question_text: 'Conseguiu seguir o plano alimentar esta semana?', question_type: 'scale', config: scaleConfig(1, 10, 'Não segui', 'Segui 100%'), is_required: true, order_index: 1, section: 'Adesão' },
    { question_text: 'Qual refeição foi mais difícil de seguir?', question_type: 'single_choice', options: options('Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia', 'Nenhuma, segui todas'), is_required: true, order_index: 2, section: 'Adesão' },
    { question_text: 'O que dificultou seguir o plano?', question_type: 'multiple_choice', options: options('Nada, consegui seguir', 'Falta de tempo para cozinhar', 'Eventos sociais', 'Vontade de comer doces/besteiras', 'Alimentos do plano não disponíveis', 'Falta de apetite', 'Ansiedade/estresse', 'Outro'), is_required: true, order_index: 3, section: 'Adesão' },

    { question_text: 'Bem-Estar', question_type: 'section_header', config: { subtitle: 'Como você se sentiu' }, is_required: false, order_index: 4, section: 'Bem-Estar' },
    { question_text: 'Nível de energia durante a semana:', question_type: 'scale', config: scaleConfig(1, 10, 'Sem energia', 'Energia total'), is_required: true, order_index: 5, section: 'Bem-Estar' },
    { question_text: 'Como está seu intestino?', question_type: 'single_choice', options: options('Funcionando bem', 'Um pouco preso', 'Preso', 'Solto/diarreia', 'Alternando'), is_required: true, order_index: 6, section: 'Bem-Estar' },
    { question_text: 'Sentiu inchaço ou desconforto abdominal?', question_type: 'yes_no', is_required: true, order_index: 7, section: 'Bem-Estar' },
    { question_text: 'Peso atual (se pesou):', question_type: 'number', config: numberConfig(30, 300, 'kg', 0.1), is_required: false, order_index: 8, section: 'Bem-Estar' },
    { question_text: 'Observações, dúvidas ou sugestões:', question_type: 'long_text', config: textConfig('Algo que queira compartilhar com seu nutricionista...'), is_required: false, order_index: 9, section: 'Bem-Estar' },
  ],
}

// ============================================
// EXPORTAR TODOS OS TEMPLATES
// ============================================

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  trainerInitialAssessment,
  trainerWeeklyCheckin,
  trainerProgressReview,
  nutritionistInitialAssessment,
  nutritionistFoodRecall,
  nutritionistWeeklyCheckin,
]

// Templates agrupados por especialidade
export const TEMPLATES_BY_SPECIALTY: Record<FormSpecialty, SystemTemplate[]> = {
  trainer: [trainerInitialAssessment, trainerWeeklyCheckin, trainerProgressReview],
  nutritionist: [nutritionistInitialAssessment, nutritionistFoodRecall, nutritionistWeeklyCheckin],
  coach: [], // Fase 2
}

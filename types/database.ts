// Complexo Wellness - Database Types
// Tipos gerados manualmente baseados no schema do banco de dados

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      fitness_profiles: {
        Row: {
          id: string
          nome: string
          email: string
          data_nascimento: string | null
          sexo: string | null
          altura_cm: number | null
          peso_atual: number | null
          objetivo: string | null
          nivel_atividade: string | null
          meta_calorias_diarias: number | null
          meta_proteina_g: number | null
          meta_carboidrato_g: number | null
          meta_gordura_g: number | null
          meta_agua_ml: number
          hora_acordar: string
          hora_dormir: string
          usa_medicamento_jejum: boolean
          medicamento_nome: string | null
          medicamento_horario: string | null
          medicamento_jejum_antes_horas: number | null
          medicamento_restricao_depois_horas: number | null
          medicamento_restricao_tipo: string | null
          meta_peso: number | null
          meta_percentual_gordura: number | null
          meta_massa_muscular: number | null
          data_meta: string | null
          streak_atual: number
          maior_streak: number
          pontos_totais: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          data_nascimento?: string | null
          sexo?: string | null
          altura_cm?: number | null
          peso_atual?: number | null
          objetivo?: string | null
          nivel_atividade?: string | null
          meta_calorias_diarias?: number | null
          meta_proteina_g?: number | null
          meta_carboidrato_g?: number | null
          meta_gordura_g?: number | null
          meta_agua_ml?: number
          hora_acordar?: string
          hora_dormir?: string
          usa_medicamento_jejum?: boolean
          medicamento_nome?: string | null
          medicamento_horario?: string | null
          medicamento_jejum_antes_horas?: number | null
          medicamento_restricao_depois_horas?: number | null
          medicamento_restricao_tipo?: string | null
          meta_peso?: number | null
          meta_percentual_gordura?: number | null
          meta_massa_muscular?: number | null
          data_meta?: string | null
          streak_atual?: number
          maior_streak?: number
          pontos_totais?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          data_nascimento?: string | null
          sexo?: string | null
          altura_cm?: number | null
          peso_atual?: number | null
          objetivo?: string | null
          nivel_atividade?: string | null
          meta_calorias_diarias?: number | null
          meta_proteina_g?: number | null
          meta_carboidrato_g?: number | null
          meta_gordura_g?: number | null
          meta_agua_ml?: number
          hora_acordar?: string
          hora_dormir?: string
          usa_medicamento_jejum?: boolean
          medicamento_nome?: string | null
          medicamento_horario?: string | null
          medicamento_jejum_antes_horas?: number | null
          medicamento_restricao_depois_horas?: number | null
          medicamento_restricao_tipo?: string | null
          meta_peso?: number | null
          meta_percentual_gordura?: number | null
          meta_massa_muscular?: number | null
          data_meta?: string | null
          streak_atual?: number
          maior_streak?: number
          pontos_totais?: number
          updated_at?: string
        }
      }
      fitness_exercises_library: {
        Row: {
          id: string
          nome: string
          nome_en: string | null
          grupo_muscular: string
          musculos_secundarios: string[] | null
          equipamento: string | null
          tipo: string | null
          instrucoes: string | null
          video_url: string | null
          imagem_url: string | null
          dificuldade: string | null
          is_composto: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          nome_en?: string | null
          grupo_muscular: string
          musculos_secundarios?: string[] | null
          equipamento?: string | null
          tipo?: string | null
          instrucoes?: string | null
          video_url?: string | null
          imagem_url?: string | null
          dificuldade?: string | null
          is_composto?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          nome_en?: string | null
          grupo_muscular?: string
          musculos_secundarios?: string[] | null
          equipamento?: string | null
          tipo?: string | null
          instrucoes?: string | null
          video_url?: string | null
          imagem_url?: string | null
          dificuldade?: string | null
          is_composto?: boolean
        }
      }
      fitness_workout_templates: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          descricao: string | null
          tipo: string | null
          fase: string | null
          dia_semana: number | null
          duracao_estimada_min: number | null
          is_ativo: boolean
          ordem: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome: string
          descricao?: string | null
          tipo?: string | null
          fase?: string | null
          dia_semana?: number | null
          duracao_estimada_min?: number | null
          is_ativo?: boolean
          ordem?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          nome?: string
          descricao?: string | null
          tipo?: string | null
          fase?: string | null
          dia_semana?: number | null
          duracao_estimada_min?: number | null
          is_ativo?: boolean
          ordem?: number | null
          updated_at?: string
        }
      }
      fitness_workout_template_exercises: {
        Row: {
          id: string
          template_id: string | null
          exercise_id: string | null
          exercicio_nome: string | null
          ordem: number
          series: number | null
          repeticoes: string | null
          descanso_segundos: number | null
          carga_sugerida: number | null
          unidade_carga: string
          notas: string | null
          is_superset: boolean
          superset_grupo: number | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          exercise_id?: string | null
          exercicio_nome?: string | null
          ordem: number
          series?: number | null
          repeticoes?: string | null
          descanso_segundos?: number | null
          carga_sugerida?: number | null
          unidade_carga?: string
          notas?: string | null
          is_superset?: boolean
          superset_grupo?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          exercise_id?: string | null
          exercicio_nome?: string | null
          ordem?: number
          series?: number | null
          repeticoes?: string | null
          descanso_segundos?: number | null
          carga_sugerida?: number | null
          unidade_carga?: string
          notas?: string | null
          is_superset?: boolean
          superset_grupo?: number | null
        }
      }
      fitness_workouts: {
        Row: {
          id: string
          user_id: string | null
          template_id: string | null
          nome: string
          tipo: string | null
          data: string
          hora_inicio: string | null
          hora_fim: string | null
          duracao_minutos: number | null
          status: string
          calorias_estimadas: number | null
          notas: string | null
          nivel_energia: number | null
          nivel_dificuldade: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          template_id?: string | null
          nome: string
          tipo?: string | null
          data: string
          hora_inicio?: string | null
          hora_fim?: string | null
          duracao_minutos?: number | null
          status?: string
          calorias_estimadas?: number | null
          notas?: string | null
          nivel_energia?: number | null
          nivel_dificuldade?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          template_id?: string | null
          nome?: string
          tipo?: string | null
          data?: string
          hora_inicio?: string | null
          hora_fim?: string | null
          duracao_minutos?: number | null
          status?: string
          calorias_estimadas?: number | null
          notas?: string | null
          nivel_energia?: number | null
          nivel_dificuldade?: number | null
          updated_at?: string
        }
      }
      fitness_workout_exercises: {
        Row: {
          id: string
          workout_id: string | null
          exercise_id: string | null
          exercicio_nome: string
          ordem: number
          status: string
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id?: string | null
          exercise_id?: string | null
          exercicio_nome: string
          ordem: number
          status?: string
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string | null
          exercise_id?: string | null
          exercicio_nome?: string
          ordem?: number
          status?: string
          notas?: string | null
        }
      }
      fitness_exercise_sets: {
        Row: {
          id: string
          workout_exercise_id: string | null
          numero_serie: number
          repeticoes_planejadas: number | null
          repeticoes_realizadas: number | null
          carga: number | null
          unidade_carga: string
          tempo_segundos: number | null
          status: string
          is_pr: boolean
          rpe: number | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_exercise_id?: string | null
          numero_serie: number
          repeticoes_planejadas?: number | null
          repeticoes_realizadas?: number | null
          carga?: number | null
          unidade_carga?: string
          tempo_segundos?: number | null
          status?: string
          is_pr?: boolean
          rpe?: number | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_exercise_id?: string | null
          numero_serie?: number
          repeticoes_planejadas?: number | null
          repeticoes_realizadas?: number | null
          carga?: number | null
          unidade_carga?: string
          tempo_segundos?: number | null
          status?: string
          is_pr?: boolean
          rpe?: number | null
          notas?: string | null
        }
      }
      fitness_personal_records: {
        Row: {
          id: string
          user_id: string | null
          exercise_id: string | null
          exercicio_nome: string
          tipo_record: string | null
          valor: number
          unidade: string | null
          data_record: string
          workout_id: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          exercise_id?: string | null
          exercicio_nome: string
          tipo_record?: string | null
          valor: number
          unidade?: string | null
          data_record: string
          workout_id?: string | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          exercise_id?: string | null
          exercicio_nome?: string
          tipo_record?: string | null
          valor?: number
          unidade?: string | null
          data_record?: string
          workout_id?: string | null
          notas?: string | null
        }
      }
      fitness_foods: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          marca: string | null
          porcao_padrao: number
          unidade_porcao: string
          calorias: number | null
          proteinas: number | null
          carboidratos: number | null
          gorduras: number | null
          fibras: number | null
          sodio: number | null
          categoria: string | null
          is_favorito: boolean
          codigo_barras: string | null
          imagem_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome: string
          marca?: string | null
          porcao_padrao?: number
          unidade_porcao?: string
          calorias?: number | null
          proteinas?: number | null
          carboidratos?: number | null
          gorduras?: number | null
          fibras?: number | null
          sodio?: number | null
          categoria?: string | null
          is_favorito?: boolean
          codigo_barras?: string | null
          imagem_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          nome?: string
          marca?: string | null
          porcao_padrao?: number
          unidade_porcao?: string
          calorias?: number | null
          proteinas?: number | null
          carboidratos?: number | null
          gorduras?: number | null
          fibras?: number | null
          sodio?: number | null
          categoria?: string | null
          is_favorito?: boolean
          codigo_barras?: string | null
          imagem_url?: string | null
        }
      }
      fitness_meals: {
        Row: {
          id: string
          user_id: string | null
          data: string
          tipo_refeicao: string
          horario: string | null
          horario_planejado: string | null
          status: string
          calorias_total: number | null
          proteinas_total: number | null
          carboidratos_total: number | null
          gorduras_total: number | null
          foto_url: string | null
          analise_ia: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          data: string
          tipo_refeicao: string
          horario?: string | null
          horario_planejado?: string | null
          status?: string
          calorias_total?: number | null
          proteinas_total?: number | null
          carboidratos_total?: number | null
          gorduras_total?: number | null
          foto_url?: string | null
          analise_ia?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          data?: string
          tipo_refeicao?: string
          horario?: string | null
          horario_planejado?: string | null
          status?: string
          calorias_total?: number | null
          proteinas_total?: number | null
          carboidratos_total?: number | null
          gorduras_total?: number | null
          foto_url?: string | null
          analise_ia?: string | null
          notas?: string | null
          updated_at?: string
        }
      }
      fitness_meal_items: {
        Row: {
          id: string
          meal_id: string | null
          food_id: string | null
          nome_alimento: string
          quantidade: number
          unidade: string
          calorias: number | null
          proteinas: number | null
          carboidratos: number | null
          gorduras: number | null
          created_at: string
        }
        Insert: {
          id?: string
          meal_id?: string | null
          food_id?: string | null
          nome_alimento: string
          quantidade: number
          unidade?: string
          calorias?: number | null
          proteinas?: number | null
          carboidratos?: number | null
          gorduras?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          meal_id?: string | null
          food_id?: string | null
          nome_alimento?: string
          quantidade?: number
          unidade?: string
          calorias?: number | null
          proteinas?: number | null
          carboidratos?: number | null
          gorduras?: number | null
        }
      }
      fitness_water_logs: {
        Row: {
          id: string
          user_id: string | null
          data: string
          horario: string
          quantidade_ml: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          data: string
          horario?: string
          quantidade_ml: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          data?: string
          horario?: string
          quantidade_ml?: number
        }
      }
      fitness_body_compositions: {
        Row: {
          id: string
          user_id: string | null
          data: string
          peso: number | null
          altura_cm: number | null
          idade: number | null
          agua_corporal_l: number | null
          proteina_kg: number | null
          minerais_kg: number | null
          massa_gordura_kg: number | null
          massa_muscular_esqueletica_kg: number | null
          imc: number | null
          percentual_gordura: number | null
          massa_muscular_esqueletica_ref_min: number | null
          massa_muscular_esqueletica_ref_max: number | null
          massa_livre_gordura_kg: number | null
          taxa_metabolica_basal: number | null
          relacao_cintura_quadril: number | null
          gordura_visceral: number | null
          grau_obesidade: number | null
          peso_ideal: number | null
          controle_peso: number | null
          controle_gordura: number | null
          controle_muscular: number | null
          pontuacao_inbody: number | null
          massa_magra_braco_esquerdo: number | null
          massa_magra_braco_esquerdo_percent: number | null
          massa_magra_braco_direito: number | null
          massa_magra_braco_direito_percent: number | null
          massa_magra_tronco: number | null
          massa_magra_tronco_percent: number | null
          massa_magra_perna_esquerda: number | null
          massa_magra_perna_esquerda_percent: number | null
          massa_magra_perna_direita: number | null
          massa_magra_perna_direita_percent: number | null
          gordura_braco_esquerdo: number | null
          gordura_braco_esquerdo_percent: number | null
          gordura_braco_direito: number | null
          gordura_braco_direito_percent: number | null
          gordura_tronco: number | null
          gordura_tronco_percent: number | null
          gordura_perna_esquerda: number | null
          gordura_perna_esquerda_percent: number | null
          gordura_perna_direita: number | null
          gordura_perna_direita_percent: number | null
          impedancia_dados: Json | null
          foto_url: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          data: string
          peso?: number | null
          altura_cm?: number | null
          idade?: number | null
          agua_corporal_l?: number | null
          proteina_kg?: number | null
          minerais_kg?: number | null
          massa_gordura_kg?: number | null
          massa_muscular_esqueletica_kg?: number | null
          imc?: number | null
          percentual_gordura?: number | null
          massa_muscular_esqueletica_ref_min?: number | null
          massa_muscular_esqueletica_ref_max?: number | null
          massa_livre_gordura_kg?: number | null
          taxa_metabolica_basal?: number | null
          relacao_cintura_quadril?: number | null
          gordura_visceral?: number | null
          grau_obesidade?: number | null
          peso_ideal?: number | null
          controle_peso?: number | null
          controle_gordura?: number | null
          controle_muscular?: number | null
          pontuacao_inbody?: number | null
          massa_magra_braco_esquerdo?: number | null
          massa_magra_braco_esquerdo_percent?: number | null
          massa_magra_braco_direito?: number | null
          massa_magra_braco_direito_percent?: number | null
          massa_magra_tronco?: number | null
          massa_magra_tronco_percent?: number | null
          massa_magra_perna_esquerda?: number | null
          massa_magra_perna_esquerda_percent?: number | null
          massa_magra_perna_direita?: number | null
          massa_magra_perna_direita_percent?: number | null
          gordura_braco_esquerdo?: number | null
          gordura_braco_esquerdo_percent?: number | null
          gordura_braco_direito?: number | null
          gordura_braco_direito_percent?: number | null
          gordura_tronco?: number | null
          gordura_tronco_percent?: number | null
          gordura_perna_esquerda?: number | null
          gordura_perna_esquerda_percent?: number | null
          gordura_perna_direita?: number | null
          gordura_perna_direita_percent?: number | null
          impedancia_dados?: Json | null
          foto_url?: string | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          data?: string
          peso?: number | null
          altura_cm?: number | null
          idade?: number | null
          agua_corporal_l?: number | null
          proteina_kg?: number | null
          minerais_kg?: number | null
          massa_gordura_kg?: number | null
          massa_muscular_esqueletica_kg?: number | null
          imc?: number | null
          percentual_gordura?: number | null
          massa_muscular_esqueletica_ref_min?: number | null
          massa_muscular_esqueletica_ref_max?: number | null
          massa_livre_gordura_kg?: number | null
          taxa_metabolica_basal?: number | null
          relacao_cintura_quadril?: number | null
          gordura_visceral?: number | null
          grau_obesidade?: number | null
          peso_ideal?: number | null
          controle_peso?: number | null
          controle_gordura?: number | null
          controle_muscular?: number | null
          pontuacao_inbody?: number | null
          massa_magra_braco_esquerdo?: number | null
          massa_magra_braco_esquerdo_percent?: number | null
          massa_magra_braco_direito?: number | null
          massa_magra_braco_direito_percent?: number | null
          massa_magra_tronco?: number | null
          massa_magra_tronco_percent?: number | null
          massa_magra_perna_esquerda?: number | null
          massa_magra_perna_esquerda_percent?: number | null
          massa_magra_perna_direita?: number | null
          massa_magra_perna_direita_percent?: number | null
          gordura_braco_esquerdo?: number | null
          gordura_braco_esquerdo_percent?: number | null
          gordura_braco_direito?: number | null
          gordura_braco_direito_percent?: number | null
          gordura_tronco?: number | null
          gordura_tronco_percent?: number | null
          gordura_perna_esquerda?: number | null
          gordura_perna_esquerda_percent?: number | null
          gordura_perna_direita?: number | null
          gordura_perna_direita_percent?: number | null
          impedancia_dados?: Json | null
          foto_url?: string | null
          notas?: string | null
        }
      }
      fitness_progress_photos: {
        Row: {
          id: string
          user_id: string | null
          data: string
          tipo: string | null
          foto_url: string
          peso_no_dia: number | null
          percentual_gordura_no_dia: number | null
          notas: string | null
          is_favorita: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          data: string
          tipo?: string | null
          foto_url: string
          peso_no_dia?: number | null
          percentual_gordura_no_dia?: number | null
          notas?: string | null
          is_favorita?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          data?: string
          tipo?: string | null
          foto_url?: string
          peso_no_dia?: number | null
          percentual_gordura_no_dia?: number | null
          notas?: string | null
          is_favorita?: boolean
        }
      }
      fitness_daily_notes: {
        Row: {
          id: string
          user_id: string | null
          data: string
          humor: number | null
          nivel_energia: number | null
          nivel_estresse: number | null
          qualidade_sono: number | null
          dores: string[] | null
          notas: string | null
          pontuacao_dia: number | null
          treino_concluido: boolean
          alimentacao_ok: boolean
          agua_ok: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          data: string
          humor?: number | null
          nivel_energia?: number | null
          nivel_estresse?: number | null
          qualidade_sono?: number | null
          dores?: string[] | null
          notas?: string | null
          pontuacao_dia?: number | null
          treino_concluido?: boolean
          alimentacao_ok?: boolean
          agua_ok?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          data?: string
          humor?: number | null
          nivel_energia?: number | null
          nivel_estresse?: number | null
          qualidade_sono?: number | null
          dores?: string[] | null
          notas?: string | null
          pontuacao_dia?: number | null
          treino_concluido?: boolean
          alimentacao_ok?: boolean
          agua_ok?: boolean
          updated_at?: string
        }
      }
      fitness_sleep_logs: {
        Row: {
          id: string
          user_id: string | null
          data: string
          hora_dormir: string | null
          hora_acordar: string | null
          duracao_minutos: number | null
          qualidade: number | null
          fatores: string[] | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          data: string
          hora_dormir?: string | null
          hora_acordar?: string | null
          duracao_minutos?: number | null
          qualidade?: number | null
          fatores?: string[] | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          data?: string
          hora_dormir?: string | null
          hora_acordar?: string | null
          duracao_minutos?: number | null
          qualidade?: number | null
          fatores?: string[] | null
          notas?: string | null
        }
      }
      fitness_supplements: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          tipo: string | null
          dosagem: string | null
          horario_ideal: string | null
          instrucoes: string | null
          is_ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome: string
          tipo?: string | null
          dosagem?: string | null
          horario_ideal?: string | null
          instrucoes?: string | null
          is_ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          nome?: string
          tipo?: string | null
          dosagem?: string | null
          horario_ideal?: string | null
          instrucoes?: string | null
          is_ativo?: boolean
        }
      }
      fitness_supplements_logs: {
        Row: {
          id: string
          user_id: string | null
          supplement_id: string | null
          data: string
          horario: string
          tomado: boolean
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          supplement_id?: string | null
          data: string
          horario?: string
          tomado?: boolean
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          supplement_id?: string | null
          data?: string
          horario?: string
          tomado?: boolean
          notas?: string | null
        }
      }
      fitness_achievements: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          icone: string | null
          categoria: string | null
          criterio: Json | null
          pontos: number
          is_ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          icone?: string | null
          categoria?: string | null
          criterio?: Json | null
          pontos?: number
          is_ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          icone?: string | null
          categoria?: string | null
          criterio?: Json | null
          pontos?: number
          is_ativo?: boolean
        }
      }
      fitness_achievements_users: {
        Row: {
          id: string
          user_id: string | null
          achievement_id: string | null
          data_desbloqueio: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          achievement_id?: string | null
          data_desbloqueio?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          achievement_id?: string | null
          data_desbloqueio?: string
        }
      }
      fitness_goals: {
        Row: {
          id: string
          user_id: string | null
          titulo: string
          descricao: string | null
          tipo: string | null
          valor_atual: number | null
          valor_meta: number | null
          unidade: string | null
          data_inicio: string
          data_alvo: string | null
          status: string
          prioridade: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          titulo: string
          descricao?: string | null
          tipo?: string | null
          valor_atual?: number | null
          valor_meta?: number | null
          unidade?: string | null
          data_inicio?: string
          data_alvo?: string | null
          status?: string
          prioridade?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          titulo?: string
          descricao?: string | null
          tipo?: string | null
          valor_atual?: number | null
          valor_meta?: number | null
          unidade?: string | null
          data_inicio?: string
          data_alvo?: string | null
          status?: string
          prioridade?: number
          updated_at?: string
        }
      }
      fitness_coach_conversations: {
        Row: {
          id: string
          user_id: string | null
          mensagem_usuario: string
          resposta_coach: string
          contexto: Json | null
          tokens_usados: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          mensagem_usuario: string
          resposta_coach: string
          contexto?: Json | null
          tokens_usados?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          mensagem_usuario?: string
          resposta_coach?: string
          contexto?: Json | null
          tokens_usados?: number | null
        }
      }
      fitness_notification_settings: {
        Row: {
          id: string
          user_id: string | null
          push_subscription: Json | null
          notif_treino_ativo: boolean
          notif_treino_horario: string
          notif_agua_ativo: boolean
          notif_agua_intervalo_horas: number
          notif_medicamento_ativo: boolean
          notif_refeicao_ativo: boolean
          notif_sono_ativo: boolean
          notif_sono_horario: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          push_subscription?: Json | null
          notif_treino_ativo?: boolean
          notif_treino_horario?: string
          notif_agua_ativo?: boolean
          notif_agua_intervalo_horas?: number
          notif_medicamento_ativo?: boolean
          notif_refeicao_ativo?: boolean
          notif_sono_ativo?: boolean
          notif_sono_horario?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          push_subscription?: Json | null
          notif_treino_ativo?: boolean
          notif_treino_horario?: string
          notif_agua_ativo?: boolean
          notif_agua_intervalo_horas?: number
          notif_medicamento_ativo?: boolean
          notif_refeicao_ativo?: boolean
          notif_sono_ativo?: boolean
          notif_sono_horario?: string
          updated_at?: string
        }
      }
      // ============================================
      // TABLES ADDED IN PHASES 2-8
      // ============================================
      fitness_professionals: {
        Row: {
          id: string
          user_id: string
          type: string
          registration: string | null
          specialty: string | null
          bio: string | null
          max_clients: number
          is_active: boolean
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          registration?: string | null
          specialty?: string | null
          bio?: string | null
          max_clients?: number
          is_active?: boolean
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          registration?: string | null
          specialty?: string | null
          bio?: string | null
          max_clients?: number
          is_active?: boolean
          display_name?: string | null
          updated_at?: string
        }
      }
      fitness_client_assignments: {
        Row: {
          id: string
          client_id: string
          professional_id: string
          assigned_at: string
          assigned_by: string | null
          notes: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          professional_id: string
          assigned_at?: string
          assigned_by?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          professional_id?: string
          assigned_at?: string
          assigned_by?: string | null
          notes?: string | null
          is_active?: boolean
        }
      }
      fitness_appointments: {
        Row: {
          id: string
          patient_id: string
          professional_id: string
          appointment_type: string
          meeting_link: string | null
          date: string
          start_time: string
          end_time: string
          location: string | null
          status: string
          reschedule_reason: string | null
          reschedule_requested_at: string | null
          notes: string | null
          confirmed_by_patient: boolean
          confirmed_at: string | null
          ics_data: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          professional_id: string
          appointment_type: string
          meeting_link?: string | null
          date: string
          start_time: string
          end_time: string
          location?: string | null
          status?: string
          reschedule_reason?: string | null
          reschedule_requested_at?: string | null
          notes?: string | null
          confirmed_by_patient?: boolean
          confirmed_at?: string | null
          ics_data?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          professional_id?: string
          appointment_type?: string
          meeting_link?: string | null
          date?: string
          start_time?: string
          end_time?: string
          location?: string | null
          status?: string
          reschedule_reason?: string | null
          reschedule_requested_at?: string | null
          notes?: string | null
          confirmed_by_patient?: boolean
          confirmed_at?: string | null
          ics_data?: string | null
          created_by?: string
          updated_at?: string
        }
      }
      fitness_professional_notes: {
        Row: {
          id: string
          professional_id: string
          patient_id: string
          appointment_id: string | null
          note_type: string
          content: string
          visible_to_roles: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          patient_id: string
          appointment_id?: string | null
          note_type: string
          content: string
          visible_to_roles?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          patient_id?: string
          appointment_id?: string | null
          note_type?: string
          content?: string
          visible_to_roles?: string[]
          updated_at?: string
        }
      }
      fitness_community_posts: {
        Row: {
          id: string
          user_id: string
          post_type: string
          content: string | null
          image_url: string | null
          related_id: string | null
          is_auto_generated: boolean
          reactions_count: Json
          comments_count: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_type: string
          content?: string | null
          image_url?: string | null
          related_id?: string | null
          is_auto_generated?: boolean
          reactions_count?: Json
          comments_count?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_type?: string
          content?: string | null
          image_url?: string | null
          related_id?: string | null
          is_auto_generated?: boolean
          reactions_count?: Json
          comments_count?: number
          is_visible?: boolean
          updated_at?: string
        }
      }
      fitness_community_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          reaction_type?: string
        }
      }
      fitness_community_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          is_visible?: boolean
          updated_at?: string
        }
      }
      fitness_rankings: {
        Row: {
          id: string
          name: string
          type: string
          category: string | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          description: string | null
          point_rules: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          category?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          description?: string | null
          point_rules?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          category?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          description?: string | null
          point_rules?: Json
          created_by?: string | null
          updated_at?: string
        }
      }
      fitness_ranking_participants: {
        Row: {
          id: string
          ranking_id: string
          user_id: string
          total_points: number
          current_position: number | null
          joined_at: string
        }
        Insert: {
          id?: string
          ranking_id: string
          user_id: string
          total_points?: number
          current_position?: number | null
          joined_at?: string
        }
        Update: {
          id?: string
          ranking_id?: string
          user_id?: string
          total_points?: number
          current_position?: number | null
        }
      }
      fitness_point_transactions: {
        Row: {
          id: string
          user_id: string
          points: number
          reason: string
          category: string
          source: string
          awarded_by: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points: number
          reason: string
          category: string
          source: string
          awarded_by?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          reason?: string
          category?: string
          source?: string
          awarded_by?: string | null
          reference_id?: string | null
        }
      }
      fitness_push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          keys_p256dh: string
          keys_auth: string
          user_agent: string | null
          active: boolean
          created_at: string
          last_used: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          keys_p256dh: string
          keys_auth: string
          user_agent?: string | null
          active?: boolean
          created_at?: string
          last_used?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          keys_p256dh?: string
          keys_auth?: string
          user_agent?: string | null
          active?: boolean
          last_used?: string
        }
      }
      fitness_notification_history: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          sent_at: string
          read_at: string | null
          clicked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          sent_at?: string
          read_at?: string | null
          clicked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          sent_at?: string
          read_at?: string | null
          clicked_at?: string | null
        }
      }
      fitness_form_templates: {
        Row: {
          id: string
          professional_id: string | null
          name: string
          description: string | null
          specialty: string
          form_type: string
          is_system_template: boolean
          is_active: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id?: string | null
          name: string
          description?: string | null
          specialty: string
          form_type: string
          is_system_template?: boolean
          is_active?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string | null
          name?: string
          description?: string | null
          specialty?: string
          form_type?: string
          is_system_template?: boolean
          is_active?: boolean
          version?: number
          updated_at?: string
        }
      }
      fitness_form_questions: {
        Row: {
          id: string
          template_id: string
          question_text: string
          question_type: string
          options: Json | null
          config: Json
          is_required: boolean
          order_index: number
          section: string | null
          conditional_on: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          question_text: string
          question_type: string
          options?: Json | null
          config?: Json
          is_required?: boolean
          order_index?: number
          section?: string | null
          conditional_on?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          question_text?: string
          question_type?: string
          options?: Json | null
          config?: Json
          is_required?: boolean
          order_index?: number
          section?: string | null
          conditional_on?: Json | null
        }
      }
      fitness_form_assignments: {
        Row: {
          id: string
          template_id: string
          template_version: number
          professional_id: string
          client_id: string
          status: string
          due_date: string | null
          sent_at: string
          started_at: string | null
          completed_at: string | null
          reminder_sent: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          template_version?: number
          professional_id: string
          client_id: string
          status?: string
          due_date?: string | null
          sent_at?: string
          started_at?: string | null
          completed_at?: string | null
          reminder_sent?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          template_version?: number
          professional_id?: string
          client_id?: string
          status?: string
          due_date?: string | null
          sent_at?: string
          started_at?: string | null
          completed_at?: string | null
          reminder_sent?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      fitness_form_responses: {
        Row: {
          id: string
          assignment_id: string
          question_id: string
          question_snapshot: Json
          response_value: Json
          responded_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          question_id: string
          question_snapshot: Json
          response_value: Json
          responded_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          question_id?: string
          question_snapshot?: Json
          response_value?: Json
          responded_at?: string
        }
      }
      fitness_form_drafts: {
        Row: {
          id: string
          assignment_id: string
          client_id: string
          draft_data: Json
          current_step: number
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          client_id: string
          draft_data?: Json
          current_step?: number
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          client_id?: string
          draft_data?: Json
          current_step?: number
          updated_at?: string
        }
      }
      fitness_conversations: {
        Row: {
          id: string
          client_id: string
          professional_id: string
          last_message_at: string
          client_unread_count: number
          professional_unread_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          professional_id: string
          last_message_at?: string
          client_unread_count?: number
          professional_unread_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          professional_id?: string
          last_message_at?: string
          client_unread_count?: number
          professional_unread_count?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      fitness_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          sender_type: string
          content: string
          message_type: string
          metadata: Json | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          sender_type: string
          content: string
          message_type?: string
          metadata?: Json | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          sender_type?: string
          content?: string
          message_type?: string
          metadata?: Json | null
          is_read?: boolean
          read_at?: string | null
        }
      }
      fitness_meal_plans: {
        Row: {
          id: string
          professional_id: string
          client_id: string | null
          name: string
          description: string | null
          goal: string | null
          calories_target: number | null
          protein_target: number | null
          carbs_target: number | null
          fat_target: number | null
          fiber_target: number | null
          water_target: number | null
          duration_weeks: number
          is_template: boolean
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          client_id?: string | null
          name: string
          description?: string | null
          goal?: string | null
          calories_target?: number | null
          protein_target?: number | null
          carbs_target?: number | null
          fat_target?: number | null
          fiber_target?: number | null
          water_target?: number | null
          duration_weeks?: number
          is_template?: boolean
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          client_id?: string | null
          name?: string
          description?: string | null
          goal?: string | null
          calories_target?: number | null
          protein_target?: number | null
          carbs_target?: number | null
          fat_target?: number | null
          fiber_target?: number | null
          water_target?: number | null
          duration_weeks?: number
          is_template?: boolean
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      fitness_meal_plan_days: {
        Row: {
          id: string
          meal_plan_id: string
          day_of_week: number
          day_name: string | null
          calories_target: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meal_plan_id: string
          day_of_week: number
          day_name?: string | null
          calories_target?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meal_plan_id?: string
          day_of_week?: number
          day_name?: string | null
          calories_target?: number | null
          notes?: string | null
        }
      }
      fitness_meal_plan_meals: {
        Row: {
          id: string
          meal_plan_day_id: string
          meal_type: string
          meal_name: string | null
          scheduled_time: string | null
          foods: Json
          total_calories: number | null
          total_protein: number | null
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          instructions: string | null
          alternatives: Json
          is_optional: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          meal_plan_day_id: string
          meal_type: string
          meal_name?: string | null
          scheduled_time?: string | null
          foods?: Json
          total_calories?: number | null
          total_protein?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          instructions?: string | null
          alternatives?: Json
          is_optional?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          meal_plan_day_id?: string
          meal_type?: string
          meal_name?: string | null
          scheduled_time?: string | null
          foods?: Json
          total_calories?: number | null
          total_protein?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          instructions?: string | null
          alternatives?: Json
          is_optional?: boolean
          order_index?: number
        }
      }
      fitness_training_programs: {
        Row: {
          id: string
          professional_id: string
          client_id: string | null
          name: string
          description: string | null
          goal: string | null
          difficulty: string
          duration_weeks: number
          days_per_week: number
          session_duration: number
          equipment_needed: Json
          is_template: boolean
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          client_id?: string | null
          name: string
          description?: string | null
          goal?: string | null
          difficulty?: string
          duration_weeks?: number
          days_per_week?: number
          session_duration?: number
          equipment_needed?: Json
          is_template?: boolean
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          client_id?: string | null
          name?: string
          description?: string | null
          goal?: string | null
          difficulty?: string
          duration_weeks?: number
          days_per_week?: number
          session_duration?: number
          equipment_needed?: Json
          is_template?: boolean
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      fitness_training_weeks: {
        Row: {
          id: string
          program_id: string
          week_number: number
          name: string | null
          focus: string | null
          intensity_modifier: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          program_id: string
          week_number: number
          name?: string | null
          focus?: string | null
          intensity_modifier?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          program_id?: string
          week_number?: number
          name?: string | null
          focus?: string | null
          intensity_modifier?: number
          notes?: string | null
        }
      }
      fitness_training_days: {
        Row: {
          id: string
          week_id: string
          day_of_week: number | null
          day_number: number | null
          name: string
          muscle_groups: Json
          estimated_duration: number | null
          warmup_notes: string | null
          cooldown_notes: string | null
          notes: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          week_id: string
          day_of_week?: number | null
          day_number?: number | null
          name: string
          muscle_groups?: Json
          estimated_duration?: number | null
          warmup_notes?: string | null
          cooldown_notes?: string | null
          notes?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          week_id?: string
          day_of_week?: number | null
          day_number?: number | null
          name?: string
          muscle_groups?: Json
          estimated_duration?: number | null
          warmup_notes?: string | null
          cooldown_notes?: string | null
          notes?: string | null
          order_index?: number
        }
      }
      fitness_training_exercises: {
        Row: {
          id: string
          training_day_id: string
          exercise_name: string
          exercise_category: string | null
          muscle_group: string | null
          sets: number
          reps: string | null
          rest_seconds: number
          tempo: string | null
          weight_suggestion: string | null
          rpe_target: number | null
          instructions: string | null
          video_url: string | null
          alternatives: Json
          superset_with: string | null
          is_dropset: boolean
          is_warmup: boolean
          order_index: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          training_day_id: string
          exercise_name: string
          exercise_category?: string | null
          muscle_group?: string | null
          sets?: number
          reps?: string | null
          rest_seconds?: number
          tempo?: string | null
          weight_suggestion?: string | null
          rpe_target?: number | null
          instructions?: string | null
          video_url?: string | null
          alternatives?: Json
          superset_with?: string | null
          is_dropset?: boolean
          is_warmup?: boolean
          order_index?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          training_day_id?: string
          exercise_name?: string
          exercise_category?: string | null
          muscle_group?: string | null
          sets?: number
          reps?: string | null
          rest_seconds?: number
          tempo?: string | null
          weight_suggestion?: string | null
          rpe_target?: number | null
          instructions?: string | null
          video_url?: string | null
          alternatives?: Json
          superset_with?: string | null
          is_dropset?: boolean
          is_warmup?: boolean
          order_index?: number
          notes?: string | null
        }
      }
      fitness_api_usage: {
        Row: {
          id: string
          user_id: string
          feature: string
          model: string | null
          endpoint: string | null
          tokens_input: number
          tokens_output: number
          cost_usd: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          model?: string | null
          endpoint?: string | null
          tokens_input?: number
          tokens_output?: number
          cost_usd?: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature?: string
          model?: string | null
          endpoint?: string | null
          tokens_input?: number
          tokens_output?: number
          cost_usd?: number
          metadata?: Json | null
        }
      }
      fitness_audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          target_type: string | null
          target_id: string | null
          target_user_id: string | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          target_user_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          target_type?: string | null
          target_id?: string | null
          target_user_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      fitness_terms_acceptance: {
        Row: {
          id: string
          user_id: string
          version: string
          accepted_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          version: string
          accepted_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          version?: string
          accepted_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      fitness_consent_history: {
        Row: {
          id: string
          user_id: string
          consent_type: string
          consent_version: string
          accepted: boolean
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          consent_type: string
          consent_version: string
          accepted: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          consent_type?: string
          consent_version?: string
          accepted?: boolean
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      fitness_lgpd_requests: {
        Row: {
          id: string
          user_id: string
          request_type: string
          status: string
          requested_at: string
          processed_at: string | null
          processed_by: string | null
          notes: string | null
          data_file_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          request_type: string
          status?: string
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          notes?: string | null
          data_file_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: string
          status?: string
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          notes?: string | null
          data_file_url?: string | null
        }
      }
      fitness_activities: {
        Row: {
          id: string
          user_id: string
          date: string
          activity_type: string
          custom_name: string | null
          duration_minutes: number
          intensity: string
          calories_burned: number | null
          distance_km: number | null
          heart_rate_avg: number | null
          notes: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          activity_type: string
          custom_name?: string | null
          duration_minutes: number
          intensity: string
          calories_burned?: number | null
          distance_km?: number | null
          heart_rate_avg?: number | null
          notes?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          activity_type?: string
          custom_name?: string | null
          duration_minutes?: number
          intensity?: string
          calories_burned?: number | null
          distance_km?: number | null
          heart_rate_avg?: number | null
          notes?: string | null
          location?: string | null
          updated_at?: string
        }
      }
      fitness_user_foods: {
        Row: {
          id: string
          user_id: string
          nome: string
          categoria: string
          marca: string | null
          descricao: string | null
          porcao_padrao: number
          unidade: string
          calorias: number
          proteinas: number
          carboidratos: number
          gorduras: number
          fibras: number | null
          sodio: number | null
          porcoes_comuns: Json | null
          is_favorite: boolean
          is_active: boolean
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          categoria: string
          marca?: string | null
          descricao?: string | null
          porcao_padrao?: number
          unidade?: string
          calorias?: number
          proteinas?: number
          carboidratos?: number
          gorduras?: number
          fibras?: number | null
          sodio?: number | null
          porcoes_comuns?: Json | null
          is_favorite?: boolean
          is_active?: boolean
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          categoria?: string
          marca?: string | null
          descricao?: string | null
          porcao_padrao?: number
          unidade?: string
          calorias?: number
          proteinas?: number
          carboidratos?: number
          gorduras?: number
          fibras?: number | null
          sodio?: number | null
          porcoes_comuns?: Json | null
          is_favorite?: boolean
          is_active?: boolean
          source?: string
          updated_at?: string
        }
      }
      fitness_insights: {
        Row: {
          id: string
          user_id: string
          type: string
          priority: string
          category: string
          title: string
          description: string
          icon: string | null
          data: Json | null
          action: Json | null
          viewed: boolean
          dismissed: boolean
          dismissed_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          priority: string
          category: string
          title: string
          description: string
          icon?: string | null
          data?: Json | null
          action?: Json | null
          viewed?: boolean
          dismissed?: boolean
          dismissed_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          priority?: string
          category?: string
          title?: string
          description?: string
          icon?: string | null
          data?: Json | null
          action?: Json | null
          viewed?: boolean
          dismissed?: boolean
          dismissed_at?: string | null
          expires_at?: string | null
        }
      }
      fitness_ai_reports: {
        Row: {
          id: string
          user_id: string
          tipo: string
          periodo_inicio: string
          periodo_fim: string
          conteudo: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: string
          periodo_inicio: string
          periodo_fim: string
          conteudo: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tipo?: string
          periodo_inicio?: string
          periodo_fim?: string
          conteudo?: Json
        }
      }
      fitness_xp_history: {
        Row: {
          id: string
          user_id: string
          xp_gained: number
          xp_type: string
          source_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          xp_gained: number
          xp_type: string
          source_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          xp_gained?: number
          xp_type?: string
          source_id?: string | null
          description?: string | null
        }
      }
      fitness_ranking_snapshots: {
        Row: {
          id: string
          user_id: string
          periodo: string
          data_referencia: string
          posicao: number
          xp_total: number
          nivel: number
          percentil: number | null
          total_participantes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          periodo: string
          data_referencia: string
          posicao: number
          xp_total: number
          nivel: number
          percentil?: number | null
          total_participantes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          periodo?: string
          data_referencia?: string
          posicao?: number
          xp_total?: number
          nivel?: number
          percentil?: number | null
          total_participantes?: number | null
        }
      }
      fitness_wellness_checkins: {
        Row: {
          id: string
          user_id: string
          data: string
          horario: string | null
          humor: number
          stress: number
          energia: number
          fatores_positivos: string[] | null
          fatores_negativos: string[] | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: string
          horario?: string | null
          humor: number
          stress: number
          energia: number
          fatores_positivos?: string[] | null
          fatores_negativos?: string[] | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: string
          horario?: string | null
          humor?: number
          stress?: number
          energia?: number
          fatores_positivos?: string[] | null
          fatores_negativos?: string[] | null
          notas?: string | null
        }
      }
      fitness_broadcast_messages: {
        Row: {
          id: string
          sender_id: string
          title: string
          content: string
          message_type: string | null
          target_filter: Json | null
          recipient_count: number
          channels: string[]
          scheduled_at: string | null
          sent_at: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          title: string
          content: string
          message_type?: string | null
          target_filter?: Json | null
          recipient_count?: number
          channels?: string[]
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          title?: string
          content?: string
          message_type?: string | null
          target_filter?: Json | null
          recipient_count?: number
          channels?: string[]
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
      }
      fitness_broadcast_recipients: {
        Row: {
          id: string
          broadcast_id: string
          user_id: string
          push_sent: boolean
          email_sent: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          broadcast_id: string
          user_id: string
          push_sent?: boolean
          email_sent?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          broadcast_id?: string
          user_id?: string
          push_sent?: boolean
          email_sent?: boolean
          read_at?: string | null
        }
      }
      fitness_inbox_messages: {
        Row: {
          id: string
          user_id: string
          source: string
          source_id: string | null
          title: string
          preview: string | null
          content: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: string
          source_id?: string | null
          title: string
          preview?: string | null
          content?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          source_id?: string | null
          title?: string
          preview?: string | null
          content?: string | null
          read_at?: string | null
        }
      }
      fitness_meal_plan_adherence: {
        Row: {
          id: string
          meal_plan_id: string
          client_id: string
          date: string
          meals_planned: number
          meals_completed: number
          adherence_percentage: number | null
          calories_consumed: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meal_plan_id: string
          client_id: string
          date: string
          meals_planned?: number
          meals_completed?: number
          adherence_percentage?: number | null
          calories_consumed?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meal_plan_id?: string
          client_id?: string
          date?: string
          meals_planned?: number
          meals_completed?: number
          adherence_percentage?: number | null
          calories_consumed?: number | null
          notes?: string | null
        }
      }
      fitness_training_adherence: {
        Row: {
          id: string
          program_id: string
          client_id: string
          training_day_id: string | null
          date: string
          completed: boolean
          exercises_planned: number
          exercises_completed: number
          adherence_percentage: number | null
          workout_duration: number | null
          notes: string | null
          client_feedback: string | null
          rpe_average: number | null
          created_at: string
        }
        Insert: {
          id?: string
          program_id: string
          client_id: string
          training_day_id?: string | null
          date: string
          completed?: boolean
          exercises_planned?: number
          exercises_completed?: number
          adherence_percentage?: number | null
          workout_duration?: number | null
          notes?: string | null
          client_feedback?: string | null
          rpe_average?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          program_id?: string
          client_id?: string
          training_day_id?: string | null
          date?: string
          completed?: boolean
          exercises_planned?: number
          exercises_completed?: number
          adherence_percentage?: number | null
          workout_duration?: number | null
          notes?: string | null
          client_feedback?: string | null
          rpe_average?: number | null
        }
      }
      fitness_weight_history: {
        Row: {
          id: string
          user_id: string
          data: string
          peso: number
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: string
          peso: number
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: string
          peso?: number
          notas?: string | null
        }
      }
      fitness_bioimpedance: {
        Row: {
          id: string
          user_id: string
          data: string
          peso: number | null
          percentual_gordura: number | null
          massa_muscular: number | null
          agua_corporal: number | null
          gordura_visceral: number | null
          taxa_metabolica_basal: number | null
          pontuacao_inbody: number | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: string
          peso?: number | null
          percentual_gordura?: number | null
          massa_muscular?: number | null
          agua_corporal?: number | null
          gordura_visceral?: number | null
          taxa_metabolica_basal?: number | null
          pontuacao_inbody?: number | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: string
          peso?: number | null
          percentual_gordura?: number | null
          massa_muscular?: number | null
          agua_corporal?: number | null
          gordura_visceral?: number | null
          taxa_metabolica_basal?: number | null
          pontuacao_inbody?: number | null
          notas?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_daily_summary: {
        Args: { p_user_id: string; p_date: string }
        Returns: Json
      }
      get_weekly_summary: {
        Args: { p_user_id: string; p_start_date: string }
        Returns: Json
      }
      search_exercises: {
        Args: { p_query: string }
        Returns: {
          id: string
          nome: string
          grupo_muscular: string
          equipamento: string
          dificuldade: string
        }[]
      }
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_user_xp: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_level_from_xp: {
        Args: { p_xp: number }
        Returns: number
      }
      update_user_xp: {
        Args: { p_user_id: string }
        Returns: { xp_total: number; nivel: number }[]
      }
      get_user_ranking: {
        Args: { p_user_id: string }
        Returns: {
          posicao: number
          xp_total: number
          nivel: number
          percentil: number
          total_usuarios: number
          proximo_acima_xp: number
          proximo_abaixo_xp: number
        }[]
      }
      get_ranking_leaderboard: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          posicao: number
          apelido: string
          xp_total: number
          nivel: number
          streak_atual: number
          total_conquistas: number
        }[]
      }
      mark_messages_as_read: {
        Args: {
          p_conversation_id: string
          p_user_id: string
          p_user_type: string
        }
        Returns: number
      }
      get_or_create_conversation: {
        Args: {
          p_client_id: string
          p_professional_id: string
        }
        Returns: string
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_professional: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      professional_has_client: {
        Args: {
          professional_user_id: string
          client_user_id: string
        }
        Returns: boolean
      }
      register_consent: {
        Args: {
          p_user_id: string
          p_consent_type: string
          p_consent_version: string
          p_accepted: boolean
          p_ip_address?: string | null
          p_user_agent?: string | null
        }
        Returns: string
      }
      complete_onboarding: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      export_user_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type aliases para facilitar o uso
export type Profile = Database['public']['Tables']['fitness_profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['fitness_profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['fitness_profiles']['Update']

export type Exercise = Database['public']['Tables']['fitness_exercises_library']['Row']
export type ExerciseInsert = Database['public']['Tables']['fitness_exercises_library']['Insert']

export type WorkoutTemplate = Database['public']['Tables']['fitness_workout_templates']['Row']
export type WorkoutTemplateInsert = Database['public']['Tables']['fitness_workout_templates']['Insert']
export type WorkoutTemplateUpdate = Database['public']['Tables']['fitness_workout_templates']['Update']

export type WorkoutTemplateExercise = Database['public']['Tables']['fitness_workout_template_exercises']['Row']
export type WorkoutTemplateExerciseInsert = Database['public']['Tables']['fitness_workout_template_exercises']['Insert']

export type Workout = Database['public']['Tables']['fitness_workouts']['Row']
export type WorkoutInsert = Database['public']['Tables']['fitness_workouts']['Insert']
export type WorkoutUpdate = Database['public']['Tables']['fitness_workouts']['Update']

export type WorkoutExercise = Database['public']['Tables']['fitness_workout_exercises']['Row']
export type WorkoutExerciseInsert = Database['public']['Tables']['fitness_workout_exercises']['Insert']

export type ExerciseSet = Database['public']['Tables']['fitness_exercise_sets']['Row']
export type ExerciseSetInsert = Database['public']['Tables']['fitness_exercise_sets']['Insert']
export type ExerciseSetUpdate = Database['public']['Tables']['fitness_exercise_sets']['Update']

export type PersonalRecord = Database['public']['Tables']['fitness_personal_records']['Row']

export type Food = Database['public']['Tables']['fitness_foods']['Row']
export type FoodInsert = Database['public']['Tables']['fitness_foods']['Insert']

export type Meal = Database['public']['Tables']['fitness_meals']['Row']
export type MealInsert = Database['public']['Tables']['fitness_meals']['Insert']
export type MealUpdate = Database['public']['Tables']['fitness_meals']['Update']

export type MealItem = Database['public']['Tables']['fitness_meal_items']['Row']
export type MealItemInsert = Database['public']['Tables']['fitness_meal_items']['Insert']

export type WaterLog = Database['public']['Tables']['fitness_water_logs']['Row']
export type WaterLogInsert = Database['public']['Tables']['fitness_water_logs']['Insert']

export type BodyComposition = Database['public']['Tables']['fitness_body_compositions']['Row']
export type BodyCompositionInsert = Database['public']['Tables']['fitness_body_compositions']['Insert']

export type ProgressPhoto = Database['public']['Tables']['fitness_progress_photos']['Row']
export type ProgressPhotoInsert = Database['public']['Tables']['fitness_progress_photos']['Insert']

export type DailyNote = Database['public']['Tables']['fitness_daily_notes']['Row']
export type DailyNoteInsert = Database['public']['Tables']['fitness_daily_notes']['Insert']
export type DailyNoteUpdate = Database['public']['Tables']['fitness_daily_notes']['Update']

export type SleepLog = Database['public']['Tables']['fitness_sleep_logs']['Row']
export type SleepLogInsert = Database['public']['Tables']['fitness_sleep_logs']['Insert']

export type Supplement = Database['public']['Tables']['fitness_supplements']['Row']
export type SupplementInsert = Database['public']['Tables']['fitness_supplements']['Insert']

export type SupplementLog = Database['public']['Tables']['fitness_supplements_logs']['Row']
export type SupplementLogInsert = Database['public']['Tables']['fitness_supplements_logs']['Insert']

export type Achievement = Database['public']['Tables']['fitness_achievements']['Row']
export type UserAchievement = Database['public']['Tables']['fitness_achievements_users']['Row']

export type Goal = Database['public']['Tables']['fitness_goals']['Row']
export type GoalInsert = Database['public']['Tables']['fitness_goals']['Insert']
export type GoalUpdate = Database['public']['Tables']['fitness_goals']['Update']

export type CoachConversation = Database['public']['Tables']['fitness_coach_conversations']['Row']
export type CoachConversationInsert = Database['public']['Tables']['fitness_coach_conversations']['Insert']

export type NotificationSettings = Database['public']['Tables']['fitness_notification_settings']['Row']
export type NotificationSettingsInsert = Database['public']['Tables']['fitness_notification_settings']['Insert']
export type NotificationSettingsUpdate = Database['public']['Tables']['fitness_notification_settings']['Update']

// --- Phase 2+ Type Aliases ---

export type Professional = Database['public']['Tables']['fitness_professionals']['Row']
export type ProfessionalInsert = Database['public']['Tables']['fitness_professionals']['Insert']
export type ProfessionalUpdate = Database['public']['Tables']['fitness_professionals']['Update']

export type ClientAssignment = Database['public']['Tables']['fitness_client_assignments']['Row']
export type ClientAssignmentInsert = Database['public']['Tables']['fitness_client_assignments']['Insert']
export type ClientAssignmentUpdate = Database['public']['Tables']['fitness_client_assignments']['Update']

export type AppointmentRow = Database['public']['Tables']['fitness_appointments']['Row']
export type AppointmentInsert = Database['public']['Tables']['fitness_appointments']['Insert']
export type AppointmentUpdate = Database['public']['Tables']['fitness_appointments']['Update']

export type ProfessionalNote = Database['public']['Tables']['fitness_professional_notes']['Row']
export type ProfessionalNoteInsert = Database['public']['Tables']['fitness_professional_notes']['Insert']
export type ProfessionalNoteUpdate = Database['public']['Tables']['fitness_professional_notes']['Update']

export type CommunityPost = Database['public']['Tables']['fitness_community_posts']['Row']
export type CommunityPostInsert = Database['public']['Tables']['fitness_community_posts']['Insert']
export type CommunityPostUpdate = Database['public']['Tables']['fitness_community_posts']['Update']

export type CommunityReaction = Database['public']['Tables']['fitness_community_reactions']['Row']
export type CommunityReactionInsert = Database['public']['Tables']['fitness_community_reactions']['Insert']

export type CommunityComment = Database['public']['Tables']['fitness_community_comments']['Row']
export type CommunityCommentInsert = Database['public']['Tables']['fitness_community_comments']['Insert']
export type CommunityCommentUpdate = Database['public']['Tables']['fitness_community_comments']['Update']

export type Ranking = Database['public']['Tables']['fitness_rankings']['Row']
export type RankingInsert = Database['public']['Tables']['fitness_rankings']['Insert']
export type RankingUpdate = Database['public']['Tables']['fitness_rankings']['Update']

export type RankingParticipant = Database['public']['Tables']['fitness_ranking_participants']['Row']
export type RankingParticipantInsert = Database['public']['Tables']['fitness_ranking_participants']['Insert']
export type RankingParticipantUpdate = Database['public']['Tables']['fitness_ranking_participants']['Update']

export type PointTransaction = Database['public']['Tables']['fitness_point_transactions']['Row']
export type PointTransactionInsert = Database['public']['Tables']['fitness_point_transactions']['Insert']

export type PushSubscriptionRow = Database['public']['Tables']['fitness_push_subscriptions']['Row']
export type PushSubscriptionInsert = Database['public']['Tables']['fitness_push_subscriptions']['Insert']
export type PushSubscriptionUpdate = Database['public']['Tables']['fitness_push_subscriptions']['Update']

export type NotificationHistoryRow = Database['public']['Tables']['fitness_notification_history']['Row']
export type NotificationHistoryInsert = Database['public']['Tables']['fitness_notification_history']['Insert']
export type NotificationHistoryUpdate = Database['public']['Tables']['fitness_notification_history']['Update']

export type FormTemplateRow = Database['public']['Tables']['fitness_form_templates']['Row']
export type FormTemplateInsert = Database['public']['Tables']['fitness_form_templates']['Insert']
export type FormTemplateUpdate = Database['public']['Tables']['fitness_form_templates']['Update']

export type FormQuestionRow = Database['public']['Tables']['fitness_form_questions']['Row']
export type FormQuestionInsert = Database['public']['Tables']['fitness_form_questions']['Insert']
export type FormQuestionUpdate = Database['public']['Tables']['fitness_form_questions']['Update']

export type FormAssignmentRow = Database['public']['Tables']['fitness_form_assignments']['Row']
export type FormAssignmentInsert = Database['public']['Tables']['fitness_form_assignments']['Insert']
export type FormAssignmentUpdate = Database['public']['Tables']['fitness_form_assignments']['Update']

export type FormResponseRow = Database['public']['Tables']['fitness_form_responses']['Row']
export type FormResponseInsert = Database['public']['Tables']['fitness_form_responses']['Insert']

export type FormDraftRow = Database['public']['Tables']['fitness_form_drafts']['Row']
export type FormDraftInsert = Database['public']['Tables']['fitness_form_drafts']['Insert']
export type FormDraftUpdate = Database['public']['Tables']['fitness_form_drafts']['Update']

export type Conversation = Database['public']['Tables']['fitness_conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['fitness_conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['fitness_conversations']['Update']

export type Message = Database['public']['Tables']['fitness_messages']['Row']
export type MessageInsert = Database['public']['Tables']['fitness_messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['fitness_messages']['Update']

export type MealPlan = Database['public']['Tables']['fitness_meal_plans']['Row']
export type MealPlanInsert = Database['public']['Tables']['fitness_meal_plans']['Insert']
export type MealPlanUpdate = Database['public']['Tables']['fitness_meal_plans']['Update']

export type MealPlanDay = Database['public']['Tables']['fitness_meal_plan_days']['Row']
export type MealPlanDayInsert = Database['public']['Tables']['fitness_meal_plan_days']['Insert']

export type MealPlanMeal = Database['public']['Tables']['fitness_meal_plan_meals']['Row']
export type MealPlanMealInsert = Database['public']['Tables']['fitness_meal_plan_meals']['Insert']

export type TrainingProgram = Database['public']['Tables']['fitness_training_programs']['Row']
export type TrainingProgramInsert = Database['public']['Tables']['fitness_training_programs']['Insert']
export type TrainingProgramUpdate = Database['public']['Tables']['fitness_training_programs']['Update']

export type TrainingWeek = Database['public']['Tables']['fitness_training_weeks']['Row']
export type TrainingWeekInsert = Database['public']['Tables']['fitness_training_weeks']['Insert']

export type TrainingDay = Database['public']['Tables']['fitness_training_days']['Row']
export type TrainingDayInsert = Database['public']['Tables']['fitness_training_days']['Insert']

export type TrainingExercise = Database['public']['Tables']['fitness_training_exercises']['Row']
export type TrainingExerciseInsert = Database['public']['Tables']['fitness_training_exercises']['Insert']

export type ApiUsage = Database['public']['Tables']['fitness_api_usage']['Row']
export type ApiUsageInsert = Database['public']['Tables']['fitness_api_usage']['Insert']

export type AuditLog = Database['public']['Tables']['fitness_audit_log']['Row']
export type AuditLogInsert = Database['public']['Tables']['fitness_audit_log']['Insert']

export type TermsAcceptance = Database['public']['Tables']['fitness_terms_acceptance']['Row']
export type TermsAcceptanceInsert = Database['public']['Tables']['fitness_terms_acceptance']['Insert']

export type ConsentHistory = Database['public']['Tables']['fitness_consent_history']['Row']
export type ConsentHistoryInsert = Database['public']['Tables']['fitness_consent_history']['Insert']

export type LgpdRequest = Database['public']['Tables']['fitness_lgpd_requests']['Row']
export type LgpdRequestInsert = Database['public']['Tables']['fitness_lgpd_requests']['Insert']
export type LgpdRequestUpdate = Database['public']['Tables']['fitness_lgpd_requests']['Update']

export type Activity = Database['public']['Tables']['fitness_activities']['Row']
export type ActivityInsert = Database['public']['Tables']['fitness_activities']['Insert']
export type ActivityUpdate = Database['public']['Tables']['fitness_activities']['Update']

export type UserFood = Database['public']['Tables']['fitness_user_foods']['Row']
export type UserFoodInsert = Database['public']['Tables']['fitness_user_foods']['Insert']
export type UserFoodUpdate = Database['public']['Tables']['fitness_user_foods']['Update']

export type Insight = Database['public']['Tables']['fitness_insights']['Row']
export type InsightInsert = Database['public']['Tables']['fitness_insights']['Insert']
export type InsightUpdate = Database['public']['Tables']['fitness_insights']['Update']

export type AiReport = Database['public']['Tables']['fitness_ai_reports']['Row']
export type AiReportInsert = Database['public']['Tables']['fitness_ai_reports']['Insert']

export type XpHistory = Database['public']['Tables']['fitness_xp_history']['Row']
export type XpHistoryInsert = Database['public']['Tables']['fitness_xp_history']['Insert']

export type RankingSnapshot = Database['public']['Tables']['fitness_ranking_snapshots']['Row']
export type RankingSnapshotInsert = Database['public']['Tables']['fitness_ranking_snapshots']['Insert']

export type WellnessCheckinRow = Database['public']['Tables']['fitness_wellness_checkins']['Row']
export type WellnessCheckinInsert = Database['public']['Tables']['fitness_wellness_checkins']['Insert']
export type WellnessCheckinUpdate = Database['public']['Tables']['fitness_wellness_checkins']['Update']

export type BroadcastMessage = Database['public']['Tables']['fitness_broadcast_messages']['Row']
export type BroadcastMessageInsert = Database['public']['Tables']['fitness_broadcast_messages']['Insert']
export type BroadcastMessageUpdate = Database['public']['Tables']['fitness_broadcast_messages']['Update']

export type BroadcastRecipient = Database['public']['Tables']['fitness_broadcast_recipients']['Row']
export type BroadcastRecipientInsert = Database['public']['Tables']['fitness_broadcast_recipients']['Insert']

export type InboxMessage = Database['public']['Tables']['fitness_inbox_messages']['Row']
export type InboxMessageInsert = Database['public']['Tables']['fitness_inbox_messages']['Insert']
export type InboxMessageUpdate = Database['public']['Tables']['fitness_inbox_messages']['Update']

export type MealPlanAdherence = Database['public']['Tables']['fitness_meal_plan_adherence']['Row']
export type MealPlanAdherenceInsert = Database['public']['Tables']['fitness_meal_plan_adherence']['Insert']

export type TrainingAdherence = Database['public']['Tables']['fitness_training_adherence']['Row']
export type TrainingAdherenceInsert = Database['public']['Tables']['fitness_training_adherence']['Insert']

export type WeightHistory = Database['public']['Tables']['fitness_weight_history']['Row']
export type WeightHistoryInsert = Database['public']['Tables']['fitness_weight_history']['Insert']

export type Bioimpedance = Database['public']['Tables']['fitness_bioimpedance']['Row']
export type BioimpedanceInsert = Database['public']['Tables']['fitness_bioimpedance']['Insert']

// FeliceFit - Database Types
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

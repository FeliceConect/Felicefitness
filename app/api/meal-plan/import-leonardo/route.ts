// Endpoint especial para importar o plano do Leonardo diretamente
// Este endpoint pode ser chamado uma vez para inserir o plano no banco

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const LEONARDO_MEAL_PLAN = {
  name: "Plano Alimentar Otimizado - Com Variações",
  description: "Meta diária: 2150 kcal | 185g proteína | 190g carb | 70g gordura",
  daily_targets: {
    calories: 2150,
    protein: 185,
    carbs: 190,
    fat: 70
  },
  special_rules: [
    { time: "12:00-14:00", rule: "Jejum - apenas água" },
    { time: "14:00", rule: "Revolade" },
    { time: "14:00-18:00", rule: "Sem laticínios" }
  ],
  meals: [
    {
      type: "wake_up",
      name: "Ao Acordar",
      time: "05:00",
      is_optional: false,
      is_training_day_only: false,
      options: [
        {
          option: "A",
          name: "Padrão",
          foods: [
            { name: "Água", quantity: 500, unit: "ml" },
            { name: "Treino em jejum", quantity: 30, unit: "min" }
          ]
        }
      ]
    },
    {
      type: "breakfast",
      name: "Café da Manhã Pós-Treino",
      time: "05:45-06:30",
      target_protein: 40,
      target_carbs: 45,
      target_fat: 18,
      is_optional: false,
      is_training_day_only: false,
      options: [
        {
          option: "A",
          name: "Ovos completo",
          foods: [
            { name: "Ovos mexidos na manteiga", quantity: 3, unit: "unid" },
            { name: "Pão integral com queijo", quantity: 2, unit: "fatias" },
            { name: "Banana", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "B",
          name: "Shake rápido",
          foods: [
            { name: "Whey batido com água", quantity: 1, unit: "scoop" },
            { name: "Banana com pasta de amendoim", quantity: 1, unit: "unid" },
            { name: "Granola", quantity: 30, unit: "g" }
          ]
        },
        {
          option: "C",
          name: "Tapioca",
          foods: [
            { name: "Tapioca com 2 ovos e queijo", quantity: 2, unit: "colheres goma" },
            { name: "Yopro 25g", quantity: 1, unit: "unid" },
            { name: "Fruta", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "D",
          name: "Omelete",
          foods: [
            { name: "Omelete de 3 ovos com queijo e tomate", quantity: 3, unit: "ovos" },
            { name: "Pão integral", quantity: 2, unit: "fatias" },
            { name: "Banana", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "E",
          name: "Mingau proteico",
          foods: [
            { name: "Aveia cozida com água", quantity: 40, unit: "g" },
            { name: "Whey misturado", quantity: 1, unit: "scoop" },
            { name: "Banana picada", quantity: 1, unit: "unid" },
            { name: "Pasta de amendoim", quantity: 10, unit: "g" }
          ]
        }
      ]
    },
    {
      type: "morning_snack",
      name: "Lanche Manhã",
      time: "09:30-10:00",
      target_protein: 22,
      target_carbs: 20,
      is_optional: true,
      is_training_day_only: false,
      options: [
        {
          option: "A",
          name: "Yopro + Maçã",
          foods: [
            { name: "Yopro 25g", quantity: 1, unit: "unid" },
            { name: "Maçã", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "B",
          name: "Ovos + Banana",
          foods: [
            { name: "Ovos cozidos", quantity: 2, unit: "unid" },
            { name: "Banana", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "C",
          name: "Whey + Fruta",
          foods: [
            { name: "Whey com água", quantity: 30, unit: "g" },
            { name: "Fruta", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "D",
          name: "Cottage + Frutas",
          foods: [
            { name: "Queijo cottage", quantity: 100, unit: "g" },
            { name: "Frutas vermelhas", quantity: 1, unit: "porção" }
          ]
        },
        {
          option: "E",
          name: "Nuts + Yopro",
          foods: [
            { name: "Nuts", quantity: 30, unit: "g" },
            { name: "Yopro 15g", quantity: 1, unit: "unid" }
          ]
        }
      ]
    },
    {
      type: "lunch",
      name: "Almoço",
      time: "11:00-11:45",
      target_protein: 50,
      target_carbs: 50,
      target_fat: 15,
      is_optional: false,
      is_training_day_only: false,
      notes: "TERMINAR ATÉ 12H",
      options: [
        {
          option: "A",
          name: "Contrafilé",
          foods: [
            { name: "Legumes à vontade (brócolis, abobrinha, cenoura, vagem, couve-flor)", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Contrafilé grelhado com alho", quantity: 200, unit: "g" }
          ]
        },
        {
          option: "B",
          name: "Frango (peito)",
          foods: [
            { name: "Legumes à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Peito de frango grelhado ou desfiado", quantity: 200, unit: "g" }
          ]
        },
        {
          option: "C",
          name: "Frango (coxa/sobrecoxa)",
          foods: [
            { name: "Legumes à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Coxa/sobrecoxa de frango assado", quantity: 180, unit: "g" }
          ]
        },
        {
          option: "D",
          name: "Tilápia",
          foods: [
            { name: "Legumes à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Tilápia grelhada com limão", quantity: 200, unit: "g" }
          ]
        },
        {
          option: "E",
          name: "Salmão",
          foods: [
            { name: "Legumes à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Salmão grelhado ou assado", quantity: 180, unit: "g" }
          ]
        },
        {
          option: "F",
          name: "Carne moída",
          foods: [
            { name: "Legumes à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Carne moída magra refogada", quantity: 200, unit: "g" }
          ]
        },
        {
          option: "G",
          name: "Patinho",
          foods: [
            { name: "Legumes à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Patinho grelhado", quantity: 200, unit: "g" }
          ]
        },
        {
          option: "H",
          name: "Lombo suíno",
          foods: [
            { name: "Legumes à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Lombo suíno assado", quantity: 180, unit: "g" }
          ]
        },
        {
          option: "I",
          name: "Atum",
          foods: [
            { name: "Salada à vontade", quantity: 1, unit: "porção" },
            { name: "Arroz", quantity: 3, unit: "colheres" },
            { name: "Feijão", quantity: 2, unit: "colheres" },
            { name: "Atum em água com salada", quantity: 2, unit: "latas" }
          ]
        }
      ]
    },
    {
      type: "afternoon_snack",
      name: "Lanche Tarde",
      time: "17:00-17:30",
      target_protein: 20,
      target_carbs: 25,
      target_fat: 12,
      is_optional: false,
      is_training_day_only: false,
      restrictions: ["no_dairy"],
      notes: "SEM LATICÍNIOS",
      options: [
        {
          option: "A",
          name: "Ovos + Banana",
          foods: [
            { name: "Ovos cozidos", quantity: 2, unit: "unid" },
            { name: "Banana", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "B",
          name: "Banana + Pasta",
          foods: [
            { name: "Banana", quantity: 1, unit: "unid" },
            { name: "Pasta de amendoim", quantity: 2, unit: "colheres" }
          ]
        },
        {
          option: "C",
          name: "Ovos + Nuts",
          foods: [
            { name: "Ovos cozidos", quantity: 2, unit: "unid" },
            { name: "Nuts", quantity: 30, unit: "g" }
          ]
        },
        {
          option: "D",
          name: "Wrap de frango",
          foods: [
            { name: "Tortilha integral", quantity: 1, unit: "unid" },
            { name: "Frango desfiado", quantity: 80, unit: "g" }
          ]
        },
        {
          option: "E",
          name: "Vitamina sem leite",
          foods: [
            { name: "Banana", quantity: 1, unit: "unid" },
            { name: "Pasta de amendoim", quantity: 1, unit: "colher" },
            { name: "Água e gelo", quantity: 200, unit: "ml" }
          ]
        },
        {
          option: "F",
          name: "Atum + Torradas",
          foods: [
            { name: "Atum em água", quantity: 100, unit: "g" },
            { name: "Torradas integrais", quantity: 3, unit: "unid" }
          ]
        }
      ]
    },
    {
      type: "pre_workout",
      name: "Pré-Beach Tennis",
      time: "18:30",
      target_protein: 25,
      target_carbs: 25,
      is_optional: false,
      is_training_day_only: true,
      notes: "DIAS DE TREINO - Já pode laticínios",
      options: [
        {
          option: "A",
          name: "Yopro + Banana",
          foods: [
            { name: "Yopro 25g", quantity: 1, unit: "unid" },
            { name: "Banana", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "B",
          name: "Whey + Banana",
          foods: [
            { name: "Whey", quantity: 1, unit: "scoop" },
            { name: "Banana", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "C",
          name: "Ovos + Pão",
          foods: [
            { name: "Ovos", quantity: 2, unit: "unid" },
            { name: "Pão com mel", quantity: 1, unit: "fatia" }
          ]
        },
        {
          option: "D",
          name: "Cottage + Frutas",
          foods: [
            { name: "Queijo cottage", quantity: 150, unit: "g" },
            { name: "Frutas", quantity: 1, unit: "porção" }
          ]
        }
      ]
    },
    {
      type: "dinner",
      name: "Jantar",
      time: "20:00-21:00",
      target_protein: 45,
      target_carbs: 25,
      target_fat: 15,
      is_optional: false,
      is_training_day_only: false,
      options: [
        {
          option: "A",
          name: "Contrafilé",
          foods: [
            { name: "Contrafilé grelhado", quantity: 180, unit: "g" },
            { name: "Salada verde à vontade", quantity: 1, unit: "porção" },
            { name: "Legumes refogados ou no vapor", quantity: 1, unit: "porção" }
          ]
        },
        {
          option: "B",
          name: "Frango grelhado",
          foods: [
            { name: "Frango grelhado com ervas", quantity: 180, unit: "g" },
            { name: "Salada verde à vontade", quantity: 1, unit: "porção" },
            { name: "Legumes refogados", quantity: 1, unit: "porção" }
          ]
        },
        {
          option: "C",
          name: "Peixe",
          foods: [
            { name: "Peixe grelhado ou assado", quantity: 180, unit: "g" },
            { name: "Salada verde à vontade", quantity: 1, unit: "porção" },
            { name: "Legumes no vapor", quantity: 1, unit: "porção" }
          ]
        },
        {
          option: "D",
          name: "Omelete",
          foods: [
            { name: "Omelete com recheio", quantity: 4, unit: "ovos" },
            { name: "Salada verde à vontade", quantity: 1, unit: "porção" }
          ]
        },
        {
          option: "E",
          name: "Carne moída",
          foods: [
            { name: "Carne moída refogada com legumes", quantity: 180, unit: "g" },
            { name: "Salada verde à vontade", quantity: 1, unit: "porção" }
          ]
        },
        {
          option: "F",
          name: "Lombo suíno",
          foods: [
            { name: "Lombo suíno assado", quantity: 180, unit: "g" },
            { name: "Salada verde à vontade", quantity: 1, unit: "porção" },
            { name: "Legumes", quantity: 1, unit: "porção" }
          ]
        }
      ]
    },
    {
      type: "supper",
      name: "Ceia",
      time: "22:00",
      target_protein: 18,
      is_optional: true,
      is_training_day_only: false,
      notes: "Se tiver fome",
      options: [
        {
          option: "A",
          name: "Yopro",
          foods: [
            { name: "Yopro 25g", quantity: 1, unit: "unid" }
          ]
        },
        {
          option: "B",
          name: "Ovos",
          foods: [
            { name: "Ovos cozidos", quantity: 2, unit: "unid" }
          ]
        },
        {
          option: "C",
          name: "Nuts",
          foods: [
            { name: "Nuts", quantity: 30, unit: "g" }
          ]
        },
        {
          option: "D",
          name: "Cottage",
          foods: [
            { name: "Queijo cottage", quantity: 100, unit: "g" }
          ]
        }
      ]
    }
  ]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é o Leonardo (felicemed@gmail.com)
    if (user.email !== 'felicemed@gmail.com') {
      return NextResponse.json(
        { error: 'Este endpoint é exclusivo para o usuário Leonardo' },
        { status: 403 }
      )
    }

    // Admin client
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar se já existe um professional para este usuário
    let professionalId: string

    const { data: existingProf } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProf) {
      professionalId = existingProf.id
    } else {
      // Criar professional
      const { data: newProf, error: profError } = await supabaseAdmin
        .from('fitness_professionals')
        .insert({
          user_id: user.id,
          type: 'nutritionist',
          specialties: ['nutrition'],
          is_active: true
        })
        .select('id')
        .single()

      if (profError) {
        console.error('Error creating professional:', profError)
        return NextResponse.json({ error: 'Erro ao criar profissional' }, { status: 500 })
      }
      professionalId = newProf.id
    }

    // Verificar se já existe um plano com este nome para este usuário
    const { data: existingPlan } = await supabaseAdmin
      .from('fitness_meal_plans')
      .select('id')
      .eq('client_id', user.id)
      .eq('name', LEONARDO_MEAL_PLAN.name)
      .single()

    if (existingPlan) {
      return NextResponse.json({
        success: false,
        message: 'Plano já existe para este usuário',
        plan_id: existingPlan.id
      })
    }

    // Criar plano principal
    const { data: mealPlan, error: planError } = await supabaseAdmin
      .from('fitness_meal_plans')
      .insert({
        professional_id: professionalId,
        client_id: user.id,
        name: LEONARDO_MEAL_PLAN.name,
        description: LEONARDO_MEAL_PLAN.description,
        goal: 'custom',
        calories_target: LEONARDO_MEAL_PLAN.daily_targets.calories,
        protein_target: LEONARDO_MEAL_PLAN.daily_targets.protein,
        carbs_target: LEONARDO_MEAL_PLAN.daily_targets.carbs,
        fat_target: LEONARDO_MEAL_PLAN.daily_targets.fat,
        is_template: false,
        is_active: true,
        notes: LEONARDO_MEAL_PLAN.special_rules.map(r => `${r.time ? r.time + ': ' : ''}${r.rule}`).join('\n')
      })
      .select()
      .single()

    if (planError) {
      console.error('Error creating meal plan:', planError)
      return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 })
    }

    // Criar dias (0-6)
    const dayNames: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda (Beach Tennis)',
      2: 'Terça',
      3: 'Quarta',
      4: 'Quinta (Feirinha - Liberado)',
      5: 'Sexta',
      6: 'Sábado (Beach Tennis)'
    }

    const dayPromises = []
    for (let day = 0; day <= 6; day++) {
      dayPromises.push(
        supabaseAdmin
          .from('fitness_meal_plan_days')
          .insert({
            meal_plan_id: mealPlan.id,
            day_of_week: day,
            day_name: dayNames[day],
            calories_target: LEONARDO_MEAL_PLAN.daily_targets.calories
          })
          .select()
          .single()
      )
    }

    const dayResults = await Promise.all(dayPromises)
    const days = dayResults.map(r => r.data).filter(Boolean)

    // Criar refeições para cada dia
    for (const day of days) {
      if (!day) continue

      const mealPromises = LEONARDO_MEAL_PLAN.meals.map((meal, index) => {
        const timeMatch = meal.time.match(/(\d{1,2}:\d{2})/)
        const scheduledTime = timeMatch ? timeMatch[1] + ':00' : null

        const primaryOption = meal.options[0]
        const alternatives = meal.options.slice(1)

        return supabaseAdmin
          .from('fitness_meal_plan_meals')
          .insert({
            meal_plan_day_id: day.id,
            meal_type: meal.type,
            meal_name: meal.name,
            scheduled_time: scheduledTime,
            foods: primaryOption?.foods || [],
            total_protein: meal.target_protein || 0,
            total_carbs: meal.target_carbs || 0,
            total_fat: meal.target_fat || 0,
            instructions: meal.notes,
            alternatives: alternatives,
            is_optional: meal.is_optional,
            order_index: index
          })
      })

      await Promise.all(mealPromises)
    }

    return NextResponse.json({
      success: true,
      message: 'Plano do Leonardo importado com sucesso!',
      plan_id: mealPlan.id
    })

  } catch (error) {
    console.error('Import Leonardo plan error:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Dados mock para o módulo de alimentação
import { format, subDays } from 'date-fns'
import type {
  Food,
  Meal,
  MealItem,
  NutritionTotals
} from './types'

// Banco de alimentos inicial - Alimentos comuns brasileiros
export const mockFoods: Food[] = [
  // ====== PROTEÍNAS ======
  {
    id: 'food-contrafile',
    nome: 'Contrafilé grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 220,
    proteinas: 23,
    carboidratos: 0,
    gorduras: 14,
    is_favorite: true
  },
  {
    id: 'food-frango',
    nome: 'Frango grelhado (peito)',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 165,
    proteinas: 31,
    carboidratos: 0,
    gorduras: 3.6,
    is_favorite: true
  },
  {
    id: 'food-frango-coxa',
    nome: 'Frango (coxa/sobrecoxa)',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 209,
    proteinas: 26,
    carboidratos: 0,
    gorduras: 11
  },
  {
    id: 'food-ovo',
    nome: 'Ovo inteiro',
    categoria: 'proteina',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 78,
    proteinas: 6,
    carboidratos: 0.6,
    gorduras: 5,
    porcoes_comuns: [
      { label: '1 ovo', grams: 50, isDefault: true },
      { label: '2 ovos', grams: 100 },
      { label: '3 ovos', grams: 150 },
      { label: '4 ovos', grams: 200 }
    ],
    is_favorite: true
  },
  {
    id: 'food-ovo-clara',
    nome: 'Clara de ovo',
    categoria: 'proteina',
    porcao_padrao: 33,
    unidade: 'g',
    calorias: 17,
    proteinas: 3.6,
    carboidratos: 0.2,
    gorduras: 0.1,
    porcoes_comuns: [
      { label: '1 clara', grams: 33, isDefault: true },
      { label: '2 claras', grams: 66 },
      { label: '3 claras', grams: 99 },
      { label: '4 claras', grams: 132 }
    ]
  },
  {
    id: 'food-carne-moida',
    nome: 'Carne moída magra',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 176,
    proteinas: 26,
    carboidratos: 0,
    gorduras: 8
  },
  {
    id: 'food-alcatra',
    nome: 'Alcatra grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 190,
    proteinas: 27,
    carboidratos: 0,
    gorduras: 9
  },
  {
    id: 'food-patinho',
    nome: 'Patinho grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 170,
    proteinas: 28,
    carboidratos: 0,
    gorduras: 6
  },
  {
    id: 'food-picanha',
    nome: 'Picanha grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 280,
    proteinas: 22,
    carboidratos: 0,
    gorduras: 21
  },
  {
    id: 'food-maminha',
    nome: 'Maminha grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 195,
    proteinas: 25,
    carboidratos: 0,
    gorduras: 10
  },
  {
    id: 'food-file-mignon',
    nome: 'Filé mignon grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 198,
    proteinas: 26,
    carboidratos: 0,
    gorduras: 10
  },
  {
    id: 'food-carne-seca',
    nome: 'Carne seca (charque)',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 220,
    proteinas: 45,
    carboidratos: 0,
    gorduras: 5
  },
  {
    id: 'food-tilapia',
    nome: 'Tilápia grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 96,
    proteinas: 20,
    carboidratos: 0,
    gorduras: 1.7
  },
  {
    id: 'food-salmao',
    nome: 'Salmão grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 208,
    proteinas: 20,
    carboidratos: 0,
    gorduras: 13
  },
  {
    id: 'food-atum',
    nome: 'Atum em conserva (água)',
    categoria: 'proteina',
    porcao_padrao: 60,
    unidade: 'g',
    calorias: 70,
    proteinas: 16,
    carboidratos: 0,
    gorduras: 0.5
  },
  {
    id: 'food-sardinha',
    nome: 'Sardinha em conserva',
    categoria: 'proteina',
    porcao_padrao: 60,
    unidade: 'g',
    calorias: 120,
    proteinas: 14,
    carboidratos: 0,
    gorduras: 7
  },
  {
    id: 'food-camarao',
    nome: 'Camarão cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 99,
    proteinas: 24,
    carboidratos: 0,
    gorduras: 0.3
  },
  {
    id: 'food-peru',
    nome: 'Peito de peru defumado',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 30,
    proteinas: 6,
    carboidratos: 0.5,
    gorduras: 0.5
  },
  {
    id: 'food-linguica',
    nome: 'Linguiça de frango',
    categoria: 'proteina',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 90,
    proteinas: 8,
    carboidratos: 1,
    gorduras: 6
  },
  {
    id: 'food-presunto',
    nome: 'Presunto magro',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 35,
    proteinas: 5,
    carboidratos: 0.5,
    gorduras: 1.5
  },
  {
    id: 'food-carne-porco',
    nome: 'Lombo de porco assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 175,
    proteinas: 28,
    carboidratos: 0,
    gorduras: 7
  },
  {
    id: 'food-costela-porco',
    nome: 'Costela de porco',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 280,
    proteinas: 22,
    carboidratos: 0,
    gorduras: 21
  },
  // Mais Peixes
  {
    id: 'food-bacalhau',
    nome: 'Bacalhau dessalgado cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 136,
    proteinas: 29,
    carboidratos: 0,
    gorduras: 1.5
  },
  {
    id: 'food-merluza',
    nome: 'Merluza grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 82,
    proteinas: 18,
    carboidratos: 0,
    gorduras: 0.8
  },
  {
    id: 'food-pescada',
    nome: 'Pescada grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 89,
    proteinas: 19,
    carboidratos: 0,
    gorduras: 1.2
  },
  {
    id: 'food-robalo',
    nome: 'Robalo grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 97,
    proteinas: 20,
    carboidratos: 0,
    gorduras: 1.8
  },
  {
    id: 'food-pargo',
    nome: 'Pargo assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 100,
    proteinas: 21,
    carboidratos: 0,
    gorduras: 1.5
  },
  {
    id: 'food-linguado',
    nome: 'Linguado grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 86,
    proteinas: 18,
    carboidratos: 0,
    gorduras: 1.2
  },
  {
    id: 'food-dourado',
    nome: 'Dourado grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 108,
    proteinas: 20,
    carboidratos: 0,
    gorduras: 2.8
  },
  {
    id: 'food-pintado',
    nome: 'Pintado grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 94,
    proteinas: 19,
    carboidratos: 0,
    gorduras: 1.6
  },
  {
    id: 'food-truta',
    nome: 'Truta grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 119,
    proteinas: 20,
    carboidratos: 0,
    gorduras: 4
  },
  {
    id: 'food-peixe-espada',
    nome: 'Peixe espada grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 144,
    proteinas: 23,
    carboidratos: 0,
    gorduras: 5
  },
  {
    id: 'food-cavalinha',
    nome: 'Cavalinha grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 205,
    proteinas: 19,
    carboidratos: 0,
    gorduras: 14
  },
  {
    id: 'food-anchova',
    nome: 'Anchova em conserva',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 60,
    proteinas: 8,
    carboidratos: 0,
    gorduras: 3
  },
  // Frutos do Mar
  {
    id: 'food-lula',
    nome: 'Lula grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 92,
    proteinas: 18,
    carboidratos: 3,
    gorduras: 1.4
  },
  {
    id: 'food-polvo',
    nome: 'Polvo cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 82,
    proteinas: 15,
    carboidratos: 2.2,
    gorduras: 1
  },
  {
    id: 'food-mexilhao',
    nome: 'Mexilhão cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 86,
    proteinas: 12,
    carboidratos: 3.7,
    gorduras: 2.2
  },
  {
    id: 'food-ostra',
    nome: 'Ostra crua',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 68,
    proteinas: 7,
    carboidratos: 4,
    gorduras: 2.5
  },
  {
    id: 'food-caranguejo',
    nome: 'Carne de caranguejo',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 83,
    proteinas: 18,
    carboidratos: 0,
    gorduras: 1
  },
  {
    id: 'food-lagosta',
    nome: 'Lagosta cozida',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 89,
    proteinas: 19,
    carboidratos: 0,
    gorduras: 0.9
  },
  // Mais Carnes
  {
    id: 'food-acém',
    nome: 'Acém cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 212,
    proteinas: 26,
    carboidratos: 0,
    gorduras: 12
  },
  {
    id: 'food-costela-bovina',
    nome: 'Costela bovina assada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 292,
    proteinas: 24,
    carboidratos: 0,
    gorduras: 21
  },
  {
    id: 'food-coxao-mole',
    nome: 'Coxão mole grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 169,
    proteinas: 28,
    carboidratos: 0,
    gorduras: 6
  },
  {
    id: 'food-coxao-duro',
    nome: 'Coxão duro grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 163,
    proteinas: 29,
    carboidratos: 0,
    gorduras: 5
  },
  {
    id: 'food-lagarto',
    nome: 'Lagarto cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 156,
    proteinas: 28,
    carboidratos: 0,
    gorduras: 4.5
  },
  {
    id: 'food-musculo',
    nome: 'Músculo cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 185,
    proteinas: 30,
    carboidratos: 0,
    gorduras: 7
  },
  {
    id: 'food-fraldinha',
    nome: 'Fraldinha grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 195,
    proteinas: 25,
    carboidratos: 0,
    gorduras: 10
  },
  {
    id: 'food-cupim',
    nome: 'Cupim assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 270,
    proteinas: 22,
    carboidratos: 0,
    gorduras: 20
  },
  {
    id: 'food-figado-bovino',
    nome: 'Fígado bovino grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 175,
    proteinas: 26,
    carboidratos: 4,
    gorduras: 5
  },
  {
    id: 'food-coracao-frango',
    nome: 'Coração de frango grelhado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 185,
    proteinas: 26,
    carboidratos: 0.1,
    gorduras: 8
  },
  {
    id: 'food-moela',
    nome: 'Moela de frango',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 130,
    proteinas: 22,
    carboidratos: 0,
    gorduras: 4.5
  },
  // Mais Aves
  {
    id: 'food-pato',
    nome: 'Peito de pato assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 201,
    proteinas: 23,
    carboidratos: 0,
    gorduras: 11
  },
  {
    id: 'food-chester',
    nome: 'Chester assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 165,
    proteinas: 28,
    carboidratos: 0,
    gorduras: 5.5
  },
  {
    id: 'food-codorna',
    nome: 'Codorna assada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 227,
    proteinas: 25,
    carboidratos: 0,
    gorduras: 14
  },
  {
    id: 'food-frango-asa',
    nome: 'Asa de frango assada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 266,
    proteinas: 26,
    carboidratos: 0,
    gorduras: 17
  },
  // Mais Porco
  {
    id: 'food-pernil-porco',
    nome: 'Pernil de porco assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 237,
    proteinas: 26,
    carboidratos: 0,
    gorduras: 14
  },
  {
    id: 'food-bacon',
    nome: 'Bacon frito',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 160,
    proteinas: 10,
    carboidratos: 0.4,
    gorduras: 13
  },
  {
    id: 'food-bisteca-porco',
    nome: 'Bisteca de porco grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 224,
    proteinas: 27,
    carboidratos: 0,
    gorduras: 12
  },
  // Embutidos
  {
    id: 'food-salsicha',
    nome: 'Salsicha',
    categoria: 'proteina',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 155,
    proteinas: 6,
    carboidratos: 2,
    gorduras: 14
  },
  {
    id: 'food-linguica-calabresa',
    nome: 'Linguiça calabresa',
    categoria: 'proteina',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 170,
    proteinas: 8,
    carboidratos: 1,
    gorduras: 15
  },
  {
    id: 'food-mortadela',
    nome: 'Mortadela',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 92,
    proteinas: 4,
    carboidratos: 1,
    gorduras: 8
  },
  {
    id: 'food-salame',
    nome: 'Salame',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 130,
    proteinas: 7,
    carboidratos: 0.5,
    gorduras: 11
  },
  {
    id: 'food-copa-lombo',
    nome: 'Copa lombo',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 75,
    proteinas: 8,
    carboidratos: 0.5,
    gorduras: 4.5
  },
  {
    id: 'food-peito-peru-natural',
    nome: 'Peito de peru natural assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 135,
    proteinas: 29,
    carboidratos: 0,
    gorduras: 2
  },
  // Proteínas Vegetais
  {
    id: 'food-tofu',
    nome: 'Tofu firme',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 76,
    proteinas: 8,
    carboidratos: 2,
    gorduras: 4.5
  },
  {
    id: 'food-tofu-defumado',
    nome: 'Tofu defumado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 110,
    proteinas: 11,
    carboidratos: 2,
    gorduras: 6
  },
  {
    id: 'food-tempeh',
    nome: 'Tempeh',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 192,
    proteinas: 20,
    carboidratos: 8,
    gorduras: 11
  },
  {
    id: 'food-seitan',
    nome: 'Seitan',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 118,
    proteinas: 25,
    carboidratos: 4,
    gorduras: 0.5
  },
  {
    id: 'food-edamame',
    nome: 'Edamame cozido',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 121,
    proteinas: 12,
    carboidratos: 9,
    gorduras: 5,
    fibras: 5
  },
  {
    id: 'food-proteina-soja',
    nome: 'Proteína de soja texturizada (PTS)',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 98,
    proteinas: 17,
    carboidratos: 6,
    gorduras: 0.3,
    fibras: 4
  },
  {
    id: 'food-ervilha-proteina',
    nome: 'Proteína isolada de ervilha',
    categoria: 'proteina',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 24,
    carboidratos: 1,
    gorduras: 0.5
  },
  {
    id: 'food-hamburguer-vegetal',
    nome: 'Hambúrguer vegetal',
    categoria: 'proteina',
    porcao_padrao: 90,
    unidade: 'g',
    calorias: 200,
    proteinas: 18,
    carboidratos: 8,
    gorduras: 11
  },
  // Mais Cordeiro
  {
    id: 'food-cordeiro-pernil',
    nome: 'Pernil de cordeiro assado',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 230,
    proteinas: 25,
    carboidratos: 0,
    gorduras: 14
  },
  {
    id: 'food-cordeiro-costela',
    nome: 'Costela de cordeiro grelhada',
    categoria: 'proteina',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 294,
    proteinas: 22,
    carboidratos: 0,
    gorduras: 22
  },
  // Ovo de codorna
  {
    id: 'food-ovo-codorna',
    nome: 'Ovo de codorna',
    categoria: 'proteina',
    porcao_padrao: 10,
    unidade: 'g',
    calorias: 16,
    proteinas: 1.2,
    carboidratos: 0.1,
    gorduras: 1.2,
    porcoes_comuns: [
      { label: '1 ovo de codorna', grams: 10, isDefault: true },
      { label: '3 ovos de codorna', grams: 30 },
      { label: '5 ovos de codorna', grams: 50 }
    ]
  },

  // ====== LATICÍNIOS ======
  {
    id: 'food-yopro',
    nome: 'Yopro 25g proteína',
    categoria: 'laticinio',
    marca: 'Danone',
    porcao_padrao: 160,
    unidade: 'g',
    calorias: 160,
    proteinas: 25,
    carboidratos: 9,
    gorduras: 0,
    porcoes_comuns: [
      { label: '1 pote', grams: 160, isDefault: true },
      { label: '½ pote', grams: 80 }
    ],
    is_favorite: true
  },
  {
    id: 'food-mussarela',
    nome: 'Queijo muçarela',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 90,
    proteinas: 6,
    carboidratos: 0.5,
    gorduras: 7
  },
  {
    id: 'food-queijo-branco',
    nome: 'Queijo branco (minas)',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 70,
    proteinas: 5,
    carboidratos: 0.5,
    gorduras: 5
  },
  {
    id: 'food-queijo-cottage',
    nome: 'Queijo cottage',
    categoria: 'laticinio',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 50,
    proteinas: 6,
    carboidratos: 2,
    gorduras: 2
  },
  {
    id: 'food-ricota',
    nome: 'Ricota',
    categoria: 'laticinio',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 70,
    proteinas: 6,
    carboidratos: 2,
    gorduras: 4
  },
  {
    id: 'food-requeijao',
    nome: 'Requeijão cremoso',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 70,
    proteinas: 2,
    carboidratos: 1,
    gorduras: 7
  },
  {
    id: 'food-requeijao-light',
    nome: 'Requeijão light',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 40,
    proteinas: 3,
    carboidratos: 1,
    gorduras: 3
  },
  {
    id: 'food-leite-integral',
    nome: 'Leite integral',
    categoria: 'laticinio',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 120,
    proteinas: 6,
    carboidratos: 10,
    gorduras: 6
  },
  {
    id: 'food-leite-desnatado',
    nome: 'Leite desnatado',
    categoria: 'laticinio',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 70,
    proteinas: 7,
    carboidratos: 10,
    gorduras: 0.2
  },
  {
    id: 'food-iogurte-natural',
    nome: 'Iogurte natural',
    categoria: 'laticinio',
    porcao_padrao: 170,
    unidade: 'g',
    calorias: 100,
    proteinas: 6,
    carboidratos: 8,
    gorduras: 5
  },
  {
    id: 'food-iogurte-grego',
    nome: 'Iogurte grego',
    categoria: 'laticinio',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 90,
    proteinas: 10,
    carboidratos: 4,
    gorduras: 4
  },
  {
    id: 'food-creme-leite',
    nome: 'Creme de leite',
    categoria: 'laticinio',
    porcao_padrao: 25,
    unidade: 'g',
    calorias: 75,
    proteinas: 0.5,
    carboidratos: 1,
    gorduras: 8
  },
  // Mais Queijos
  {
    id: 'food-queijo-prato',
    nome: 'Queijo prato',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 7,
    carboidratos: 0.5,
    gorduras: 9
  },
  {
    id: 'food-queijo-parmesao',
    nome: 'Queijo parmesão ralado',
    categoria: 'laticinio',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 60,
    proteinas: 5,
    carboidratos: 0.3,
    gorduras: 4.5
  },
  {
    id: 'food-queijo-gorgonzola',
    nome: 'Queijo gorgonzola',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 100,
    proteinas: 6,
    carboidratos: 0.5,
    gorduras: 8
  },
  {
    id: 'food-queijo-brie',
    nome: 'Queijo brie',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 95,
    proteinas: 6,
    carboidratos: 0.4,
    gorduras: 8
  },
  {
    id: 'food-queijo-provolone',
    nome: 'Queijo provolone',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 100,
    proteinas: 7,
    carboidratos: 0.6,
    gorduras: 8
  },
  {
    id: 'food-queijo-coalho',
    nome: 'Queijo coalho',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 85,
    proteinas: 6,
    carboidratos: 0.5,
    gorduras: 7
  },
  {
    id: 'food-queijo-canastra',
    nome: 'Queijo canastra',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 7,
    carboidratos: 0.3,
    gorduras: 9
  },
  {
    id: 'food-queijo-meia-cura',
    nome: 'Queijo meia cura',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 105,
    proteinas: 7,
    carboidratos: 0.4,
    gorduras: 8.5
  },
  {
    id: 'food-queijo-catupiry',
    nome: 'Catupiry',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 90,
    proteinas: 3,
    carboidratos: 1,
    gorduras: 8.5
  },
  {
    id: 'food-cream-cheese',
    nome: 'Cream cheese',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 100,
    proteinas: 2,
    carboidratos: 1,
    gorduras: 10
  },
  {
    id: 'food-cream-cheese-light',
    nome: 'Cream cheese light',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 50,
    proteinas: 2.5,
    carboidratos: 2,
    gorduras: 4
  },
  // Mais Iogurtes
  {
    id: 'food-iogurte-desnatado',
    nome: 'Iogurte desnatado',
    categoria: 'laticinio',
    porcao_padrao: 170,
    unidade: 'g',
    calorias: 70,
    proteinas: 6,
    carboidratos: 10,
    gorduras: 0.5
  },
  {
    id: 'food-iogurte-proteico',
    nome: 'Iogurte proteico',
    categoria: 'laticinio',
    porcao_padrao: 140,
    unidade: 'g',
    calorias: 90,
    proteinas: 15,
    carboidratos: 5,
    gorduras: 0.5
  },
  {
    id: 'food-iogurte-skyr',
    nome: 'Skyr',
    categoria: 'laticinio',
    porcao_padrao: 140,
    unidade: 'g',
    calorias: 90,
    proteinas: 16,
    carboidratos: 4,
    gorduras: 0.2
  },
  {
    id: 'food-kefir',
    nome: 'Kefir natural',
    categoria: 'laticinio',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 100,
    proteinas: 6,
    carboidratos: 8,
    gorduras: 5
  },
  {
    id: 'food-coalhada',
    nome: 'Coalhada',
    categoria: 'laticinio',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 65,
    proteinas: 4,
    carboidratos: 5,
    gorduras: 3
  },
  // Manteiga e derivados
  {
    id: 'food-manteiga-ghee',
    nome: 'Manteiga ghee',
    categoria: 'laticinio',
    porcao_padrao: 10,
    unidade: 'g',
    calorias: 90,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 10
  },
  {
    id: 'food-nata',
    nome: 'Nata',
    categoria: 'laticinio',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 80,
    proteinas: 0.5,
    carboidratos: 0.5,
    gorduras: 9
  },
  {
    id: 'food-chantilly',
    nome: 'Chantilly',
    categoria: 'laticinio',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 100,
    proteinas: 0.5,
    carboidratos: 5,
    gorduras: 9
  },
  {
    id: 'food-leite-condensado',
    nome: 'Leite condensado',
    categoria: 'laticinio',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 65,
    proteinas: 1.5,
    carboidratos: 11,
    gorduras: 2
  },
  {
    id: 'food-doce-leite',
    nome: 'Doce de leite',
    categoria: 'laticinio',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 60,
    proteinas: 1,
    carboidratos: 12,
    gorduras: 1.5
  },

  // ====== CARBOIDRATOS ======
  {
    id: 'food-arroz',
    nome: 'Arroz branco cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 130,
    proteinas: 2.7,
    carboidratos: 28,
    gorduras: 0.3,
    porcoes_comuns: [
      { label: '1 colher de servir', grams: 60, isDefault: true },
      { label: '2 colheres de servir', grams: 120 },
      { label: '3 colheres de servir', grams: 180 },
      { label: '1 escumadeira cheia', grams: 100 }
    ],
    is_favorite: true
  },
  {
    id: 'food-arroz-integral',
    nome: 'Arroz integral cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 112,
    proteinas: 2.6,
    carboidratos: 24,
    gorduras: 0.9,
    fibras: 1.8
  },
  {
    id: 'food-feijao',
    nome: 'Feijão carioca cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 77,
    proteinas: 5,
    carboidratos: 14,
    gorduras: 0.5,
    porcoes_comuns: [
      { label: '1 concha', grams: 80, isDefault: true },
      { label: '2 conchas', grams: 160 },
      { label: '½ concha', grams: 40 },
      { label: '1 concha cheia', grams: 120 }
    ],
    is_favorite: true
  },
  {
    id: 'food-feijao-preto',
    nome: 'Feijão preto cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 77,
    proteinas: 4.5,
    carboidratos: 14,
    gorduras: 0.5
  },
  {
    id: 'food-lentilha',
    nome: 'Lentilha cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 93,
    proteinas: 6,
    carboidratos: 16,
    gorduras: 0.4,
    fibras: 4
  },
  {
    id: 'food-grao-bico',
    nome: 'Grão de bico cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 120,
    proteinas: 7,
    carboidratos: 18,
    gorduras: 2,
    fibras: 5
  },
  {
    id: 'food-batata-doce',
    nome: 'Batata doce cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 86,
    proteinas: 1.6,
    carboidratos: 20,
    gorduras: 0.1
  },
  {
    id: 'food-batata-inglesa',
    nome: 'Batata inglesa cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 77,
    proteinas: 1.9,
    carboidratos: 17,
    gorduras: 0.1
  },
  {
    id: 'food-mandioca',
    nome: 'Mandioca cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 125,
    proteinas: 0.6,
    carboidratos: 30,
    gorduras: 0.3
  },
  {
    id: 'food-inhame',
    nome: 'Inhame cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 97,
    proteinas: 2,
    carboidratos: 23,
    gorduras: 0.1
  },
  {
    id: 'food-pao',
    nome: 'Pão integral (fatia)',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 70,
    proteinas: 3,
    carboidratos: 12,
    gorduras: 1,
    porcoes_comuns: [
      { label: '1 fatia', grams: 30, isDefault: true },
      { label: '2 fatias', grams: 60 },
      { label: '3 fatias', grams: 90 }
    ]
  },
  {
    id: 'food-pao-frances',
    nome: 'Pão francês',
    categoria: 'carboidrato',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 150,
    proteinas: 4,
    carboidratos: 29,
    gorduras: 2,
    porcoes_comuns: [
      { label: '1 pão francês', grams: 50, isDefault: true },
      { label: '2 pães franceses', grams: 100 },
      { label: '½ pão francês', grams: 25 }
    ]
  },
  {
    id: 'food-pao-forma-branco',
    nome: 'Pão de forma branco (fatia)',
    categoria: 'carboidrato',
    porcao_padrao: 25,
    unidade: 'g',
    calorias: 65,
    proteinas: 2,
    carboidratos: 13,
    gorduras: 0.8
  },
  {
    id: 'food-tapioca',
    nome: 'Tapioca (goma)',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 105,
    proteinas: 0,
    carboidratos: 26,
    gorduras: 0,
    porcoes_comuns: [
      { label: '1 colher sopa cheia', grams: 30, isDefault: true },
      { label: '2 colheres sopa', grams: 60 },
      { label: '3 colheres sopa', grams: 90 }
    ]
  },
  {
    id: 'food-aveia',
    nome: 'Aveia em flocos',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 117,
    proteinas: 4.4,
    carboidratos: 20,
    gorduras: 2.4,
    fibras: 3,
    porcoes_comuns: [
      { label: '2 colheres sopa', grams: 30, isDefault: true },
      { label: '3 colheres sopa', grams: 45 },
      { label: '4 colheres sopa', grams: 60 }
    ]
  },
  {
    id: 'food-granola',
    nome: 'Granola',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 130,
    proteinas: 3,
    carboidratos: 20,
    gorduras: 4,
    is_favorite: true
  },
  {
    id: 'food-macarrao',
    nome: 'Macarrão cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 131,
    proteinas: 5,
    carboidratos: 25,
    gorduras: 1
  },
  {
    id: 'food-macarrao-integral',
    nome: 'Macarrão integral cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 124,
    proteinas: 5,
    carboidratos: 24,
    gorduras: 0.9,
    fibras: 3
  },
  {
    id: 'food-cuscuz',
    nome: 'Cuscuz de milho',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 120,
    proteinas: 2,
    carboidratos: 28,
    gorduras: 0.5
  },
  {
    id: 'food-milho',
    nome: 'Milho verde cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 96,
    proteinas: 3.2,
    carboidratos: 19,
    gorduras: 1.4
  },
  {
    id: 'food-pipoca',
    nome: 'Pipoca (sem manteiga)',
    categoria: 'carboidrato',
    porcao_padrao: 25,
    unidade: 'g',
    calorias: 96,
    proteinas: 3,
    carboidratos: 19,
    gorduras: 1
  },
  {
    id: 'food-farofa',
    nome: 'Farofa pronta',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 130,
    proteinas: 1,
    carboidratos: 22,
    gorduras: 4
  },
  {
    id: 'food-biscoito-integral',
    nome: 'Biscoito integral',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 120,
    proteinas: 2,
    carboidratos: 20,
    gorduras: 4
  },
  {
    id: 'food-torrada',
    nome: 'Torrada integral',
    categoria: 'carboidrato',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 55,
    proteinas: 2,
    carboidratos: 10,
    gorduras: 1
  },
  // Mais Carboidratos
  {
    id: 'food-quinoa',
    nome: 'Quinoa cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 120,
    proteinas: 4.4,
    carboidratos: 21,
    gorduras: 1.9,
    fibras: 2.8
  },
  {
    id: 'food-amaranto',
    nome: 'Amaranto cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 102,
    proteinas: 4,
    carboidratos: 19,
    gorduras: 1.6,
    fibras: 2.1
  },
  {
    id: 'food-trigo-sarraceno',
    nome: 'Trigo sarraceno cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 92,
    proteinas: 3.4,
    carboidratos: 20,
    gorduras: 0.6,
    fibras: 2.7
  },
  {
    id: 'food-cevada',
    nome: 'Cevada cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 123,
    proteinas: 2.3,
    carboidratos: 28,
    gorduras: 0.4,
    fibras: 4
  },
  {
    id: 'food-polenta',
    nome: 'Polenta pronta',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 70,
    proteinas: 1.5,
    carboidratos: 15,
    gorduras: 0.3
  },
  {
    id: 'food-farinha-aveia',
    nome: 'Farinha de aveia',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 115,
    proteinas: 4,
    carboidratos: 20,
    gorduras: 2.5,
    fibras: 3
  },
  {
    id: 'food-farinha-arroz',
    nome: 'Farinha de arroz',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 2,
    carboidratos: 24,
    gorduras: 0.4
  },
  {
    id: 'food-farinha-amendoas',
    nome: 'Farinha de amêndoas',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 170,
    proteinas: 6,
    carboidratos: 6,
    gorduras: 15,
    fibras: 3
  },
  {
    id: 'food-farinha-coco',
    nome: 'Farinha de coco',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 120,
    proteinas: 6,
    carboidratos: 18,
    gorduras: 4,
    fibras: 12
  },
  {
    id: 'food-batata-baroa',
    nome: 'Batata baroa (mandioquinha) cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 104,
    proteinas: 0.9,
    carboidratos: 24,
    gorduras: 0.2
  },
  {
    id: 'food-cara',
    nome: 'Cará cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 95,
    proteinas: 2,
    carboidratos: 22,
    gorduras: 0.1
  },
  {
    id: 'food-pao-australiano',
    nome: 'Pão australiano',
    categoria: 'carboidrato',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 140,
    proteinas: 4,
    carboidratos: 26,
    gorduras: 2
  },
  {
    id: 'food-pao-sirio',
    nome: 'Pão sírio',
    categoria: 'carboidrato',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 130,
    proteinas: 5,
    carboidratos: 26,
    gorduras: 1
  },
  {
    id: 'food-wrap',
    nome: 'Wrap integral',
    categoria: 'carboidrato',
    porcao_padrao: 45,
    unidade: 'g',
    calorias: 100,
    proteinas: 3,
    carboidratos: 19,
    gorduras: 1.5
  },
  {
    id: 'food-crepioca',
    nome: 'Crepioca (tapioca + ovo)',
    categoria: 'carboidrato',
    porcao_padrao: 80,
    unidade: 'g',
    calorias: 180,
    proteinas: 7,
    carboidratos: 22,
    gorduras: 7
  },
  {
    id: 'food-nhoque',
    nome: 'Nhoque cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 133,
    proteinas: 3,
    carboidratos: 28,
    gorduras: 1
  },
  {
    id: 'food-lasanha-massa',
    nome: 'Massa de lasanha cozida',
    categoria: 'carboidrato',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 70,
    proteinas: 2.5,
    carboidratos: 14,
    gorduras: 0.5
  },
  {
    id: 'food-panqueca-massa',
    nome: 'Massa de panqueca (1 unidade)',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 75,
    proteinas: 2.5,
    carboidratos: 12,
    gorduras: 2
  },
  {
    id: 'food-waffle',
    nome: 'Waffle',
    categoria: 'carboidrato',
    porcao_padrao: 75,
    unidade: 'g',
    calorias: 200,
    proteinas: 5,
    carboidratos: 25,
    gorduras: 9
  },
  {
    id: 'food-cereal-matinal',
    nome: 'Cereal matinal (sem açúcar)',
    categoria: 'carboidrato',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 3,
    carboidratos: 23,
    gorduras: 1
  },
  {
    id: 'food-muesli',
    nome: 'Muesli',
    categoria: 'carboidrato',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 180,
    proteinas: 5,
    carboidratos: 32,
    gorduras: 4
  },
  {
    id: 'food-ervilha',
    nome: 'Ervilha cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 84,
    proteinas: 5.4,
    carboidratos: 15,
    gorduras: 0.4,
    fibras: 5
  },
  {
    id: 'food-feijao-branco',
    nome: 'Feijão branco cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 100,
    proteinas: 7,
    carboidratos: 18,
    gorduras: 0.4,
    fibras: 6
  },
  {
    id: 'food-feijao-fradinho',
    nome: 'Feijão fradinho cozido',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 77,
    proteinas: 5,
    carboidratos: 14,
    gorduras: 0.5
  },
  {
    id: 'food-fava',
    nome: 'Fava cozida',
    categoria: 'carboidrato',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 72,
    proteinas: 5,
    carboidratos: 12,
    gorduras: 0.4
  },

  // ====== FRUTAS ======
  {
    id: 'food-banana',
    nome: 'Banana',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 89,
    proteinas: 1.1,
    carboidratos: 23,
    gorduras: 0.3,
    porcoes_comuns: [
      { label: '1 banana média', grams: 100, isDefault: true },
      { label: '1 banana pequena', grams: 70 },
      { label: '1 banana grande', grams: 130 },
      { label: '2 bananas', grams: 200 }
    ],
    is_favorite: true
  },
  {
    id: 'food-maca',
    nome: 'Maçã',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 78,
    proteinas: 0.4,
    carboidratos: 21,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 maçã média', grams: 150, isDefault: true },
      { label: '1 maçã pequena', grams: 100 },
      { label: '1 maçã grande', grams: 200 }
    ]
  },
  {
    id: 'food-laranja',
    nome: 'Laranja',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 62,
    proteinas: 1.2,
    carboidratos: 15,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 laranja média', grams: 150, isDefault: true },
      { label: '1 laranja pequena', grams: 100 },
      { label: '1 laranja grande', grams: 200 }
    ]
  },
  {
    id: 'food-mamao',
    nome: 'Mamão papaia',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 60,
    proteinas: 0.9,
    carboidratos: 15,
    gorduras: 0.2
  },
  {
    id: 'food-manga',
    nome: 'Manga',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 90,
    proteinas: 0.6,
    carboidratos: 23,
    gorduras: 0.3
  },
  {
    id: 'food-abacaxi',
    nome: 'Abacaxi',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 48,
    proteinas: 0.5,
    carboidratos: 12,
    gorduras: 0.1
  },
  {
    id: 'food-melancia',
    nome: 'Melancia',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 45,
    proteinas: 0.9,
    carboidratos: 11,
    gorduras: 0.2
  },
  {
    id: 'food-melao',
    nome: 'Melão',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 50,
    proteinas: 1.2,
    carboidratos: 12,
    gorduras: 0.2
  },
  {
    id: 'food-morango',
    nome: 'Morango',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 32,
    proteinas: 0.7,
    carboidratos: 8,
    gorduras: 0.3
  },
  {
    id: 'food-uva',
    nome: 'Uva',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 67,
    proteinas: 0.6,
    carboidratos: 17,
    gorduras: 0.4
  },
  {
    id: 'food-pera',
    nome: 'Pêra',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 57,
    proteinas: 0.4,
    carboidratos: 15,
    gorduras: 0.1
  },
  {
    id: 'food-kiwi',
    nome: 'Kiwi',
    categoria: 'fruta',
    porcao_padrao: 75,
    unidade: 'g',
    calorias: 46,
    proteinas: 0.8,
    carboidratos: 11,
    gorduras: 0.4
  },
  {
    id: 'food-acai',
    nome: 'Açaí (polpa pura)',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 70,
    proteinas: 1,
    carboidratos: 6,
    gorduras: 5
  },
  {
    id: 'food-abacate',
    nome: 'Abacate',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 160,
    proteinas: 2,
    carboidratos: 8,
    gorduras: 15
  },
  {
    id: 'food-goiaba',
    nome: 'Goiaba',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 54,
    proteinas: 1.1,
    carboidratos: 13,
    gorduras: 0.4
  },
  {
    id: 'food-maracuja',
    nome: 'Maracujá (polpa)',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 68,
    proteinas: 2,
    carboidratos: 16,
    gorduras: 0.4
  },
  {
    id: 'food-limao',
    nome: 'Limão (suco)',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'ml',
    calorias: 22,
    proteinas: 0.4,
    carboidratos: 7,
    gorduras: 0.2
  },
  {
    id: 'food-coco',
    nome: 'Coco fresco ralado',
    categoria: 'fruta',
    porcao_padrao: 40,
    unidade: 'g',
    calorias: 140,
    proteinas: 1.3,
    carboidratos: 6,
    gorduras: 13
  },
  // Mais Frutas
  {
    id: 'food-tangerina',
    nome: 'Tangerina (mexerica)',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 53,
    proteinas: 0.8,
    carboidratos: 13,
    gorduras: 0.3,
    porcoes_comuns: [
      { label: '1 tangerina média', grams: 100, isDefault: true },
      { label: '2 tangerinas', grams: 200 }
    ]
  },
  {
    id: 'food-ameixa',
    nome: 'Ameixa fresca',
    categoria: 'fruta',
    porcao_padrao: 70,
    unidade: 'g',
    calorias: 32,
    proteinas: 0.5,
    carboidratos: 8,
    gorduras: 0.2
  },
  {
    id: 'food-ameixa-seca',
    nome: 'Ameixa seca',
    categoria: 'fruta',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 72,
    proteinas: 0.7,
    carboidratos: 18,
    gorduras: 0.1,
    fibras: 2
  },
  {
    id: 'food-damasco',
    nome: 'Damasco fresco',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 48,
    proteinas: 1.4,
    carboidratos: 11,
    gorduras: 0.4
  },
  {
    id: 'food-damasco-seco',
    nome: 'Damasco seco',
    categoria: 'fruta',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 72,
    proteinas: 1,
    carboidratos: 18,
    gorduras: 0.2
  },
  {
    id: 'food-figo',
    nome: 'Figo fresco',
    categoria: 'fruta',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 37,
    proteinas: 0.4,
    carboidratos: 10,
    gorduras: 0.2
  },
  {
    id: 'food-lichia',
    nome: 'Lichia',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 66,
    proteinas: 0.8,
    carboidratos: 16,
    gorduras: 0.4
  },
  {
    id: 'food-carambola',
    nome: 'Carambola',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 31,
    proteinas: 1,
    carboidratos: 7,
    gorduras: 0.3
  },
  {
    id: 'food-romã',
    nome: 'Romã',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 83,
    proteinas: 1.7,
    carboidratos: 19,
    gorduras: 1.2
  },
  {
    id: 'food-caqui',
    nome: 'Caqui',
    categoria: 'fruta',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 105,
    proteinas: 0.6,
    carboidratos: 28,
    gorduras: 0.3
  },
  {
    id: 'food-framboesa',
    nome: 'Framboesa',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 52,
    proteinas: 1.2,
    carboidratos: 12,
    gorduras: 0.7,
    fibras: 6.5
  },
  {
    id: 'food-mirtilo',
    nome: 'Mirtilo (blueberry)',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 57,
    proteinas: 0.7,
    carboidratos: 14,
    gorduras: 0.3,
    fibras: 2.4
  },
  {
    id: 'food-amora',
    nome: 'Amora',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 43,
    proteinas: 1.4,
    carboidratos: 10,
    gorduras: 0.5,
    fibras: 5
  },
  {
    id: 'food-acerola',
    nome: 'Acerola',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 32,
    proteinas: 0.4,
    carboidratos: 8,
    gorduras: 0.3
  },
  {
    id: 'food-jabuticaba',
    nome: 'Jabuticaba',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 58,
    proteinas: 0.6,
    carboidratos: 15,
    gorduras: 0.2
  },
  {
    id: 'food-pitaya',
    nome: 'Pitaya',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 50,
    proteinas: 1.1,
    carboidratos: 11,
    gorduras: 0.4
  },
  {
    id: 'food-graviola',
    nome: 'Graviola',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 66,
    proteinas: 1,
    carboidratos: 17,
    gorduras: 0.3
  },
  {
    id: 'food-cupuacu',
    nome: 'Cupuaçu (polpa)',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 72,
    proteinas: 1.9,
    carboidratos: 15,
    gorduras: 0.5
  },
  {
    id: 'food-jaca',
    nome: 'Jaca',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 95,
    proteinas: 1.7,
    carboidratos: 23,
    gorduras: 0.6
  },
  {
    id: 'food-tamarindo',
    nome: 'Tamarindo (polpa)',
    categoria: 'fruta',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 72,
    proteinas: 0.9,
    carboidratos: 19,
    gorduras: 0.2
  },
  {
    id: 'food-banana-passa',
    nome: 'Banana passa',
    categoria: 'fruta',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 90,
    proteinas: 1,
    carboidratos: 23,
    gorduras: 0.2
  },
  {
    id: 'food-uva-passa',
    nome: 'Uva passa',
    categoria: 'fruta',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 90,
    proteinas: 1,
    carboidratos: 23,
    gorduras: 0.1
  },
  {
    id: 'food-tâmara',
    nome: 'Tâmara',
    categoria: 'fruta',
    porcao_padrao: 25,
    unidade: 'g',
    calorias: 70,
    proteinas: 0.5,
    carboidratos: 18,
    gorduras: 0.1
  },
  {
    id: 'food-nectarina',
    nome: 'Nectarina',
    categoria: 'fruta',
    porcao_padrao: 140,
    unidade: 'g',
    calorias: 62,
    proteinas: 1.5,
    carboidratos: 15,
    gorduras: 0.4
  },
  {
    id: 'food-pêssego',
    nome: 'Pêssego',
    categoria: 'fruta',
    porcao_padrao: 130,
    unidade: 'g',
    calorias: 51,
    proteinas: 1.2,
    carboidratos: 12,
    gorduras: 0.3
  },
  {
    id: 'food-cereja',
    nome: 'Cereja',
    categoria: 'fruta',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 63,
    proteinas: 1.1,
    carboidratos: 16,
    gorduras: 0.2
  },

  // ====== VEGETAIS ======
  {
    id: 'food-brocolis',
    nome: 'Brócolis cozido',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 35,
    proteinas: 2.4,
    carboidratos: 7,
    gorduras: 0.4,
    fibras: 3.3
  },
  {
    id: 'food-abobrinha',
    nome: 'Abobrinha refogada',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 20,
    proteinas: 1.2,
    carboidratos: 4,
    gorduras: 0.2
  },
  {
    id: 'food-salada',
    nome: 'Salada mista',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 15,
    proteinas: 1,
    carboidratos: 3,
    gorduras: 0.1,
    fibras: 2
  },
  {
    id: 'food-alface',
    nome: 'Alface',
    categoria: 'vegetal',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 7,
    proteinas: 0.5,
    carboidratos: 1,
    gorduras: 0.1
  },
  {
    id: 'food-tomate',
    nome: 'Tomate',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 18,
    proteinas: 0.9,
    carboidratos: 4,
    gorduras: 0.2
  },
  {
    id: 'food-cenoura',
    nome: 'Cenoura cozida',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 35,
    proteinas: 0.8,
    carboidratos: 8,
    gorduras: 0.2
  },
  {
    id: 'food-beterraba',
    nome: 'Beterraba cozida',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 44,
    proteinas: 1.6,
    carboidratos: 10,
    gorduras: 0.1
  },
  {
    id: 'food-chuchu',
    nome: 'Chuchu cozido',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 17,
    proteinas: 0.8,
    carboidratos: 4,
    gorduras: 0.1
  },
  {
    id: 'food-couve',
    nome: 'Couve refogada',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 26,
    proteinas: 2.9,
    carboidratos: 4,
    gorduras: 0.4,
    fibras: 2.7
  },
  {
    id: 'food-espinafre',
    nome: 'Espinafre cozido',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 23,
    proteinas: 2.9,
    carboidratos: 3.6,
    gorduras: 0.4,
    fibras: 2.4
  },
  {
    id: 'food-vagem',
    nome: 'Vagem cozida',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 35,
    proteinas: 1.8,
    carboidratos: 8,
    gorduras: 0.2
  },
  {
    id: 'food-pepino',
    nome: 'Pepino',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 15,
    proteinas: 0.6,
    carboidratos: 3.6,
    gorduras: 0.1
  },
  {
    id: 'food-pimentao',
    nome: 'Pimentão',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 27,
    proteinas: 0.9,
    carboidratos: 6,
    gorduras: 0.2
  },
  {
    id: 'food-cebola',
    nome: 'Cebola',
    categoria: 'vegetal',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 20,
    proteinas: 0.5,
    carboidratos: 5,
    gorduras: 0.1
  },
  {
    id: 'food-alho',
    nome: 'Alho',
    categoria: 'vegetal',
    porcao_padrao: 5,
    unidade: 'g',
    calorias: 7,
    proteinas: 0.3,
    carboidratos: 1.6,
    gorduras: 0
  },
  {
    id: 'food-repolho',
    nome: 'Repolho cru',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 22,
    proteinas: 1.2,
    carboidratos: 5,
    gorduras: 0.1
  },
  {
    id: 'food-berinjela',
    nome: 'Berinjela grelhada',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 24,
    proteinas: 0.8,
    carboidratos: 6,
    gorduras: 0.1
  },
  {
    id: 'food-cogumelo',
    nome: 'Cogumelo champignon',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 22,
    proteinas: 3.1,
    carboidratos: 3.3,
    gorduras: 0.3
  },
  {
    id: 'food-abobora',
    nome: 'Abóbora cozida',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 26,
    proteinas: 1,
    carboidratos: 6,
    gorduras: 0.1
  },
  {
    id: 'food-quiabo',
    nome: 'Quiabo refogado',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 33,
    proteinas: 1.9,
    carboidratos: 7,
    gorduras: 0.2
  },
  {
    id: 'food-rucula',
    nome: 'Rúcula',
    categoria: 'vegetal',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 8,
    proteinas: 0.8,
    carboidratos: 1,
    gorduras: 0.2
  },
  {
    id: 'food-acelga',
    nome: 'Acelga cozida',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 20,
    proteinas: 1.8,
    carboidratos: 3.7,
    gorduras: 0.1
  },
  {
    id: 'food-couve-flor',
    nome: 'Couve-flor cozida',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 23,
    proteinas: 1.9,
    carboidratos: 5,
    gorduras: 0.1
  },
  {
    id: 'food-maxixe',
    nome: 'Maxixe cozido',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 17,
    proteinas: 0.9,
    carboidratos: 3,
    gorduras: 0.1
  },
  {
    id: 'food-jiló',
    nome: 'Jiló refogado',
    categoria: 'vegetal',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 32,
    proteinas: 1.1,
    carboidratos: 7,
    gorduras: 0.1
  },

  // ====== GORDURAS ======
  {
    id: 'food-amendoim',
    nome: 'Pasta de amendoim integral',
    categoria: 'gordura',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 120,
    proteinas: 5,
    carboidratos: 4,
    gorduras: 10,
    is_favorite: true
  },
  {
    id: 'food-nuts',
    nome: 'Mix de nuts',
    categoria: 'gordura',
    porcao_padrao: 40,
    unidade: 'g',
    calorias: 240,
    proteinas: 6,
    carboidratos: 8,
    gorduras: 22,
    is_favorite: true
  },
  {
    id: 'food-castanha-para',
    nome: 'Castanha do Pará',
    categoria: 'gordura',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 100,
    proteinas: 2,
    carboidratos: 2,
    gorduras: 10
  },
  {
    id: 'food-castanha-caju',
    nome: 'Castanha de caju',
    categoria: 'gordura',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 175,
    proteinas: 5,
    carboidratos: 10,
    gorduras: 14
  },
  {
    id: 'food-amendoas',
    nome: 'Amêndoas',
    categoria: 'gordura',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 170,
    proteinas: 6,
    carboidratos: 6,
    gorduras: 15
  },
  {
    id: 'food-nozes',
    nome: 'Nozes',
    categoria: 'gordura',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 195,
    proteinas: 4.5,
    carboidratos: 4,
    gorduras: 19
  },
  {
    id: 'food-azeite',
    nome: 'Azeite de oliva',
    categoria: 'gordura',
    porcao_padrao: 10,
    unidade: 'ml',
    calorias: 88,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 10
  },
  {
    id: 'food-oleo-coco',
    nome: 'Óleo de coco',
    categoria: 'gordura',
    porcao_padrao: 10,
    unidade: 'ml',
    calorias: 90,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 10
  },
  {
    id: 'food-manteiga',
    nome: 'Manteiga',
    categoria: 'gordura',
    porcao_padrao: 10,
    unidade: 'g',
    calorias: 72,
    proteinas: 0.1,
    carboidratos: 0,
    gorduras: 8
  },
  {
    id: 'food-margarina',
    nome: 'Margarina',
    categoria: 'gordura',
    porcao_padrao: 10,
    unidade: 'g',
    calorias: 54,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 6
  },
  {
    id: 'food-semente-chia',
    nome: 'Semente de chia',
    categoria: 'gordura',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 73,
    proteinas: 2.5,
    carboidratos: 6,
    gorduras: 4.5,
    fibras: 5
  },
  {
    id: 'food-semente-linhaca',
    nome: 'Semente de linhaça',
    categoria: 'gordura',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 80,
    proteinas: 2.7,
    carboidratos: 4,
    gorduras: 6.3,
    fibras: 4
  },
  {
    id: 'food-semente-girassol',
    nome: 'Semente de girassol',
    categoria: 'gordura',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 175,
    proteinas: 6,
    carboidratos: 6,
    gorduras: 15
  },

  // ====== SUPLEMENTOS ======
  {
    id: 'food-whey',
    nome: 'Whey Protein',
    categoria: 'suplemento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 120,
    proteinas: 24,
    carboidratos: 3,
    gorduras: 1.5,
    porcoes_comuns: [
      { label: '1 scoop', grams: 30, isDefault: true },
      { label: '2 scoops', grams: 60 },
      { label: '½ scoop', grams: 15 }
    ],
    is_favorite: true
  },
  {
    id: 'food-whey-isolado',
    nome: 'Whey Protein Isolado',
    categoria: 'suplemento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 27,
    carboidratos: 1,
    gorduras: 0.5
  },
  {
    id: 'food-caseina',
    nome: 'Caseína',
    categoria: 'suplemento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 24,
    carboidratos: 2,
    gorduras: 0.5
  },
  {
    id: 'food-albumina',
    nome: 'Albumina',
    categoria: 'suplemento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 105,
    proteinas: 25,
    carboidratos: 1,
    gorduras: 0
  },
  {
    id: 'food-creatina',
    nome: 'Creatina',
    categoria: 'suplemento',
    porcao_padrao: 5,
    unidade: 'g',
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0
  },
  {
    id: 'food-bcaa',
    nome: 'BCAA',
    categoria: 'suplemento',
    porcao_padrao: 5,
    unidade: 'g',
    calorias: 20,
    proteinas: 5,
    carboidratos: 0,
    gorduras: 0
  },
  {
    id: 'food-glutamina',
    nome: 'Glutamina',
    categoria: 'suplemento',
    porcao_padrao: 5,
    unidade: 'g',
    calorias: 20,
    proteinas: 5,
    carboidratos: 0,
    gorduras: 0
  },
  {
    id: 'food-maltodextrina',
    nome: 'Maltodextrina',
    categoria: 'suplemento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 115,
    proteinas: 0,
    carboidratos: 29,
    gorduras: 0
  },
  {
    id: 'food-dextrose',
    nome: 'Dextrose',
    categoria: 'suplemento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 112,
    proteinas: 0,
    carboidratos: 28,
    gorduras: 0
  },
  {
    id: 'food-hipercalorico',
    nome: 'Hipercalórico',
    categoria: 'suplemento',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 400,
    proteinas: 15,
    carboidratos: 75,
    gorduras: 5
  },
  {
    id: 'food-cookie-topway',
    nome: 'Cookie Proteico Topway',
    categoria: 'suplemento',
    marca: 'Topway',
    porcao_padrao: 40,
    unidade: 'g',
    calorias: 150,
    proteinas: 10,
    carboidratos: 18,
    gorduras: 5,
    porcoes_comuns: [
      { label: '1 cookie', grams: 40, isDefault: true },
      { label: '2 cookies', grams: 80 }
    ],
    is_favorite: true
  },
  {
    id: 'food-alfajor-topway',
    nome: 'Alfajor Proteico Topway',
    categoria: 'suplemento',
    marca: 'Topway',
    porcao_padrao: 55,
    unidade: 'g',
    calorias: 190,
    proteinas: 12,
    carboidratos: 22,
    gorduras: 7,
    porcoes_comuns: [
      { label: '1 alfajor', grams: 55, isDefault: true },
      { label: '2 alfajores', grams: 110 }
    ],
    is_favorite: true
  },
  {
    id: 'food-barra-proteina',
    nome: 'Barra de proteína',
    categoria: 'suplemento',
    porcao_padrao: 45,
    unidade: 'g',
    calorias: 170,
    proteinas: 15,
    carboidratos: 18,
    gorduras: 5
  },

  // ====== BEBIDAS ======
  {
    id: 'food-suco-laranja',
    nome: 'Suco de laranja natural',
    categoria: 'bebida',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 90,
    proteinas: 1,
    carboidratos: 21,
    gorduras: 0
  },
  {
    id: 'food-cafe',
    nome: 'Café sem açúcar',
    categoria: 'bebida',
    porcao_padrao: 100,
    unidade: 'ml',
    calorias: 2,
    proteinas: 0.1,
    carboidratos: 0,
    gorduras: 0,
    porcoes_comuns: [
      { label: '1 xícara', grams: 100, isDefault: true },
      { label: '1 caneca', grams: 200 },
      { label: '½ xícara', grams: 50 }
    ]
  },
  {
    id: 'food-agua-coco',
    nome: 'Água de coco',
    categoria: 'bebida',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 40,
    proteinas: 0.4,
    carboidratos: 9,
    gorduras: 0
  },
  {
    id: 'food-cha-verde',
    nome: 'Chá verde',
    categoria: 'bebida',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 2,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0
  },
  {
    id: 'food-suco-uva',
    nome: 'Suco de uva integral',
    categoria: 'bebida',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 120,
    proteinas: 0.5,
    carboidratos: 30,
    gorduras: 0
  },
  {
    id: 'food-refrigerante',
    nome: 'Refrigerante',
    categoria: 'bebida',
    porcao_padrao: 350,
    unidade: 'ml',
    calorias: 140,
    proteinas: 0,
    carboidratos: 35,
    gorduras: 0
  },
  {
    id: 'food-refrigerante-zero',
    nome: 'Refrigerante zero',
    categoria: 'bebida',
    porcao_padrao: 350,
    unidade: 'ml',
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0
  },
  {
    id: 'food-isotônico',
    nome: 'Isotônico',
    categoria: 'bebida',
    porcao_padrao: 500,
    unidade: 'ml',
    calorias: 120,
    proteinas: 0,
    carboidratos: 30,
    gorduras: 0
  },
  {
    id: 'food-leite-vegetal',
    nome: 'Leite de amêndoas',
    categoria: 'bebida',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 40,
    proteinas: 1,
    carboidratos: 3,
    gorduras: 3
  },
  {
    id: 'food-leite-aveia',
    nome: 'Leite de aveia',
    categoria: 'bebida',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 100,
    proteinas: 2,
    carboidratos: 16,
    gorduras: 3
  },
  {
    id: 'food-smoothie-fruta',
    nome: 'Smoothie de frutas',
    categoria: 'bebida',
    porcao_padrao: 300,
    unidade: 'ml',
    calorias: 150,
    proteinas: 2,
    carboidratos: 35,
    gorduras: 0.5
  },
  {
    id: 'food-cafe-leite',
    nome: 'Café com leite',
    categoria: 'bebida',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 65,
    proteinas: 3,
    carboidratos: 5,
    gorduras: 3
  },

  // ====== SUCOS NATURAIS ======
  {
    id: 'food-suco-abacaxi',
    nome: 'Suco de abacaxi natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 80,
    proteinas: 0.5,
    carboidratos: 20,
    gorduras: 0,
    fibras: 0.5,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 },
      { label: '½ copo', grams: 100 }
    ]
  },
  {
    id: 'food-suco-manga',
    nome: 'Suco de manga natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 110,
    proteinas: 0.6,
    carboidratos: 27,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-maracuja',
    nome: 'Suco de maracujá natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 90,
    proteinas: 1,
    carboidratos: 22,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-acerola',
    nome: 'Suco de acerola natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 46,
    proteinas: 0.8,
    carboidratos: 11,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-goiaba',
    nome: 'Suco de goiaba natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 88,
    proteinas: 0.8,
    carboidratos: 22,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-melancia',
    nome: 'Suco de melancia natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 60,
    proteinas: 0.6,
    carboidratos: 15,
    gorduras: 0.1,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-morango',
    nome: 'Suco de morango natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 70,
    proteinas: 0.6,
    carboidratos: 17,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-limao',
    nome: 'Suco de limão (limonada)',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 50,
    proteinas: 0.3,
    carboidratos: 12,
    gorduras: 0.1,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-caju',
    nome: 'Suco de caju natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 78,
    proteinas: 0.6,
    carboidratos: 19,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-tangerina',
    nome: 'Suco de tangerina natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 86,
    proteinas: 0.8,
    carboidratos: 21,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-mamao',
    nome: 'Suco de mamão natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 68,
    proteinas: 0.6,
    carboidratos: 17,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-melao',
    nome: 'Suco de melão natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 64,
    proteinas: 0.8,
    carboidratos: 16,
    gorduras: 0.1,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-cenoura',
    nome: 'Suco de cenoura natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 80,
    proteinas: 1.2,
    carboidratos: 18,
    gorduras: 0.3,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-beterraba',
    nome: 'Suco de beterraba natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 72,
    proteinas: 1.4,
    carboidratos: 17,
    gorduras: 0.1,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-verde',
    nome: 'Suco verde (couve, maçã, limão)',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 55,
    proteinas: 1.2,
    carboidratos: 13,
    gorduras: 0.2,
    fibras: 1.5,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-detox',
    nome: 'Suco detox (gengibre, limão, pepino)',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 35,
    proteinas: 0.6,
    carboidratos: 8,
    gorduras: 0.1,
    fibras: 1,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-graviola',
    nome: 'Suco de graviola natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 100,
    proteinas: 1,
    carboidratos: 25,
    gorduras: 0.3,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-cupuacu',
    nome: 'Suco de cupuaçu natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 92,
    proteinas: 1.2,
    carboidratos: 22,
    gorduras: 0.4,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-jabuticaba',
    nome: 'Suco de jabuticaba natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 86,
    proteinas: 0.6,
    carboidratos: 21,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },
  {
    id: 'food-suco-pitanga',
    nome: 'Suco de pitanga natural',
    categoria: 'suco',
    porcao_padrao: 200,
    unidade: 'ml',
    calorias: 66,
    proteinas: 0.8,
    carboidratos: 16,
    gorduras: 0.2,
    porcoes_comuns: [
      { label: '1 copo (200ml)', grams: 200, isDefault: true },
      { label: '1 copo grande (300ml)', grams: 300 }
    ]
  },

  // ====== PRATOS PRONTOS ======
  {
    id: 'food-lasanha-bolonhesa',
    nome: 'Lasanha à bolonhesa',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 400,
    proteinas: 18,
    carboidratos: 35,
    gorduras: 20
  },
  {
    id: 'food-strogonoff-frango',
    nome: 'Strogonoff de frango',
    categoria: 'prato_pronto',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 320,
    proteinas: 22,
    carboidratos: 8,
    gorduras: 23
  },
  {
    id: 'food-strogonoff-carne',
    nome: 'Strogonoff de carne',
    categoria: 'prato_pronto',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 350,
    proteinas: 25,
    carboidratos: 8,
    gorduras: 25
  },
  {
    id: 'food-feijoada',
    nome: 'Feijoada completa',
    categoria: 'prato_pronto',
    porcao_padrao: 300,
    unidade: 'g',
    calorias: 420,
    proteinas: 24,
    carboidratos: 30,
    gorduras: 22
  },
  {
    id: 'food-escondidinho',
    nome: 'Escondidinho de carne seca',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 380,
    proteinas: 20,
    carboidratos: 35,
    gorduras: 18
  },
  {
    id: 'food-moqueca',
    nome: 'Moqueca de peixe',
    categoria: 'prato_pronto',
    porcao_padrao: 300,
    unidade: 'g',
    calorias: 350,
    proteinas: 25,
    carboidratos: 12,
    gorduras: 22
  },
  {
    id: 'food-bobó-camarao',
    nome: 'Bobó de camarão',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 380,
    proteinas: 20,
    carboidratos: 25,
    gorduras: 22
  },
  {
    id: 'food-frango-parmegiana',
    nome: 'Frango à parmegiana',
    categoria: 'prato_pronto',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 420,
    proteinas: 28,
    carboidratos: 20,
    gorduras: 26
  },
  {
    id: 'food-bife-parmegiana',
    nome: 'Bife à parmegiana',
    categoria: 'prato_pronto',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 450,
    proteinas: 30,
    carboidratos: 18,
    gorduras: 28
  },
  {
    id: 'food-risoto-camarao',
    nome: 'Risoto de camarão',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 380,
    proteinas: 18,
    carboidratos: 45,
    gorduras: 14
  },
  {
    id: 'food-risoto-funghi',
    nome: 'Risoto de funghi',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 350,
    proteinas: 10,
    carboidratos: 48,
    gorduras: 12
  },
  {
    id: 'food-macarrao-carbonara',
    nome: 'Macarrão à carbonara',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 480,
    proteinas: 18,
    carboidratos: 45,
    gorduras: 25
  },
  {
    id: 'food-macarrao-bolonhesa',
    nome: 'Macarrão à bolonhesa',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 380,
    proteinas: 16,
    carboidratos: 48,
    gorduras: 14
  },
  {
    id: 'food-frango-xadrez',
    nome: 'Frango xadrez',
    categoria: 'prato_pronto',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 280,
    proteinas: 25,
    carboidratos: 12,
    gorduras: 15
  },
  {
    id: 'food-yakisoba',
    nome: 'Yakisoba',
    categoria: 'prato_pronto',
    porcao_padrao: 300,
    unidade: 'g',
    calorias: 420,
    proteinas: 18,
    carboidratos: 55,
    gorduras: 14
  },
  {
    id: 'food-sushi-combo',
    nome: 'Combo de sushi (10 peças)',
    categoria: 'prato_pronto',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 350,
    proteinas: 18,
    carboidratos: 50,
    gorduras: 8
  },
  {
    id: 'food-temaki-salmao',
    nome: 'Temaki de salmão',
    categoria: 'prato_pronto',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 280,
    proteinas: 15,
    carboidratos: 35,
    gorduras: 10
  },
  {
    id: 'food-pizza-calabresa',
    nome: 'Pizza de calabresa (fatia)',
    categoria: 'prato_pronto',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 280,
    proteinas: 12,
    carboidratos: 28,
    gorduras: 14
  },
  {
    id: 'food-pizza-frango-catupiry',
    nome: 'Pizza frango com catupiry (fatia)',
    categoria: 'prato_pronto',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 270,
    proteinas: 14,
    carboidratos: 26,
    gorduras: 12
  },
  {
    id: 'food-baiao-dois',
    nome: 'Baião de dois',
    categoria: 'prato_pronto',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 280,
    proteinas: 12,
    carboidratos: 35,
    gorduras: 10
  },
  {
    id: 'food-galinhada',
    nome: 'Galinhada',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 350,
    proteinas: 22,
    carboidratos: 40,
    gorduras: 12
  },
  {
    id: 'food-virado-paulista',
    nome: 'Virado à paulista',
    categoria: 'prato_pronto',
    porcao_padrao: 300,
    unidade: 'g',
    calorias: 420,
    proteinas: 20,
    carboidratos: 45,
    gorduras: 18
  },
  {
    id: 'food-acaraje',
    nome: 'Acarajé',
    categoria: 'prato_pronto',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 350,
    proteinas: 10,
    carboidratos: 30,
    gorduras: 22
  },
  {
    id: 'food-tacos',
    nome: 'Tacos (2 unidades)',
    categoria: 'prato_pronto',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 320,
    proteinas: 14,
    carboidratos: 28,
    gorduras: 18
  },
  {
    id: 'food-burrito',
    nome: 'Burrito',
    categoria: 'prato_pronto',
    porcao_padrao: 250,
    unidade: 'g',
    calorias: 450,
    proteinas: 18,
    carboidratos: 50,
    gorduras: 20
  },
  {
    id: 'food-sanduiche-natural',
    nome: 'Sanduíche natural de frango',
    categoria: 'prato_pronto',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 250,
    proteinas: 18,
    carboidratos: 25,
    gorduras: 8
  },
  {
    id: 'food-sanduiche-atum',
    nome: 'Sanduíche de atum',
    categoria: 'prato_pronto',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 280,
    proteinas: 20,
    carboidratos: 26,
    gorduras: 10
  },
  {
    id: 'food-torta-frango',
    nome: 'Torta de frango (fatia)',
    categoria: 'prato_pronto',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 260,
    proteinas: 12,
    carboidratos: 22,
    gorduras: 14
  },
  {
    id: 'food-quiche-lorraine',
    nome: 'Quiche lorraine (fatia)',
    categoria: 'prato_pronto',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 290,
    proteinas: 10,
    carboidratos: 18,
    gorduras: 20
  },
  {
    id: 'food-omelete-recheada',
    nome: 'Omelete recheada',
    categoria: 'prato_pronto',
    porcao_padrao: 150,
    unidade: 'g',
    calorias: 280,
    proteinas: 18,
    carboidratos: 4,
    gorduras: 22
  },

  // ====== SOBREMESAS ======
  {
    id: 'food-pudim-leite',
    nome: 'Pudim de leite condensado',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 270,
    proteinas: 5,
    carboidratos: 42,
    gorduras: 9
  },
  {
    id: 'food-brigadeiro',
    nome: 'Brigadeiro',
    categoria: 'sobremesa',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 80,
    proteinas: 1,
    carboidratos: 12,
    gorduras: 3
  },
  {
    id: 'food-beijinho',
    nome: 'Beijinho',
    categoria: 'sobremesa',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 85,
    proteinas: 1,
    carboidratos: 13,
    gorduras: 3.5
  },
  {
    id: 'food-mousse-chocolate',
    nome: 'Mousse de chocolate',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 280,
    proteinas: 4,
    carboidratos: 28,
    gorduras: 18
  },
  {
    id: 'food-mousse-maracuja',
    nome: 'Mousse de maracujá',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 220,
    proteinas: 3,
    carboidratos: 30,
    gorduras: 10
  },
  {
    id: 'food-pavê',
    nome: 'Pavê de chocolate',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 320,
    proteinas: 5,
    carboidratos: 38,
    gorduras: 16
  },
  {
    id: 'food-torta-limao',
    nome: 'Torta de limão',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 310,
    proteinas: 4,
    carboidratos: 40,
    gorduras: 15
  },
  {
    id: 'food-bolo-chocolate',
    nome: 'Bolo de chocolate',
    categoria: 'sobremesa',
    porcao_padrao: 80,
    unidade: 'g',
    calorias: 280,
    proteinas: 4,
    carboidratos: 38,
    gorduras: 13
  },
  {
    id: 'food-bolo-cenoura',
    nome: 'Bolo de cenoura com cobertura',
    categoria: 'sobremesa',
    porcao_padrao: 80,
    unidade: 'g',
    calorias: 260,
    proteinas: 4,
    carboidratos: 35,
    gorduras: 12
  },
  {
    id: 'food-bolo-milho',
    nome: 'Bolo de milho',
    categoria: 'sobremesa',
    porcao_padrao: 80,
    unidade: 'g',
    calorias: 220,
    proteinas: 4,
    carboidratos: 32,
    gorduras: 9
  },
  {
    id: 'food-cheesecake',
    nome: 'Cheesecake',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 350,
    proteinas: 6,
    carboidratos: 28,
    gorduras: 24
  },
  {
    id: 'food-brownie',
    nome: 'Brownie',
    categoria: 'sobremesa',
    porcao_padrao: 60,
    unidade: 'g',
    calorias: 250,
    proteinas: 3,
    carboidratos: 30,
    gorduras: 14
  },
  {
    id: 'food-petit-gateau',
    nome: 'Petit gâteau',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 380,
    proteinas: 5,
    carboidratos: 35,
    gorduras: 24
  },
  {
    id: 'food-tiramisu',
    nome: 'Tiramisù',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 290,
    proteinas: 5,
    carboidratos: 28,
    gorduras: 18
  },
  {
    id: 'food-romeu-julieta',
    nome: 'Romeu e Julieta (goiabada com queijo)',
    categoria: 'sobremesa',
    porcao_padrao: 60,
    unidade: 'g',
    calorias: 180,
    proteinas: 4,
    carboidratos: 25,
    gorduras: 7
  },
  {
    id: 'food-sorvete-chocolate',
    nome: 'Sorvete de chocolate',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 220,
    proteinas: 4,
    carboidratos: 28,
    gorduras: 11
  },
  {
    id: 'food-acai-sem-adicoes',
    nome: 'Açaí puro (sem adições)',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 70,
    proteinas: 1,
    carboidratos: 6,
    gorduras: 5
  },
  {
    id: 'food-banana-split',
    nome: 'Banana split',
    categoria: 'sobremesa',
    porcao_padrao: 200,
    unidade: 'g',
    calorias: 400,
    proteinas: 5,
    carboidratos: 55,
    gorduras: 18
  },
  {
    id: 'food-cocada',
    nome: 'Cocada',
    categoria: 'sobremesa',
    porcao_padrao: 40,
    unidade: 'g',
    calorias: 160,
    proteinas: 1,
    carboidratos: 22,
    gorduras: 8
  },
  {
    id: 'food-quindim',
    nome: 'Quindim',
    categoria: 'sobremesa',
    porcao_padrao: 40,
    unidade: 'g',
    calorias: 130,
    proteinas: 2,
    carboidratos: 18,
    gorduras: 6
  },
  {
    id: 'food-paçoca',
    nome: 'Paçoca',
    categoria: 'sobremesa',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 95,
    proteinas: 3,
    carboidratos: 10,
    gorduras: 5
  },
  {
    id: 'food-pe-moleque',
    nome: 'Pé de moleque',
    categoria: 'sobremesa',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 135,
    proteinas: 3,
    carboidratos: 15,
    gorduras: 7
  },
  {
    id: 'food-rapadura',
    nome: 'Rapadura',
    categoria: 'sobremesa',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 110,
    proteinas: 0.5,
    carboidratos: 27,
    gorduras: 0
  },
  {
    id: 'food-cupcake',
    nome: 'Cupcake',
    categoria: 'sobremesa',
    porcao_padrao: 60,
    unidade: 'g',
    calorias: 200,
    proteinas: 2,
    carboidratos: 30,
    gorduras: 8
  },
  {
    id: 'food-creme-brulee',
    nome: 'Crème brûlée',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 280,
    proteinas: 4,
    carboidratos: 25,
    gorduras: 18
  },
  {
    id: 'food-panna-cotta',
    nome: 'Panna cotta',
    categoria: 'sobremesa',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 250,
    proteinas: 3,
    carboidratos: 22,
    gorduras: 17
  },

  // ====== MOLHOS E CONDIMENTOS ======
  {
    id: 'food-molho-branco',
    nome: 'Molho branco (bechamel)',
    categoria: 'condimento',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 75,
    proteinas: 2,
    carboidratos: 5,
    gorduras: 5
  },
  {
    id: 'food-molho-pesto',
    nome: 'Molho pesto',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 150,
    proteinas: 3,
    carboidratos: 2,
    gorduras: 15
  },
  {
    id: 'food-molho-barbecue',
    nome: 'Molho barbecue',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 55,
    proteinas: 0.3,
    carboidratos: 13,
    gorduras: 0.2
  },
  {
    id: 'food-molho-teriyaki',
    nome: 'Molho teriyaki',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'ml',
    calorias: 50,
    proteinas: 2,
    carboidratos: 10,
    gorduras: 0
  },
  {
    id: 'food-molho-cesar',
    nome: 'Molho caesar',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 130,
    proteinas: 1,
    carboidratos: 1,
    gorduras: 14
  },
  {
    id: 'food-molho-rosé',
    nome: 'Molho rosé',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 85,
    proteinas: 0.5,
    carboidratos: 3,
    gorduras: 8
  },
  {
    id: 'food-tahine',
    nome: 'Tahine',
    categoria: 'condimento',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 90,
    proteinas: 2.5,
    carboidratos: 3,
    gorduras: 8
  },
  {
    id: 'food-hummus',
    nome: 'Hummus',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 55,
    proteinas: 2,
    carboidratos: 5,
    gorduras: 3
  },
  {
    id: 'food-guacamole',
    nome: 'Guacamole',
    categoria: 'condimento',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 75,
    proteinas: 1,
    carboidratos: 4,
    gorduras: 7
  },
  {
    id: 'food-chimichurri',
    nome: 'Chimichurri',
    categoria: 'condimento',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 65,
    proteinas: 0.5,
    carboidratos: 1,
    gorduras: 7
  },
  {
    id: 'food-molho-tártaro',
    nome: 'Molho tártaro',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 145,
    proteinas: 0.3,
    carboidratos: 2,
    gorduras: 15
  },
  {
    id: 'food-molho-ranch',
    nome: 'Molho ranch',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 130,
    proteinas: 0.5,
    carboidratos: 2,
    gorduras: 13
  },
  {
    id: 'food-molho-pimenta',
    nome: 'Molho de pimenta',
    categoria: 'condimento',
    porcao_padrao: 5,
    unidade: 'ml',
    calorias: 1,
    proteinas: 0.1,
    carboidratos: 0.2,
    gorduras: 0
  },
  {
    id: 'food-wasabi',
    nome: 'Wasabi',
    categoria: 'condimento',
    porcao_padrao: 5,
    unidade: 'g',
    calorias: 15,
    proteinas: 0.3,
    carboidratos: 2.5,
    gorduras: 0.5
  },
  {
    id: 'food-gengibre-conserva',
    nome: 'Gengibre em conserva (gari)',
    categoria: 'condimento',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 10,
    proteinas: 0.1,
    carboidratos: 2,
    gorduras: 0
  },
  {
    id: 'food-missô',
    nome: 'Pasta de missô',
    categoria: 'condimento',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 30,
    proteinas: 2,
    carboidratos: 4,
    gorduras: 1
  },
  {
    id: 'food-vinagrete',
    nome: 'Vinagrete',
    categoria: 'condimento',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 25,
    proteinas: 0.5,
    carboidratos: 5,
    gorduras: 0.5
  },
  {
    id: 'food-molho-madeira',
    nome: 'Molho madeira',
    categoria: 'condimento',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 45,
    proteinas: 1,
    carboidratos: 5,
    gorduras: 2
  },
  {
    id: 'food-molho-gorgonzola',
    nome: 'Molho de gorgonzola',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 95,
    proteinas: 3,
    carboidratos: 1,
    gorduras: 9
  },
  {
    id: 'food-molho-4-queijos',
    nome: 'Molho 4 queijos',
    categoria: 'condimento',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 110,
    proteinas: 4,
    carboidratos: 2,
    gorduras: 10
  },
  {
    id: 'food-azeite-trufas',
    nome: 'Azeite trufado',
    categoria: 'condimento',
    porcao_padrao: 10,
    unidade: 'ml',
    calorias: 88,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 10
  },
  {
    id: 'food-pate-azeitona',
    nome: 'Patê de azeitona',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 85,
    proteinas: 1,
    carboidratos: 2,
    gorduras: 8
  },
  {
    id: 'food-pate-atum',
    nome: 'Patê de atum',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 75,
    proteinas: 5,
    carboidratos: 1,
    gorduras: 6
  },
  {
    id: 'food-azeitona-verde',
    nome: 'Azeitona verde',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 45,
    proteinas: 0.3,
    carboidratos: 1,
    gorduras: 4.5
  },
  {
    id: 'food-azeitona-preta',
    nome: 'Azeitona preta',
    categoria: 'condimento',
    porcao_padrao: 30,
    unidade: 'g',
    calorias: 35,
    proteinas: 0.3,
    carboidratos: 2,
    gorduras: 3
  },
  {
    id: 'food-palmito',
    nome: 'Palmito em conserva',
    categoria: 'condimento',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 15,
    proteinas: 1.5,
    carboidratos: 2,
    gorduras: 0.3
  },
  {
    id: 'food-alcaparra',
    nome: 'Alcaparra',
    categoria: 'condimento',
    porcao_padrao: 10,
    unidade: 'g',
    calorias: 2,
    proteinas: 0.2,
    carboidratos: 0.4,
    gorduras: 0
  },

  // ====== OUTROS ======
  {
    id: 'food-mel',
    nome: 'Mel',
    categoria: 'outros',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 64,
    proteinas: 0.1,
    carboidratos: 17,
    gorduras: 0
  },
  {
    id: 'food-acucar',
    nome: 'Açúcar refinado',
    categoria: 'outros',
    porcao_padrao: 10,
    unidade: 'g',
    calorias: 40,
    proteinas: 0,
    carboidratos: 10,
    gorduras: 0
  },
  {
    id: 'food-chocolate-amargo',
    nome: 'Chocolate amargo 70%',
    categoria: 'outros',
    porcao_padrao: 25,
    unidade: 'g',
    calorias: 140,
    proteinas: 2,
    carboidratos: 12,
    gorduras: 10
  },
  {
    id: 'food-geleia',
    nome: 'Geleia de frutas',
    categoria: 'outros',
    porcao_padrao: 20,
    unidade: 'g',
    calorias: 50,
    proteinas: 0,
    carboidratos: 13,
    gorduras: 0
  },
  {
    id: 'food-molho-tomate',
    nome: 'Molho de tomate',
    categoria: 'outros',
    porcao_padrao: 50,
    unidade: 'g',
    calorias: 20,
    proteinas: 0.5,
    carboidratos: 4,
    gorduras: 0.2
  },
  {
    id: 'food-catchup',
    nome: 'Catchup',
    categoria: 'outros',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 18,
    proteinas: 0.2,
    carboidratos: 4,
    gorduras: 0
  },
  {
    id: 'food-mostarda',
    nome: 'Mostarda',
    categoria: 'outros',
    porcao_padrao: 10,
    unidade: 'g',
    calorias: 6,
    proteinas: 0.4,
    carboidratos: 0.5,
    gorduras: 0.3
  },
  {
    id: 'food-maionese',
    nome: 'Maionese',
    categoria: 'outros',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 100,
    proteinas: 0.1,
    carboidratos: 0.5,
    gorduras: 11
  },
  {
    id: 'food-maionese-light',
    nome: 'Maionese light',
    categoria: 'outros',
    porcao_padrao: 15,
    unidade: 'g',
    calorias: 35,
    proteinas: 0.1,
    carboidratos: 2,
    gorduras: 3
  },
  {
    id: 'food-vinagre',
    nome: 'Vinagre',
    categoria: 'outros',
    porcao_padrao: 15,
    unidade: 'ml',
    calorias: 3,
    proteinas: 0,
    carboidratos: 0.5,
    gorduras: 0
  },
  {
    id: 'food-shoyu',
    nome: 'Shoyu (molho de soja)',
    categoria: 'outros',
    porcao_padrao: 15,
    unidade: 'ml',
    calorias: 10,
    proteinas: 1,
    carboidratos: 1,
    gorduras: 0,
    sodio: 900
  },
  {
    id: 'food-sorvete',
    nome: 'Sorvete de creme',
    categoria: 'outros',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 200,
    proteinas: 3,
    carboidratos: 24,
    gorduras: 11
  },
  {
    id: 'food-pizza-mussarela',
    nome: 'Pizza de mussarela (fatia)',
    categoria: 'outros',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 260,
    proteinas: 10,
    carboidratos: 28,
    gorduras: 12
  },
  {
    id: 'food-hamburguer',
    nome: 'Hambúrguer bovino',
    categoria: 'outros',
    porcao_padrao: 90,
    unidade: 'g',
    calorias: 230,
    proteinas: 17,
    carboidratos: 0,
    gorduras: 18
  },
  {
    id: 'food-batata-frita',
    nome: 'Batata frita',
    categoria: 'outros',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 312,
    proteinas: 3.4,
    carboidratos: 41,
    gorduras: 15
  },
  {
    id: 'food-coxinha',
    nome: 'Coxinha',
    categoria: 'outros',
    porcao_padrao: 80,
    unidade: 'g',
    calorias: 220,
    proteinas: 7,
    carboidratos: 22,
    gorduras: 12
  },
  {
    id: 'food-pastel',
    nome: 'Pastel de carne',
    categoria: 'outros',
    porcao_padrao: 100,
    unidade: 'g',
    calorias: 280,
    proteinas: 8,
    carboidratos: 28,
    gorduras: 15
  },
  {
    id: 'food-pao-queijo',
    nome: 'Pão de queijo',
    categoria: 'outros',
    porcao_padrao: 40,
    unidade: 'g',
    calorias: 120,
    proteinas: 3,
    carboidratos: 14,
    gorduras: 6,
    porcoes_comuns: [
      { label: '1 pão de queijo', grams: 40, isDefault: true },
      { label: '2 pães de queijo', grams: 80 },
      { label: '3 pães de queijo', grams: 120 }
    ]
  },
  {
    id: 'food-acai-completo',
    nome: 'Açaí tigela completo',
    categoria: 'outros',
    porcao_padrao: 300,
    unidade: 'g',
    calorias: 450,
    proteinas: 5,
    carboidratos: 70,
    gorduras: 18
  }
]

// Função para calcular macros de um item
function calculateItemMacros(food: Food, quantidade: number): Omit<MealItem, 'id' | 'food_id' | 'food'> {
  const multiplier = quantidade / food.porcao_padrao
  return {
    quantidade,
    calorias: Math.round(food.calorias * multiplier),
    proteinas: Math.round(food.proteinas * multiplier * 10) / 10,
    carboidratos: Math.round(food.carboidratos * multiplier * 10) / 10,
    gorduras: Math.round(food.gorduras * multiplier * 10) / 10
  }
}

// Criar item de refeição
function createMealItem(foodId: string, quantidade: number): MealItem | null {
  const food = mockFoods.find(f => f.id === foodId)
  if (!food) return null

  const macros = calculateItemMacros(food, quantidade)
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    food_id: foodId,
    food,
    ...macros
  }
}

// Gerar refeições do dia atual
export function getTodayMeals(): Meal[] {
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentHour = new Date().getHours()
  const meals: Meal[] = []

  // Café da manhã (concluído se for depois das 7h)
  if (currentHour >= 6) {
    const cafeManha: MealItem[] = [
      createMealItem('food-banana', 100),
      createMealItem('food-granola', 30),
      createMealItem('food-yopro', 160),
      createMealItem('food-nuts', 40)
    ].filter(Boolean) as MealItem[]

    const cafeTotals = cafeManha.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )

    meals.push({
      id: `meal-${today}-cafe`,
      user_id: 'mock-user',
      tipo: 'cafe_manha',
      data: today,
      horario_planejado: '06:30',
      horario_real: currentHour >= 7 ? '06:35' : undefined,
      status: currentHour >= 7 ? 'concluido' : 'pendente',
      itens: cafeManha,
      ...cafeTotals,
      calorias_total: cafeTotals.calorias,
      proteinas_total: cafeTotals.proteinas,
      carboidratos_total: cafeTotals.carboidratos,
      gorduras_total: cafeTotals.gorduras,
      created_at: new Date().toISOString()
    })
  }

  // Lanche da manhã (concluído se for depois das 10h)
  if (currentHour >= 10) {
    const lancheManha: MealItem[] = [
      createMealItem('food-cookie-topway', 40)
    ].filter(Boolean) as MealItem[]

    const lancheTotals = lancheManha.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )

    meals.push({
      id: `meal-${today}-lanche-manha`,
      user_id: 'mock-user',
      tipo: 'lanche_manha',
      data: today,
      horario_planejado: '10:00',
      horario_real: currentHour >= 10 ? '09:55' : undefined,
      status: currentHour >= 10 ? 'concluido' : 'pendente',
      itens: lancheManha,
      ...lancheTotals,
      calorias_total: lancheTotals.calorias,
      proteinas_total: lancheTotals.proteinas,
      carboidratos_total: lancheTotals.carboidratos,
      gorduras_total: lancheTotals.gorduras,
      created_at: new Date().toISOString()
    })
  }

  // Almoço (concluído se for depois das 12h)
  if (currentHour >= 11) {
    const almoco: MealItem[] = [
      createMealItem('food-arroz', 150),
      createMealItem('food-feijao', 100),
      createMealItem('food-contrafile', 180),
      createMealItem('food-brocolis', 100),
      createMealItem('food-suco-laranja', 200),
      createMealItem('food-alfajor-topway', 55)
    ].filter(Boolean) as MealItem[]

    const almocoTotals = almoco.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )

    meals.push({
      id: `meal-${today}-almoco`,
      user_id: 'mock-user',
      tipo: 'almoco',
      data: today,
      horario_planejado: '11:30',
      horario_real: currentHour >= 12 ? '11:45' : undefined,
      status: currentHour >= 12 ? 'concluido' : 'pendente',
      itens: almoco,
      ...almocoTotals,
      calorias_total: almocoTotals.calorias,
      proteinas_total: almocoTotals.proteinas,
      carboidratos_total: almocoTotals.carboidratos,
      gorduras_total: almocoTotals.gorduras,
      notas: 'Alfajor antes das 12h!',
      created_at: new Date().toISOString()
    })
  }

  // Lanche da tarde
  if (currentHour >= 17) {
    const lancheTarde: MealItem[] = [
      createMealItem('food-banana', 100),
      createMealItem('food-amendoim', 20)
    ].filter(Boolean) as MealItem[]

    const lancheTardeTotals = lancheTarde.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )

    meals.push({
      id: `meal-${today}-lanche-tarde`,
      user_id: 'mock-user',
      tipo: 'lanche_tarde',
      data: today,
      horario_planejado: '17:00',
      horario_real: currentHour >= 17 ? '17:10' : undefined,
      status: currentHour >= 17 ? 'concluido' : 'pendente',
      itens: lancheTarde,
      ...lancheTardeTotals,
      calorias_total: lancheTardeTotals.calorias,
      proteinas_total: lancheTardeTotals.proteinas,
      carboidratos_total: lancheTardeTotals.carboidratos,
      gorduras_total: lancheTardeTotals.gorduras,
      notas: 'Lanche da tarde',
      created_at: new Date().toISOString()
    })
  }

  // Jantar
  if (currentHour >= 20) {
    const jantar: MealItem[] = [
      createMealItem('food-frango', 150),
      createMealItem('food-arroz', 100),
      createMealItem('food-brocolis', 150),
      createMealItem('food-salada', 100)
    ].filter(Boolean) as MealItem[]

    const jantarTotals = jantar.reduce(
      (acc, item) => ({
        calorias: acc.calorias + item.calorias,
        proteinas: acc.proteinas + item.proteinas,
        carboidratos: acc.carboidratos + item.carboidratos,
        gorduras: acc.gorduras + item.gorduras
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )

    meals.push({
      id: `meal-${today}-jantar`,
      user_id: 'mock-user',
      tipo: 'jantar',
      data: today,
      horario_planejado: '20:00',
      horario_real: currentHour >= 21 ? '20:15' : undefined,
      status: currentHour >= 21 ? 'concluido' : 'pendente',
      itens: jantar,
      ...jantarTotals,
      calorias_total: jantarTotals.calorias,
      proteinas_total: jantarTotals.proteinas,
      carboidratos_total: jantarTotals.carboidratos,
      gorduras_total: jantarTotals.gorduras,
      created_at: new Date().toISOString()
    })
  }

  return meals
}

// Buscar alimento por ID
export function getFoodById(id: string): Food | null {
  return mockFoods.find(f => f.id === id) || null
}

// Buscar alimentos por termo
export function searchFoods(query: string): Food[] {
  const lowerQuery = query.toLowerCase()
  return mockFoods.filter(
    f =>
      f.nome.toLowerCase().includes(lowerQuery) ||
      f.marca?.toLowerCase().includes(lowerQuery) ||
      f.categoria.toLowerCase().includes(lowerQuery)
  )
}

// Obter alimentos favoritos
export function getFavoriteFoods(): Food[] {
  return mockFoods.filter(f => f.is_favorite)
}

// Obter alimentos por categoria
export function getFoodsByCategory(categoria: string): Food[] {
  return mockFoods.filter(f => f.categoria === categoria)
}

// Obter refeição por ID
export function getMealById(id: string): Meal | null {
  const meals = getTodayMeals()
  return meals.find(m => m.id === id) || null
}

// Calcular totais diários
export function calculateDailyTotals(meals: Meal[]): NutritionTotals {
  return meals.reduce(
    (totals, meal) => ({
      calorias: totals.calorias + meal.calorias_total,
      proteinas: totals.proteinas + meal.proteinas_total,
      carboidratos: totals.carboidratos + meal.carboidratos_total,
      gorduras: totals.gorduras + meal.gorduras_total
    }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  )
}

// Gerar histórico de alimentação (últimos 7 dias)
export function getNutritionHistory(): Array<{ date: string; totals: NutritionTotals }> {
  const history = []

  for (let i = 0; i < 7; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const variation = 0.85 + Math.random() * 0.3 // 85% a 115% da meta

    history.push({
      date,
      totals: {
        calorias: Math.round(2500 * variation),
        proteinas: Math.round(170 * variation),
        carboidratos: Math.round(280 * variation),
        gorduras: Math.round(85 * variation)
      }
    })
  }

  return history
}

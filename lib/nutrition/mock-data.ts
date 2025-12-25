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
    gorduras: 0.1
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
    gorduras: 1
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
    gorduras: 2
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
    gorduras: 0
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
    fibras: 3
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
    gorduras: 0.2
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
    gorduras: 0.2
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
    gorduras: 0
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
    gorduras: 6
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
      notas: 'Sem laticínios (Revolade)',
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

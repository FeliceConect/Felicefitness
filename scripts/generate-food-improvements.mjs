#!/usr/bin/env node
/**
 * Gera migrations de dados para melhorar o banco de alimentos:
 *   1. nome_popular      — nome amigável exibido na busca (a partir do nome técnico TACO/TBCA)
 *   2. categorias        — correção das categorias TBCA mal classificadas no seed
 *   3. porcoes_comuns    — porções caseiras para alimentos que só têm 100g
 *
 * Determinístico (sem IA): lê supabase/seed-global-foods.sql e escreve
 * 3 arquivos em supabase/migrations/. Rodar:  node scripts/generate-food-improvements.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SEED = join(ROOT, 'supabase', 'seed-global-foods.sql')
const OUT_DIR = join(ROOT, 'supabase', 'migrations')

// ---------------------------------------------------------------------------
// Parse do seed
// ---------------------------------------------------------------------------

/** Faz o parse de uma linha `('a', 'b', ...),` respeitando '' como escape. */
function parseValuesLine(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('(')) return null
  const fields = []
  let i = 1
  while (i < trimmed.length) {
    const ch = trimmed[i]
    if (ch === "'") {
      // string literal
      let value = ''
      i++
      while (i < trimmed.length) {
        if (trimmed[i] === "'" && trimmed[i + 1] === "'") { value += "'"; i += 2; continue }
        if (trimmed[i] === "'") { i++; break }
        value += trimmed[i]; i++
      }
      fields.push(value)
    } else if (ch === ',' || ch === ' ') {
      i++
    } else if (ch === ')') {
      break
    } else {
      // literal numérico / NULL
      let value = ''
      while (i < trimmed.length && ![',', ')'].includes(trimmed[i])) { value += trimmed[i]; i++ }
      fields.push(value.trim())
    }
  }
  return fields
}

const seedText = readFileSync(SEED, 'utf8')
const foods = []
for (const line of seedText.split('\n')) {
  const fields = parseValuesLine(line)
  if (!fields || fields.length < 6) continue
  const [nome, nomeBusca, categoria, source, sourceId] = fields
  if (!['taco', 'tbca'].includes(source)) continue
  foods.push({ nome, nomeBusca, categoria, source, sourceId })
}
console.log(`Parseados ${foods.length} alimentos do seed`)

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const sqlEscape = (s) => s.replace(/'/g, "''")
const removeAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

// ---------------------------------------------------------------------------
// 1. nome_popular
// ---------------------------------------------------------------------------

function buildNomePopular(nome) {
  let s = nome.trim()
  // remove conteúdo entre parênteses (listas de receita), inclusive aninhados
  let prev
  do { prev = s; s = s.replace(/\([^()]*\)/g, ' ') } while (s !== prev)
  // remove aspas tipográficas de cultivar: ´Rio´ → Rio
  s = s.replace(/[´`’]/g, '')
  // expande abreviações TBCA
  s = s.replace(/\bc\/\s*/gi, 'com ').replace(/\bs\/\s*/gi, 'sem ').replace(/\bp\/\s*/gi, 'para ')
  // segmenta por vírgula
  let segments = s.split(',').map(seg => seg.trim()).filter(Boolean)
  // remove nome científico: segmento não-inicial capitalizado com 2+ palavras
  // cuja 2ª palavra é minúscula (padrão gênero+espécie, ex: "Citrus reticulata")
  segments = segments.filter((seg, idx) => {
    if (idx === 0) return true
    const words = seg.split(/\s+/)
    if (words.length >= 2 && /^[A-Z]/.test(words[0]) && /^[a-z]/.test(words[1])) return false
    return true
  })
  if (segments.length === 0) return null
  // limita tamanho descartando segmentos do fim (mantém ao menos o primeiro)
  let result = segments.join(' ')
  while (result.length > 70 && segments.length > 1) {
    segments.pop()
    result = segments.join(' ')
  }
  result = result.replace(/\s+/g, ' ').trim()
  if (!result) return null
  return result.charAt(0).toUpperCase() + result.slice(1)
}

// ---------------------------------------------------------------------------
// 2. Correção de categorias (TBCA)
// ---------------------------------------------------------------------------

const CATEGORY_RULES = [
  // [categoria, [palavras-chave que devem aparecer no PRIMEIRO segmento do nome]]
  ['suplemento', ['whey', 'creatina', 'bcaa', 'glutamina', 'albumina', 'caseina', 'hipercalorico', 'suplemento', 'proteina isolada', 'proteina concentrada']],
  ['bebida', ['suco', 'refrigerante', 'refresco', 'cafe', 'cha ', 'cha,', 'chas', 'agua de coco', 'agua tonica', 'cerveja', 'vinho', 'cachaca', 'vodka', 'whisky', 'bebida', 'guarana', 'mate', 'capuccino', 'cappuccino', 'achocolatado', 'vitamina de', 'batida', 'caipirinha', 'licor', 'energetico', 'isotonico']],
  ['laticinio', ['leite', 'queijo', 'iogurte', 'requeijao', 'coalhada', 'ricota', 'cream cheese', 'creme de leite', 'leite fermentado', 'bebida lactea', 'petit suisse', 'muçarela', 'mucarela', 'mussarela', 'parmesao', 'provolone', 'minas frescal', 'catupiry']],
  ['fruta', ['abacate', 'abacaxi', 'acai', 'acerola', 'ameixa', 'amora', 'banana', 'caju', 'caqui', 'carambola', 'cereja', 'ciriguela', 'cupuacu', 'damasco', 'figo', 'framboesa', 'fruta-pao', 'goiaba', 'graviola', 'jabuticaba', 'jaca', 'jambo', 'kiwi', 'laranja', 'limao', 'lichia', 'maca,', 'maca ', 'mamao', 'manga,', 'manga ', 'mangaba', 'maracuja', 'melancia', 'melao', 'mexerica', 'morango', 'nectarina', 'pera,', 'pera ', 'pessego', 'pinha', 'pitanga', 'roma', 'tamarindo', 'tangerina', 'umbu', 'uva,', 'uva ', 'seriguela', 'sapoti', 'atemoia', 'fruta do conde', 'salada de frutas']],
  ['sobremesa', ['bolo', 'torta doce', 'pudim', 'brigadeiro', 'beijinho', 'quindim', 'doce de', 'goiabada', 'marmelada', 'cocada', 'pacoca', 'pe de moleque', 'rapadura', 'sorvete', 'picole', 'mousse', 'gelatina', 'chocolate', 'bombom', 'brownie', 'churros', 'sagu', 'canjica', 'arroz doce', 'manjar', 'pave', 'creme de papaia', 'compota', 'geleia', 'mel,', 'mel ', 'melado', 'acucar']],
  ['gordura', ['azeite', 'oleo', 'manteiga', 'margarina', 'banha', 'gordura vegetal', 'maionese', 'creme vegetal', 'castanha', 'amendoim', 'noz,', 'nozes', 'amendoa', 'avela', 'macadamia', 'pistache', 'semente de', 'gergelim', 'chia', 'linhaca', 'pasta de amendoim']],
  ['condimento', ['molho', 'ketchup', 'catchup', 'mostarda', 'shoyu', 'vinagre', 'tempero', 'caldo de', 'pimenta', 'sal,', 'sal ', 'alho,', 'alho ', 'cebola,', 'oregano', 'colorau', 'acafrao', 'canela', 'cravo', 'salsa,', 'salsinha', 'cebolinha', 'coentro', 'louro', 'manjericao', 'alecrim', 'curry', 'cominho', 'gengibre', 'wasabi', 'extrato de tomate', 'azeitona']],
  ['proteina', ['carne', 'frango', 'galinha', 'peru', 'chester', 'pato', 'boi', 'bovina', 'suina', 'porco', 'leitao', 'bacalhau', 'peixe', 'anchova', 'atum', 'sardinha', 'salmao', 'tilapia', 'merluza', 'pescada', 'corvina', 'dourado', 'linguado', 'robalo', 'tucunare', 'pintado', 'traira', 'cacao', 'camarao', 'lagosta', 'caranguejo', 'siri', 'lula', 'polvo', 'marisco', 'mexilhao', 'ostra', 'ovo,', 'ovo ', 'ovos', 'figado', 'coracao', 'moela', 'bucho', 'dobradinha', 'linguica', 'salsicha', 'presunto', 'mortadela', 'salame', 'copa,', 'bacon', 'toucinho', 'costela', 'picanha', 'alcatra', 'contrafile', 'file mignon', 'maminha', 'fraldinha', 'patinho', 'coxao', 'lagarto', 'acem', 'musculo', 'cupim', 'paleta', 'lombo', 'pernil', 'hamburguer de carne', 'almondega', 'carneiro', 'cordeiro', 'cabrito', 'bufalo', 'avestruz', 'ra,', 'javali', 'peito de']],
  ['carboidrato', ['arroz', 'pao', 'macarrao', 'massa', 'lasanha', 'nhoque', 'espaguete', 'talharim', 'batata', 'mandioca', 'aipim', 'macaxeira', 'inhame', 'cara,', 'milho', 'fuba', 'polenta', 'angu', 'cuscuz', 'tapioca', 'farinha', 'farofa', 'aveia', 'granola', 'cereal', 'biscoito', 'bolacha', 'torrada', 'wafer', 'panqueca', 'crepe', 'pipoca', 'canjiquinha', 'quirera', 'trigo', 'centeio', 'cevada', 'quinoa', 'amaranto', 'feijao', 'lentilha', 'grao de bico', 'ervilha,', 'ervilha ', 'soja,', 'soja ', 'fava,', 'orelha-de-padre', 'pastel', 'esfiha', 'coxinha', 'pao de queijo', 'pamonha', 'beiju', 'bisnaguinha', 'croissant', 'brioche', 'salgadinho', 'polvilho', 'amido']],
  ['vegetal', ['abobora', 'abobrinha', 'acelga', 'agriao', 'aipo', 'alcachofra', 'alface', 'almeirao', 'aspargo', 'berinjela', 'bertalha', 'beterraba', 'brocolis', 'cenoura', 'chicoria', 'chuchu', 'couve', 'espinafre', 'jilo', 'maxixe', 'mostarda folha', 'nabo', 'palmito', 'pepino', 'pimentao', 'quiabo', 'rabanete', 'repolho', 'rucula', 'salada,', 'salada ', 'taioba', 'tomate', 'vagem', 'legumes', 'verduras', 'cogumelo', 'champignon', 'shitake', 'shimeji', 'serralha', 'caruru', 'ora-pro-nobis']],
  ['prato_pronto', ['feijoada', 'estrogonofe', 'strogonoff', 'yakisoba', 'risoto', 'paella', 'moqueca', 'bobo de', 'vatapa', 'acaraje', 'baiao de dois', 'arroz carreteiro', 'galinhada', 'rabada', 'mocoto', 'sarapatel', 'buchada', 'dobradinha com', 'sopa', 'caldo verde', 'canja', 'pizza', 'hamburguer,', 'cheeseburger', 'cachorro quente', 'sanduiche', 'misto quente', 'bauru', 'x-', 'quibe', 'kibe', 'esfirra', 'empada', 'torta salgada', 'enroladinho', 'papa de', 'papinha', 'sushi', 'sashimi', 'temaki', 'tabule', 'charuto de', 'panelada', 'virado', 'tutu de', 'escondidinho', 'fricasse', 'lanche,', 'wrap', 'taco,', 'burrito', 'nuggets', 'steak de frango']],
]

function proposeCategory(nomeBusca) {
  const firstSegment = removeAccents(nomeBusca.split(',')[0] || '').toLowerCase().trim() + ','
  // prioridade: prato_pronto e sobremesa antes das demais para preparações
  for (const [cat, keywords] of CATEGORY_RULES) {
    for (const kw of keywords) {
      const needle = removeAccents(kw).toLowerCase()
      if (needle.endsWith(',') || needle.endsWith(' ')) {
        if (firstSegment.startsWith(needle) || firstSegment.includes(' ' + needle)) return cat
      } else if (firstSegment.includes(needle)) {
        return cat
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// 3. Porções caseiras
// ---------------------------------------------------------------------------

const P = (label, grams, isDefault = false) =>
  isDefault ? { label, grams, isDefault: true } : { label, grams }

const PORTION_RULES = [
  // [teste sobre nome_busca sem acento, porções]
  { test: n => n.startsWith('pao, frances') || n.startsWith('pao frances'), portions: [P('1 unidade (50g)', 50, true), P('meia unidade (25g)', 25), P('2 unidades (100g)', 100)] },
  { test: n => n.startsWith('pao') && n.includes('forma'), portions: [P('1 fatia (25g)', 25, true), P('2 fatias (50g)', 50), P('3 fatias (75g)', 75)] },
  { test: n => n.startsWith('pao de queijo'), portions: [P('1 unidade pequena (20g)', 20), P('1 unidade média (45g)', 45, true), P('3 unidades (135g)', 135)] },
  { test: n => n.startsWith('pao'), portions: [P('1 fatia (30g)', 30), P('1 unidade (50g)', 50, true), P('2 unidades (100g)', 100)] },
  { test: n => n.startsWith('arroz') && (n.includes('cozid') || n.includes('c/ ') || n.includes('com ')), portions: [P('2 colheres de sopa (50g)', 50), P('1 escumadeira (90g)', 90, true), P('2 escumadeiras (180g)', 180)] },
  { test: n => (n.startsWith('feijao') || n.startsWith('lentilha') || n.startsWith('grao de bico') || n.startsWith('ervilha')) && n.includes('cozid'), portions: [P('meia concha (45g)', 45), P('1 concha (90g)', 90, true), P('2 conchas (180g)', 180)] },
  { test: n => n.startsWith('feijoada'), portions: [P('meia concha (70g)', 70), P('1 concha (140g)', 140, true), P('2 conchas (280g)', 280)] },
  { test: n => (n.startsWith('macarrao') || n.startsWith('espaguete') || n.startsWith('talharim') || n.startsWith('massa') || n.startsWith('nhoque')) && (n.includes('cozid') || n.includes('molho')), portions: [P('1 pegador (110g)', 110, true), P('2 pegadores (220g)', 220)] },
  { test: n => n.startsWith('lasanha'), portions: [P('1 pedaço pequeno (120g)', 120), P('1 pedaço médio (200g)', 200, true)] },
  { test: n => n.startsWith('ovo') && !n.includes('codorna'), portions: [P('1 unidade média (50g)', 50, true), P('2 unidades (100g)', 100), P('3 unidades (150g)', 150)] },
  { test: n => n.startsWith('ovo') && n.includes('codorna'), portions: [P('1 unidade (10g)', 10, true), P('3 unidades (30g)', 30), P('5 unidades (50g)', 50)] },
  { test: n => /^(frango|galinha|peru|chester)/.test(n) && n.includes('file'), portions: [P('1 filé pequeno (80g)', 80), P('1 filé médio (120g)', 120, true), P('1 filé grande (180g)', 180)] },
  { test: n => /^(frango|galinha)/.test(n) && (n.includes('coxa') || n.includes('sobrecoxa')), portions: [P('1 unidade (65g)', 65, true), P('2 unidades (130g)', 130)] },
  { test: n => /^(frango|galinha|peru|chester)/.test(n), portions: [P('1 porção pequena (80g)', 80), P('1 porção média (120g)', 120, true), P('1 porção grande (180g)', 180)] },
  { test: n => /^carne/.test(n) && n.includes('moida'), portions: [P('2 colheres de sopa (60g)', 60), P('4 colheres de sopa (120g)', 120, true)] },
  { test: n => /^(carne|picanha|alcatra|contrafile|file mignon|maminha|fraldinha|patinho|coxao|lagarto|acem|musculo|cupim|costela|lombo|pernil|paleta|bife)/.test(n), portions: [P('1 bife pequeno (80g)', 80), P('1 bife médio (120g)', 120, true), P('1 bife grande (180g)', 180)] },
  { test: n => /^(peixe|tilapia|merluza|pescada|salmao|atum|sardinha|bacalhau|anchova|corvina|linguado|robalo|dourado|pintado|cacao)/.test(n), portions: [P('1 filé pequeno (100g)', 100), P('1 filé médio (150g)', 150, true)] },
  { test: n => n.startsWith('banana'), portions: [P('1 unidade pequena (55g)', 55), P('1 unidade média (70g)', 70, true), P('1 unidade grande (90g)', 90)] },
  { test: n => n.startsWith('maca'), portions: [P('1 unidade pequena (90g)', 90), P('1 unidade média (130g)', 130, true)] },
  { test: n => n.startsWith('laranja') || n.startsWith('mexerica') || n.startsWith('tangerina'), portions: [P('1 unidade média (130g)', 130, true), P('2 unidades (260g)', 260)] },
  { test: n => n.startsWith('mamao'), portions: [P('1 fatia média (170g)', 170, true), P('meio mamão papaia (155g)', 155)] },
  { test: n => n.startsWith('melancia') || n.startsWith('melao') || n.startsWith('abacaxi'), portions: [P('1 fatia média (100g)', 100, true), P('2 fatias (200g)', 200)] },
  { test: n => n.startsWith('manga'), portions: [P('meia unidade (140g)', 140, true), P('1 unidade média (280g)', 280)] },
  { test: n => n.startsWith('uva'), portions: [P('1 cacho pequeno (100g)', 100, true), P('10 bagos (80g)', 80)] },
  { test: n => n.startsWith('morango'), portions: [P('5 unidades (60g)', 60), P('10 unidades (120g)', 120, true)] },
  { test: n => n.startsWith('pera') || n.startsWith('pessego') || n.startsWith('kiwi') || n.startsWith('caqui') || n.startsWith('goiaba'), portions: [P('1 unidade média (110g)', 110, true)] },
  { test: n => n.startsWith('abacate'), portions: [P('2 colheres de sopa (60g)', 60, true), P('meia unidade (100g)', 100)] },
  { test: n => n.startsWith('leite') && !n.includes('po') && !n.includes('condensado') && !n.includes('coco'), portions: [P('meio copo (100ml)', 100), P('1 copo (200ml)', 200, true), P('1 xícara (240ml)', 240)] },
  { test: n => n.startsWith('leite') && n.includes('po'), portions: [P('1 colher de sopa (10g)', 10), P('2 colheres de sopa (20g)', 20, true)] },
  { test: n => n.startsWith('leite condensado') || n.startsWith('creme de leite') || n.startsWith('doce de leite'), portions: [P('1 colher de sopa (20g)', 20, true), P('2 colheres de sopa (40g)', 40)] },
  { test: n => n.startsWith('iogurte') || n.startsWith('coalhada') || n.startsWith('leite fermentado'), portions: [P('1 pote (100g)', 100), P('1 copo (170g)', 170, true), P('1 pote grande (200g)', 200)] },
  { test: n => n.startsWith('queijo') || n.startsWith('mucarela') || n.startsWith('mussarela') || n.startsWith('ricota') || n.startsWith('parmesao') || n.startsWith('provolone'), portions: [P('1 fatia fina (15g)', 15), P('1 fatia média (30g)', 30, true), P('2 fatias (60g)', 60)] },
  { test: n => n.startsWith('requeijao') || n.startsWith('cream cheese'), portions: [P('1 colher de sopa (30g)', 30, true), P('1 ponta de faca (10g)', 10)] },
  { test: n => n.startsWith('suco') || n.startsWith('refresco') || n.startsWith('refrigerante') || n.startsWith('agua de coco') || n.startsWith('cha') || n.startsWith('mate') || n.startsWith('guarana'), portions: [P('meio copo (100ml)', 100), P('1 copo (200ml)', 200, true), P('1 copo grande (300ml)', 300)] },
  { test: n => n.startsWith('cafe'), portions: [P('1 xícara pequena (50ml)', 50, true), P('1 xícara (100ml)', 100), P('1 caneca (200ml)', 200)] },
  { test: n => n.startsWith('biscoito') || n.startsWith('bolacha'), portions: [P('1 unidade (8g)', 8), P('3 unidades (24g)', 24, true), P('5 unidades (40g)', 40)] },
  { test: n => n.startsWith('torrada'), portions: [P('1 unidade (8g)', 8), P('2 unidades (16g)', 16, true)] },
  { test: n => n.startsWith('bolo') || n.startsWith('torta'), portions: [P('1 fatia pequena (60g)', 60), P('1 fatia média (90g)', 90, true)] },
  { test: n => n.startsWith('pizza'), portions: [P('1 fatia (125g)', 125, true), P('2 fatias (250g)', 250)] },
  { test: n => n.startsWith('sopa') || n.startsWith('caldo') || n.startsWith('canja'), portions: [P('1 concha (130g)', 130), P('1 prato fundo (300g)', 300, true)] },
  { test: n => n.startsWith('batata') && (n.includes('frita') || n.includes('palha')), portions: [P('1 porção pequena (60g)', 60), P('1 porção média (100g)', 100, true)] },
  { test: n => (n.startsWith('batata') || n.startsWith('mandioca') || n.startsWith('aipim') || n.startsWith('macaxeira') || n.startsWith('inhame') || n.startsWith('cara')) && n.includes('cozid'), portions: [P('1 unidade pequena (70g)', 70), P('1 unidade média (140g)', 140, true)] },
  { test: n => n.startsWith('pure'), portions: [P('1 colher de servir (80g)', 80, true), P('2 colheres de servir (160g)', 160)] },
  { test: n => n.startsWith('farofa') || n.startsWith('farinha de mandioca'), portions: [P('1 colher de sopa (15g)', 15), P('2 colheres de sopa (30g)', 30, true)] },
  { test: n => n.startsWith('aveia') || n.startsWith('granola') || n.startsWith('cereal matinal'), portions: [P('1 colher de sopa (15g)', 15), P('2 colheres de sopa (30g)', 30, true), P('meia xícara (45g)', 45)] },
  { test: n => n.startsWith('tapioca') || n.startsWith('beiju'), portions: [P('1 unidade média (80g)', 80, true)] },
  { test: n => n.startsWith('cuscuz'), portions: [P('1 fatia média (135g)', 135, true)] },
  { test: n => n.startsWith('azeite') || n.startsWith('oleo'), portions: [P('1 fio (4g)', 4), P('1 colher de sopa (13g)', 13, true)] },
  { test: n => n.startsWith('manteiga') || n.startsWith('margarina'), portions: [P('1 ponta de faca (5g)', 5, true), P('1 colher de sopa (14g)', 14)] },
  { test: n => n.startsWith('maionese'), portions: [P('1 colher de sopa (15g)', 15, true)] },
  { test: n => n.startsWith('acucar') || n.startsWith('mel') || n.startsWith('melado'), portions: [P('1 colher de chá (5g)', 5), P('1 colher de sopa (14g)', 14, true)] },
  { test: n => n.startsWith('castanha') || n.startsWith('amendoim') || n.startsWith('noz') || n.startsWith('amendoa') || n.startsWith('avela') || n.startsWith('pistache') || n.startsWith('macadamia'), portions: [P('1 punhado (30g)', 30, true), P('meia xícara (60g)', 60)] },
  { test: n => n.startsWith('pasta de amendoim'), portions: [P('1 colher de sopa (15g)', 15, true), P('2 colheres de sopa (30g)', 30)] },
  { test: n => n.startsWith('pipoca'), portions: [P('1 xícara (10g)', 10), P('1 saco pequeno (25g)', 25, true)] },
  { test: n => n.startsWith('chocolate') || n.startsWith('bombom'), portions: [P('1 quadradinho (10g)', 10), P('2 quadradinhos (20g)', 20, true), P('1 barra pequena (45g)', 45)] },
  { test: n => n.startsWith('sorvete') || n.startsWith('picole'), portions: [P('1 bola (60g)', 60, true), P('2 bolas (120g)', 120)] },
  { test: n => n.startsWith('pudim') || n.startsWith('mousse') || n.startsWith('gelatina') || n.startsWith('manjar') || n.startsWith('pave'), portions: [P('1 fatia/porção (100g)', 100, true)] },
  { test: n => n.startsWith('brigadeiro') || n.startsWith('beijinho') || n.startsWith('cocada') || n.startsWith('quindim'), portions: [P('1 unidade (20g)', 20, true), P('2 unidades (40g)', 40)] },
  { test: n => n.startsWith('hamburguer') || n.startsWith('cheeseburger') || n.startsWith('x-'), portions: [P('1 unidade (150g)', 150, true)] },
  { test: n => n.startsWith('coxinha') || n.startsWith('pastel') || n.startsWith('esfiha') || n.startsWith('esfirra') || n.startsWith('empada') || n.startsWith('quibe') || n.startsWith('kibe'), portions: [P('1 unidade pequena (40g)', 40), P('1 unidade média (80g)', 80, true)] },
  { test: n => n.startsWith('panqueca') || n.startsWith('crepe'), portions: [P('1 unidade (80g)', 80, true), P('2 unidades (160g)', 160)] },
  { test: n => n.startsWith('sushi') || n.startsWith('temaki') || n.startsWith('sashimi'), portions: [P('4 unidades (100g)', 100, true), P('8 unidades (200g)', 200)] },
  { test: n => n.startsWith('salada') || n.startsWith('alface') || n.startsWith('rucula') || n.startsWith('agriao') || n.startsWith('repolho'), portions: [P('1 pegador (40g)', 40), P('1 prato de sobremesa (80g)', 80, true)] },
  { test: n => n.startsWith('tomate'), portions: [P('3 fatias (45g)', 45), P('1 unidade média (110g)', 110, true)] },
  { test: n => (n.startsWith('cenoura') || n.startsWith('beterraba') || n.startsWith('abobrinha') || n.startsWith('chuchu') || n.startsWith('abobora') || n.startsWith('berinjela') || n.startsWith('couve') || n.startsWith('brocolis') || n.startsWith('espinafre') || n.startsWith('vagem') || n.startsWith('quiabo') || n.startsWith('jilo')) && (n.includes('cozid') || n.includes('refogad')), portions: [P('2 colheres de sopa (50g)', 50), P('4 colheres de sopa (100g)', 100, true)] },
  // fallback para preparações prontas (estrogonofe, risoto, moqueca, ensopados...)
  { test: n => /(estrogonofe|strogonoff|risoto|moqueca|yakisoba|escondidinho|fricasse|ensopad|refogad|guisad|cozido,|a milanesa|a parmegiana|assad|grelhad)/.test(n), portions: [P('1 porção pequena (150g)', 150), P('1 porção média (250g)', 250, true), P('1 porção grande (350g)', 350)] },
]

function proposePortions(nomeBusca) {
  const n = removeAccents(nomeBusca).toLowerCase()
  for (const rule of PORTION_RULES) {
    if (rule.test(n)) return rule.portions
  }
  return null
}

// ---------------------------------------------------------------------------
// Geração dos arquivos
// ---------------------------------------------------------------------------

// 1. nome_popular
let nomePopularCount = 0
const nomePopularLines = [
  '-- FASE 2 — nome_popular: nome amigável exibido na busca.',
  '-- Gerado por scripts/generate-food-improvements.mjs (determinístico, sem IA).',
  '-- Idempotente: UPDATE por (source, source_id).',
  '',
]
for (const f of foods) {
  const popular = buildNomePopular(f.nome)
  if (!popular) continue
  const popularBusca = removeAccents(popular).toLowerCase()
  nomePopularLines.push(
    `UPDATE fitness_global_foods SET nome_popular = '${sqlEscape(popular)}', nome_popular_busca = '${sqlEscape(popularBusca)}' WHERE source = '${f.source}' AND source_id = '${sqlEscape(f.sourceId)}';`
  )
  nomePopularCount++
}
writeFileSync(join(OUT_DIR, '20260720_fase2_nome_popular_data.sql'), nomePopularLines.join('\n') + '\n')
console.log(`nome_popular: ${nomePopularCount} updates`)

// 2. categorias
let catCount = 0
const catStats = {}
const catLines = [
  '-- FASE 2 — correção de categorias TBCA mal classificadas no seed',
  '-- (ex: pão de queijo era "vegetal", anchova era "condimento").',
  '-- Gerado por scripts/generate-food-improvements.mjs. Regras por palavra-chave',
  '-- no primeiro segmento do nome. Idempotente: UPDATE por (source, source_id).',
  '',
]
for (const f of foods) {
  if (f.source !== 'tbca') continue
  const proposed = proposeCategory(f.nomeBusca)
  if (!proposed || proposed === f.categoria) continue
  catLines.push(
    `UPDATE fitness_global_foods SET categoria = '${proposed}' WHERE source = 'tbca' AND source_id = '${sqlEscape(f.sourceId)}'; -- ${f.nome.slice(0, 60).replace(/\n/g, ' ')} (era ${f.categoria})`
  )
  catStats[`${f.categoria} -> ${proposed}`] = (catStats[`${f.categoria} -> ${proposed}`] || 0) + 1
  catCount++
}
writeFileSync(join(OUT_DIR, '20260720_fase2_categorias_data.sql'), catLines.join('\n') + '\n')
console.log(`categorias: ${catCount} correções`)

// 3. porções
let portionCount = 0
const portionLines = [
  '-- FASE 2 — porções caseiras para alimentos que só tinham 100g.',
  '-- Gerado por scripts/generate-food-improvements.mjs (regras por palavra-chave,',
  '-- baseadas no Dicionário de Medidas Caseiras / Guia Alimentar).',
  '-- Idempotente: só preenche onde porcoes_comuns IS NULL.',
  '',
]
for (const f of foods) {
  const portions = proposePortions(f.nomeBusca)
  if (!portions) continue
  const json = JSON.stringify(portions)
  portionLines.push(
    `UPDATE fitness_global_foods SET porcoes_comuns = '${sqlEscape(json)}'::jsonb WHERE source = '${f.source}' AND source_id = '${sqlEscape(f.sourceId)}' AND porcoes_comuns IS NULL;`
  )
  portionCount++
}
writeFileSync(join(OUT_DIR, '20260720_fase2_porcoes_data.sql'), portionLines.join('\n') + '\n')
console.log(`porções: ${portionCount} updates`)

console.log('\nResumo de correções de categoria:')
for (const [k, v] of Object.entries(catStats).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${k}: ${v}`)
}

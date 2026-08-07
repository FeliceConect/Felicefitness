# Cardio no treino — intensidade declarada x tempo declarado

Levantamento de **todos os 108 cardios pontuados** da base (abril/2026 → 07/08/2026).

> **Importante:** nem a duração nem a intensidade são medidas pelo app. As duas são
> **digitadas pelo próprio paciente** no modal de registro de cardio
> (`hooks/use-save-workout.ts`: `tempo_segundos = duracao_minutos * 60`).
> Não existe cronômetro, sensor, nem validação. O campo "minutos" abaixo é o que
> a pessoa declarou, não o que ela fez.

## 1. Por intensidade declarada

| Intensidade | Pontos | Créditos | Total pts | Min | Média | Máx | Pts por minuto |
|---|---|---|---|---|---|---|---|
| Leve | 3 | 1 | 3 | 20 min | 20.0 min | 20 min | 0.15 |
| Moderado | 5 | 97 | 485 | 5 min | 19.0 min | 55 min | 0.32 |
| Intenso | 8 | 8 | 64 | 3 min | 13.4 min | 30 min | 1.07 |
| Máximo | 10 | 2 | 20 | 3 min | 3.0 min | 3 min | 3.33 |

## 2. Sessões com mais de um cardio no mesmo treino

Aqui aparece o efeito do circuito aeróbico: cada movimento registrado
separadamente, cada um com sua própria duração declarada.

| Paciente | Data | Cardios | Minutos declarados (soma) | Pontos |
|---|---|---|---|---|
| Edjane Queiroz | 08/07/2026 | 5 | 110 min ⚠️ | 25 |
| Crislene Rodrigues | 13/07/2026 | 4 | 105 min ⚠️ | 20 |
| Edjane Queiroz | 03/07/2026 | 5 | 100 min ⚠️ | 25 |
| Edjane Queiroz | 05/08/2026 | 4 | 80 min ⚠️ | 20 |
| Edjane Queiroz | 03/08/2026 | 4 | 80 min ⚠️ | 20 |
| Edjane Queiroz | 31/07/2026 | 4 | 80 min ⚠️ | 20 |
| Edjane Queiroz | 29/07/2026 | 4 | 80 min ⚠️ | 20 |
| Edjane Queiroz | 22/07/2026 | 4 | 80 min ⚠️ | 20 |
| Edjane Queiroz | 13/07/2026 | 4 | 80 min ⚠️ | 20 |
| Edjane Queiroz | 10/07/2026 | 4 | 80 min ⚠️ | 20 |
| Edjane Queiroz | 01/07/2026 | 4 | 80 min ⚠️ | 18 |
| Edjane Queiroz | 20/07/2026 | 3 | 60 min ⚠️ | 15 |
| Edjane Queiroz | 24/07/2026 | 2 | 40 min | 10 |
| Edjane Queiroz | 17/07/2026 | 2 | 40 min | 10 |
| Edjane Queiroz | 06/07/2026 | 2 | 40 min | 10 |
| Leonardo Felice | 04/05/2026 | 2 | 32 min | 13 |

## 3. Tabela completa

Ordenada da mais recente para a mais antiga. A coluna **pts/min** mostra o quanto
cada minuto declarado rendeu — quanto maior, mais o sistema pagou por menos tempo.

| Data | Paciente | Exercício | Intensidade | Minutos | Pontos | pts/min |
|---|---|---|---|---|---|---|
| 05/08/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 05/08/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 05/08/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 05/08/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 05/08/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 03/08/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 03/08/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 03/08/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 03/08/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 03/08/2026 | Karla Garcia | Bicicleta | Moderado | 20 | +5 | 0.25 |
| 01/08/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 31/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 31/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 31/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 31/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 31/07/2026 | Kauê Sayão | Esteira | Moderado | 15 | +5 | 0.33 |
| 30/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 29/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 29/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 29/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 29/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 29/07/2026 | Karla Garcia | Bicicleta | Intenso | 10 | +8 | 0.80 |
| 29/07/2026 | Kauê Sayão | Esteira | Intenso | 30 | +8 | 0.27 |
| 28/07/2026 | Karla Garcia | Esteira | Moderado | 10 | +5 | 0.50 |
| 25/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 24/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 24/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 23/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 22/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 22/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 22/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 22/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 22/07/2026 | Kauê Sayão | Esteira | Moderado | 55 | +5 | 0.09 |
| 21/07/2026 | Karla Garcia | Esteira | Moderado | 10 | +5 | 0.50 |
| 21/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 20/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 20/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 20/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 18/07/2026 | Leonardo Felice | Esteira | Máximo | 3 | +10 | 3.33 ⚠️ |
| 17/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 17/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 14/07/2026 | Karla Garcia | Esteira | Moderado | 10 | +5 | 0.50 |
| 13/07/2026 | Crislene Rodrigues | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 13/07/2026 | Crislene Rodrigues | Corrida Estacionária Joelho Alto | Moderado | 45 | +5 | 0.11 |
| 13/07/2026 | Crislene Rodrigues | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 13/07/2026 | Crislene Rodrigues | Tesoura | Moderado | 20 | +5 | 0.25 |
| 13/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 13/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 13/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 13/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 13/07/2026 | Leonardo Felice | Esteira | Máximo | 3 | +10 | 3.33 ⚠️ |
| 13/07/2026 | Marinella Felice | Outro | Moderado | 15 | +5 | 0.33 |
| 11/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 10/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 10/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 10/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 10/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 10/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 08/07/2026 | Edjane Queiroz | Bicicleta | Moderado | 30 | +5 | 0.17 |
| 08/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 08/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 08/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 08/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 08/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 07/07/2026 | Kauê Sayão | Esteira | Moderado | 20 | +5 | 0.25 |
| 06/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 06/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 06/07/2026 | Marinella Felice | Esteira | Moderado | 15 | +5 | 0.33 |
| 03/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 03/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 03/07/2026 | Edjane Queiroz | Esteira | Moderado | 20 | +5 | 0.25 |
| 03/07/2026 | Edjane Queiroz | Polichinelo | Moderado | 20 | +5 | 0.25 |
| 03/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 03/07/2026 | Leonardo Felice | Esteira | Intenso | 3 | +8 | 2.67 ⚠️ |
| 02/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 02/07/2026 | Leonardo Felice | Esteira | Intenso | 3 | +8 | 2.67 ⚠️ |
| 01/07/2026 | Edjane Queiroz | Corrida Estacionária (Calcanhar para trás) | Moderado | 20 | +5 | 0.25 |
| 01/07/2026 | Edjane Queiroz | Corrida Estacionária Joelho Alto | Moderado | 20 | +5 | 0.25 |
| 01/07/2026 | Edjane Queiroz | Polichinelo | Leve | 20 | +3 | 0.15 |
| 01/07/2026 | Edjane Queiroz | Tesoura | Moderado | 20 | +5 | 0.25 |
| 01/07/2026 | Kauê Sayão | Esteira | Moderado | 30 | +5 | 0.17 |
| 01/07/2026 | Leonardo Felice | Esteira | Moderado | 9 | +5 | 0.56 |
| 26/06/2026 | Karla Garcia | Bicicleta | Moderado | 10 | +5 | 0.50 |
| 25/06/2026 | Leonardo Felice | Esteira | Moderado | 6 | +5 | 0.83 |
| 24/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 22/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 22/06/2026 | Marinella Felice | Outro | Moderado | 20 | +5 | 0.25 |
| 19/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 18/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 16/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 13/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 12/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 11/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 10/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 09/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 08/06/2026 | Leonardo Felice | Esteira | Moderado | 8 | +5 | 0.63 |
| 05/06/2026 | Leonardo Felice | Esteira | Moderado | 17 | +5 | 0.29 |
| 28/05/2026 | Leonardo Felice | Esteira | Moderado | 16 | +5 | 0.31 |
| 23/05/2026 | Leonardo Felice | Esteira | Intenso | 15 | +8 | 0.53 |
| 19/05/2026 | Leonardo Felice | Esteira | Intenso | 14 | +8 | 0.57 |
| 09/05/2026 | Leonardo Felice | Esteira | Moderado | 13 | +5 | 0.38 |
| 06/05/2026 | Leonardo Felice | Esteira | Intenso | 12 | +8 | 0.67 |
| 05/05/2026 | Karla Garcia | Bicicleta | Moderado | 10 | +5 | 0.50 |
| 04/05/2026 | Leonardo Felice | Esteira | Moderado | 12 | +5 | 0.42 |
| 04/05/2026 | Leonardo Felice | Esteira | Intenso | 20 | +8 | 0.40 |
| 01/05/2026 | José Eduardo Felice | Elíptico | Moderado | 5 | +5 | 1.00 ⚠️ |
| 01/05/2026 | Leonardo Felice | Esteira | Moderado | 11 | +5 | 0.45 |
| 28/04/2026 | Leonardo Felice | Esteira | Moderado | 12 | +5 | 0.42 |

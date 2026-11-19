# Meu Ônibus Está Chegando - API Olho Vivo (SPTrans)

Aplicativo mobile desenvolvido em React Native com Expo para a Global Solution 2026.2 da FIAP (2º ano de Ciência da Computação — Cross-Platform Application Development).

O objetivo do aplicativo é ajudar os passageiros de transporte público em São Paulo a encontrarem pontos de ônibus próximos e receberem avisos em tempo real quando a linha desejada estiver chegando.

## Funcionalidades

- **Busca por Proximidade com GPS (`expo-location`):** Obtém a latitude e longitude atuais do usuário e ordena os pontos de ônibus da SPTrans do mais próximo ao mais distante.
- **Consulta de Previsão em Tempo Real:** Exibe as linhas que passam no ponto selecionado e calcula quantos minutos faltam para o próximo ônibus chegar.
- **Monitoramento e Alerta de Chegada (`expo-notifications`, `Alert` e `Vibration`):** Atualiza a previsão automaticamente a cada 15 segundos e dispara uma notificação local, alerta na tela e vibração quando o ônibus está a 5 minutos ou menos do ponto.

## Estrutura do Projeto

- `App.js`: Lógica principal em React, autenticação com token na API da SPTrans, leitura do GPS, cálculo de distância/tempo e controle das notificações.
- `TelaPrincipal.js`: Componentes visuais da interface (barra de busca, lista de paradas, previsão das linhas e painel de monitoramento).
- `styles.js`: Estilização da interface com `StyleSheet`.
- `integrantes.txt`: Lista dos participantes do grupo e divisão de responsabilidades.

## Como Executar o Projeto

1. **Clone este repositório:**
   ```bash
   git clone [https://github.com/kaue-sr/gs-2026-meu-onibus-sptrans.git](https://github.com/kaue-sr/gs-2026-meu-onibus-sptrans.git)
   cd gs-2026-meu-onibus-sptrans
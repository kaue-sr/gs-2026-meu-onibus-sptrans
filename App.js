
  import React, { useState, useEffect } from 'react';
import { Alert, Vibration } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import TelaPrincipal from './TelaPrincipal';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // COLE O SEU TOKEN DA SPTRANS AQUI
  const TOKEN_SPTRANS = '9600affd2d290155605c6ef0ca876287ea56960aa561b292df76f544b11d06bc';
  const URL_BASE = 'https://api.olhovivo.sptrans.com.br/v2.1';

  const [busca, setBusca] = useState('');
  const [paradas, setParadas] = useState([]);
  const [pontoSelecionado, setPontoSelecionado] = useState(null);
  const [linhasNoPonto, setLinhasNoPonto] = useState([]);
  const [gpsUsuario, setGpsUsuario] = useState(null);
  const [statusTexto, setStatusTexto] = useState('Digite uma rua ou toque em "Perto de mim".');

  const [monitorando, setMonitorando] = useState(null);
  const [jaNotificou, setJaNotificou] = useState(false);

  function calcularMinutosFaltando(horaAtual, horaPrevista) {
    const [h1, m1] = horaAtual.split(':').map(Number);
    const [h2, m2] = horaPrevista.split(':').map(Number);

    let totalAtual = h1 * 60 + m1;
    let totalPrevisto = h2 * 60 + m2;

    if (totalPrevisto < totalAtual) {
      totalPrevisto += 24 * 60;
    }

    return totalPrevisto - totalAtual;
  }

  async function obterGPS() {
    setStatusTexto('Obtendo sua localização pelo GPS...');
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Ative o GPS para encontrar os pontos perto de você.');
      return null;
    }

    const posicao = await Location.getCurrentPositionAsync({});
    setGpsUsuario(posicao.coords);
    return posicao.coords;
  }

  async function autenticarSPTrans() {
    const resposta = await fetch(`${URL_BASE}/Login/Autenticar?token=${TOKEN_SPTRANS}`, {
      method: 'POST',
      credentials: 'include',
    });
    return await resposta.json();
  }

  // Busca pontos digitados OU busca automática perto do GPS (quando termoForcado = "a")
  async function buscarPontos(termoForcado = null) {
    const termoFinal = termoForcado !== null ? termoForcado : busca.trim();

    if (termoFinal === '') {
      Alert.alert('Campo vazio', 'Digite o nome de uma rua ou toque em "Perto de mim".');
      return;
    }

    const coords = await obterGPS();
    if (!coords) return;

    setStatusTexto('Buscando pontos na SPTrans...');
    setPontoSelecionado(null);
    setLinhasNoPonto([]);

    try {
      const ok = await autenticarSPTrans();
      if (!ok) {
        Alert.alert('Erro', 'Token da SPTrans inválido ou ainda não ativado.');
        setStatusTexto('Token inválido.');
        return;
      }

      const termoCodificado = encodeURIComponent(termoFinal);
      const resposta = await fetch(`${URL_BASE}/Parada/Buscar?termosBusca=${termoCodificado}`, {
        credentials: 'include',
      });
      const lista = await resposta.json();

      if (!Array.isArray(lista) || lista.length === 0) {
        setParadas([]);
        setStatusTexto(`Nenhum ponto encontrado para "${termoFinal}".`);
        return;
      }

      const listaComDistancia = lista.map((ponto) => {
        const dLat = ponto.py - coords.latitude;
        const dLon = ponto.px - coords.longitude;
        const distancia = Math.sqrt(dLat * dLat + dLon * dLon);

        return {
          ...ponto,
          np: ponto.np && ponto.np.trim() !== '' ? ponto.np : ponto.ed,
          distancia,
        };
      });

      listaComDistancia.sort((a, b) => a.distancia - b.distancia);

      // Limita aos 25 mais próximos para não pesar a tela
      const maisProximos = listaComDistancia.slice(0, 25);

      setParadas(maisProximos);
      setStatusTexto(`Mostrando os ${maisProximos.length} pontos mais próximos do seu GPS.`);
    } catch (erro) {
      Alert.alert('Erro de conexão', 'Falha ao acessar a API: ' + erro.message);
      setStatusTexto('Falha na busca.');
    }
  }

  async function carregarPrevisaoDoPonto(ponto) {
    setPontoSelecionado(ponto);
    setStatusTexto(`Consultando horários no ponto: ${ponto.np}...`);

    try {
      await autenticarSPTrans();
      const resposta = await fetch(`${URL_BASE}/Previsao/Parada?codigoParada=${ponto.cp}`, {
        credentials: 'include',
      });
      const dados = await resposta.json();

      if (dados.p && dados.p.l && dados.p.l.length > 0) {
        const horaConsulta = dados.hr;

        const linhasFormatadas = dados.p.l.map((linha) => {
          const proximoOnibus = linha.vs[0];
          const minutos = proximoOnibus
            ? calcularMinutosFaltando(horaConsulta, proximoOnibus.t)
            : null;

          return {
            ...linha,
            horaPrevista: proximoOnibus ? proximoOnibus.t : '--:--',
            minutosFaltando: minutos,
          };
        });

        setLinhasNoPonto(linhasFormatadas);
        setStatusTexto(`Horários atualizados às ${horaConsulta}`);
      } else {
        setLinhasNoPonto([]);
        setStatusTexto('Nenhum ônibus previsto para este ponto agora.');
      }
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível buscar a previsão.');
    }
  }

  async function iniciarMonitoramento(linha) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita as notificações para receber o aviso do ônibus.');
      return;
    }

    setMonitorando({
      codigoParada: pontoSelecionado.cp,
      nomeParada: pontoSelecionado.np,
      codigoLinha: linha.cl,
      letreiro: linha.c,
      minutos: linha.minutosFaltando,
      horaPrevista: linha.horaPrevista,
    });
    setJaNotificou(false);

    Alert.alert(
      'Monitoramento Ativado!',
      `Vamos te avisar assim que a linha ${linha.c} estiver a 5 minutos ou menos do ponto.`
    );
  }

  async function dispararAvisoChegada(letreiro, nomeParada, minutos) {
    Vibration.vibrate([500, 300, 500]);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚌 Seu ônibus ${letreiro} está chegando!`,
        body: `Faltam cerca de ${minutos} min para ele chegar no ponto ${nomeParada}.`,
      },
      trigger: null,
    });

    Alert.alert(
      '🚌 Ônibus Chegando!',
      `A linha ${letreiro} chega em ${minutos} minuto(s) no ponto ${nomeParada}!`
    );
  }

  useEffect(() => {
    if (!monitorando) return;

    verificarChegada();

    const intervalo = setInterval(() => {
      verificarChegada();
    }, 15000);

    return () => clearInterval(intervalo);
  }, [monitorando, jaNotificou]);

  async function verificarChegada() {
    if (!monitorando) return;

    try {
      await autenticarSPTrans();
      const url = `${URL_BASE}/Previsao?codigoParada=${monitorando.codigoParada}&codigoLinha=${monitorando.codigoLinha}`;
      const resposta = await fetch(url, {
        credentials: 'include',
      });
      const dados = await resposta.json();

      if (dados.p && dados.p.l && dados.p.l.length > 0) {
        const horaAgora = dados.hr;
        const onibus = dados.p.l[0].vs[0];

        if (onibus) {
          const faltam = calcularMinutosFaltando(horaAgora, onibus.t);

          setMonitorando((anterior) =>
            anterior ? { ...anterior, minutos: faltam, horaPrevista: onibus.t } : null
          );

          if (faltam <= 5 && !jaNotificou) {
            setJaNotificou(true);
            dispararAvisoChegada(monitorando.letreiro, monitorando.nomeParada, faltam);
          }
        }
      }
    } catch (erro) {
      console.log('Erro ao atualizar previsão:', erro);
    }
  }

  return (
    <TelaPrincipal
      gpsUsuario={gpsUsuario}
      monitorando={monitorando}
      setMonitorando={setMonitorando}
      dispararAvisoChegada={dispararAvisoChegada}
      busca={busca}
      setBusca={setBusca}
      buscarPontos={buscarPontos}
      statusTexto={statusTexto}
      pontoSelecionado={pontoSelecionado}
      setPontoSelecionado={setPontoSelecionado}
      paradas={paradas}
      carregarPrevisaoDoPonto={carregarPrevisaoDoPonto}
      linhasNoPonto={linhasNoPonto}
      iniciarMonitoramento={iniciarMonitoramento}
    />
  );
}
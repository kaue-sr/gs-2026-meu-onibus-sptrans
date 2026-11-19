import React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import styles from './styles';

export default function TelaPrincipal({
  gpsUsuario,
  monitorando,
  setMonitorando,
  dispararAvisoChegada,
  busca,
  setBusca,
  buscarPontos,
  statusTexto,
  pontoSelecionado,
  setPontoSelecionado,
  paradas,
  carregarPrevisaoDoPonto,
  linhasNoPonto,
  iniciarMonitoramento,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🚌 Meu Ônibus Está Chegando</Text>

      {gpsUsuario && (
        <Text style={styles.gpsTexto}>
          GPS ativo: {gpsUsuario.latitude.toFixed(4)}, {gpsUsuario.longitude.toFixed(4)}
        </Text>
      )}

      {/* Card de Monitoramento Ativo */}
      {monitorando && (
        <View style={styles.cardMonitorando}>
          <Text style={styles.monitorandoTitulo}>
            Monitorando linha: {monitorando.letreiro}
          </Text>
          <Text style={styles.monitorandoInfo}>Ponto: {monitorando.nomeParada}</Text>
          <Text style={styles.monitorandoTempo}>
            Previsão: {monitorando.horaPrevista} (faltam {monitorando.minutos} min)
          </Text>

          <View style={styles.linhaBotoes}>
            <TouchableOpacity
              style={styles.botaoTestar}
              onPress={() =>
                dispararAvisoChegada(
                  monitorando.letreiro,
                  monitorando.nomeParada,
                  monitorando.minutos
                )
              }
            >
              <Text style={styles.textoBotao}>Testar Alerta Agora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => setMonitorando(null)}
            >
              <Text style={styles.textoBotao}>Parar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Barra de Busca */}
      <View style={styles.areaBusca}>
        <TextInput
          style={styles.input}
          placeholder="Buscar rua (ex: Paulista, Lapa...)"
          value={busca}
          onChangeText={setBusca}
        />
        <TouchableOpacity style={styles.botaoBuscar} onPress={() => buscarPontos()}>
          <Text style={styles.textoBotao}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Botão para achar pontos próximos automaticamente pelo GPS */}
      <TouchableOpacity style={styles.botaoGPS} onPress={() => buscarPontos('a')}>
        <Text style={styles.textoBotao}>📍 Achar pontos perto de mim pelo GPS</Text>
      </TouchableOpacity>

      <Text style={styles.status}>{statusTexto}</Text>

      {/* Lista de Paradas Próximas */}
      {!pontoSelecionado && (
        <FlatList
          data={paradas}
          keyExtractor={(item) => String(item.cp)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => carregarPrevisaoDoPonto(item)}
            >
              <Text style={styles.cardTitulo}>{item.np}</Text>
              <Text style={styles.cardSubtitulo}>{item.ed}</Text>
              <Text style={styles.link}>Ver ônibus deste ponto →</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Linhas que vão passar no Ponto Escolhido */}
      {pontoSelecionado && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => setPontoSelecionado(null)}
          >
            <Text style={styles.textoBotao}>← Voltar para pontos</Text>
          </TouchableOpacity>

          <FlatList
            data={linhasNoPonto}
            keyExtractor={(item) => String(item.cl)}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Linha {item.c}</Text>
                <Text style={styles.cardSubtitulo}>
                  Destino: {item.lt0} / {item.lt1}
                </Text>

                {item.minutosFaltando !== null ? (
                  <Text style={styles.tempoDestaque}>
                    Chega em {item.minutosFaltando} min (às {item.horaPrevista})
                  </Text>
                ) : (
                  <Text style={styles.cardSubtitulo}>Sem previsão no momento</Text>
                )}

                {item.minutosFaltando !== null && (
                  <TouchableOpacity
                    style={styles.botaoAvisar}
                    onPress={() => iniciarMonitoramento(item)}
                  >
                    <Text style={styles.textoBotao}>🔔 Avisar quando estiver chegando</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>
      )}

      <Text style={styles.rodape}>Dados fornecidos pela API Olho Vivo - SPTrans</Text>
    </View>
  );
}
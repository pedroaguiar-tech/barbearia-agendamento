import { useState, useEffect } from 'react'
import './App.css'
import { db } from './firebase'
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore'

function App() {
  const [passo, setPasso] = useState(1) // 1: Serviços, 2: Barbeiro, 3: Data/Horário, 4: Identificação, 5: Sucesso, 6: Painel Barbeiro
  const [carrinho, setCarrinho] = useState([]) 
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')

  // ☁️ BANCO DE DADOS EM TEMPO REAL NA NUVEM (FIREBASE)
  const [listaAgendamentos, setListaAgendamentos] = useState([])

  // Escuta os agendamentos da nuvem em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'agendamentos'), (snapshot) => {
      const dadosNuvem = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setListaAgendamentos(dadosNuvem)
    })

    return () => unsubscribe()
  }, [])

  // 🔒 ESTADOS DO PAINEL PRIVADO DO BARBEIRO
  const [senhaInput, setSenhaInput] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [barbeiroPainel, setBarbeiroPainel] = useState('Brendon')
  const [dataFiltroDesempenho, setDataFiltroDesempenho] = useState(new Date().toISOString().split('T')[0])

  const SENHA_BARBEIRO = '1234'

  // 📱 CONFIGURAÇÃO DOS WHATSAPPS DOS BARBEIROS
  const whatsAppBarbeiros = {
    Brendon: '5511948260279',
    Lucas: '5511983880215'
  }

  // 📋 TABELA DE SERVIÇOS
  const tabelaServicos = [
    { id: 1, nome: 'Corte', preco: 40, duracao: '1h', imagem: '/corte.jpeg' },
    { id: 2, nome: 'Luzes', preco: 60, duracao: '1h', imagem: '/luzes.jpeg' },
    { id: 3, nome: 'Botox', preco: 70, duracao: '1h', imagem: '' },
    { id: 4, nome: 'Nevou', preco: 70, duracao: '1h', imagem: '' }, 
    { id: 5, nome: 'Pezinho', preco: 15, duracao: '1h', imagem: '' },
    { id: 6, nome: 'Hidratação', preco: 15, duracao: '1h', imagem: '' },
    { id: 7, nome: 'Sobrancelha', preco: 15, duracao: '1h', imagem: '' },
    { id: 8, nome: 'Progressiva', preco: 80, duracao: '1h', imagem: '' },
    { id: 9, nome: 'Relaxamento', preco: 35, duracao: '1h', imagem: '' },
    { id: 10, nome: 'Barba Lisa', preco: 20, duracao: '1h', imagem: '' },
    { id: 11, nome: 'Barba Desenhada', preco: 25, duracao: '1h', imagem: '/barba-corte.jpeg' },
  ]

  const fotosCarrossel = [
    { src: '/corte.jpeg', legenda: 'Degradê Fino ✂️' },
    { src: '/luzes.jpeg', legenda: 'Reflexo Alinhado ⚡' },
    { src: '/barba-corte.jpeg', legenda: 'Barba de Respeito 🧔' },
    { src: '/taper-fade-com-risco.jpeg', legenda: 'Risco de Cria 🎨' },
    { src: '/infantil.jpeg', legenda: 'Estilo Infantil 🚀' }, 
  ]

  const horariosPadrao = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ]

  function toggleServicoNoCarrinho(servico) {
    const jaAdicionado = carrinho.some(item => item.id === servico.id)
    if (jaAdicionado) {
      setCarrinho(carrinho.filter(item => item.id !== servico.id))
    } else {
      setCarrinho([...carrinho, servico])
    }
  }

  const totalPreco = carrinho.reduce((soma, item) => soma + item.preco, 0)

  function selecionarBarbeiro(nome) {
    setBarbeiroSelecionado(nome)
    setPasso(3)
  }

  function avançarParaIdentificacao(horario) {
    setHorarioSelecionado(horario)
    setPasso(4)
  }

  // SALVA O NOVO AGENDAMENTO NA NUVEM
  async function finalizarAgendamento(e) {
    e.preventDefault()
    if (nomeCliente.trim() === '' || telefoneCliente.trim() === '') {
      alert('Por favor, preencha o seu nome e telefone.')
      return
    }

    try {
      await addDoc(collection(db, 'agendamentos'), {
        cliente: nomeCliente,
        telefone: telefoneCliente,
        barbeiro: barbeiroSelecionado,
        data: dataSelecionada,
        horario: horarioSelecionado,
        servicos: carrinho.map(s => s.nome).join(', '),
        valor: totalPreco,
        status: 'pendente',
        criadoEm: Date.now()
      })
      setPasso(5)
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error)
      alert("Ocorreu um erro ao agendar. Tente novamente!")
    }
  }

  // MARCA ATENDIMENTO COMO CONCLUÍDO NA NUVEM
  async function concluirAtendimento(idAtendimento) {
    try {
      const docRef = doc(db, 'agendamentos', idAtendimento)
      await updateDoc(docRef, { status: 'concluido' })
    } catch (error) {
      console.error("Erro ao concluir atendimento:", error)
    }
  }

  // REMOVE AGENDAMENTO DA NUVEM (LIBERA O HORÁRIO NO SITE PARA TODOS)
  async function cancelarAgendamento(idParaRemover) {
    const confirmar = window.confirm('Tem certeza que deseja cancelar este agendamento? O horário ficará livre novamente no site para todos.')
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'agendamentos', idParaRemover))
      } catch (error) {
        console.error("Erro ao cancelar agendamento:", error)
      }
    }
  }

  function enviarNotificacaoWhats() {
    const numeroWhats = whatsAppBarbeiros[barbeiroSelecionado]
    const listaNomesServicos = carrinho.map(s => s.nome).join(', ')
    const textoMensagem = `✂️ *NOVO AGENDAMENTO PELO SITE* ✂️\n\n` +
      `👤 *Cliente:* ${nomeCliente}\n` +
      `📱 *WhatsApp:* ${telefoneCliente}\n` +
      `----------------------------------\n` +
      `📦 *Serviço(s):* ${listaNomesServicos}\n` +
      `💈 *Barbeiro Escolhido:* ${barbeiroSelecionado}\n` +
      `📅 *Data:* ${formatarData(dataSelecionada)}\n` +
      `🕒 *Horário:* às ${horarioSelecionado}\n` +
      `----------------------------------\n` +
      `💰 *Valor Total Somado:* R$ ${totalPreco},00\n\n` +
      `_Por favor, reserve essa vaga na sua bancada!_`
    const linkOficial = `https://api.whatsapp.com/send?phone=${numeroWhats}&text=${encodeURIComponent(textoMensagem)}`
    window.open(linkOficial, '_blank')
  }

  function formatarData(data) {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function verificarDiaBloqueado(dataString) {
    if (!dataString) return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const [ano, mes, dia] = dataString.split('-').map(Number)
    const dataAlvo = new Date(ano, mes - 1, dia)
    dataAlvo.setHours(0, 0, 0, 0)

    if (dataAlvo.getMonth() !== hoje.getMonth() || dataAlvo.getFullYear() !== hoje.getFullYear()) {
      return true
    }

    if (dataAlvo < hoje) {
      return true
    }

    const diaSemanaHoje = hoje.getDay()
    let inicioJanela = new Date(hoje)
    let fimJanela = new Date(hoje)

    if (diaSemanaHoje >= 1 && diaSemanaHoje <= 3) {
      const diferencaSegunda = diaSemanaHoje - 1
      inicioJanela.setDate(hoje.getDate() - diferencaSegunda)
      fimJanela.setDate(inicioJanela.getDate() + 2)
    } else {
      const diasAteQuinta = diaSemanaHoje === 0 ? -3 : 4 - diaSemanaHoje
      inicioJanela.setDate(hoje.getDate() + diasAteQuinta)

      const diasAteDomingo = diaSemanaHoje === 0 ? 0 : 7 - diaSemanaHoje
      fimJanela.setDate(hoje.getDate() + diasAteDomingo)
    }

    if (dataAlvo < inicioJanela || dataAlvo > fimJanela) {
      return true
    }

    return false
  }

  function checarHorarioOcupado(horario) {
    return listaAgendamentos.some(item => 
      item.data === dataSelecionada && 
      item.barbeiro === barbeiroSelecionado && 
      item.horario === horario
    )
  }

  function validarAcessoBarbeiro(e) {
    e.preventDefault()
    if (senhaInput === SENHA_BARBEIRO) {
      setAutenticado(true)
      setSenhaInput('')
    } else {
      alert('Senha incorreta! Acesso restrito aos barbeiros.')
      setSenhaInput('')
    }
  }

  // 📊 CÁLCULOS DO DASHBOARD E DESEMPENHO NA NUVEM
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataHojeString = hoje.toISOString().split('T')[0]
  const mesAtual = hoje.getMonth()

  const diaSemanaHoje = hoje.getDay()
  const segSemana = new Date(hoje)
  const difSeg = diaSemanaHoje === 0 ? -6 : 1 - diaSemanaHoje
  segSemana.setDate(hoje.getDate() + difSeg)

  const domSemana = new Date(segSemana)
  domSemana.setDate(segSemana.getDate() + 6)

  const agendamentosBarbeiro = listaAgendamentos.filter(item => item.barbeiro === barbeiroPainel)
  const agendamentosConcluidos = agendamentosBarbeiro.filter(item => item.status === 'concluido')

  const faturamentoHoje = agendamentosConcluidos
    .filter(item => item.data === dataHojeString)
    .reduce((total, item) => total + item.valor, 0)

  const faturamentoSemanal = agendamentosConcluidos
    .filter(item => {
      const [ano, mes, dia] = item.data.split('-').map(Number)
      const dataItem = new Date(ano, mes - 1, dia)
      dataItem.setHours(0, 0, 0, 0)
      return dataItem >= segSemana && dataItem <= domSemana
    })
    .reduce((total, item) => total + item.valor, 0)

  const faturamentoMes = agendamentosConcluidos
    .filter(item => {
      const [ano, mes] = item.data.split('-').map(Number)
      return (mes - 1) === mesAtual
    })
    .reduce((total, item) => total + item.valor, 0)

  const totalAtendimentosConcluidos = agendamentosConcluidos.length

  const concluidosNaDataFiltro = agendamentosConcluidos.filter(item => item.data === dataFiltroDesempenho)
  const faturamentoDataFiltro = concluidosNaDataFiltro.reduce((total, item) => total + item.valor, 0)
  const cortesDataFiltro = concluidosNaDataFiltro.length

  const diasTrabalhadosNoMes = new Set(
    agendamentosConcluidos
      .filter(item => (Number(item.data.split('-')[1]) - 1) === mesAtual)
      .map(item => item.data)
  ).size

  const mediaDiariaMes = diasTrabalhadosNoMes > 0 ? (faturamentoMes / diasTrabalhadosNoMes) : 0

  return (
    <div className="container" style={{ paddingBottom: passo === 1 && carrinho.length > 0 ? '100px' : '20px' }}>
      <header className="barber-header">
        <img 
          src="/logo-barbearia.jpeg" 
          alt="Logo Barbearia de Castro Cort's" 
          className="logo-oficial" 
          onClick={() => setPasso(6)} 
          style={{ cursor: 'pointer' }}
        />
        <div className="divisor-linha"></div>
      </header>

      {/* PASSO 1 */}
      {passo === 1 && (
        <div className="conteudo-passo">
          <div className="secao-galeria-topo">
            <h3 className="titulo-galeria">Cortes da Casa ⚡</h3>
            <div className="carrossel-container">
              {fotosCarrossel.map((foto, index) => (
                <div key={index} className="carrossel-item">
                  <img src={foto.src} alt={foto.legenda} className="carrossel-img" />
                  <span className="carrossel-legenda">{foto.legenda}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="instrucao">Selecione um ou mais serviços para montar seu atendimento:</p>
          <div className="lista-servicos">
            {tabelaServicos.map((servico) => {
              const estaNoCarrinho = carrinho.some(item => item.id === servico.id)
              return (
                <div key={servico.id} className={estaNoCarrinho ? 'card-servico-item item-selecionado' : 'card-servico-item'}>
                  <div className="servico-bloco-esquerdo">
                    {servico.imagem ? <img src={servico.imagem} alt={servico.nome} className="servico-img-miniatura" /> : <div className="servico-img-placeholder">✂️</div>}
                    <div className="servico-info">
                      <h3>{servico.nome}</h3>
                      <p>⏰ Duração: {servico.duracao}</p>
                    </div>
                  </div>
                  <div className="servico-preco-acao">
                    <span className="preco">R$ {servico.preco},00</span>
                    <button className={estaNoCarrinho ? 'btn-remover-item' : 'btn-adicionar-item'} onClick={() => toggleServicoNoCarrinho(servico)}>
                      {estaNoCarrinho ? 'Remover ❌' : 'Adicionar ➕'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {carrinho.length > 0 && (
            <div className="barra-carrinho-fixa">
              <div className="info-carrinho">
                <span className="qtd-itens">{carrinho.length} {carrinho.length === 1 ? 'serviço' : 'serviços'} selecionado(s)</span>
                <span className="valor-total-carrinho">Total: <strong>R$ {totalPreco},00</strong></span>
              </div>
              <button className="btn-avancar-fluxo" onClick={() => setPasso(2)}>Escolher Barbeiro ➔</button>
            </div>
          )}
        </div>
      )}

      {/* PASSO 2 */}
      {passo === 2 && (
        <div className="card-secao conteudo-passo">
          <div className="badge-multi-servicos">Selecionados: <strong>{carrinho.map(s => s.nome).join(', ')}</strong></div>
          <h3>Com quem você quer agendar?</h3>
          <div className="lista-barbeiros">
            <div className="card-barbeiro">
              <div className="clique-selecao" onClick={() => selecionarBarbeiro('Brendon')}><span className="barbeiro-nome">✂️ Brendon</span></div>
              <a href="https://www.instagram.com/brendon_barber01?igsh=enJ6a2lsZ2dwODBk" target="_blank" rel="noopener noreferrer" className="btn-instagram">📸 Ver Portfólio</a>
            </div>
            <div className="card-barbeiro">
              <div className="clique-selecao" onClick={() => selecionarBarbeiro('Lucas')}><span className="barbeiro-nome">✂️ Lucas</span></div>
              <a href="https://www.instagram.com/lc.barbeer011?igsh=MW94aWF1dzl5bmE3aw==" target="_blank" rel="noopener noreferrer" className="btn-instagram">📸 Ver Portfólio</a>
            </div>
          </div>
          <button className="btn-voltar" onClick={() => setPasso(1)}>Voltar</button>
        </div>
      )}

      {/* PASSO 3 */}
      {passo === 3 && (
        <div className="card-horarios conteudo-passo">
          <div className="resumo-escolhas">
            <p>Serviços: <strong>{carrinho.map(s => s.nome).join(', ')}</strong></p>
            <p>Profissional: <strong>{barbeiroSelecionado}</strong></p>
            <p>Valor Total: <strong>R$ {totalPreco},00</strong></p>
          </div>

          <h3>1. Escolha o dia do atendimento:</h3>
          <input 
            type="date" 
            className="input-data" 
            value={dataSelecionada} 
            onChange={(e) => setDataSelecionada(e.target.value)} 
          />

          {(() => {
            const estaBloqueado = verificarDiaBloqueado(dataSelecionada);

            if (dataSelecionada && estaBloqueado) {
              return (
                <div className="aviso-fechado">
                  <p>🚫 Agenda indisponível! Só é possível escolher os dias liberados desta semana dentro do mês atual.</p>
                </div>
              );
            }

            if (dataSelecionada) {
              return (
                <div className="secao-horas-animada">
                  <h3>2. Horários para ({formatarData(dataSelecionada)}):</h3>
                  <div className="grade-horarios">
                    {horariosPadrao.map((horario) => {
                      const ocupado = checarHorarioOcupado(horario);
                      return (
                        <button 
                          key={horario} 
                          disabled={ocupado}
                          className={`btn-horario ${ocupado ? 'horario-bloqueado' : ''}`}
                          style={{
                            opacity: ocupado ? 0.4 : 1,
                            cursor: ocupado ? 'not-allowed' : 'pointer',
                            backgroundColor: ocupado ? '#444' : ''
                          }}
                          onClick={() => !ocupado && avançarParaIdentificacao(horario)}
                        >
                          {horario} {ocupado ? '(Ocupado)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}
          <button className="btn-voltar" onClick={() => setPasso(2)}>Voltar</button>
        </div>
      )}

      {/* PASSO 4 */}
      {passo === 4 && (
        <div className="card-secao conteudo-passo">
          <div className="resumo-escolhas">
            <p>Serviço(s): <strong>{carrinho.map(s => s.nome).join(', ')}</strong></p>
            <p>Barbeiro: <strong>{barbeiroSelecionado}</strong></p>
            <p>Data e Horário: <strong>{formatarData(dataSelecionada)} às {horarioSelecionado}</strong></p>
            <p>Total: <strong>R$ {totalPreco},00</strong></p>
          </div>
          <h3>Para quem é o agendamento?</h3>
          <form onSubmit={finalizarAgendamento} className="formulario-cliente">
            <input type="text" placeholder="Nome Completo" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
            <input type="tel" placeholder="Telefone (WhatsApp)" value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} />
            <button type="submit" className="btn-confirmar">Confirmar Agendamento 📅</button>
          </form>
          <button className="btn-voltar" onClick={() => setPasso(3)}>Voltar</button>
        </div>
      )}

      {/* PASSO 5 */}
      {passo === 5 && (
        <div className="card-sucesso conteudo-passo">
          <h2>🔔 Agendamento Recebido!</h2>
          <button className="btn-enviar-whats-notificacao" onClick={enviarNotificacaoWhats}>Enviar Confirmação 💬</button>
          <button className="btn-voltar" onClick={() => { setPasso(1); setCarrinho([]); setDataSelecionada(''); setNomeCliente(''); setTelefoneCliente(''); }}>Novo Agendamento</button>
        </div>
      )}

      {/* 🔒 PASSO 6: PAINEL DO BARBEIRO (SINCRONIZADO NA NUVEM) */}
      {passo === 6 && (
        <div className="card-secao conteudo-passo">
          {!autenticado ? (
            <div className="login-barbeiro">
              <h3>🔒 Acesso Interno</h3>
              <p className="instrucao">Digite a senha da equipe para gerenciar a bancada:</p>
              <form onSubmit={validarAcessoBarbeiro} className="formulario-cliente">
                <input 
                  type="password" 
                  placeholder="Senha de Acesso" 
                  value={senhaInput} 
                  onChange={(e) => setSenhaInput(e.target.value)}
                />
                <button type="submit" className="btn-confirmar">Autenticar 🔑</button>
              </form>
              <button className="btn-voltar" style={{ marginTop: '15px' }} onClick={() => setPasso(1)}>Voltar ao Início</button>
            </div>
          ) : (
            <div className="painel-barbeiro-logado">
              <h2>Painel de Gestão 💈</h2>
              
              <div className="filtros-barbeiro" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                <button 
                  className={`btn-horario ${barbeiroPainel === 'Brendon' ? 'selecionado' : ''}`}
                  onClick={() => setBarbeiroPainel('Brendon')}
                >
                  Agenda do Brendon
                </button>
                <button 
                  className={`btn-horario ${barbeiroPainel === 'Lucas' ? 'selecionado' : ''}`}
                  onClick={() => setBarbeiroPainel('Lucas')}
                >
                  Agenda do Lucas
                </button>
              </div>

              {/* 💵 DASHBOARD GERAL */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '10px', 
                marginBottom: '20px' 
              }}>
                <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>Hoje 💵</span>
                  <h3 style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#2ed573' }}>R$ {faturamentoHoje},00</h3>
                </div>
                
                <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>Semana 📊</span>
                  <h3 style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#eccc68' }}>R$ {faturamentoSemanal},00</h3>
                </div>

                <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>Mês Atual 🗓️</span>
                  <h3 style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#1e90ff' }}>R$ {faturamentoMes},00</h3>
                </div>

                <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>Cortes Feitos ✂️</span>
                  <h3 style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#ffa502' }}>{totalAtendimentosConcluidos}</h3>
                </div>
              </div>

              {/* 🗓️ CONSULTA E COMPARATIVO DE DESEMPENHO DIÁRIO */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '10px', color: '#eccc68' }}>📅 Consulta de Desempenho por Dia</h3>
                <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>Escolha um dia no calendário para ver o faturamento e comparar com a média do mês:</p>
                
                <input 
                  type="date" 
                  className="input-data" 
                  value={dataFiltroDesempenho} 
                  onChange={(e) => setDataFiltroDesempenho(e.target.value)}
                  style={{ marginBottom: '15px' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#222', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>Faturamento do Dia</span>
                    <h4 style={{ margin: '5px 0 0 0', color: '#2ed573' }}>R$ {faturamentoDataFiltro},00</h4>
                    <span style={{ fontSize: '10px', color: '#888' }}>{cortesDataFiltro} corte(s)</span>
                  </div>

                  <div style={{ backgroundColor: '#222', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>Média Diária do Mês</span>
                    <h4 style={{ margin: '5px 0 0 0', color: '#1e90ff' }}>R$ {mediaDiariaMes.toFixed(0)},00 / dia</h4>
                    <span style={{ fontSize: '10px', color: '#888' }}>Baseado em {diasTrabalhadosNoMes} dia(s)</span>
                  </div>
                </div>

                {faturamentoDataFiltro > 0 && (
                  <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {faturamentoDataFiltro > mediaDiariaMes ? (
                      <span style={{ color: '#2ed573' }}>🚀 Desempenho no dia: ACIMA da sua média mensal!</span>
                    ) : faturamentoDataFiltro === mediaDiariaMes ? (
                      <span style={{ color: '#eccc68' }}>⚖️ Desempenho no dia: Na média do mês.</span>
                    ) : (
                      <span style={{ color: '#ff4757' }}>📉 Desempenho no dia: Abaixo da sua média mensal.</span>
                    )}
                  </div>
                )}
              </div>

              {/* LISTA DE AGENDAMENTOS EM TEMPO REAL */}
              <div className="lista-agenda-dia">
                <h3>Agendamentos Realtime ({barbeiroPainel}):</h3>
                
                {agendamentosBarbeiro.map(item => (
                  <div key={item.id} className="card-servico-item" style={{ 
                    marginBottom: '12px', 
                    textAlign: 'left', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    borderColor: item.status === 'concluido' ? '#2ed573' : '' 
                  }}>
                    <div className="servico-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>⏰ {item.horario} - {item.cliente} ({formatarData(item.data)})</h4>
                        {item.status === 'concluido' && (
                          <span style={{ fontSize: '11px', color: '#2ed573', backgroundColor: '#1b3b22', padding: '2px 8px', borderRadius: '12px' }}>
                            ✓ Concluído
                          </span>
                        )}
                      </div>
                      <p>📱 Whats: {item.telefone}</p>
                      <p>📦 {item.servicos} | 💰 R$ {item.valor},00</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                      {item.status !== 'concluido' && (
                        <button 
                          onClick={() => concluirAtendimento(item.id)}
                          className="btn-adicionar-item"
                          style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                        >
                          Concluir Corte ✂️
                        </button>
                      )}
                      
                      <button 
                        onClick={() => cancelarAgendamento(item.id)}
                        className="btn-remover-item"
                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                      >
                        Cancelar ❌
                      </button>
                    </div>
                  </div>
                ))}

                {agendamentosBarbeiro.length === 0 && (
                  <p style={{ marginTop: '20px', color: '#888' }}>Nenhum agendamento ativo para este barbeiro! 🙌</p>
                )}
              </div>

              <button className="btn-voltar" style={{ marginTop: '20px' }} onClick={() => { setAutenticado(false); setPasso(1); }}>Sair do Painel 🚪</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
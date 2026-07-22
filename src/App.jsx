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
  const [passo, setPasso] = useState(1) // 1: Serviços, 2: Barbeiro, 3: Data/Horário, 4: Identificação e PIX, 5: Sucesso, 6: Painel Barbeiro
  const [carrinho, setCarrinho] = useState([]) 
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')

  // ☁️ BANCO DE DADOS EM TEMPO REAL NA NUVEM (FIREBASE)
  const [listaAgendamentos, setListaAgendamentos] = useState([])

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

  const SENHA_BARBEIRO = 'castrobarber'

  // 📱 CONFIGURAÇÃO DOS WHATSAPPS E CHAVES PIX DOS BARBEIROS
  const dadosBarbeiros = {
    Brendon: {
      whats: '5511948260279',
      pix: '11948260279',
      titular: 'Brendon Castro'
    },
    Lucas: {
      whats: '5511983880215',
      pix: '11983880215',
      titular: 'Lucas Silva Costa'
    }
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

  // 🔒 CLIENTES FIXOS DO BRENDON
  const clientesFixosBrendon = [
    { diaSemana: 3, horario: '13:00', cliente: 'João Paulo (Fixo)' },
    { diaSemana: 3, horario: '18:00', cliente: 'Jhow (Fixo)' },
    { diaSemana: 3, horario: '19:00', cliente: 'Celso (Fixo)' },
    { diaSemana: 4, horario: '13:00', cliente: 'Fabricio (Fixo)' },
    { diaSemana: 5, horario: '09:00', cliente: 'Diego (Fixo)' },
    { diaSemana: 5, horario: '13:00', cliente: 'Roger (Fixo)' },
    { diaSemana: 5, horario: '17:00', cliente: 'Raul (Fixo)' },
    { diaSemana: 5, horario: '18:00', cliente: 'Pedrão (Fixo)' },
    { diaSemana: 5, horario: '19:00', cliente: 'Wendel (Fixo)' },
    { diaSemana: 5, horario: '20:00', cliente: 'Juninho (Fixo)' },
    { diaSemana: 6, horario: '11:00', cliente: 'Davi Primo (Fixo)' },
    { diaSemana: 6, horario: '18:00', cliente: 'Paulo (Fixo)' },
  ]

  function ehUltimoSabadoDoMes(dataStr) {
    if (!dataStr) return false
    const [ano, mes, dia] = dataStr.split('-').map(Number)
    const dataObj = new Date(ano, mes - 1, dia)
    if (dataObj.getDay() !== 6) return false

    const proximaSemana = new Date(dataObj)
    proximaSemana.setDate(dataObj.getDate() + 7)
    return proximaSemana.getMonth() !== (mes - 1)
  }

  function obterHorariosDisponiveis(barbeiro, dataStr) {
    if (!dataStr) return []
    const [ano, mes, dia] = dataStr.split('-').map(Number)
    const dataObj = new Date(ano, mes - 1, dia)
    const diaSemana = dataObj.getDay()

    if (barbeiro === 'Lucas') {
      return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    }

    if (diaSemana === 0) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
    if (diaSemana === 1) return [] // Segunda-feira (Folga)
    if (diaSemana === 2) return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 3) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
    if (diaSemana === 4) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 5) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
    if (diaSemana === 6) {
      if (ehUltimoSabadoDoMes(dataStr)) {
        return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
      }
      return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    }

    return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
  }

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
        sinal: 'R$ 10,00',
        criadoEm: Date.now()
      })
      setPasso(5)
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error)
      alert("Ocorreu um erro ao agendar. Tente novamente!")
    }
  }

  // COPIA CHAVE PIX PARA A ÁREA DE TRANSFERÊNCIA
  function copiarPix(chave) {
    navigator.clipboard.writeText(chave)
    alert('Chave PIX copiada com sucesso!')
  }

  // CONCLUI ATENDIMENTO PERMITINDO INSERIR VALOR MANUALMENTE
  async function concluirAtendimento(item) {
    const valorDigitado = prompt(`Confirmar conclusão do corte de ${item.cliente}.\nQual foi o valor cobrado (R$)?`, item.valor || 40)
    
    if (valorDigitado !== null) {
      const valorFinal = Number(valorDigitado) || item.valor || 0
      try {
        if (item.id) {
          const docRef = doc(db, 'agendamentos', item.id)
          await updateDoc(docRef, { 
            status: 'concluido',
            valor: valorFinal 
          })
        } else {
          await addDoc(collection(db, 'agendamentos'), {
            cliente: item.cliente,
            telefone: 'Cliente Fixo',
            barbeiro: 'Brendon',
            data: dataSelecionada || new Date().toISOString().split('T')[0],
            horario: item.horario || 'Fixo',
            servicos: 'Atendimento Fixo',
            valor: valorFinal,
            status: 'concluido',
            criadoEm: Date.now()
          })
        }
      } catch (error) {
        console.error("Erro ao concluir atendimento:", error)
      }
    }
  }

  async function cancelarAgendamento(idParaRemover) {
    const confirmar = window.confirm('Tem certeza que deseja cancelar este agendamento? O horário ficará livre novamente no site para todos.')
    if (confirmar) {
      try {
        const docRef = doc(db, 'agendamentos', idParaRemover)
        await deleteDoc(docRef)
      } catch (error) {
        console.error("Erro ao cancelar agendamento:", error)
      }
    }
  }

  async function liberarHorarioFixo(fixoObj) {
    const confirmar = window.confirm(`Deseja cancelar o horário do cliente fixo (${fixoObj.cliente}) no dia selecionado e liberar para o site?`)
    if (confirmar) {
      try {
        await addDoc(collection(db, 'agendamentos'), {
          cliente: `${fixoObj.cliente} (CANCELADO)`,
          telefone: 'Fixo Liberado',
          barbeiro: 'Brendon',
          data: dataSelecionada || new Date().toISOString().split('T')[0],
          horario: fixoObj.horario,
          servicos: 'Fixo Cancelado',
          valor: 0,
          status: 'fixo_cancelado',
          criadoEm: Date.now()
        })
      } catch (error) {
        console.error("Erro ao liberar horário fixo:", error)
      }
    }
  }

  function enviarNotificacaoWhats() {
    const infoBarbeiro = dadosBarbeiros[barbeiroSelecionado]
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
      `💰 *Valor Total:* R$ ${totalPreco},00\n` +
      `💵 *Sinal Efetuado:* R$ 10,00 (PIX)\n\n` +
      `_Estou enviando o comprovante de R$ 10,00 em anexo para confirmar a reserva da minha vaga!_`
    const linkOficial = `https://api.whatsapp.com/send?phone=${infoBarbeiro.whats}&text=${encodeURIComponent(textoMensagem)}`
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
    const registroNuvem = listaAgendamentos.find(item => 
      item.data === dataSelecionada && 
      item.barbeiro === barbeiroSelecionado && 
      item.horario === horario
    )

    if (registroNuvem) {
      if (registroNuvem.status === 'fixo_cancelado') {
        return { ocupado: false, motivo: '' }
      }
      return { ocupado: true, motivo: registroNuvem.cliente }
    }

    if (barbeiroSelecionado === 'Brendon' && dataSelecionada) {
      const [ano, mes, dia] = dataSelecionada.split('-').map(Number)
      const dataObj = new Date(ano, mes - 1, dia)
      const diaSemana = dataObj.getDay()

      const fixo = clientesFixosBrendon.find(f => f.diaSemana === diaSemana && f.horario === horario)
      if (fixo) {
        return { ocupado: true, motivo: fixo.cliente }
      }
    }

    return { ocupado: false, motivo: '' }
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

  const agendamentosBarbeiro = listaAgendamentos.filter(item => item.barbeiro === barbeiroPainel && item.status !== 'fixo_cancelado')
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
              const listaHorarios = obterHorariosDisponiveis(barbeiroSelecionado, dataSelecionada);

              if (listaHorarios.length === 0) {
                return (
                  <div className="aviso-fechado" style={{ marginTop: '15px' }}>
                    <p>😴 O profissional está de folga nesta data!</p>
                  </div>
                )
              }

              return (
                <div className="secao-horas-animada">
                  <h3>2. Horários para ({formatarData(dataSelecionada)}):</h3>
                  <div className="grade-horarios">
                    {listaHorarios.map((horario) => {
                      const { ocupado, motivo } = checarHorarioOcupado(horario);
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
                          {horario} {ocupado ? `(${motivo || 'Ocupado'})` : ''}
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

      {/* PASSO 4: IDENTIFICAÇÃO E PAGAMENTO DO SINAL */}
      {passo === 4 && (
        <div className="card-secao conteudo-passo">
          <div className="resumo-escolhas">
            <p>Serviço(s): <strong>{carrinho.map(s => s.nome).join(', ')}</strong></p>
            <p>Barbeiro: <strong>{barbeiroSelecionado}</strong></p>
            <p>Data e Horário: <strong>{formatarData(dataSelecionada)} às {horarioSelecionado}</strong></p>
            <p>Total do Atendimento: <strong>R$ {totalPreco},00</strong></p>
          </div>

          <h3>Para quem é o agendamento?</h3>
          <form onSubmit={finalizarAgendamento} className="formulario-cliente">
            <input type="text" placeholder="Seu Nome Completo" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
            <input type="tel" placeholder="Seu Telefone (WhatsApp)" value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} />

            {/* CAIXA DE SINAL PIX */}
            <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginTop: '15px', border: '1px solid #eccc68', textAlign: 'left' }}>
              <h4 style={{ color: '#eccc68', margin: '0 0 8px 0', fontSize: '14px' }}>📌 Garantia de Reserva (Sinal de R$ 10,00)</h4>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0 0 10px 0' }}>
                Para confirmar a sua vaga na bancada, faça o envio do sinal de <strong>R$ 10,00</strong> via PIX. Esse valor é <strong>descontado do total</strong> do seu corte na barbearia!
              </p>

              <div style={{ backgroundColor: '#222', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Titular:</strong> {dadosBarbeiros[barbeiroSelecionado]?.titular}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Chave PIX (Celular):</strong> {dadosBarbeiros[barbeiroSelecionado]?.pix}</p>
                <button 
                  type="button"
                  onClick={() => copiarPix(dadosBarbeiros[barbeiroSelecionado]?.pix)}
                  style={{ backgroundColor: '#eccc68', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                >
                  📋 Copiar Chave PIX
                </button>
              </div>

              {/* POLÍTICA DE CANCELAMENTO */}
              <div style={{ backgroundColor: '#2b1b1b', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #ff4757' }}>
                <p style={{ fontSize: '10px', color: '#ff7979', margin: 0, lineHeight: '1.3' }}>
                  ⚠️ <strong>Aviso de Reserva:</strong> Em caso de desistência com menos de 2 horas de antecedência ou não comparecimento, o valor do sinal não será reembolsado para cobrir a reserva do horário.
                </p>
              </div>
            </div>

            <button type="submit" className="btn-confirmar" style={{ marginTop: '15px' }}>
              Avançar e Enviar Comprovante 📲
            </button>
          </form>
          <button className="btn-voltar" onClick={() => setPasso(3)}>Voltar</button>
        </div>
      )}

      {/* PASSO 5 */}
      {passo === 5 && (
        <div className="card-sucesso conteudo-passo">
          <h2>🔔 Agendamento Reservado!</h2>
          <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>
            Clique no botão abaixo para abrir o WhatsApp do barbeiro e <strong>enviar a mensagem junto com o comprovante de R$ 10,00</strong>!
          </p>
          <button className="btn-enviar-whats-notificacao" onClick={enviarNotificacaoWhats}>
            Enviar Comprovante no WhatsApp 💬
          </button>
          <button className="btn-voltar" style={{ marginTop: '15px' }} onClick={() => { setPasso(1); setCarrinho([]); setDataSelecionada(''); setNomeCliente(''); setTelefoneCliente(''); }}>
            Novo Agendamento
          </button>
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

              {/* LISTA DE CLIENTES FIXOS BLOQUEADOS NO PAINEL DO BRENDON */}
              {barbeiroPainel === 'Brendon' && (
                <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #333', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', color: '#ffa502', marginBottom: '10px' }}>📌 Clientes Fixos da Semana (Brendon)</h3>
                  <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>Se um fixo desistir ou cortar, você pode dar baixa ou liberar o horário aqui:</p>
                  
                  {clientesFixosBrendon.map((fixo, idx) => {
                    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '12px' }}>
                        <span><strong>{diasNomes[fixo.diaSemana]} {fixo.horario}:</strong> {fixo.cliente}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            onClick={() => concluirAtendimento({ cliente: fixo.cliente, valor: 40, horario: fixo.horario })}
                            style={{ backgroundColor: '#2ed573', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                          >
                            Concluir 💵
                          </button>
                          <button 
                            onClick={() => liberarHorarioFixo(fixo)}
                            style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                          >
                            Desistiu ❌
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* LISTA DE AGENDAMENTOS DO SITE EM TEMPO REAL */}
              <div className="lista-agenda-dia">
                <h3>Agendamentos do Site ({barbeiroPainel}):</h3>
                
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
                            ✓ Concluído (R$ {item.valor},00)
                          </span>
                        )}
                      </div>
                      <p>📱 Whats: {item.telefone}</p>
                      <p>📦 {item.servicos} | 💰 Valor Total: R$ {item.valor},00</p>
                      <p style={{ color: '#eccc68', fontSize: '11px' }}>💵 Sinal Pago: {item.sinal || 'R$ 10,00'}</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                      {item.status !== 'concluido' && (
                        <button 
                          onClick={() => concluirAtendimento(item)}
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
                  <p style={{ marginTop: '20px', color: '#888' }}>Nenhum agendamento ativo pelo site para este barbeiro! 🙌</p>
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
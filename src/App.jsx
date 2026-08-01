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
  const [dataFiltroPainel, setDataFiltroPainel] = useState(new Date().toISOString().split('T')[0])

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
    { id: 1, nome: 'Corte', preco: 40, duracao: '1h', imagem: '/corte.jpeg', promo: true },
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
    { diaSemana: 5, horario: '10:00', cliente: 'Alemão (Fixo)' }, // 👈 Adicionado Alemão na Sexta às 10h
    { diaSemana: 5, horario: '13:00', cliente: 'Roger (Fixo)' },
    { diaSemana: 5, horario: '17:00', cliente: 'Raul (Fixo)' },
    { diaSemana: 5, horario: '18:00', cliente: 'Pedrão (Fixo)' },
    { diaSemana: 5, horario: '19:00', cliente: 'Wendel (Fixo)' },
    { diaSemana: 5, horario: '20:00', cliente: 'Juninho (Fixo)' },
    { diaSemana: 6, horario: '11:00', cliente: 'Davi Primo (Fixo)' },
    { diaSemana: 6, horario: '18:00', cliente: 'Paulo (Fixo)' },
  ]

  function ehDiaPromocional(dataStr) {
    if (!dataStr) return false
    const [ano, mes, dia] = dataStr.split('-').map(Number)
    const diaSemana = new Date(ano, mes - 1, dia).getDay()
    return diaSemana === 2 || diaSemana === 3
  }

  function calcularTotalFinal() {
    return carrinho.reduce((soma, item) => {
      if (item.nome === 'Corte' && ehDiaPromocional(dataSelecionada)) {
        return soma + 35
      }
      return soma + item.preco
    }, 0)
  }

  const totalPreco = calcularTotalFinal()

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

    if (diaSemana === 0) return [] // Domingo (Folga do Brendon)
    if (diaSemana === 1) return [] // Segunda-feira (Folga do Brendon)
    if (diaSemana === 2) return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 3) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
    if (diaSemana === 4) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 5) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'] // 👈 Retirados 22h e 23h na Sexta
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

  function selecionarBarbeiro(nome) {
    setBarbeiroSelecionado(nome)
    setPasso(3)
  }

  function avançarParaIdentificacao(horario) {
    setHorarioSelecionado(horario)
    setPasso(4)
  }

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

  function copiarPix(chave) {
    navigator.clipboard.writeText(chave)
    alert('Chave PIX copiada com sucesso!')
  }

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
            data: dataFiltroPainel,
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
          data: dataFiltroPainel,
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

    const agora = new Date()
    const hoje = new Date(agora)

    if (agora.getDay() === 3 && agora.getHours() >= 21) {
      hoje.setDate(hoje.getDate() + 1)
    }

    if (agora.getDay() === 0 && agora.getHours() >= 21) {
      hoje.setDate(hoje.getDate() + 1)
    }

    hoje.setHours(0, 0, 0, 0)

    const [ano, mes, dia] = dataString.split('-').map(Number)
    const dataAlvo = new Date(ano, mes - 1, dia)
    dataAlvo.setHours(0, 0, 0, 0)

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

  // 📊 CÁLCULOS DO DASHBOARD E DESEMPENHO DO PAINEL
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataHojeString = hoje.toISOString().split('T')[0]
  const mesAtual = hoje.getMonth()

  const agendamentosBarbeiro = listaAgendamentos.filter(item => item.barbeiro === barbeiroPainel && item.status !== 'fixo_cancelado')
  const agendamentosConcluidos = agendamentosBarbeiro.filter(item => item.status === 'concluido')

  const faturamentoHoje = agendamentosConcluidos
    .filter(item => item.data === dataHojeString)
    .reduce((total, item) => total + item.valor, 0)

  const faturamentoMes = agendamentosConcluidos
    .filter(item => {
      const [ano, mes] = item.data.split('-').map(Number)
      return (mes - 1) === mesAtual
    })
    .reduce((total, item) => total + item.valor, 0)

  // 🗓️ CONSTRUÇÃO DA LINHA DO TEMPO DIÁRIA PARA O PAINEL ORGANIZADO
  function obterLinhaDoTempoDoDia() {
    if (!dataFiltroPainel) return []
    const [ano, mes, dia] = dataFiltroPainel.split('-').map(Number)
    const dataObj = new Date(ano, mes - 1, dia)
    const diaSemana = dataObj.getDay()

    const todosHorariosDia = obterHorariosDisponiveis(barbeiroPainel, dataFiltroPainel)
    
    return todosHorariosDia.map(horario => {
      // 1. Procura no Firebase
      const regNuvem = listaAgendamentos.find(item => 
        item.data === dataFiltroPainel && 
        item.barbeiro === barbeiroPainel && 
        item.horario === horario
      )

      if (regNuvem && regNuvem.status !== 'fixo_cancelado') {
        return { horario, cliente: regNuvem.cliente, tipo: 'Site', status: regNuvem.status, item: regNuvem }
      }

      // 2. Procura nos Fixos do Brendon
      if (barbeiroPainel === 'Brendon') {
        const fixo = clientesFixosBrendon.find(f => f.diaSemana === diaSemana && f.horario === horario)
        if (fixo && (!regNuvem || regNuvem.status !== 'fixo_cancelado')) {
          return { horario, cliente: fixo.cliente, tipo: 'Fixo', status: 'fixo', item: fixo }
        }
      }

      return { horario, cliente: 'Livre / Disponível', tipo: 'Livre', status: 'livre', item: null }
    })
  }

  const linhaDoTempoHoje = obterLinhaDoTempoDoDia()

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
                      <h3>
                        {servico.nome} 
                        {servico.promo && (
                          <span style={{ fontSize: '10px', backgroundColor: '#eccc68', color: '#000', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>
                            🔥 PROMO TER / QUA
                          </span>
                        )}
                      </h3>
                      <p>⏰ Duração: {servico.duracao}</p>
                      {servico.promo && (
                        <p style={{ fontSize: '10px', color: '#2ed573', fontWeight: 'bold', margin: '2px 0 0 0' }}>
                          Terça e Quarta por R$ 35,00!
                        </p>
                      )}
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
                <span className="valor-total-carrinho">Subtotal: <strong>R$ {carrinho.reduce((s, i) => s + i.preco, 0)},00</strong></span>
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

          {dataSelecionada && carrinho.some(i => i.nome === 'Corte') && ehDiaPromocional(dataSelecionada) && (
            <div style={{ backgroundColor: '#1b3b22', border: '1px solid #2ed573', padding: '10px', borderRadius: '8px', margin: '10px 0', fontSize: '12px', color: '#2ed573', fontWeight: 'bold' }}>
              🎉 Desconto Aplicado! Promoção de Terça/Quarta: Corte por apenas R$ 35,00!
            </div>
          )}

          {(() => {
            const estaBloqueado = verificarDiaBloqueado(dataSelecionada);

            if (dataSelecionada && estaBloqueado) {
              return (
                <div className="aviso-fechado">
                  <p>🚫 Agenda indisponível! Só é possível escolher os dias liberados desta semana.</p>
                </div>
              );
            }

            if (dataSelecionada) {
              const listaHorarios = obterHorariosDisponiveis(barbeiroSelecionado, dataSelecionada);

              if (listaHorarios.length === 0) {
                const [ano, mes, dia] = dataSelecionada.split('-').map(Number)
                const diaSemanaSel = new Date(ano, mes - 1, dia).getDay()

                return (
                  <div className="aviso-fechado" style={{ marginTop: '15px' }}>
                    {barbeiroSelecionado === 'Brendon' ? (
                      diaSemanaSel === 0 ? (
                        <p>😴 O Brendon não atende aos domingos! Atendimentos de terça a sábado.</p>
                      ) : (
                        <p>😴 O Brendon está de folga na segunda-feira! Atendimentos de terça a sábado.</p>
                      )
                    ) : (
                      <p>😴 O profissional está de folga nesta data!</p>
                    )}
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

      {/* PASSO 4 */}
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

              <div style={{ backgroundColor: '#2b1b1b', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #ff4757' }}>
                <p style={{ fontSize: '10px', color: '#ff7979', margin: 0, lineHeight: '1.3' }}>
                  ⚠️ <strong>Aviso de Reserva:</strong> Em caso de desistência com menos de 2 horas de antecedência ou não comparecimento, o valor do sinal não será reembolsado.
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
            Clique no botão abaixo para abrir o WhatsApp do barbeiro e <strong>enviar o comprovante de R$ 10,00</strong>!
          </p>
          <button className="btn-enviar-whats-notificacao" onClick={enviarNotificacaoWhats}>
            Enviar Comprovante no WhatsApp 💬
          </button>
          <button className="btn-voltar" style={{ marginTop: '15px' }} onClick={() => { setPasso(1); setCarrinho([]); setDataSelecionada(''); setNomeCliente(''); setTelefoneCliente(''); }}>
            Novo Agendamento
          </button>
        </div>
      )}

      {/* 🔒 PASSO 6: PAINEL ORGANIZADO DO BARBEIRO */}
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
              <h2>Agenda do Barbeiro 💈</h2>
              
              <div className="filtros-barbeiro" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                <button 
                  className={`btn-horario ${barbeiroPainel === 'Brendon' ? 'selecionado' : ''}`}
                  onClick={() => setBarbeiroPainel('Brendon')}
                >
                  Brendon
                </button>
                <button 
                  className={`btn-horario ${barbeiroPainel === 'Lucas' ? 'selecionado' : ''}`}
                  onClick={() => setBarbeiroPainel('Lucas')}
                >
                  Lucas
                </button>
              </div>

              {/* 💵 DASHBOARD RAPIDO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>Hoje 💵</span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '15px', color: '#2ed573' }}>R$ {faturamentoHoje},00</h3>
                </div>
                <div style={{ backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>Mês Atual 🗓️</span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '15px', color: '#1e90ff' }}>R$ {faturamentoMes},00</h3>
                </div>
              </div>

              {/* 📅 SELETOR DE DATA ORGANIZADO */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #eccc68', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#eccc68', margin: '0 0 8px 0' }}>🗓️ Selecione o Dia para Ver a Agenda:</h3>
                <input 
                  type="date" 
                  className="input-data" 
                  value={dataFiltroPainel} 
                  onChange={(e) => setDataFiltroPainel(e.target.value)}
                  style={{ marginBottom: '0px' }}
                />
              </div>

              {/* 🕒 LINHA DO TEMPO DIÁRIA LIMPA E ORGANIZADA */}
              <div className="lista-agenda-dia" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>
                  Horários do dia ({formatarData(dataFiltroPainel)}):
                </h3>

                {linhaDoTempoHoje.map((slot, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justify: 'space-between', 
                    alignItems: 'center', 
                    backgroundColor: slot.status === 'concluido' ? '#1b3b22' : slot.type === 'Livre' ? '#1a1a1a' : '#222', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    borderLeft: slot.type === 'Fixo' ? '4px solid #ffa502' : slot.type === 'Site' ? '4px solid #1e90ff' : '4px solid #444'
                  }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{slot.horario}</strong> - <span style={{ fontSize: '13px', color: slot.type === 'Livre' ? '#666' : '#fff' }}>{slot.cliente}</span>
                      {slot.type !== 'Livre' && (
                        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                          Tipo: {slot.type} {slot.item?.telefone ? `| Whats: ${slot.item.telefone}` : ''}
                        </div>
                      )}
                    </div>

                    <div>
                      {slot.type === 'Site' && slot.status !== 'concluido' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => concluirAtendimento(slot.item)} style={{ backgroundColor: '#2ed573', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Concluir 💵</button>
                          <button onClick={() => cancelarAgendamento(slot.item.id)} style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>Desistiu ❌</button>
                        </div>
                      )}

                      {slot.type === 'Fixo' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => concluirAtendimento({ cliente: slot.cliente, valor: 40, horario: slot.horario })} style={{ backgroundColor: '#2ed573', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Concluir 💵</button>
                          <button onClick={() => liberarHorarioFixo(slot.item)} style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>Desistiu ❌</button>
                        </div>
                      )}

                      {slot.status === 'concluido' && (
                        <span style={{ fontSize: '10px', color: '#2ed573', fontWeight: 'bold' }}>✓ Concluído</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-voltar" style={{ marginTop: '20px' }} onClick={() => { setAutenticado(false); setPasso(1); }}>Sair do Painel 🚪</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AppS
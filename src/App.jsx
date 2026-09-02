import { useState, useEffect } from 'react'
import './App.css'
import { db } from './firebase'
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc
} from 'firebase/firestore'

function App() {
  const [passo, setPasso] = useState(1) // 1: Serviços, 2: Barbeiro, 3: Data/Horário, 4: Identificação, 5: Sucesso, 6: Painel Barbeiro, 7: Cancelar Agendamento
  const [carrinho, setCarrinho] = useState([]) 
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')

  // ☁️ BANCO DE DADOS EM TEMPO REAL NA NUVEM (FIREBASE)
  const [listaAgendamentos, setListaAgendamentos] = useState([])
  const [listaFixosNuvem, setListaFixosNuvem] = useState([])
  const [configBarbeiros, setConfigBarbeiros] = useState({
    Brendon: {
      folgas: [0, 1], // 0: Dom, 1: Seg por padrão
      servicos: [
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
      ],
      galeria: [
        { src: '/corte.jpeg', legenda: 'Degradê Fino ✂️' },
        { src: '/luzes.jpeg', legenda: 'Reflexo Alinhado ⚡' },
        { src: '/barba-corte.jpeg', legenda: 'Barba de Respeito 🧔' },
        { src: '/taper-fade-com-risco.jpeg', legenda: 'Risco de Cria 🎨' },
        { src: '/infantil.jpeg', legenda: 'Estilo Infantil 🚀' },
      ]
    }
  })

  useEffect(() => {
    const unsubscribeAgendamentos = onSnapshot(collection(db, 'agendamentos'), (snapshot) => {
      const dadosNuvem = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setListaAgendamentos(dadosNuvem)
    })

    const unsubscribeFixos = onSnapshot(collection(db, 'clientes_fixos'), (snapshot) => {
      const fixos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setListaFixosNuvem(fixos)
    })

    const unsubscribeConfig = onSnapshot(collection(db, 'config_barbeiros'), (snapshot) => {
      const configs = {}
      snapshot.docs.forEach(doc => {
        configs[doc.id] = doc.data()
      })
      if (Object.keys(configs).length > 0) {
        setConfigBarbeiros(prev => ({ ...prev, ...configs }))
      }
    })

    return () => {
      unsubscribeAgendamentos()
      unsubscribeFixos()
      unsubscribeConfig()
    }
  }, [])

  // 🔒 ESTADOS DO PAINEL PRIVADO DO BARBEIRO
  const [senhaInput, setSenhaInput] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [barbeiroPainel, setBarbeiroPainel] = useState('Brendon')
  const [dataFiltroPainel, setDataFiltroPainel] = useState(new Date().toISOString().split('T')[0])

  // Form de Adicionar Fixo e Bloqueios Manuais
  const [novoFixoDia, setNovoFixoDia] = useState(5)
  const [novoFixoHorario, setNovoFixoHorario] = useState('09:00')
  const [novoFixoNome, setNovoFixoNome] = useState('')
  const [bloqueioData, setBloqueioData] = useState('')
  const [bloqueioHorario, setBloqueioHorario] = useState('09:00')

  // Form de Novo Serviço e Foto
  const [novoServicoNome, setNovoServicoNome] = useState('')
  const [novoServicoPreco, setNovoServicoPreco] = useState('')
  const [novaFotoUrl, setNovaFotoUrl] = useState('')
  const [novaFotoLegenda, setNovaFotoLegenda] = useState('')

  // Form de Cancelamento pelo Cliente
  const [telefoneBusca, setTelefoneBusca] = useState('')

  const SENHA_BARBEIRO = 'castrobarber'

  // 📱 CONFIGURAÇÕES FIXAS DOS WHATSAPPS
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

  // 📋 DADOS DINÂMICOS
  const tabelaServicos = configBarbeiros[barbeiroSelecionado || 'Brendon']?.servicos || []
  const fotosCarrossel = configBarbeiros[barbeiroSelecionado || 'Brendon']?.galeria || []

  const clientesFixosPadraoBrendon = [
    { diaSemana: 3, horario: '13:00', cliente: 'João Paulo (Fixo)' },
    { diaSemana: 3, horario: '18:00', cliente: 'Jhow (Fixo)' },
    { diaSemana: 3, horario: '19:00', cliente: 'Celso (Fixo)' },
    { diaSemana: 4, horario: '13:00', cliente: 'Fabricio (Fixo)' },
    { diaSemana: 5, horario: '09:00', cliente: 'Diego (Fixo)' },
    { diaSemana: 5, horario: '10:00', cliente: 'Alemão (Fixo)' },
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
      if (item.nome === 'Corte' && ehDiaPromocional(dataSelecionada)) return soma + 35
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

    const folgasBarbeiro = configBarbeiros[barbeiro]?.folgas || (barbeiro === 'Brendon' ? [0, 1] : [])
    if (folgasBarbeiro.includes(diaSemana)) return []

    if (barbeiro === 'Lucas') return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    if (diaSemana === 2) return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 3) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
    if (diaSemana === 4) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 5) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    if (diaSemana === 6) {
      if (ehUltimoSabadoDoMes(dataStr)) return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
      return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    }
    return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
  }

  function toggleServicoNoCarrinho(servico) {
    const jaAdicionado = carrinho.some(item => item.id === servico.id)
    if (jaAdicionado) setCarrinho(carrinho.filter(item => item.id !== servico.id))
    else setCarrinho([...carrinho, servico])
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
    if (nomeCliente.trim() === '' || telefoneCliente.trim() === '') return alert('Por favor, preencha o seu nome e telefone.')

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
          await updateDoc(doc(db, 'agendamentos', item.id), { status: 'concluido', valor: valorFinal })
        } else {
          await addDoc(collection(db, 'agendamentos'), {
            cliente: item.cliente, telefone: 'Cliente Fixo', barbeiro: barbeiroPainel, data: dataFiltroPainel,
            horario: item.horario || 'Fixo', servicos: 'Atendimento Fixo', valor: valorFinal, status: 'concluido', criadoEm: Date.now()
          })
        }
      } catch (error) { console.error(error) }
    }
  }

  async function cancelarAgendamento(idParaRemover) {
    if (window.confirm('Deseja realmente desmarcar este agendamento?')) {
      if (!idParaRemover) return alert('Erro: ID do agendamento não encontrado!');
      try {
        await deleteDoc(doc(db, 'agendamentos', idParaRemover))
        alert('Agendamento desmarcado com sucesso!')
      } catch (error) { 
        console.error(error)
        alert('Erro de conexão ao cancelar.')
      }
    }
  }

  async function desbloquearHorarioManual(idBloqueio) {
    if (window.confirm('Deseja desbloquear e abrir este horário novamente para os clientes?')) {
      if (!idBloqueio) return alert('Erro: ID do bloqueio não encontrado!');
      try {
        await deleteDoc(doc(db, 'agendamentos', idBloqueio))
        alert('🟢 Horário liberado com sucesso!')
      } catch (error) { 
        console.error(error)
        alert('Erro ao liberar o horário.')
      }
    }
  }

  async function liberarHorarioFixo(fixoObj) {
    if (window.confirm(`Cancelar o horário do cliente fixo (${fixoObj.cliente}) hoje e liberar a vaga?`)) {
      try {
        await addDoc(collection(db, 'agendamentos'), {
          cliente: `${fixoObj.cliente} (CANCELADO)`, telefone: 'Fixo Liberado', barbeiro: barbeiroPainel,
          data: dataFiltroPainel, horario: fixoObj.horario, servicos: 'Fixo Cancelado', valor: 0, status: 'fixo_cancelado', criadoEm: Date.now()
        })
        alert('🟢 Horário do cliente fixo liberado para hoje!')
      } catch (error) { console.error(error) }
    }
  }

  async function bloquearHorarioBarbeiro(e) {
    e.preventDefault()
    if (!bloqueioData) return alert("Selecione a data")
    try {
      await addDoc(collection(db, 'agendamentos'), {
        cliente: 'Fechado/Indisponível', telefone: 'Bloqueio', barbeiro: barbeiroPainel,
        data: bloqueioData, horario: bloqueioHorario, servicos: 'Bloqueio Manual', valor: 0, status: 'bloqueado_barbeiro', criadoEm: Date.now()
      })
      alert('Horário bloqueado com sucesso!')
    } catch(err) { console.error(err) }
  }

  async function adicionarNovoFixo(e) {
    e.preventDefault()
    if (!novoFixoNome.trim()) return alert('Digite o nome do cliente fixo.')
    const conflitoNuvem = listaFixosNuvem.find(f => f.barbeiro === barbeiroPainel && f.diaSemana === Number(novoFixoDia) && f.horario === novoFixoHorario)
    const conflitoPadrao = barbeiroPainel === 'Brendon' && clientesFixosPadraoBrendon.find(f => f.diaSemana === Number(novoFixoDia) && f.horario === novoFixoHorario)
    if (conflitoNuvem || conflitoPadrao) return alert(`O horário já está reservado!`)
    try {
      await addDoc(collection(db, 'clientes_fixos'), {
        barbeiro: barbeiroPainel, diaSemana: Number(novoFixoDia), horario: novoFixoHorario, cliente: `${novoFixoNome.trim()} (Fixo)`, criadoEm: Date.now()
      })
      setNovoFixoNome('')
      alert('Cliente fixo adicionado com sucesso!')
    } catch (error) { console.error(error) }
  }

  async function deletarFixoDefinitivo(idFixo) {
    if (window.confirm('Remover este cliente fixo definitivamente?')) {
      try { await deleteDoc(doc(db, 'clientes_fixos', idFixo)) } catch (error) { console.error(error) }
    }
  }

  async function toggleDiaFolga(diaIndex) {
    const folgasAtuais = configBarbeiros[barbeiroPainel]?.folgas || [0, 1]
    let novasFolgas = folgasAtuais.includes(diaIndex) ? folgasAtuais.filter(d => d !== diaIndex) : [...folgasAtuais, diaIndex]
    try { await setDoc(doc(db, 'config_barbeiros', barbeiroPainel), { ...configBarbeiros[barbeiroPainel], folgas: novasFolgas }, { merge: true }) } catch (error) { console.error(error) }
  }

  async function atualizarPrecoServico(idServico, novoPreco) {
    const servicosAtualizados = (configBarbeiros[barbeiroPainel]?.servicos || tabelaServicos).map(s => s.id === idServico ? { ...s, preco: Number(novoPreco) } : s)
    try { await setDoc(doc(db, 'config_barbeiros', barbeiroPainel), { ...configBarbeiros[barbeiroPainel], servicos: servicosAtualizados }, { merge: true }) } catch (error) { console.error(error) }
  }

  async function adicionarNovoServico(e) {
    e.preventDefault()
    if (!novoServicoNome.trim() || !novoServicoPreco) return
    const novoServ = { id: Date.now(), nome: novoServicoNome.trim(), preco: Number(novoServicoPreco), duracao: '1h', imagem: '' }
    try {
      await setDoc(doc(db, 'config_barbeiros', barbeiroPainel), { ...configBarbeiros[barbeiroPainel], servicos: [...(configBarbeiros[barbeiroPainel]?.servicos || tabelaServicos), novoServ] }, { merge: true })
      setNovoServicoNome(''); setNovoServicoPreco('')
    } catch (error) { console.error(error) }
  }

  async function removerServico(idServico) {
    const servicosFiltrados = (configBarbeiros[barbeiroPainel]?.servicos || tabelaServicos).filter(s => s.id !== idServico)
    try { await setDoc(doc(db, 'config_barbeiros', barbeiroPainel), { ...configBarbeiros[barbeiroPainel], servicos: servicosFiltrados }, { merge: true }) } catch (error) { console.error(error) }
  }

  async function adicionarNovaFotoGaleria(e) {
    e.preventDefault()
    if (!novaFotoUrl.trim()) return
    const novaFoto = { src: novaFotoUrl.trim(), legenda: novaFotoLegenda.trim() || 'Corte no Estilo ✂️' }
    try {
      await setDoc(doc(db, 'config_barbeiros', barbeiroPainel), { ...configBarbeiros[barbeiroPainel], galeria: [...(configBarbeiros[barbeiroPainel]?.galeria || fotosCarrossel), novaFoto] }, { merge: true })
      setNovaFotoUrl(''); setNovaFotoLegenda('')
    } catch (error) { console.error(error) }
  }

  async function removerFotoGaleria(indexFoto) {
    const galeriaFiltrada = (configBarbeiros[barbeiroPainel]?.galeria || fotosCarrossel).filter((_, idx) => idx !== indexFoto)
    try { await setDoc(doc(db, 'config_barbeiros', barbeiroPainel), { ...configBarbeiros[barbeiroPainel], galeria: galeriaFiltrada }, { merge: true }) } catch (error) { console.error(error) }
  }

  function enviarNotificacaoWhats() {
    const infoBarbeiro = dadosBarbeiros[barbeiroSelecionado]
    const listaNomesServicos = carrinho.map(s => s.nome).join(', ')
    const textoMensagem = `✂️ *NOVO AGENDAMENTO PELO SITE* ✂️\n\n👤 *Cliente:* ${nomeCliente}\n📱 *WhatsApp:* ${telefoneCliente}\n----------------------------------\n📦 *Serviço(s):* ${listaNomesServicos}\n💈 *Barbeiro Escolhido:* ${barbeiroSelecionado}\n📅 *Data:* ${formatarData(dataSelecionada)}\n🕒 *Horário:* às ${horarioSelecionado}\n----------------------------------\n💰 *Valor Total:* R$ ${totalPreco},00\n💵 *Sinal Efetuado:* R$ 10,00 (PIX)\n\n_Estou enviando o comprovante de R$ 10,00 em anexo para confirmar a reserva da minha vaga!_`
    window.open(`https://api.whatsapp.com/send?phone=${infoBarbeiro.whats}&text=${encodeURIComponent(textoMensagem)}`, '_blank')
  }

  function formatarData(data) {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  // 🟢 FUNÇÃO DE BLOQUEIO DE DIAS CORRIGIDA
  function verificarDiaBloqueado(dataString) {
    if (!dataString) return false;
    
    const hoje = new Date();
    // Zera as horas para comparar apenas datas limpas
    const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const dataAlvo = new Date(ano, mes - 1, dia);
    
    // 1. Dias anteriores a hoje são sempre bloqueados
    if (dataAlvo < hojeZerado) return true;
    
    // 2. Trava de segurança: impede o agendamento de pular para semanas futuras distantes
    const diferencaDias = (dataAlvo - hojeZerado) / (1000 * 60 * 60 * 24);
    if (diferencaDias > 6) return true;

    const diaSemanaHoje = hoje.getDay();
    const horaHoje = hoje.getHours();
    const diaSemanaAlvo = dataAlvo.getDay();

    // 3. Define qual das duas janelas de agendamento está aberta agora
    let janelaAberta = 0; // 1 = Segunda a Quarta | 2 = Quinta a Domingo
    
    if (
      (diaSemanaHoje === 0 && horaHoje >= 21) || // Domingo depois das 21h
      (diaSemanaHoje === 1) ||                   // Segunda-feira (o dia todo)
      (diaSemanaHoje === 2) ||                   // Terça-feira (o dia todo)
      (diaSemanaHoje === 3 && horaHoje < 21)     // Quarta-feira antes das 21h
    ) {
      janelaAberta = 1;
    } else {
      janelaAberta = 2; // Quarta 21h+ até Domingo 20:59
    }

    // 4. Mapeia se o dia que o cliente clicou faz parte da janela 1 ou 2
    const alvoEhJanela1 = (diaSemanaAlvo === 1 || diaSemanaAlvo === 2 || diaSemanaAlvo === 3);
    const alvoEhJanela2 = (diaSemanaAlvo === 4 || diaSemanaAlvo === 5 || diaSemanaAlvo === 6 || diaSemanaAlvo === 0);

    // 5. Aplica a restrição de acordo com a janela aberta no momento
    if (janelaAberta === 1 && !alvoEhJanela1) return true; // Bloqueia quinta a domingo
    if (janelaAberta === 2 && !alvoEhJanela2) return true; // Bloqueia segunda a quarta

    return false; // Permite o agendamento
  }

  function checarHorarioOcupado(horario) {
    const registroNuvem = listaAgendamentos.find(item => item.data === dataSelecionada && item.barbeiro === barbeiroSelecionado && item.horario === horario)
    if (registroNuvem) {
      if (registroNuvem.status === 'fixo_cancelado') return { ocupado: false, motivo: '' }
      if (registroNuvem.status === 'bloqueado_barbeiro') return { ocupado: true, motivo: 'Indisponível' }
      return { ocupado: true, motivo: registroNuvem.cliente }
    }

    if (dataSelecionada) {
      const hoje = new Date()
      const anoH = hoje.getFullYear()
      const mesH = String(hoje.getMonth() + 1).padStart(2, '0')
      const diaH = String(hoje.getDate()).padStart(2, '0')
      const dataHojeLocal = `${anoH}-${mesH}-${diaH}`

      if (dataSelecionada === dataHojeLocal) {
        const horaAtual = hoje.getHours()
        const horaSlot = Number(horario.split(':')[0])
        if (horaSlot <= horaAtual) {
          return { ocupado: true, motivo: 'Horário Passou' }
        }
      }
    }

    if (dataSelecionada) {
      const [ano, mes, dia] = dataSelecionada.split('-').map(Number)
      const diaSemana = new Date(ano, mes - 1, dia).getDay()

      const fixoNuvem = listaFixosNuvem.find(f => f.barbeiro === barbeiroSelecionado && f.diaSemana === diaSemana && f.horario === horario)
      if (fixoNuvem) return { ocupado: true, motivo: fixoNuvem.cliente }

      if (barbeiroSelecionado === 'Brendon') {
        const fixoPadrao = clientesFixosPadraoBrendon.find(f => f.diaSemana === diaSemana && f.horario === horario)
        if (fixoPadrao) return { ocupado: true, motivo: fixoPadrao.cliente }
      }
    }
    return { ocupado: false, motivo: '' }
  }

  function validarAcessoBarbeiro(e) {
    e.preventDefault()
    if (senhaInput === SENHA_BARBEIRO) { setAutenticado(true); setSenhaInput('') } 
    else { alert('Senha incorreta!'); setSenhaInput('') }
  }

  // 📊 CÁLCULOS DO DASHBOARD
  const hojeCalc = new Date()
  const dataHojeString = `${hojeCalc.getFullYear()}-${String(hojeCalc.getMonth() + 1).padStart(2, '0')}-${String(hojeCalc.getDate()).padStart(2, '0')}`
  const mesAtual = hojeCalc.getMonth()

  const agendamentosBarbeiro = listaAgendamentos.filter(item => item.barbeiro === barbeiroPainel && item.status !== 'fixo_cancelado' && item.status !== 'bloqueado_barbeiro')
  const agendamentosConcluidos = agendamentosBarbeiro.filter(item => item.status === 'concluido')

  const faturamentoHoje = agendamentosConcluidos.filter(item => item.data === dataHojeString).reduce((total, item) => total + item.valor, 0)
  const faturamentoMes = agendamentosConcluidos.filter(item => { const [, mes] = item.data.split('-').map(Number); return (mes - 1) === mesAtual }).reduce((total, item) => total + item.valor, 0)
  const clientesAtendidosMes = agendamentosConcluidos.filter(item => { const [, mes] = item.data.split('-').map(Number); return (mes - 1) === mesAtual }).length

  function obterLinhaDoTempoDoDia() {
    if (!dataFiltroPainel) return []
    const [ano, mes, dia] = dataFiltroPainel.split('-').map(Number)
    const diaSemana = new Date(ano, mes - 1, dia).getDay()
    const todosHorariosDia = obterHorariosDisponiveis(barbeiroPainel, dataFiltroPainel)
    
    return todosHorariosDia.map(horario => {
      const regNuvem = listaAgendamentos.find(item => item.data === dataFiltroPainel && item.barbeiro === barbeiroPainel && item.horario === horario)
      
      if (regNuvem && regNuvem.status !== 'fixo_cancelado') {
        if (regNuvem.status === 'bloqueado_barbeiro') return { horario, cliente: 'Bloqueio Manual', tipo: 'Bloqueio', status: 'bloqueado', item: regNuvem }
        return { horario, cliente: regNuvem.cliente, tipo: 'Site', status: regNuvem.status, item: regNuvem }
      }

      const fixoNuvem = listaFixosNuvem.find(f => f.barbeiro === barbeiroPainel && f.diaSemana === diaSemana && f.horario === horario)
      if (fixoNuvem && (!regNuvem || regNuvem.status !== 'fixo_cancelado')) return { horario, cliente: fixoNuvem.cliente, tipo: 'Fixo', status: 'fixo', item: fixoNuvem }

      if (barbeiroPainel === 'Brendon') {
        const fixoPadrao = clientesFixosPadraoBrendon.find(f => f.diaSemana === diaSemana && f.horario === horario)
        if (fixoPadrao && (!regNuvem || regNuvem.status !== 'fixo_cancelado')) return { horario, cliente: fixoPadrao.cliente, tipo: 'Fixo', status: 'fixo', item: fixoPadrao }
      }
      return { horario, cliente: 'Livre / Disponível', tipo: 'Livre', status: 'livre', item: null }
    })
  }

  const linhaDoTempoHoje = obterLinhaDoTempoDoDia()
  const diasNomesMap = ['Domingo', 'Segunda', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

  function obterHorariosDoDiaSemana(diaSemana) {
    if (diaSemana === 2) return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 3) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
    if (diaSemana === 4) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 5) return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    if (diaSemana === 6) return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
  }

  const quadroGeralFormDia = obterHorariosDoDiaSemana(Number(novoFixoDia)).map(h => {
    const fixoNuvem = listaFixosNuvem.find(f => f.barbeiro === barbeiroPainel && f.diaSemana === Number(novoFixoDia) && f.horario === h)
    if (fixoNuvem) return { horario: h, cliente: fixoNuvem.cliente, ocupado: true, idNuvem: fixoNuvem.id }
    if (barbeiroPainel === 'Brendon') {
      const fixoPadrao = clientesFixosPadraoBrendon.find(f => f.diaSemana === Number(novoFixoDia) && f.horario === h)
      if (fixoPadrao) return { horario: h, cliente: fixoPadrao.cliente, ocupado: true, idNuvem: null }
    }
    return { horario: h, cliente: 'Livre / Disponível', ocupado: false, idNuvem: null }
  })

  const folgasBarbeiroPainel = configBarbeiros[barbeiroPainel]?.folgas || (barbeiroPainel === 'Brendon' ? [0, 1] : [])
  const servicosBarbeiroPainel = configBarbeiros[barbeiroPainel]?.servicos || tabelaServicos
  const galeriaBarbeiroPainel = configBarbeiros[barbeiroPainel]?.galeria || fotosCarrossel
  const meusAgendamentosPesquisa = listaAgendamentos.filter(ag => ag.telefone === telefoneBusca && ag.status === 'pendente')

  return (
    <div className="container" style={{ paddingBottom: passo === 1 && carrinho.length > 0 ? '100px' : '20px' }}>
      <header className="barber-header">
        <img src="/logo-barbearia.jpeg" alt="Logo Barbearia de Castro Cort's" className="logo-oficial" onClick={() => setPasso(6)} style={{ cursor: 'pointer' }} />
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
             <p className="instrucao" style={{ margin: 0 }}>Selecione seus serviços:</p>
             <button onClick={() => setPasso(7)} style={{ backgroundColor: '#1e1e1e', color: '#eccc68', border: '1px solid #eccc68', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
               Desmarcar Horário ❌
             </button>
          </div>

          <div className="lista-servicos">
            {tabelaServicos.map((servico) => {
              const estaNoCarrinho = carrinho.some(item => item.id === servico.id)
              return (
                <div key={servico.id} className={estaNoCarrinho ? 'card-servico-item item-selecionado' : 'card-servico-item'}>
                  <div className="servico-bloco-esquerdo">
                    {servico.imagem ? <img src={servico.imagem} alt={servico.nome} className="servico-img-miniatura" /> : <div className="servico-img-placeholder">✂️</div>}
                    <div className="servico-info">
                      <h3>{servico.nome} {servico.promo && (<span style={{ fontSize: '10px', backgroundColor: '#eccc68', color: '#000', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>🔥 PROMO TER / QUA</span>)}</h3>
                      <p>⏰ Duração: {servico.duracao}</p>
                      {servico.promo && (<p style={{ fontSize: '10px', color: '#2ed573', fontWeight: 'bold', margin: '2px 0 0 0' }}>Terça e Quarta por R$ 35,00!</p>)}
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
          <input type="date" className="input-data" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} />

          {dataSelecionada && carrinho.some(i => i.nome === 'Corte') && ehDiaPromocional(dataSelecionada) && (
            <div style={{ backgroundColor: '#1b3b22', border: '1px solid #2ed573', padding: '10px', borderRadius: '8px', margin: '10px 0', fontSize: '12px', color: '#2ed573', fontWeight: 'bold' }}>
              🎉 Desconto Aplicado! Promoção de Terça/Quarta: Corte por apenas R$ 35,00!
            </div>
          )}

          {(() => {
            if (dataSelecionada && verificarDiaBloqueado(dataSelecionada)) {
              return <div className="aviso-fechado"><p>🚫 Agenda indisponível! Escolha dias liberados para agendamento.</p></div>
            }

            if (dataSelecionada) {
              const listaHorarios = obterHorariosDisponiveis(barbeiroSelecionado, dataSelecionada);
              if (listaHorarios.length === 0) {
                const diaSemanaSel = new Date(dataSelecionada.split('-').map(Number)[0], dataSelecionada.split('-').map(Number)[1] - 1, dataSelecionada.split('-').map(Number)[2]).getDay()
                return (
                  <div className="aviso-fechado" style={{ marginTop: '15px' }}>
                    {barbeiroSelecionado === 'Brendon' ? (
                      diaSemanaSel === 0 ? <p>😴 O Brendon não atende aos domingos! Atendimentos de terça a sábado.</p> : <p>😴 O Brendon está de folga na segunda-feira! Atendimentos de terça a sábado.</p>
                    ) : <p>😴 O profissional está de folga nesta data!</p>}
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
                          key={horario} disabled={ocupado}
                          className={`btn-horario ${ocupado ? 'horario-bloqueado' : ''}`}
                          style={{ opacity: ocupado ? 0.4 : 1, cursor: ocupado ? 'not-allowed' : 'pointer', backgroundColor: ocupado ? '#444' : '' }}
                          onClick={() => !ocupado && avançarParaIdentificacao(horario)}
                        >
                          {horario} {ocupado ? `(${motivo})` : ''}
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
              <h4 style={{ color: '#eccc68', margin: '0 0 8px 0', fontSize: '14px' }}>📌 Garantia de Reserva (R$ 10,00)</h4>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0 0 10px 0' }}>Para confirmar a sua vaga, faça o envio do sinal via PIX (descontado do total).</p>
              <div style={{ backgroundColor: '#222', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Titular:</strong> {dadosBarbeiros[barbeiroSelecionado]?.titular}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Chave PIX:</strong> {dadosBarbeiros[barbeiroSelecionado]?.pix}</p>
                <button type="button" onClick={() => copiarPix(dadosBarbeiros[barbeiroSelecionado]?.pix)} style={{ backgroundColor: '#eccc68', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>📋 Copiar Chave PIX</button>
              </div>
            </div>
            <button type="submit" className="btn-confirmar" style={{ marginTop: '15px' }}>Avançar e Enviar Comprovante 📲</button>
          </form>
          <button className="btn-voltar" onClick={() => setPasso(3)}>Voltar</button>
        </div>
      )}

      {/* PASSO 5 */}
      {passo === 5 && (
        <div className="card-sucesso conteudo-passo">
          <h2>🔔 Agendamento Reservado!</h2>
          <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>Clique no botão abaixo para abrir o WhatsApp do barbeiro e enviar o comprovante de R$ 10,00!</p>
          <button className="btn-enviar-whats-notificacao" onClick={enviarNotificacaoWhats}>Enviar Comprovante no WhatsApp 💬</button>
          <button className="btn-voltar" style={{ marginTop: '15px' }} onClick={() => { setPasso(1); setCarrinho([]); setDataSelecionada(''); setNomeCliente(''); setTelefoneCliente(''); }}>Novo Agendamento</button>
        </div>
      )}

      {/* PASSO 7: CANCELAR AGENDAMENTO DO CLIENTE */}
      {passo === 7 && (
        <div className="card-secao conteudo-passo">
          <h3>Meus Agendamentos</h3>
          <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>Digite seu número de telefone (WhatsApp) para buscar e cancelar seus horários marcados:</p>
          <input 
            type="tel" 
            placeholder="Seu Telefone (Ex: 11988887777)" 
            className="input-data" 
            value={telefoneBusca} 
            onChange={(e) => setTelefoneBusca(e.target.value)} 
          />

          <div style={{ marginTop: '15px', textAlign: 'left' }}>
            {telefoneBusca.length > 5 && meusAgendamentosPesquisa.length === 0 && (
              <p style={{ fontSize: '12px', color: '#ff4757' }}>Nenhum agendamento encontrado para este número.</p>
            )}
            
            {meusAgendamentosPesquisa.map(ag => (
              <div key={ag.id} style={{ backgroundColor: '#222', padding: '12px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #eccc68' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>{formatarData(ag.data)} às {ag.horario}</p>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#aaa' }}>Profissional: {ag.barbeiro} | Serviço: {ag.servicos}</p>
                <button onClick={() => cancelarAgendamento(ag.id)} style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                  Desmarcar Horário ❌
                </button>
              </div>
            ))}
          </div>
          <button className="btn-voltar" onClick={() => setPasso(1)}>Voltar ao Início</button>
        </div>
      )}

      {/* 🔒 PASSO 6: PAINEL DO BARBEIRO */}
      {passo === 6 && (
        <div className="card-secao conteudo-passo">
          {!autenticado ? (
            <div className="login-barbeiro">
              <h3>🔒 Acesso Interno</h3>
              <p className="instrucao">Digite a senha da equipe para gerenciar a bancada:</p>
              <form onSubmit={validarAcessoBarbeiro} className="formulario-cliente">
                <input type="password" placeholder="Senha de Acesso" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} />
                <button type="submit" className="btn-confirmar">Autenticar 🔑</button>
              </form>
              <button className="btn-voltar" style={{ marginTop: '15px' }} onClick={() => setPasso(1)}>Voltar ao Início</button>
            </div>
          ) : (
            <div className="painel-barbeiro-logado">
              <h2>Agenda do Barbeiro 💈</h2>
              
              <div className="filtros-barbeiro" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                <button className={`btn-horario ${barbeiroPainel === 'Brendon' ? 'selecionado' : ''}`} onClick={() => setBarbeiroPainel('Brendon')}>Brendon</button>
                <button className={`btn-horario ${barbeiroPainel === 'Lucas' ? 'selecionado' : ''}`} onClick={() => setBarbeiroPainel('Lucas')}>Lucas</button>
              </div>

              {/* 💵 DASHBOARD */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>Hoje 💵</span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#2ed573' }}>R$ {faturamentoHoje}</h3>
                </div>
                <div style={{ backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>Mês 🗓️</span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#1e90ff' }}>R$ {faturamentoMes}</h3>
                </div>
                <div style={{ backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>Clientes 👥</span>
                  <h3 style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#ffa502' }}>{clientesAtendidosMes}</h3>
                </div>
              </div>

              {/* 🚫 BLOQUEAR HORÁRIO ESPECÍFICO */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ff4757', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#ff4757', margin: '0 0 8px 0' }}>🚫 Bloquear Horário Específico</h3>
                <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 10px 0' }}>Feche um horário no site (ex: almoço ou saída médica):</p>
                <form onSubmit={bloquearHorarioBarbeiro} style={{ display: 'flex', gap: '6px' }}>
                  <input type="date" value={bloqueioData} onChange={e => setBloqueioData(e.target.value)} required style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '11px' }} />
                  <select value={bloqueioHorario} onChange={e => setBloqueioHorario(e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '11px' }}>
                    {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <button type="submit" style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>Bloquear</button>
                </form>
              </div>

              {/* 🏖️ GERENCIADOR DE DIAS DE FOLGA */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #1e90ff', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#1e90ff', margin: '0 0 8px 0' }}>🏖️ Dias de Folga da Semana</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {diasNomesMap.map((diaNome, idx) => {
                    const ehFolga = folgasBarbeiroPainel.includes(idx)
                    return (
                      <button key={idx} onClick={() => toggleDiaFolga(idx)} style={{ backgroundColor: ehFolga ? '#ff4757' : '#2ed573', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {diaNome} {ehFolga ? '😴 Folga' : '✂️ Trabalha'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 💰 GERENCIADOR DE SERVIÇOS E PREÇOS */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #2ed573', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#2ed573', margin: '0 0 8px 0' }}>💰 Gerenciar Serviços e Preços</h3>
                <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '10px' }}>
                  {servicosBarbeiroPainel.map(serv => (
                    <div key={serv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: '6px 10px', borderRadius: '4px', marginBottom: '4px', fontSize: '11px' }}>
                      <span><strong>{serv.nome}:</strong> R$ {serv.preco},00</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => { const p = prompt(`Novo preço:`, serv.preco); if (p !== null) atualizarPrecoServico(serv.id, p) }} style={{ backgroundColor: '#eccc68', color: '#000', border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Mudar R$ ✏️</button>
                        <button onClick={() => removerServico(serv.id)} style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={adicionarNovoServico} style={{ display: 'flex', gap: '6px' }}>
                  <input type="text" placeholder="Novo Serviço" value={novoServicoNome} onChange={(e) => setNovoServicoNome(e.target.value)} style={{ flex: 2, padding: '6px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '11px' }} />
                  <input type="number" placeholder="R$" value={novoServicoPreco} onChange={(e) => setNovoServicoPreco(e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '11px' }} />
                  <button type="submit" style={{ backgroundColor: '#2ed573', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>+ Criar</button>
                </form>
              </div>

              {/* 📸 GERENCIADOR DE FOTOS */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #eccc68', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#eccc68', margin: '0 0 8px 0' }}>📸 Galeria de Fotos</h3>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
                  {galeriaBarbeiroPainel.map((foto, idx) => (
                    <div key={idx} style={{ position: 'relative', minWidth: '70px', textAlign: 'center' }}>
                      <img src={foto.src} alt={foto.legenda} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                      <button onClick={() => removerFotoGaleria(idx)} style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ff4757', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
                <form onSubmit={adicionarNovaFotoGaleria} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input type="text" placeholder="Link da Imagem (URL ou /foto.jpeg)" value={novaFotoUrl} onChange={(e) => setNovaFotoUrl(e.target.value)} style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '11px' }} />
                  <input type="text" placeholder="Legenda da Foto" value={novaFotoLegenda} onChange={(e) => setNovaFotoLegenda(e.target.value)} style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '11px' }} />
                  <button type="submit" style={{ backgroundColor: '#eccc68', color: '#000', border: 'none', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>+ Adicionar Foto</button>
                </form>
              </div>

              {/* 🛠️ GERENCIAR CLIENTES FIXOS */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #ffa502', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#ffa502', margin: '0 0 8px 0' }}>📌 Gerenciar Clientes Fixos</h3>
                <form onSubmit={adicionarNovoFixo} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={novoFixoDia} onChange={(e) => setNovoFixoDia(Number(e.target.value))} style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '12px' }}>
                      <option value={2}>Terça</option><option value={3}>Quarta</option><option value={4}>Quinta</option><option value={5}>Sexta</option><option value={6}>Sábado</option>
                    </select>
                    <select value={novoFixoHorario} onChange={(e) => setNovoFixoHorario(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '12px' }}>
                      {obterHorariosDoDiaSemana(Number(novoFixoDia)).map(h => {
                        const slotInfo = quadroGeralFormDia.find(q => q.horario === h)
                        return <option key={h} value={h} disabled={slotInfo?.ocupado}>{h} {slotInfo?.ocupado ? `(${slotInfo.cliente})` : '🟢 Livre'}</option>
                      })}
                    </select>
                  </div>
                  <input type="text" placeholder="Nome do Cliente Fixo" value={novoFixoNome} onChange={(e) => setNovoFixoNome(e.target.value)} style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontSize: '12px' }} />
                  <button type="submit" style={{ backgroundColor: '#ffa502', color: '#000', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Adicionar Fixo ➕</button>
                </form>

                <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#eccc68', fontWeight: 'bold', margin: '0 0 6px 0' }}>📋 Grade - {diasNomesMap[novoFixoDia]}:</p>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {quadroGeralFormDia.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: item.ocupado ? '#222' : '#1a1a1a', padding: '6px 10px', borderRadius: '4px', marginBottom: '4px', fontSize: '11px', borderLeft: item.ocupado ? '3px solid #ffa502' : '3px solid #2ed573' }}>
                        <span><strong style={{ color: item.ocupado ? '#ffa502' : '#2ed573' }}>{item.horario}</strong> - <span style={{ color: item.ocupado ? '#fff' : '#666' }}>{item.cliente}</span></span>
                        {item.idNuvem && (<button onClick={() => deletarFixoDefinitivo(item.idNuvem)} style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>Remover 🗑️</button>)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 🕒 LINHA DO TEMPO DIÁRIA */}
              <div style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #eccc68', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#eccc68', margin: '0 0 8px 0' }}>🗓️ Linha do Tempo da Agenda:</h3>
                <input type="date" className="input-data" value={dataFiltroPainel} onChange={(e) => setDataFiltroPainel(e.target.value)} style={{ marginBottom: '15px' }} />
                
                {linhaDoTempoHoje.map((slot, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: slot.status === 'concluido' ? '#1b3b22' : slot.status === 'bloqueado' ? '#3a1515' : slot.tipo === 'Livre' ? '#1a1a1a' : '#222', padding: '10px 14px', borderRadius: '8px', marginBottom: '8px', borderLeft: slot.tipo === 'Fixo' ? '4px solid #ffa502' : slot.status === 'bloqueado' ? '4px solid #ff4757' : slot.tipo === 'Site' ? '4px solid #1e90ff' : '4px solid #444' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{slot.horario}</strong> - <span style={{ fontSize: '13px', color: slot.tipo === 'Livre' ? '#666' : '#fff' }}>{slot.cliente}</span>
                      {slot.tipo !== 'Livre' && (<div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>Tipo: {slot.tipo} {slot.item?.telefone ? `| Whats: ${slot.item.telefone}` : ''}</div>)}
                    </div>
                    <div>
                      {slot.tipo === 'Site' && slot.status !== 'concluido' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => concluirAtendimento(slot.item)} style={{ backgroundColor: '#2ed573', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Concluir 💵</button>
                          <button onClick={() => cancelarAgendamento(slot.item.id)} style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>Desistiu ❌</button>
                        </div>
                      )}
                      {slot.tipo === 'Fixo' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => concluirAtendimento({ cliente: slot.cliente, valor: 40, horario: slot.horario })} style={{ backgroundColor: '#2ed573', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Concluir 💵</button>
                          <button onClick={() => liberarHorarioFixo(slot.item)} style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>Desistiu ❌</button>
                        </div>
                      )}
                      {slot.tipo === 'Bloqueio' && (
                        <button onClick={() => desbloquearHorarioManual(slot.item.id)} style={{ backgroundColor: '#2ed573', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Liberar 🟢</button>
                      )}
                      {slot.status === 'concluido' && (<span style={{ fontSize: '10px', color: '#2ed573', fontWeight: 'bold' }}>✓ Concluído</span>)}
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

export default App
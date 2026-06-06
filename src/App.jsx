import { useState } from 'react'
import './App.css'

function App() {
  const [passo, setPasso] = useState(1) // 1: Serviços, 2: Barbeiro, 3: Data/Horário, 4: Identificação, 5: Sucesso
  const [carrinho, setCarrinho] = useState([]) 
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')

  // 📱 CONFIGURAÇÃO DOS WHATSAPPS DOS BARBEIROS (Coloque o número real com 55 + DDD + Número)
  const whatsAppBarbeiros = {
    Brendon: '5511948260279', // Substitua pelo número real do Brendon
    Lucas: '5511983880215'    // Substitua pelo número real do Lucas
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

  // FOTOS DO CARROSSEL
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

  const horáriosOcupados = []

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

  function finalizarAgendamento(e) {
    e.preventDefault()
    if (nomeCliente.trim() === '' || telefoneCliente.trim() === '') {
      alert('Por favor, preencha o seu nome e telefone.')
      return
    }
    setPasso(5)
  }

  // 🔔 NOVO: Função que monta o texto e redireciona para o WhatsApp do Barbeiro
  function enviarNotificacaoWhats() {
    const numeroWhats = whatsAppBarbeiros[barbeiroSelecionado]
    const listaNomesServicos = carrinho.map(s => s.nome).join(', ')

    // Monta o texto usando quebras de linha e formatação do próprio WhatsApp (*texto* fica em negrito)
    const textoMensagem = `✂️ *NOVO AGENDAMENTO PELO SITE* ✂️\n\n` +
      `👤 *Cliente:* ${nomeCliente}\n` +
      `📱 *WhatsApp:* ${telefoneCliente}\n` +
      `----------------------------------\n` +
      `📦 *Serviço(s):* ${listaNomesServicos}\n` +
      `💈 *Barbeiro Escolhido:* ${barbeiroSelecionado}\n` +
      `📅 *Data:* ${formatarData(dataSelecionada)} (${diaSemana === 6 ? 'Sábado' : 'Dia útil'})\n` +
      `🕒 *Horário:* às ${horarioSelecionado}\n` +
      `----------------------------------\n` +
      `💰 *Valor Total Somado:* R$ ${totalPreco},00\n\n` +
      `_Por favor, reserve essa vaga na sua bancada!_`

    // Codifica o texto para o formato de link da web
    const linkOficial = `https://api.whatsapp.com/send?phone=${numeroWhats}&text=${encodeURIComponent(textoMensagem)}`
    
    // Abre o WhatsApp em uma nova aba
    window.open(linkOficial, '_blank')
  }

  function formatarData(data) {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function pegarDiaSemana(dataString) {
    if (!dataString) return null
    const data = new Date(dataString + 'T00:00:00')
    return data.getDay()
  }

  const diaSemana = pegarDiaSemana(dataSelecionada)

  return (
    <div className="container" style={{ paddingBottom: passo === 1 && carrinho.length > 0 ? '100px' : '20px' }}>
      
      {/* 💈 TOPO COM O LOGO OFICIAL */}
      <header className="barber-header">
        <img 
          src="/logo-barbearia.jpeg" 
          alt="Logo Barbearia de Castro Cort's" 
          className="logo-oficial" 
        />
        <div className="divisor-linha"></div>
      </header>

      {/* 📋 PASSO 1: CARROSSEL DE ENTRADA + TABELA DE SERVIÇOS */}
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
                <div 
                  key={servico.id} 
                  className={estaNoCarrinho ? 'card-servico-item item-selecionado' : 'card-servico-item'}
                >
                  <div className="servico-bloco-esquerdo">
                    {servico.imagem ? (
                      <img src={servico.imagem} alt={servico.nome} className="servico-img-miniatura" />
                    ) : (
                      <div className="servico-img-placeholder">✂️</div>
                    )}
                    <div className="servico-info">
                      <h3>{servico.nome}</h3>
                      <p>⏰ Duração: {servico.duracao}</p>
                    </div>
                  </div>
                  
                  <div className="servico-preco-acao">
                    <span className="preco">R$ {servico.preco},00</span>
                    <button 
                      className={estaNoCarrinho ? 'btn-remover-item' : 'btn-adicionar-item'}
                      onClick={() => toggleServicoNoCarrinho(servico)}
                    >
                      {estaNoCarrinho ? 'Remover ❌' : 'Adicionar ➕'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 🛒 BARRA FIXA DO CARRINHO */}
          {carrinho.length > 0 && (
            <div className="barra-carrinho-fixa">
              <div className="info-carrinho">
                <span className="qtd-itens">{carrinho.length} {carrinho.length === 1 ? 'serviço' : 'serviços'} selecionado(s)</span>
                <span className="valor-total-carrinho">Total: <strong>R$ {totalPreco},00</strong></span>
              </div>
              <button className="btn-avancar-fluxo" onClick={() => setPasso(2)}>
                Escolher Barbeiro ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* 💈 PASSO 2: ESCOLHA DO BARBEIRO */}
      {passo === 2 && (
        <div className="card-secao conteudo-passo">
          <div className="badge-multi-servicos">
            Selecionados: <strong>{carrinho.map(s => s.nome).join(', ')}</strong>
          </div>
          <h3>Com quem você quer agendar?</h3>
          
          <div className="lista-barbeiros">
            <div className="card-barbeiro">
              <div className="clique-selecao" onClick={() => selecionarBarbeiro('Brendon')}>
                <span className="barbeiro-nome">✂️ Brendon</span>
              </div>
              <a href="https://www.instagram.com/brendon_barber01?igsh=enJ6a2lsZ2dwODBk" target="_blank" rel="noopener noreferrer" className="btn-instagram">📸 Ver Portfólio</a>
            </div>

            <div className="card-barbeiro">
              <div className="clique-selecao" onClick={() => selecionarBarbeiro('Lucas')}>
                <span className="barbeiro-nome">✂️ Lucas</span>
              </div>
              <a href="https://www.instagram.com/lc.barbeer011?igsh=MW94aWF1dzl5bmE3aw==" target="_blank" rel="noopener noreferrer" className="btn-instagram">📸 Ver Portfólio</a>
            </div>
          </div>
          
          <button className="btn-voltar" onClick={() => setPasso(1)}>Voltar</button>
        </div>
      )}

      {/* 🕒 PASSO 3: ESCOLHA DA DATA E DO HORÁRIO */}
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

          {dataSelecionada && diaSemana === 0 && (
            <div className="aviso-fechado">
              <p>🚫 Barbearia Fechada aos Domingos!</p>
              <span>Por favor, selecione outra data no calendário acima.</span>
            </div>
          )}

          {dataSelecionada && diaSemana !== 0 && (
            <div className="secao-horas-animada">
              <h3>
                2. Horários para o {diaSemana === 6 ? 'Sábado' : 'Dia útil'} ({formatarData(dataSelecionada)}):
              </h3>
              
              {diaSemana === 6 && (
                <p className="badge-sabado">⚠️ Agenda de Sábado costuma lotar rápido!</p>
              )}

              <div className="grade-horarios">
                {horariosPadrao.map((horario) => {
                  const estaOcupado = horáriosOcupados.includes(horario)
                  
                  return (
                    <button 
                      key={horario} 
                      disabled={estaOcupado}
                      className={estaOcupado ? 'btn-horario ocupado' : 'btn-horario'}
                      onClick={() => avançarParaIdentificacao(horario)}
                    >
                      {horario}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <button className="btn-voltar" onClick={() => setPasso(2)}>Voltar</button>
          </div>
        </div>
      )}

      {/* 👤 PASSO 4: IDENTIFICAÇÃO DO CLIENTE */}
      {passo === 4 && (
        <div className="card-secao conteudo-passo">
          <h3>Para quem é o agendamento?</h3>
          <p style={{ marginBottom: '20px', color: '#ccc' }}>Insira seus dados para confirmar a reserva na agenda do {barbeiroSelecionado}.</p>
          
          <form onSubmit={finalizarAgendamento} className="formulario-cliente">
            <div className="campo-input">
              <label>Seu Nome Completo:</label>
              <input type="text" placeholder="Ex: Pedro Silva" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
            </div>

            <div className="campo-input">
              <label>Telefone para Contato (WhatsApp):</label>
              <input type="tel" placeholder="Ex: (11) 99999-9999" value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} />
            </div>

            <button type="submit" className="btn-confirmar">Confirmar Agendamento 📅</button>
          </form>

          <button className="btn-voltar" onClick={() => setPasso(3)}>Voltar para Horários</button>
        </div>
      )}

      {/* 🎉 PASSO 5: TELA DE SUCESSO COM BOTÃO DO WHATSAPP */}
      {passo === 5 && (
        <div className="card-sucesso conteudo-passo">
          <h2>🔔 Agendamento Recebido!</h2>
          <p>Para concluir, você precisa enviar o comprovante para o barbeiro aprovar:</p>
          
          <div className="detalhes-finais">
            <p><strong>Cliente:</strong> {nomeCliente}</p>
            <p><strong>Contato:</strong> {telefoneCliente}</p>
            <hr />
            <p><strong>Serviços Contratados:</strong></p>
            <ul style={{ textAlign: 'left', paddingLeft: '20px', margin: '10px 0', color: '#e2e8f0' }}>
              {carrinho.map(item => (
                <li key={item.id} style={{ marginBottom: '4px' }}>
                  ⚡ {item.nome} — <span style={{ color: '#63b3ed' }}>R$ {item.preco},00</span>
                </li>
              ))}
            </ul>
            <hr />
            <p><strong>Barbeiro:</strong> {barbeiroSelecionado}</p>
            <p><strong>Data:</strong> {formatarData(dataSelecionada)} ({diaSemana === 6 ? 'Sábado' : 'Dia útil'})</p>
            <p><strong>Horário Reservado:</strong> às {horarioSelecionado}</p>
            <p style={{ fontSize: '1.2rem', marginTop: '15px', color: '#48bb78' }}>
              <strong>Valor Total:</strong> R$ {totalPreco},00
            </p>
          </div>
          
          {/* 💬 BOTÃO DE ENVIAR PARA O WHATSAPP DO BARBEIRO SELECIONADO */}
          <button className="btn-enviar-whats-notificacao" onClick={enviarNotificacaoWhats}>
            Enviar Confirmação para o {barbeiroSelecionado} no WhatsApp 💬
          </button>

          <p className="aviso-sistema" style={{ marginTop: '25px' }}>📌 Esta vaga foi pré-bloqueada no sistema.</p>

          <button className="btn-voltar" style={{ marginTop: '10px' }} onClick={() => {
            setPasso(1)
            setCarrinho([])
            setBarbeiroSelecionado('')
            setDataSelecionada('')
            setHorarioSelecionado('')
            setNomeCliente('')
            setTelefoneCliente('')
          }}>
            Novo Agendamento
          </button>
        </div>
      )}
    </div>
  )
}

export default App
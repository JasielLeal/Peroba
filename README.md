# Peroba — boletos com lembrete por WhatsApp

PWA mobile-first (Next.js + Postgres no Neon) para cadastrar boletos. Dois dias antes do vencimento
(configurável), manda uma mensagem de WhatsApp com valor, data e linha digitável.

## Rodar

```bash
npm install
cp .env.example .env.local   # edite os valores
npm run dev                  # desenvolvimento
npm run build && npm start   # produção
```

Requer Node 20+ e um banco no [Neon](https://neon.tech): cole a string de conexão em `DATABASE_URL`.
A tabela `boletos` é criada sozinha na primeira consulta.

## Cadastro por foto

"Novo boleto" abre a câmera do celular. A foto (ou um PDF, pelo botão "Foto ou PDF" dentro do cadastro) é
enviada junto com 7 faixas ampliadas (o modelo reduz a imagem inteira e borra números miúdos; com as faixas a linha digitável sai legível) para `/api/boleto`, onde um modelo de visão da OpenAI (`gpt-5.4` por padrão) extrai linha digitável, valor,
vencimento, beneficiário e número do documento. O app **não confia cegamente na leitura**: a linha digitável
só é aceita se os dígitos verificadores conferem, e valor e vencimento são conferidos com os que estão
embutidos no próprio código. Se algo não bater, o formulário mostra um aviso. O tipo (imposto / distribuidora)
é sugerido e pode ser alterado. Requer `OPENAI_API_KEY` (modelo trocável em `OPENAI_MODEL`). Se a linha digitável vier com 1 dígito errado, o app o corrige sozinho quando só há uma correção possível que fecha nos dígitos verificadores e no valor impresso; havendo mais de uma, a IA escolhe olhando a imagem; se nada fechar, a linha fica em branco. PDF é a melhor entrada. A foto não é guardada; só vai para a API para ler.

## Como funciona o lembrete

- `instrumentation.ts` roda um agendador dentro do servidor (uma vez por dia, depois de `LEMBRETE_HORA`,
  horário de Brasília). Só funciona onde o servidor fica ligado (VPS, Docker). Em hospedagem serverless
  (ex.: Vercel) ele não roda: use um cron chamando `GET /api/lembretes` com `x-cron-secret` ou
  `Authorization: Bearer <CRON_SECRET>` (formato do Vercel Cron).
- Um boleto é avisado **uma única vez** (`avisado_em`), e só se faltarem 0 a `LEMBRETE_DIAS` dias.
  Se o envio falhar, tenta de novo no ciclo seguinte.
- Botão "Enviar lembretes agora" na tela inicial para testar.

## WhatsApp (Evolution API + chip dedicado)

1. Suba a [Evolution API](https://doc.evolution-api.com) (Docker, num VPS ou na sua máquina).
2. Crie uma instância (ex.: `peroba`) e escaneie o QR code com o WhatsApp do chip novo.
3. Preencha `EVOLUTION_*` e `WHATSAPP_DESTINO` no `.env.local`.

Aviso: API não oficial viola os termos do WhatsApp e o número pode ser banido. Para poucas mensagens
a uma pessoa que espera recebê-las o risco é baixo, mas use um chip separado. Para migrar para a API
oficial da Meta, troque apenas `lib/whatsapp.ts`.

## Segurança

Acesso por uma senha única (`APP_SENHA`) e cookie assinado. Troque `SESSION_SECRET` e `APP_SENHA`
antes de publicar e use HTTPS. O `.env.local` atual tem valores de desenvolvimento
(senha `peroba123`).

## Instalar no celular

Abra o endereço no Chrome/Safari e use "Adicionar à tela inicial".

## Análises

A aba **Análises** mostra, por mês: total, pago x pendente, divisão entre Distribuidora / Imposto / Outros,
ranking de distribuidoras (valor e quantidade de boletos), evolução de 6 meses e indicadores
(em atraso, próximos 7 dias, valor médio, maior boleto). Para isso, cada boleto tem um **tipo** e,
no caso de distribuidoras, o **nome da distribuidora**. Boletos antigos ficam como "Outros".


## Publicar na Vercel

1. Suba o projeto para um repositório e importe na Vercel (framework Next.js, sem configurar build).
2. Em **Settings > Environment Variables**, cadastre as mesmas variáveis do `.env.example`:
   `DATABASE_URL`, `APP_SENHA`, `SESSION_SECRET`, `EVOLUTION_URL`, `EVOLUTION_API_KEY`,
   `OPENAI_API_KEY`, `EVOLUTION_INSTANCE`, `WHATSAPP_DESTINO`, `NOME_DESTINO`, `LEMBRETE_DIAS` e `CRON_SECRET`.
3. O `vercel.json` já define o cron diário (`/api/lembretes` às 08:00 UTC = 5h de Brasília) e a região
   `gru1` (São Paulo), perto de um banco Neon `sa-east-1`. A Vercel envia o `CRON_SECRET` sozinha no
   cabeçalho `Authorization`. Trocar o horário: ajuste o `schedule` (sempre em UTC; o plano Hobby
   permite no máximo 1 execução por dia, com atraso de até 1 hora).
4. `EVOLUTION_URL` precisa ser um endereço **público com HTTPS** (a Evolution API num VPS). `localhost`
   não é alcançável a partir da Vercel.
5. `LEMBRETE_HORA` só vale em servidor próprio e é ignorada na Vercel.
# Peroba

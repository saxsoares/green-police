---
name: conector-gov-br
description: Procedimento completo para adicionar, alterar ou depurar um conector de API governamental no SIMIA-Verde (rota proxy no server.ts, função cliente, tipos, catálogo e consumo na view). Use ao integrar nova fonte de dados (órgão, satélite, WFS, base cadastral), ao corrigir rota /api/* quebrada, ou quando um órgão mudar schema/endpoint.
---

# Adicionar ou corrigir um conector governamental

Todo dado externo do SIMIA-Verde entra por cinco pontos. Pular qualquer um deixa o conector
tecnicamente funcional mas invisível ou não auditável.

## Passo 1 — Tipos (`src/types.ts`)

Declare o shape da resposta **antes** de escrever a chamada. Se o dado alimenta contexto pericial,
envelope em `ItemContexto<T>` para carregar `fonte`, `confiabilidade`, `dataConsultaUtc` e
`observacoes`.

```ts
export interface RespostaNovoOrgao {
  sucesso: boolean;
  registros: Array<{ /* campos reais do órgão */ }>;
  fonte: string;
  erro?: string;
}
```

## Passo 2 — Rota proxy (`server.ts`)

Coloque junto das rotas do mesmo domínio. Template obrigatório:

```ts
app.get('/api/novo-orgao', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ sucesso: false, erro: 'Latitude e longitude são obrigatórias' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
      const url = `https://orgao.gov.br/api/...`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'SIMIA-Verde-SENASP/1.0' }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(502).json({
          sucesso: false,
          erro: `Órgão retornou status ${response.status}`,
          fonte: 'NOME DO ÓRGÃO'
        });
      }

      const data = await response.json();
      // Valide o SHAPE: um 200 com página HTML de erro é comum em API gov.br
      if (!data || typeof data !== 'object') {
        return res.status(502).json({ sucesso: false, erro: 'Resposta fora do formato esperado', fonte: 'NOME DO ÓRGÃO' });
      }

      return res.json({ sucesso: true, registros: data.features ?? [], fonte: 'NOME DO ÓRGÃO' });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      throw fetchErr;
    }
  } catch (err: any) {
    console.error('Erro na rota /api/novo-orgao:', err.message);
    return res.status(502).json({ sucesso: false, erro: err.message, fonte: 'NOME DO ÓRGÃO' });
  }
});
```

Checklist da rota:
- [ ] `AbortController` com timeout (9 s é o padrão do projeto)
- [ ] `User-Agent: SIMIA-Verde-SENASP/1.0` — vários órgãos bloqueiam agente anônimo
- [ ] validação de shape, não só de status
- [ ] **em falha, devolve falha** — nunca dado sintético, nunca default plausível
- [ ] `fonte` sempre presente, em sucesso e em erro
- [ ] credencial lida de `process.env`, nunca de query pública sem necessidade; se puder vir da
      query (caso NASA), mascare em qualquer log ou eco
- [ ] cache em memória com TTL se o órgão for lento ou tiver rate limit (veja `sipamCache`, 60 s)

## Passo 3 — Função cliente (`src/services/apiConnectors.ts`)

```ts
export async function fetchNovoOrgao(coords: CoordenadaGeo): Promise<RespostaNovoOrgao> {
  try {
    const res = await fetch(`/api/novo-orgao?lat=${coords.lat}&lng=${coords.lng}`);
    if (!res.ok) throw new Error(`Proxy retornou ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error('Falha ao consultar NOVO ÓRGÃO:', err.message);
    return { sucesso: false, registros: [], fonte: 'NOME DO ÓRGÃO', erro: err.message };
  }
}
```

O `catch` devolve `sucesso: false` e lista vazia — **não** um registro inventado. Quem consome
converte isso em `confiabilidade: 'INDISPONIVEL'`.

## Passo 4 — Catálogo (`CATALOGO_APIS_PUBLICAS`)

Sem esta entrada o conector não aparece na aba "Conectores & APIs" e não pode ser diagnosticado pelo
operador.

```ts
{
  id: 'novo-orgao',
  nome: 'Nome do Sistema',
  orgaoOuFornecedor: 'Órgão / Ministério',
  tipoDado: 'O que fornece',
  endpointUrl: 'https://orgao.gov.br/api/...',
  autenticacao: 'Aberta / Sem Chave',
  status: 'Ativo',
  descricao: 'O que a fonte entrega tecnicamente.',
  beneficioPolicial: 'Que pergunta investigativa ou tática isso responde.'
}
```

`beneficioPolicial` não é enfeite: é o que justifica a fonte perante o operador e o laudo.

## Passo 5 — Consumo

- Se alimenta o dossiê: entra como etapa numerada em `processarOcorrencia()`
  ([analyzer.ts](src/services/analyzer.ts)), na ordem, montando um `ItemContexto<T>` com
  `confiabilidade` derivada de `sucesso`.
- Se é consulta exploratória do operador: entra em `SatellitesView` ou em view própria.
- Se o dado aparece no laudo: adicione a linha correspondente em
  [reportRenderer.ts](src/services/reportRenderer.ts), **com a coluna de confiabilidade**.

## Verificação

```bash
npm run lint
npm run dev
curl "http://localhost:3000/api/novo-orgao?lat=-21.1767&lng=-47.8208"
```

Teste também o caminho de falha: derrube a rede ou aponte para host inválido e confirme que a UI
mostra `INDISPONIVEL` com mensagem acionável — e não um valor bonito.

## Cobertura geográfica

Se a fonte cobre apenas parte do Brasil (o DATAGEO/SIGAMgeo cobre só SP), isso precisa estar na
`descricao`, e fora da área de cobertura o resultado é `INDISPONIVEL` **com observação explicando**,
nunca um vazio silencioso. O operador não pode confundir "não há registro" com "esta base não cobre
esta UF".

---
name: nova-view-tatica
description: Procedimento para criar uma aba/view nova no SIMIA-Verde seguindo o padrão visual tático e as regras de exibição de confiabilidade. Use ao adicionar funcionalidade que precisa de tela própria, ao criar sub-aba em SatellitesView, ou ao construir qualquer componente em src/components/.
---

# Criar uma view tática

## Os cinco pontos de integração

**1. Registrar a aba** — [Sidebar.tsx](src/components/Sidebar.tsx)

```ts
export type ActiveTab =
  | 'ingestion' | 'satellites' | 'map' | 'report'
  | 'directives' | 'custody' | 'connectors' | 'decisions'
  | 'nova-aba';
```

E a entrada no array de navegação:

```ts
{
  id: 'nova-aba',
  label: 'Nome Curto',        // o que a força de segurança chama disso
  sublabel: 'Qualificador',   // fontes ou função: "SIPAM, INPE e NASA"
  icon: IconeLucide
}
```

**2. Criar o componente** — `src/components/views/NovaView.tsx`

```tsx
import React from 'react';
import { OcorrenciaCompleta } from '../../types';

interface NovaViewProps {
  ocorrencia: OcorrenciaCompleta;
}

export function NovaView({ ocorrencia }: NovaViewProps) {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-100">Título Operacional</h2>
        <p className="text-sm text-slate-400">Para que serve, em uma linha.</p>
      </header>
      {/* conteúdo */}
    </div>
  );
}
```

**3. Ligar no App** — import + branch de render em [App.tsx](src/App.tsx).

**4. Estado vazio** — quando não há ocorrência ativa, renderize `EmptyState`, não uma tela quebrada.

**5. `npm run lint`** antes de concluir.

## Padrão visual

O tema é **claro** e institucional — não há modo escuro no sistema.

```
fundo página     bg-slate-50 / bg-sky-50
cartão           bg-white border border-slate-200 rounded-xl
título           text-slate-900 font-semibold
texto secundário text-slate-600 text-sm
mono / dado      font-mono text-xs
```

Semântica de cor — use sempre com este significado, no par `bg-*-50 text-*-700 border-*-200`:

| Cor | Significado |
|---|---|
| `emerald` | confirmado, `REAL`, conector operacional, base sincronizada |
| `amber` | atenção, parcial, verificação manual, dossiê somente local |
| `rose` | risco crítico, alerta operacional |
| `red` | `INDISPONIVEL`, falha de fonte |
| `sky` | informativo, neutro |

Tailwind 4 pelo plugin Vite: **não há `tailwind.config.js`**. Token customizado vai em `@theme`
dentro de [index.css](src/index.css). Ícones só de `lucide-react`.

## Componente de confiabilidade

Todo dado vindo de API aparece com origem e selo. Padrão reutilizável:

```tsx
function SeloConfiabilidade({ item }: { item: ItemContexto<unknown> }) {
  const estilo = {
    REAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SIMULADO: 'bg-amber-50 text-amber-700 border-amber-200',
    INDISPONIVEL: 'bg-red-50 text-red-700 border-red-200'
  }[item.confiabilidade];

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${estilo}`}
          title={`${item.fonte} — consulta em ${item.dataConsultaUtc}`}>
      {item.confiabilidade}
    </span>
  );
}
```

`INDISPONIVEL` nunca é escondido atrás de um traço ou de um espaço em branco: o operador precisa
distinguir "não há registro" de "não consegui consultar". Quando houver `observacoes`, exiba-as.

## Regras de UI do domínio

1. Coordenadas com 6 casas decimais, com datum, copiáveis.
2. Horários em UTC, rotulados.
3. Toda consulta a órgão tem estado de carregamento visível — elas levam segundos e falham.
4. Erro de API vira mensagem acionável nomeando o órgão e o que fazer, não `console.error`.
5. Listas de focos podem ter milhares de itens: pagine ou limite explicitamente, e diga que limitou.
6. Se a view for imprimível, trate `@media print` para A4.

## Sub-aba em SatellitesView

[SatellitesView.tsx](src/components/views/SatellitesView.tsx) tem ~1800 linhas e 4 sub-abas (SIPAM,
INPE, NASA, Tríplice Validação). Localize a sub-aba correta antes de editar. Se for adicionar uma
quinta, extraia as sub-abas para arquivos separados primeiro — o arquivo já passou do limite
saudável.

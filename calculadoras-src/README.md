# Salário na Real — calculadoras CLT e PJ 2026

Site estático de calculadoras trabalhistas: **salário líquido, CLT x PJ, rescisão, férias e 13º**, com as tabelas oficiais de 2026 (incluindo a isenção do IR até R$ 5 mil da Lei 15.270/2025).

O site é publicado em `/calculadoras/` deste repositório pelo GitHub Pages e já fica pronto para receber anúncios (Google AdSense), links de afiliado, um produto próprio e apoio via Pix — tudo ligado por configuração, sem mexer em código.

## Por que este projeto dá dinheiro com pouco trabalho

- **Demanda que se repete todo mês:** milhões de buscas no Google por "salário líquido", "rescisão", "CLT ou PJ", "13º". Isso não acaba — e cresce em novembro/dezembro (13º) e em janeiro (tabelas novas).
- **Custo zero de operação:** é um site estático no GitHub Pages. Não há servidor, banco de dados nem mensalidade. O único custo recomendado é um domínio (cerca de R$ 40/ano em registro.br).
- **Manutenção de uma vez por ano:** as tabelas mudam em janeiro. Um fluxo do GitHub abre uma issue de lembrete com o checklist, e o site avisa os visitantes se as tabelas ficarem velhas.
- **Três fontes de receita no mesmo tráfego:** anúncios (todas as páginas), afiliados de contabilidade online (na calculadora CLT x PJ, onde o visitante está decidindo abrir CNPJ) e produto próprio.

### Expectativa realista

Não existe dinheiro sem nenhum esforço — o esforço aqui é concentrado no começo e quase todo já foi feito. O que ainda depende de você:

1. Tráfego orgânico leva tempo: conte com **3 a 6 meses** até o Google posicionar bem as páginas. O nicho é concorrido; o diferencial deste site é ser rápido, correto, mostrar a conta e ter a comparação CLT x PJ mais completa.
2. Anúncios pagam por mil visualizações e, em finanças no Brasil, isso fica na casa das dezenas de reais por mil páginas vistas. Ou seja: para R$ 1.000 por mês só com anúncios, são necessárias dezenas de milhares de visitas por mês.
3. Afiliados e produto próprio rendem muito mais por visitante. Uma única abertura de empresa indicada costuma valer mais que milhares de visualizações de anúncio.

## Passo a passo para monetizar

| # | O que fazer | Tempo | Onde |
|---|---|---|---|
| 1 | Publicar: fazer merge desta branch na `main` | 1 min | GitHub |
| 2 | Comprar um domínio (ex.: `salarionareal.com.br`) e apontar para o GitHub Pages | 30 min | registro.br + Settings → Pages → Custom domain |
| 3 | Atualizar `siteUrl` em `site.config.mjs` e rodar `npm run build` | 5 min | este repositório |
| 4 | Cadastrar o site no Google Search Console e enviar o `sitemap.xml` | 15 min | search.google.com/search-console |
| 5 | Divulgar a calculadora CLT x PJ (LinkedIn, comunidades de tecnologia, grupos de RH) | 1 h | redes sociais |
| 6 | Entrar em programas de afiliados de contabilidade online e preencher `afiliadoContabilidade` | 1 h | sites das contabilidades |
| 7 | Com algum tráfego, pedir aprovação no Google AdSense e preencher `adsenseClient` | 30 min | adsense.google.com |
| 8 | (Opcional) Criar um produto (ex.: planilha de planejamento para PJ) e preencher `produto` | variável | Hotmart, Kiwify ou Gumroad |
| 9 | (Opcional) Preencher `pix` para receber apoio voluntário | 2 min | `site.config.mjs` |

Observações:

- O AdSense não aprova subdomínios de `github.io`; por isso o domínio próprio (passo 2) é importante. O site já tem o que o AdSense pede: conteúdo original, página "Sobre", política de privacidade e navegação clara. Ative também a mensagem de consentimento do próprio Google em AdSense → Privacidade e mensagens.
- Links de afiliado são marcados como `rel="sponsored"` e o site mostra o aviso de comissão, como exigem o Google e as regras de publicidade.
- Para medir resultados sem cookies, crie uma conta gratuita no GoatCounter e preencha `analytics.goatcounter`. Os eventos de cálculo, compartilhamento e clique em parceiro são registrados automaticamente.

## Configuração

Tudo fica em [`site.config.mjs`](site.config.mjs). Campos vazios ficam desligados e não aparecem no site. Depois de editar, rode `npm run build` e faça commit — ou peça ao Claude para fazer isso.

## Comandos

Requer Node.js 20 ou mais recente. Não há dependências para instalar.

```bash
cd calculadoras-src
npm test          # testes do motor de cálculo (valores conferidos com exemplos publicados)
npm run build     # gera o site em ../calculadoras, o robots.txt e o ads.txt
npm run check     # confere links, SEO, dados estruturados e sitemap do site gerado
npm run serve     # abre o site em http://localhost:8080/calculadoras/
npm run e2e       # testa as calculadoras no Chromium (requer Playwright)
npm run og        # regenera a imagem de compartilhamento (requer Playwright)
```

A cada push, o GitHub Actions roda os testes, confere se o site publicado está igual ao gerado e testa as calculadoras no navegador.

## Estrutura

```
calculadoras-src/
├── site.config.mjs        # nome, domínio e monetização
├── build.mjs              # gerador do site
├── src/engine/            # motor de cálculo (roda no navegador e nos testes)
│   └── tabelas.js         # ← única coisa a atualizar todo ano
├── src/pages/             # conteúdo de cada página (textos, FAQ, exemplos)
├── src/site/              # layout, campos de formulário e utilitários de HTML
├── src/ui/                # interface das calculadoras no navegador
├── src/styles/style.css
├── src/static/            # favicon e imagem de compartilhamento
├── tests/                 # testes do motor
└── scripts/               # verificação, servidor local, teste no navegador, imagem OG
```

O build só apaga arquivos que ele mesmo gerou (listados em `.build-manifest.json`) e se recusa a sobrescrever arquivos do portfólio.

## Atualização anual das tabelas

Em janeiro, uma issue é aberta automaticamente com o checklist. Em resumo: atualizar `src/engine/tabelas.js`, ajustar os valores esperados nos testes, rodar `npm test`, `npm run build` e fazer commit.

## Levar para um domínio ou repositório próprio

1. Copie a pasta `calculadoras-src/` para o novo repositório.
2. Em `site.config.mjs`, use `siteUrl: 'https://seudominio.com.br'`, `basePath: '/'` e `raizDominio: '..'`.
3. Rode `npm run build`: o site passa a ser gerado na raiz do novo repositório.

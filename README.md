# Módulo Center

Site estático (HTML + CSS + JS modular) ligado ao Firebase, com **modo de edição ao vivo**.
Não precisa de build nem de npm: o Firebase é carregado por CDN.

```
index.html          site público
admin.html          login do painel
css/style.css       estilos do site
css/admin.css       estilos do modo de edição
js/firebase-config.js   configuração do Firebase
js/site.js          renderização do site + leitura em tempo real do Firestore
js/admin.js         modo de edição (textos, módulos, avaliações, imagens)
js/image-tools.js   compressão invisível das imagens (base64)
js/save-popup.js    pop-up "Salvando imagem" → "Imagem salva"
js/login.js         login (Firebase Authentication)
js/defaults.js      dados iniciais (catálogo e avaliações de exemplo)
js/illustrations.js ilustrações SVG dos módulos
js/search.js        busca tolerante a acentos e erros de digitação
img/logo.jpg        logo padrão
firestore.rules / storage.rules   regras de segurança
```

## 1. Configurar o Firebase (projeto `modulocenter`)

1. **Authentication** → Método de login → ative **E-mail/senha** → aba Usuários → **Adicionar usuário** (seu e-mail e uma senha forte). Copie o **UID** do usuário criado.
2. **Authentication → Configurações → Domínios autorizados** → adicione `SEU-USUARIO.github.io` (ou seu domínio próprio). `localhost` já vem autorizado.
3. **Firestore Database** → Criar banco de dados → aba **Regras** → cole o conteúdo de `firestore.rules`, trocando `COLE_AQUI_O_SEU_UID` pelo UID → Publicar.
4. **Imagens**: não é preciso usar o Storage. As fotos são reduzidas automaticamente e salvas como texto (base64) no próprio Firestore (coleção `imagens` para logo/destaques e campo `photo` dos módulos). Lembre de publicar o `firestore.rules` atualizado (inclui a coleção `imagens`).

> A `apiKey` do Firebase em `firebase-config.js` é pública por design. Quem protege os dados são as **regras** acima. Não pule o passo 3.

## 2. Publicar no GitHub Pages

1. Crie um repositório e envie todos estes arquivos (mantendo as pastas).
2. Settings → Pages → Branch `main`, pasta `/ (root)`.
3. Acesse `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Para testar localmente use um servidor (módulos ES não funcionam abrindo o arquivo direto):
`python3 -m http.server 8000` e abra `http://localhost:8000`.

## 3. Usar o modo de edição

1. Abra `/admin.html` e entre com o e-mail/senha criados.
2. No primeiro acesso, aceite **importar o catálogo inicial** (cria os 16 módulos e 7 avaliações de exemplo no Firestore).
3. Você cai no próprio site em modo de edição:
   - **Texto**: clique e digite (salva sozinho; `Ctrl+S` força o salvamento).
   - **Módulo**: clique no card → editar nome, código, veículos, categoria, **foto**, posição ou excluir. Card `＋ Adicionar módulo` cria novos.
   - **Avaliações**: clique para editar/excluir; `＋ Adicionar avaliação` cria novas.
   - **Logo e imagens dos destaques** do topo: clique na imagem para trocar ou voltar ao padrão.
   - **Configurações**: número do WhatsApp (usado em todos os botões) e telefone do rodapé.
4. As mudanças aparecem para os visitantes em tempo real.

O número de WhatsApp padrão é um placeholder (`5500000000000`): defina o real em **Configurações**.

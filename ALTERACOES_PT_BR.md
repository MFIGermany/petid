# Alterações desta versão

Esta versão foi criada diretamente a partir do pacote `petid(1).zip` fornecido pelo usuário.

Alterações realizadas:

- Tradução da interface e das mensagens exibidas ao usuário para português do Brasil.
- `lang="pt-BR"` no documento HTML.
- Menu desktop preservado no cabeçalho.
- Novo menu responsivo para celular com botão hambúrguer.
- O menu móvel respeita o estado de autenticação:
  - autenticado: Meus pets, Ativar plaquinha e Sair;
  - não autenticado: Entrar e Criar conta.
- O menu pode ser fechado pelo botão, ao tocar em um link ou com a tecla Escape.
- Compatibilidade visual com registros antigos que ainda tenham `Perro`, `Hembra`, `Otra` ou `Otro` no banco.

Não foram alteradas rotas, tabelas, conexão com Supabase, sessão, regras de autenticação ou regras de negócio das tags.

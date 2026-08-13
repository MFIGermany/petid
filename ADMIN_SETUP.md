# Painel administrativo PetID

O painel está disponível em `/admin/login` e usa credenciais independentes das contas de clientes.

## Configuração recomendada

1. Instale as dependências normalmente com `npm install` ou `npm ci`.
2. Gere um hash bcrypt para a senha administrativa:

   `npm run admin:hash -- "uma-senha-forte-com-10-ou-mais-caracteres"`

3. Copie o resultado para `ADMIN_PASSWORD_HASH` no ambiente de produção.
4. Configure também `ADMIN_EMAIL` e, opcionalmente, `ADMIN_NAME`.
5. Não configure `ADMIN_PASSWORD` quando estiver usando `ADMIN_PASSWORD_HASH`.

Exemplo:

- `ADMIN_NAME=Administrador PetID`
- `ADMIN_EMAIL=admin@petid.com.br`
- `ADMIN_PASSWORD_HASH=$2b$12$...`

## O que o painel inclui

- Dashboard com clientes, pets, pets perdidos, plaquinhas ativas, plaquinhas ativadas/vendidas e leituras do mês.
- Listagem paginada de clientes com busca por nome, e-mail, telefone ou nome do pet.
- Ficha completa do cliente com dados cadastrais, pets, contatos, plaquinhas e leituras recentes.
- Edição de nome, e-mail e telefone do cliente.
- Marcar pet como perdido/encontrado.
- Desativar e reativar plaquinhas já vinculadas. Ao reativar uma plaquinha, qualquer outra plaquinha ativa do mesmo pet é desativada para manter apenas uma ativa.
- Exclusão de cliente. As plaquinhas são preservadas no estoque/histórico, desvinculadas do pet e desativadas.

## Observação sobre “plaquinhas vendidas”

O projeto ainda não possui uma tabela de pedidos/vendas. Por isso, no painel, “vendidas/ativadas” significa plaquinhas que já tiveram `activated_at` preenchido pelo menos uma vez. Isso preserva uma métrica útil até existir um módulo comercial próprio.

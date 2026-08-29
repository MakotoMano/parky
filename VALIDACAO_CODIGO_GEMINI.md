# Validação técnica do código sugerido pelo Gemini

O código original apresenta a ideia correta — React chama uma API FastAPI, que persiste a reserva em PostgreSQL — mas não está pronto para uso real sem ajustes.

## O que estava coerente

- Uso de parâmetros `%s` no `INSERT`, evitando injeção SQL no comando.
- Credenciais obtidas por variáveis de ambiente.
- `RETURNING id` para devolver a reserva criada.
- Separação entre frontend, API e banco PostgreSQL.

## Problemas corrigidos nesta implementação

1. O trecho colado em uma linha não é Python válido; os `import` precisam estar separados.
2. Credenciais e endpoint falsos não podem servir como valores padrão em produção.
3. `allow_origins=["*"]` com uma API pública expõe a rota a qualquer site. Agora as origens são configuráveis e restritas.
4. O navegador enviava `valor_total`, permitindo alterar o preço manualmente. A API agora busca o preço no banco e calcula o total.
5. Datas e horários eram `str`. Agora são tipos `date`/`time`, com validação de reserva no passado.
6. Não havia validação de e-mail, nome, placa, duração, estacionamento ou disponibilidade.
7. Conexões e cursores poderiam ficar abertos quando ocorresse uma exceção.
8. Não havia rollback, camada de sessão, endpoint de saúde, listagem, consulta, cancelamento ou QR Code de verdade.
9. O script SQL isolado não criava a tabela automaticamente. A API cria o esquema no primeiro start e semeia os estacionamentos.
10. `DECIMAL` era convertido para `float`; valores monetários agora permanecem como `Decimal`/`NUMERIC`.
11. A aplicação não tratava concorrência. O estacionamento é bloqueado durante a verificação de capacidade no PostgreSQL.
12. Não havia configuração de deploy. O `render.yaml` provisiona API, site e PostgreSQL gerenciado como uma única infraestrutura.

## Conclusão

O código do Gemini é um esboço didático válido, mas insuficiente para afirmar que o MVP está funcional e seguro. A versão deste repositório implementa o fluxo completo, testes automatizados e infraestrutura reproduzível.


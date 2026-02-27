Arquitetura e Decisões Técnicas

A arquitetura deste projeto foi desenhada com foco em separação de responsabilidades, escalabilidade e resiliência.

O sistema é dividido em três camadas principais:

Frontend (Next.js) – responsável apenas pela experiência de edição e envio da composição.

API (Express) – responsável por validar requisições, persistir dados e enfileirar renders.

Workers (BullMQ + Redis + Remotion) – responsáveis exclusivamente pelo processamento pesado de renderização.

Essa separação é fundamental porque renderização de vídeo é uma operação CPU-bound e demorada, enquanto a API é predominantemente I/O-bound. Ao isolar o processamento pesado em workers, evitamos bloquear requisições HTTP e tornamos o sistema escalável horizontalmente.

A fila (BullMQ + Redis) funciona como um buffer entre entrada e processamento, permitindo absorver picos de demanda e aplicar retry automático em caso de falhas.

Para armazenamento dos vídeos utilizamos Object Storage (MinIO no ambiente local), que replica o comportamento de um S3. Isso permite que o sistema seja facilmente migrado para provedores cloud como AWS S3 ou Google Cloud Storage sem alterar a arquitetura.

Essa estrutura já nasce preparada para escalar.

Gargalos

Os principais gargalos do sistema atual são:

CPU e memória dos workers, pois renderização de vídeo é computacionalmente intensiva.

Tempo de processamento acumulado na fila, caso a taxa de criação de renders seja maior que a taxa de processamento.

I/O de armazenamento, especialmente upload de arquivos grandes.

Banco de dados, caso haja alto volume de atualizações de status simultâneas.

Em crescimento acelerado, o primeiro ponto a quebrar tende a ser o tempo de espera na fila, pois os renders se acumulam antes de serem processados.

Escala Horizontal

A arquitetura permite escalar os workers de forma independente da API.

Múltiplas instâncias de workers

Basta subir múltiplas réplicas do serviço worker, todas consumindo a mesma fila Redis. Como BullMQ distribui jobs automaticamente, isso aumenta a capacidade de processamento linearmente.

Auto-scaling baseado no tamanho da fila

Em produção (ex.: Kubernetes), seria possível escalar automaticamente o número de workers com base em:

Número de jobs pendentes

Tempo médio de espera na fila

Taxa de criação de novos renders

Separação de recursos

API e Workers devem rodar em máquinas diferentes:

API em instâncias leves (general purpose)

Workers em instâncias otimizadas para CPU

Isso evita que renderizações afetem a disponibilidade da API.

Armazenamento
Local vs Object Storage

Armazenamento local não escala, pois:

Não é compartilhado entre instâncias

Não é resiliente

Não suporta distribuição eficiente

Por isso, o uso de Object Storage (S3/GCS) é essencial para produção.

CDN

Os vídeos devem ser distribuídos via CDN para:

Reduzir latência

Diminuir custo de egress

Melhorar experiência do usuário

Política de retenção

Implementar:

Expiração automática de vídeos antigos

Limites diferentes para planos free vs paid

Lifecycle rules no bucket

Isso evita crescimento descontrolado de armazenamento.

Custo

Renderização é a parte mais cara do sistema.

Spot / Preemptible instances

Workers podem rodar em instâncias spot para reduzir custo.
Se a instância for interrompida, o job pode ser reprocessado automaticamente via retry da fila.

Priorização de filas

Separar filas:

render-paid

render-free

Usuários pagos podem ter prioridade e maior concorrência.

Cache de renders idênticos

É possível gerar um hash da composição.
Se um render idêntico já existir, retornar o mesmo vídeo em vez de reprocessar.

Isso reduz drasticamente custo e uso de CPU.

Observabilidade

Para operar em produção é necessário monitoramento ativo.

Métricas importantes

Tempo médio e P95 de render

Tamanho da fila

Taxa de falha

Uso de CPU e memória dos workers

Tempo de upload para storage

Alertas

Fila crescendo continuamente

Taxa de falha acima de limite

Render acima do SLA

Logs estruturados

Todos os logs devem incluir:

renderId

status

duração

erro (quando houver)

Logs estruturados permitem rastrear a jornada completa:
API → Fila → Worker → Storage.

Conclusão

A arquitetura foi desenhada para ser:

Simples no MVP

Escalável horizontalmente

Resiliente a falhas

Compatível com ambientes cloud

Preparada para controle de custo

A separação entre API e Workers é o ponto central que permite que o sistema evolua de um ambiente local com Docker Compose para uma infraestrutura distribuída em produção.
import { PrismaClient } from '@prisma/client';

/**
 * Este arquivo centraliza a instância do PrismaClient.
 * Em aplicações Next.js (especialmente em desenvolvimento), o comando 'hot reload'
 * pode criar centenas de conexões novas com o banco de dados a cada salvamento de arquivo.
 * Este padrão (Singleton) garante que usaremos apenas uma conexão ativa.
 */

// Definimos um tipo para estender o objeto global do Node.js, 
// permitindo armazenar a instância do Prisma fora do ciclo de vida do Next.js.
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

/**
 * Criamos ou recuperamos a instância do banco de dados.
 * * 1. Se 'globalForPrisma.prisma' já existir, nós a reutilizamos.
 * 2. Caso contrário, criamos uma nova (new PrismaClient).
 * 3. 'log: ["query"]': Ativamos o log de SQL no terminal para facilitar o debug 
 * de queries lentas durante o desenvolvimento.
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], 
  });

/**
 * Em ambiente de PRODUÇÃO, não salvamos no objeto global.
 * Em DESENVOLVIMENTO, salvamos para que o Hot Reload não instancie o Prisma novamente.
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
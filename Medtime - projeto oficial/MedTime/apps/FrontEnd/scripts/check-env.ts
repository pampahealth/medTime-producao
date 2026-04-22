/**
 * Script de diagnóstico de variáveis de ambiente
 * Execute com: npx tsx scripts/check-env.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Carregar .env.local quando rodado via tsx (Next.js carrega automaticamente em dev)
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  }
}

const requiredEnvVars = [
  'POSTGREST_URL',
  'POSTGREST_SCHEMA',
  'POSTGREST_API_KEY',
  'JWT_SECRET',
  'SCHEMA_USER',
  'SCHEMA_ADMIN_USER',
  'NEXT_PUBLIC_ENABLE_AUTH',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_ZOER_HOST',
  'RESEND_KEY',
];

console.log('🔍 Verificando configuração de variáveis de ambiente...\n');

let hasErrors = false;

// Verificar variáveis obrigatórias
console.log('📋 Variáveis OBRIGATÓRIAS:');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NÃO CONFIGURADA`);
    hasErrors = true;
  } else {
    // Mascarar valores sensíveis
    const displayValue = ['JWT_SECRET', 'POSTGREST_API_KEY'].includes(varName)
      ? '***' + value.slice(-4)
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 Variáveis OPCIONAIS:');
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: não configurada (opcional)`);
  } else {
    const displayValue = varName.includes('KEY')
      ? '***' + value.slice(-4)
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('\n❌ ERRO: Variáveis obrigatórias não configuradas!');
  console.log('\n📝 Passos para corrigir:');
  console.log('1. Copie o arquivo .env.example para .env.local');
  console.log('2. Preencha todas as variáveis obrigatórias');
  console.log('3. Execute este script novamente para verificar\n');
  process.exit(1);
} else {
  console.log('\n✅ Todas as variáveis obrigatórias estão configuradas!');
  console.log('\n🚀 Você pode iniciar a aplicação com: pnpm dev\n');
}

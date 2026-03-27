# API Tripla 26.03

Projeto criado dentro de `testes/api_tripla_26.03` sem alterar arquivos da pasta `MedTime`.

## O que foi implementado

### 1) API para buscar receitas por data

- Rota: `GET /api/receitas/por-data?data_receita=YYYY-MM-DD`
- Formatos aceitos para entrada da data:
  - `YYYY-MM-DD`
  - `DD/MM/YYYY`
  - `DD/MM` (busca por dia e mes em qualquer ano)
  - `MM` (busca por mes em qualquer ano)

### 2) API para buscar receitas por nome do paciente

- Rota: `GET /api/receitas/por-paciente?nome_paciente=texto`

### 3) API para buscar receitas por cartao SUS

- Rota: `GET /api/receitas/por-cartao-sus?cartao_sus=numero`
- O cartao SUS e normalizado para digitos (aceita entrada com mascara)

## Campos retornados no JSON

Cada receita retorna:

- `receita_id`
- `data_receita`
- `cartao_sus`
- `nome_paciente`
- `medicamentos` (lista):
  - `nome_medicamento`
  - `nome_imagem_medicamento`
  - `imagem_medicamento` (base64/url conforme cadastro)

## Execucao da API

```bash
cd "/home/lucas/Documentos/codigos/Medtime - projeto oficial/testes/api_tripla_26.03"
cp .env.example .env
npm install
npm run dev
```

## Teste rapido (curl)

```bash
curl "http://localhost:3010/api/receitas/por-data?data_receita=2026-02-05"
curl "http://localhost:3010/api/receitas/por-paciente?nome_paciente=Maria"
curl "http://localhost:3010/api/receitas/por-cartao-sus?cartao_sus=706302769751175"
```

## Tela simples para visualizar o JSON

Arquivo: `viewer_api_tripla.py`

### Como abrir

```bash
cd "/home/lucas/Documentos/codigos/Medtime - projeto oficial/testes/api_tripla_26.03"
python3 -m pip install -r requirements-python.txt
python3 viewer_api_tripla.py
```

A tela permite:

- escolher o tipo da busca (`data`, `nome_paciente`, `cartao_sus`)
- informar o valor da busca
- visualizar o JSON retornado

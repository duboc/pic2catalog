# Pic2Catalog

Pic2Catalog é uma aplicação que utiliza IA para gerar automaticamente entradas de catálogo de produtos a partir de imagens. A aplicação usa o modelo Gemini da Google para analisar imagens e gerar descrições detalhadas, especificações técnicas e avaliações de produtos.

## Estrutura do Projeto

O projeto está dividido em duas partes principais:

- **Backend**: API Python usando FastAPI que se comunica com a API Gemini
- **Frontend**: Aplicação React com Material UI para uma interface moderna e responsiva

## Requisitos

### Backend
- Python 3.8+
- Conta Google Cloud com acesso à API Gemini
- Variáveis de ambiente configuradas (veja `.env.example`)

### Frontend
- Node.js 14+
- npm ou yarn

## Configuração

### Backend

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Crie um ambiente virtual (opcional, mas recomendado):
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Crie um arquivo `.env` baseado no `.env.example` e adicione seu ID do projeto Google Cloud:
```
GCP_PROJECT=seu-project-id-aqui
```

5. Inicie o servidor de desenvolvimento:
```bash
uvicorn main:app --reload
```

O backend estará disponível em `http://localhost:8000`.

### Frontend

1. Navegue até a pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

O frontend estará disponível em `http://localhost:3000`.

## Uso

1. Acesse a aplicação em `http://localhost:3000`
2. Faça upload de uma imagem de produto
3. Clique em "Gerar Catálogo"
4. Navegue pelas abas para ver a visualização do produto e os dados JSON gerados

## Recursos

- Geração de informações detalhadas do produto
- Geração de avaliações de usuários
- Visualização de produto em formato de e-commerce
- Exportação dos dados em formato JSON

## Tecnologias Utilizadas

### Backend
- FastAPI
- Google Vertex AI / Gemini API
- Python

### Frontend
- React
- Material UI
- Vite
- React Router

## Licença

MIT 
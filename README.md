<div align="center">

# ⚖️ Legal AI

### AI assistant for legal queries

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

An AI assistant for legal queries. Generates documents from templates using an LLM, with a React frontend and Express backend. Supports uploading/parsing documents and Zod-validated inputs.

## ✨ Features

- 🤖 LLM-powered legal Q&A (OpenAI)
- 📄 Document generation from templates (docxtemplater + pizzip)
- 📤 Upload & parse docs (mammoth)
- ✅ Zod validation

## 🏗 Architecture

```
legalAi/
├── server/   # Express + TypeScript backend
└── web/      # React + Vite + Tailwind frontend
```

## 🛠 Tech stack

`React` · `Vite` · `Tailwind` · `Express` · `OpenAI` · `TypeScript` · `Zod`

## 📦 Quick start

```bash
git clone https://github.com/m3rashid/legalAi.git
cd legalAi/server && pnpm install && pnpm dev
cd ../web && pnpm install && pnpm dev
```

## 📄 License

MIT © [m3rashid](https://github.com/m3rashid)

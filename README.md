# 🐙 Octopus Coquinaria

Plataforma integral de consultoría gastronómica construida con React, TypeScript, Vite y Supabase.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Build de producción
npm run build
```

## 🏗️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Frontend | React 18 + TypeScript |
| Bundler | Vite 5 |
| Estilos | Tailwind CSS |
| Base de Datos | Supabase |
| Gráficos | Recharts |
| Iconos | Lucide React |

## 📁 Estructura del Proyecto

```
src/
├── pages/           # 26 páginas (Home, Admin, Hub, Finance)
├── components/      # Componentes reutilizables
├── services/        # Servicios de API y lógica
├── finance/         # Módulo FinanzaFlow
├── contexts/        # Contextos React (Auth)
└── types.ts         # Definiciones TypeScript

database/
├── MASTER_SCHEMA.sql    # ⭐ Esquema principal
├── README.md            # Documentación DB
└── _archive/            # Scripts históricos
```

## ☁️ Configuración de Supabase

1. Crea un proyecto en [Supabase.com](https://supabase.com)
2. Ejecuta `database/MASTER_SCHEMA.sql` en el SQL Editor
3. Copia `Project URL` y `anon public key` desde **Settings > API**
4. Configura las variables de entorno:

```bash
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_key
```

## 📦 Despliegue en Vercel

1. Sube el código a GitHub
2. Importa el repositorio en Vercel
3. Agrega las variables de entorno de Supabase
4. Deploy automático

## 📊 Módulos Principales

- **Home**: Landing page con diagnóstico rápido
- **Academy**: Recursos de aprendizaje para gastronomía
- **Admin**: Panel de gestión para consultores
- **Finance**: Módulo FinanzaFlow para finanzas personales/negocio
- **Hub**: Portal para clientes

---

*Última actualización: 2026-01-12*

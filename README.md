# Octopus Coquinaria - Plataforma

Este proyecto es una aplicación React construida con Vite, TypeScript y Tailwind CSS. Utiliza Supabase como base de datos opcional para almacenar los leads generados por el autodiagnóstico.

## 🚀 Inicio Rápido

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Correr en local:**
    ```bash
    npm run dev
    ```

## ☁️ Configuración de Base de Datos (Supabase)

Para que el formulario guarde los datos en la nube y funcione el panel de administración "consultor":

1.  Crea un proyecto en [Supabase.com](https://supabase.com).
2.  Ve al **SQL Editor** en tu dashboard de Supabase.
3.  Copia el contenido del archivo `supabase_schema.sql` de este proyecto y pégalo en el editor. Ejecuta el script.
4.  Ve a **Project Settings > API**.
5.  Copia la `Project URL` y la `anon public key`.
6.  Si despliegas en Vercel, agrega estas variables de entorno:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`

## 📦 Despliegue en Vercel

1.  Sube este código a tu GitHub.
2.  Importa el repositorio en Vercel.
3.  Vercel detectará automáticamente que es un proyecto Vite.
4.  En la sección "Environment Variables", agrega las claves de Supabase obtenidas en el paso anterior.
5.  Haz clic en **Deploy**.

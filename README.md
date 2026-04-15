# DJ Playlist - Frontend

Una aplicación de reproductor de música con interfaz de DJ construida con React, TypeScript y Vite.

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Fork o clona este repositorio**

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Vite

3. **Configura las variables de entorno:**
   - En el dashboard de Vercel, ve a Settings → Environment Variables
   - Agrega: `VITE_API_URL` con la URL de tu API backend

4. **Despliega:**
   - Vercel construirá y desplegará automáticamente
   - Cada push a la rama principal activará un nuevo despliegue

### Netlify

1. **Conecta tu repositorio:**
   - Ve a [netlify.com](https://netlify.com)
   - Conecta tu repositorio de GitHub

2. **Configuración de build:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Variables de entorno:**
   - Agrega `VITE_API_URL` en Site settings → Environment variables

### Otros proveedores

Para otros proveedores de hosting estático (GitHub Pages, Firebase Hosting, etc.):

1. **Construye el proyecto:**
   ```bash
   npm install
   npm run build
   ```

2. **Sube la carpeta `dist`** al proveedor de hosting

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env

# Editar .env con tu URL de API
# VITE_API_URL=http://localhost:3001/api/v1

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React reutilizables
├── context/            # Context API para estado global
├── hooks/              # Custom hooks
├── pages/              # Páginas principales
├── services/           # Servicios para API calls
├── styles/             # Estilos globales y temas
└── types/              # Definiciones de TypeScript
```

## 🔧 Configuración

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** CSS Modules
- **HTTP Client:** Axios

## 🌐 Variables de Entorno

- `VITE_API_URL`: URL base de la API backend

## 📝 Notas de Despliegue

- El archivo `vercel.json` está configurado para manejar el routing de SPA
- El build genera archivos estáticos en la carpeta `dist`
- Asegúrate de que tu API backend esté desplegada y accesible
- La aplicación es completamente estática y no requiere servidor Node.js

## 🐛 Solución de Problemas

### Error: "Could not resolve entry module"
- Asegúrate de que `index.html` esté en la raíz del proyecto

### Error: "Cannot find module 'react'"
- Ejecuta `npm install` para instalar las dependencias

### Error de CORS en producción
- Configura tu API backend para permitir el dominio de tu frontend

### Build falla con errores de TypeScript
- Ejecuta `npm run build` localmente para identificar errores
- Revisa que todas las dependencias estén instaladas
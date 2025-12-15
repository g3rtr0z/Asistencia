# Configuración de Dominios Autorizados en Firebase

## Problema
El dominio `asistencia-eight.vercel.app` no está autorizado para operaciones OAuth en Firebase.

## Solución

### Paso 1: Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Selecciona el proyecto: **miasistenciast-6f99e**

### Paso 2: Configurar Dominios Autorizados
1. En el menú lateral, haz clic en **Authentication**
2. Ve a la pestaña **Settings** (Configuración)
3. Desplázate hasta la sección **Authorized domains** (Dominios autorizados)
4. Haz clic en **Add domain** (Agregar dominio)
5. Ingresa el dominio: `asistencia-eight.vercel.app`
6. Haz clic en **Add** (Agregar)

### Paso 3: Verificar
Después de agregar el dominio, el warning debería desaparecer al recargar la aplicación.

## Dominios que deberías tener configurados

- `localhost` (ya debería estar)
- `miasistenciast-6f99e.firebaseapp.com` (ya debería estar)
- `asistencia-eight.vercel.app` (agregar este)

## Nota
Este warning no afecta la funcionalidad de autenticación por email/contraseña, pero es recomendable agregarlo para evitar mensajes en la consola y para futuras funcionalidades OAuth.


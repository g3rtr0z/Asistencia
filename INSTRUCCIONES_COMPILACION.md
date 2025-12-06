# Instrucciones para Compilar el Documento LaTeX

## Requisitos Previos

Necesitas tener instalado un sistema LaTeX en tu computador:

- **Windows**: MiKTeX o TeX Live
- **macOS**: MacTeX
- **Linux**: TeX Live (generalmente disponible en repositorios)

## Compilación Básica

### Opción 1: Usando pdfLaTeX

```bash
pdflatex informe_proyecto.tex
pdflatex informe_proyecto.tex  # Ejecutar dos veces para referencias cruzadas
```

### Opción 2: Usando XeLaTeX (mejor para caracteres especiales)

```bash
xelatex informe_proyecto.tex
xelatex informe_proyecto.tex
```

### Opción 3: Usando LaTeX Workshop (VS Code)

Si usas VS Code con la extensión LaTeX Workshop, simplemente presiona `Ctrl+Alt+B` (o `Cmd+Alt+B` en Mac).

## Estructura de Archivos

Asegúrate de que la estructura de archivos sea:

```
proyecto/
├── informe_proyecto.tex
├── src/
│   └── assets/
│       └── logopag.png
└── capturas/  (opcional - para las capturas de pantalla)
```

## Personalización

### 1. Información Personal

Edita las siguientes líneas en el archivo:

```latex
\author{Tu Nombre Completo}
```

### 2. Capturas de Pantalla

En el Anexo B, agrega tus capturas:

```latex
\begin{figure}[H]
    \centering
    \includegraphics[width=0.8\textwidth]{capturas/pantalla1.png}
    \caption{Interfaz principal de registro de asistencia}
\end{figure}
```

### 3. Bibliografía Adicional

Agrega más referencias en la sección de bibliografía si es necesario.

## Problemas Comunes

### Error de imagen no encontrada

- Asegúrate de que la ruta a `logopag.png` sea correcta
- O comenta la línea de la imagen temporalmente con `%`

### Error de paquetes faltantes

Si faltan paquetes, instálalos con:
- **MiKTeX**: Se instalan automáticamente
- **TeX Live**: `tlmgr install nombre-paquete`

### Referencias cruzadas

Ejecuta siempre dos veces el compilador para que las referencias cruzadas funcionen.

## Recursos Útiles

- [Overleaf](https://www.overleaf.com): Editor LaTeX online (no necesitas instalar nada)
- [LaTeX Tutorial](https://www.latex-tutorial.com/)
- [TeX Stack Exchange](https://tex.stackexchange.com/): Para resolver problemas

## Próximos Pasos

1. Personaliza la información del autor
2. Agrega capturas de pantalla del sistema
3. Completa el manual de usuario en el Anexo C
4. Revisa y ajusta el contenido según tus necesidades
5. Compila el documento final


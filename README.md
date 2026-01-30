# DevGarden

Una extensión de VS Code que convierte tu progreso de programación en el crecimiento de una planta virtual.

## Características

- Maceta realista con tierra y semilla animada
- La planta crece mientras programas
- 5 etapas de evolución: Semilla → Brote → Planta Joven → Planta Madura → Floreciendo
- Detecta código real (no espacios en blanco)
- Palabras clave valen más puntos
- Animaciones y efectos visuales

## Instalación

1. Clona el repositorio
2. Abre la carpeta en VS Code
3. Presiona F5 para ejecutar en modo desarrollo

## Uso

1. La extensión se activa automáticamente
2. Busca el ícono en la barra lateral
3. Empieza a programar
4. Tu planta crecerá con cada línea de código

## Estructura del Proyecto

```
DevGarden/
├── extension.js
├── package.json
├── views/
│   └── plant-view.html
└── src/
    ├── models/
    │   └── PlantModel.js
    ├── controllers/
    │   └── PlantController.js
    ├── services/
    │   ├── StorageService.js
    │   └── ActivityService.js
    └── views/
        └── PlantViewProvider.js
```

## Tecnologías

- JavaScript
- VS Code Extension API
- HTML/CSS (SVG para gráficos)

## Licencia

MIT

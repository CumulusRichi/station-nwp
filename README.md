# station-nwp

Plataforma web para la **comparación y verificación de pronósticos de modelos atmosféricos** frente a observaciones de estaciones meteorológicas.

El sistema permite visualizar y evaluar el comportamiento de distintos modelos numéricos de predicción del tiempo a escala de estación, utilizando series temporales observadas y pronosticadas.

## Modelos incluidos

Actualmente se consideran los siguientes modelos:

- **GFS 0.25°**
- **ECMWF / IFS 0.25°**
- **ETA 5 km**
- **WRF 5 km**
- **MPAS 15 km**

También se incorporan observaciones de estaciones meteorológicas para realizar la comparación y calcular métricas de desempeño.

## Variables disponibles

La plataforma muestra actualmente:

- **Temperatura del aire a 2 m**
- **Precipitación acumulada cada 6 horas**

Los datos observados y pronosticados se presentan mediante gráficos interactivos que permiten consultar valores, fechas, ciclos de inicialización y diferencias entre modelos.

## Verificación de pronósticos

Además de la visualización de series temporales, la plataforma incluye estadísticos de desempeño calculados para los últimos 30 días completos y para el pronóstico a un día.

Las métricas disponibles son:

- **BIAS**
- **MAE**
- **RMSE**
- **Correlación de Spearman**
- **N**, número de pares válidos pronóstico-observación utilizados en el cálculo

Los estadísticos se calculan individualmente para cada estación y modelo.

## Actualización de datos

Los datos son procesados automáticamente en el HPC **NUNA**.

El flujo operativo comprende:

1. Extracción de pronósticos de los modelos disponibles.
2. Extracción y procesamiento de observaciones de estaciones.
3. Homologación temporal de los datos.
4. Generación de archivos CSV para la plataforma web.
5. Cálculo automático de estadísticos de verificación.
6. Actualización del repositorio mediante Git.
7. Publicación automática mediante GitHub Pages.

Las observaciones se actualizan de forma horaria y los pronósticos se incorporan conforme se encuentran disponibles nuevos ciclos de los modelos.

## Estructura principal

```text
station-nwp/
├── modelos/
│   ├── YYYYMMDDHH/
│   └── ciclos.json
├── observaciones/
│   ├── metadata.csv
│   ├── obs_temp.csv
│   └── obs_pp.csv
├── estadisticos/
│   ├── estadisticos_temp_YYYYMMDD.csv
│   └── estadisticos_pp_YYYYMMDD.csv
└── index.html
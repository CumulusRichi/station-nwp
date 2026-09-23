# station-nwp

Plataforma web para la **comparación y verificación de pronósticos de modelos atmosféricos** frente a observaciones de estaciones meteorológicas.

Permite visualizar series temporales por estación y evaluar el desempeño reciente de distintos modelos numéricos de predicción del tiempo.

## Modelos

- GFS 0.25°
- ECMWF / IFS 0.25°
- ETA 5 km
- WRF 5 km
- MPAS 15 km

## Variables

- Temperatura del aire a 2 m
- Precipitación acumulada cada 6 horas

Los gráficos interactivos permiten consultar valores observados y pronosticados, fechas y ciclos de inicialización.

## Verificación

Los estadísticos se calculan para los últimos 30 días completos y para el pronóstico a un día.

### Temperatura

Se evalúan comparaciones cada 3 horas mediante:

- BIAS
- MAE
- RMSE
- Correlación de Spearman
- Nº datos

### Precipitación

Se evalúan acumulados cada 6 horas mediante:

- BIAS
- RMSE
- Correlación de Spearman
- Nº datos
- POD
- FAR
- CSI
- Nº eventos

Las métricas categóricas se calculan para umbrales de **0.1, 1, 5 y 25 mm en 6 horas**.

## Actualización

El procesamiento se realiza automáticamente en el HPC **NUNA**:

1. Extracción de pronósticos y observaciones.
2. Homologación temporal y generación de CSV.
3. Cálculo de estadísticos.
4. Actualización del repositorio y publicación mediante GitHub Pages.

Las observaciones se actualizan cada hora y los pronósticos conforme se encuentran disponibles nuevos ciclos.

## Sitio web

https://cumulusrichi.github.io/station-nwp/

Desarrollado por la **Subdirección de Cambio Climático y Modelamiento Atmosférico del SENAMHI**.

## Estructura

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
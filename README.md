# station-nwp

Plataforma web para la comparación de **datos observados en estaciones meteorológicas** con pronósticos de distintos modelos numéricos.

Actualmente incluye:

- GFS
- ECMWF / IFS
- ETA5
- WRF5
- MPAS15
- Observaciones de estaciones

La aplicación permite seleccionar una estación y los modelos que se desean visualizar, mostrando series de:

- Temperatura del aire a 2 m
- Precipitación acumulada cada 6 horas

Los datos son procesados automáticamente en el HPC **NUNA** y publicados en este repositorio mediante Git. La interfaz web se sirve mediante **GitHub Pages** y utiliza Plotly para la visualización interactiva.

## Estructura principal

```text
modelos/
    YYYYMMDDHH/
observaciones/
    obs_temp.csv
    obs_pp.csv
index.html

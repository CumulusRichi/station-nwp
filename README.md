# NWP-STATION

Plataforma web para comparar pronósticos de modelos atmosféricos con observaciones meteorológicas y evaluar su desempeño en el Perú.

## Modelos

GFS, ECMWF, ETA5, WRF5 y MPAS15; productos corregidos ETA22-SCA y ETA22-EQM; y ensamble WRF8 ENS de ocho miembros.

## Variables

- Temperatura del aire a 2 m.
- Precipitación acumulada en 6 horas.
- Temperatura máxima y mínima diaria.
- Precipitación acumulada en 24 horas.

## Funcionalidades

- **Pronósticos:** series por estación, distintas inicializaciones y consulta independiente del ensamble. Hasta 5 días para las variables horarias y de 6 horas, y hasta 7 días para las diarias, según disponibilidad.
- **Mapas:** comparación interactiva de campos observados y pronosticados, con zoom sincronizado.
- **Validación:** evaluación de las tres primeras ventanas diarias completas, por estación, departamento y región climática. Estadísticos de los últimos 30 días, separados por inicialización 00Z y 12Z.

## Sitio web

https://cumulusrichi.github.io/station-nwp/

Actualización automática según la disponibilidad de observaciones y pronósticos.

Desarrollado por la **Subdirección de Cambio Climático y Modelamiento Atmosférico del SENAMHI**.

## Uso

La información contiene incertidumbre, es referencial y no reemplaza los productos oficiales del SENAMHI. La institución no se responsabiliza por interpretaciones o usos inadecuados de estos resultados.
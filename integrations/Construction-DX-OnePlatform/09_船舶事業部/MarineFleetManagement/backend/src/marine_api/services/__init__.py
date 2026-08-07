"""船舶運航管理ドメインサービス."""
from .ais_receiver import AISPosition, parse_aivdm
from .crew_compliance_checker import (
    CrewComplianceResult,
    check_crew_compliance,
)
from .crew_scheduler import (
    CrewSnapshot,
    SchedulingResult,
    ShiftAssignment,
    VoyagePlan,
    optimize_shifts,
)
from .eta_calculator import ETAResult, calculate_eta, haversine_nm
from .fuel_efficiency import (
    FuelEfficiency,
    calculate_efficiency,
)
from .fuel_optimizer import (
    FuelModel,
    HistoricalSample,
    OptimizationResult,
    optimize_speed,
    train_model,
)
from .weather_fetcher import (
    DEFAULT_STATIONS,
    MarineForecast,
    fetch_all_stations,
    fetch_marine_forecast,
    upsert_forecasts,
)

__all__ = [
    "AISPosition",
    "parse_aivdm",
    "ETAResult",
    "calculate_eta",
    "haversine_nm",
    "FuelEfficiency",
    "calculate_efficiency",
    "CrewComplianceResult",
    "check_crew_compliance",
    "CrewSnapshot",
    "VoyagePlan",
    "ShiftAssignment",
    "SchedulingResult",
    "optimize_shifts",
    "FuelModel",
    "HistoricalSample",
    "OptimizationResult",
    "optimize_speed",
    "train_model",
    "MarineForecast",
    "DEFAULT_STATIONS",
    "fetch_marine_forecast",
    "fetch_all_stations",
    "upsert_forecasts",
]

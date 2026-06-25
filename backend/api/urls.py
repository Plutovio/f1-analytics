from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    RaceViewSet, DriverViewSet, ConstructorViewSet,
    ResultOverrideViewSet, current_season_metadata,
    driver_standings, constructor_standings, trigger_sync,
    CustomObtainAuthToken
)
from predictions.views import (
    championship_scenarios, points_projection,
    title_decider, win_probability
)

router = DefaultRouter()
router.register('races', RaceViewSet, basename='races')
router.register('drivers', DriverViewSet, basename='drivers')
router.register('constructors', ConstructorViewSet, basename='constructors')
router.register('results', ResultOverrideViewSet, basename='results')

urlpatterns = [
    path('seasons/current/', current_season_metadata, name='current-season'),
    path('standings/drivers/', driver_standings, name='driver-standings'),
    path('standings/constructors/', constructor_standings, name='constructor-standings'),
    path('predictions/scenarios/', championship_scenarios, name='predict-scenarios'),
    path('predictions/projection/', points_projection, name='predict-projection'),
    path('predictions/title-decider/', title_decider, name='predict-title-decider'),
    path('predictions/win-probability/', win_probability, name='predict-win-probability'),
    path('sync/', trigger_sync, name='trigger-sync'),
    path('login/', CustomObtainAuthToken.as_view(), name='api-login'),
    path('', include(router.urls)),
]

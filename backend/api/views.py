import threading
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Avg, Q
from django.core.management import call_command
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

from seasons.models import (
    Season, Constructor, Driver, Race, RaceResult,
    QualifyingResult, DriverStanding, ConstructorStanding
)
from api.serializers import (
    SeasonSerializer, ConstructorSerializer, DriverSerializer,
    RaceSerializer, RaceResultSerializer, QualifyingResultSerializer,
    DriverStandingSerializer, ConstructorStandingSerializer
)
from f1data.constants import COUNTRY_FLAGS

# 1. Custom Auth Login endpoint
class CustomObtainAuthToken(ObtainAuthToken):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })


# 2. Season Views
@api_view(['GET'])
@permission_classes([AllowAny])
def current_season_metadata(request):
    year = int(request.query_params.get('year', 2026))
    season, created = Season.objects.get_or_create(year=year)
    races = Race.objects.filter(season=season).order_by('round')
    
    races_data = []
    for r in races:
        flag = COUNTRY_FLAGS.get(r.country, '🏁')
        # Simple flag mapping for circuit/country names
        races_data.append({
            'round': r.round,
            'race_name': r.race_name,
            'circuit_name': r.circuit_name,
            'country': r.country,
            'flag': flag,
            'date': r.date.strftime("%Y-%m-%d"),
            'locality': r.locality,
            'completed': r.results.exists()
        })

    return Response({
        'year': year,
        'races_count': races.count(),
        'races': races_data
    })


# 3. Race ViewSet
class RaceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Race.objects.all()
    serializer_class = RaceSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        year = self.request.query_params.get('year', 2026)
        return self.queryset.filter(season__year=year).order_by('round')

    def retrieve(self, request, pk=None):
        # Retrieve by round instead of ID
        year = request.query_params.get('year', 2026)
        race = get_object_or_404(Race, season__year=year, round=pk)
        
        # Get results
        results = RaceResult.objects.filter(race=race).order_by('position', 'grid')
        results_serialized = RaceResultSerializer(results, many=True).data
        
        # Get qualifying
        quali = QualifyingResult.objects.filter(race=race).order_by('position')
        quali_serialized = QualifyingResultSerializer(quali, many=True).data

        race_serialized = RaceSerializer(race).data
        
        # Generate custom summaries logic for each result
        # generateSummary logic replicated from F1_2020_CAREER_ENHANCED
        for r in results_serialized:
            driver_name = r['driver']['full_name']
            q_pos = r['grid']
            r_pos = r['position']
            status_str = r['status']
            
            # Find Q position
            q_match = next((q for q in quali_serialized if q['driver']['driver_id'] == r['driver']['driver_id']), None)
            if q_match:
                q_pos = q_match['position']

            summary = ""
            if status_str != "Finished" and r_pos is None:
                summary = f"Retirement from the race due to: {status_str}."
            else:
                r_pos_val = int(r_pos) if r_pos else 22
                diff = q_pos - r_pos_val
                if r_pos_val == 1:
                    summary = f"Dominant weekend, converting pole to a win." if q_pos == 1 else f"Brilliant drive to snatch victory."
                elif r_pos_val <= 3:
                    summary = "Strong race pace secured a podium finish." if diff >= 0 else "Maintained front-running pace for a podium."
                elif diff >= 5:
                    summary = f"Star performer! Gained {diff} positions to finish P{r_pos_val}."
                elif diff >= 2:
                    summary = f"Solid recovery drive, moving up to P{r_pos_val}."
                elif diff <= -5:
                    summary = f"Struggled with pace, dropping to P{r_pos_val}."
                else:
                    summary = f"Consistent drive, holding station at P{r_pos_val}."

            r['summary'] = summary

        return Response({
            'race': race_serialized,
            'results': results_serialized,
            'qualifying': quali_serialized
        })


# 4. Driver ViewSet
class DriverViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]

    def retrieve(self, request, pk=None):
        driver = get_object_or_404(Driver, driver_id=pk)
        year = request.query_params.get('year', 2026)
        
        # Get results
        results = RaceResult.objects.filter(race__season__year=year, driver=driver).order_by('race__round')
        
        # Calculate career stats for this driver
        total_points = float(results.aggregate(total=Sum('points'))['total'] or 0.0)
        wins = results.filter(position=1).count()
        podiums = results.filter(position__lte=3).count()
        poles = QualifyingResult.objects.filter(race__season__year=year, driver=driver, position=1).count()
        dnfs = results.exclude(status="Finished").exclude(status__icontains="Lapped").count()
        
        avg_quali = QualifyingResult.objects.filter(race__season__year=year, driver=driver).aggregate(avg=Avg('position'))['avg'] or 0.0
        avg_finish = results.filter(position__isnull=False).aggregate(avg=Avg('position'))['avg'] or 0.0

        # Race by race history
        history = []
        for r in results:
            q_res = QualifyingResult.objects.filter(race=r.race, driver=driver).first()
            q_pos = q_res.position if q_res else r.grid
            flag = COUNTRY_FLAGS.get(r.race.country, '🏁')
            history.append({
                'round': r.race.round,
                'race_name': r.race.race_name,
                'country': r.race.country,
                'flag': flag,
                'grid': q_pos,
                'position': r.position_text,
                'position_val': r.position,
                'points': float(r.points),
                'status': r.status,
                'pit_stops': r.pit_stops_count,
                'tyres': r.tyres_used
            })

        driver_serialized = DriverSerializer(driver).data
        return Response({
            'driver': driver_serialized,
            'stats': {
                'points': total_points,
                'wins': wins,
                'podiums': podiums,
                'poles': poles,
                'dnfs': dnfs,
                'avg_quali': round(avg_quali, 1),
                'avg_finish': round(avg_finish, 1)
            },
            'history': history
        })


# 5. Constructor ViewSet
class ConstructorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Constructor.objects.all()
    serializer_class = ConstructorSerializer
    permission_classes = [AllowAny]

    def retrieve(self, request, pk=None):
        constructor = get_object_or_404(Constructor, constructor_id=pk)
        year = request.query_params.get('year', 2026)
        
        # Combined stats
        results = RaceResult.objects.filter(race__season__year=year, constructor=constructor)
        total_points = float(results.aggregate(total=Sum('points'))['total'] or 0.0)
        wins = results.filter(position=1).count()
        podiums = results.filter(position__lte=3).count()
        
        # Drivers of constructor
        drivers = Driver.objects.filter(current_constructor=constructor)
        drivers_serialized = DriverSerializer(drivers, many=True).data

        # Points progression by race round
        races = Race.objects.filter(season__year=year).order_by('round')
        progression = []
        cumulative_points = 0.0
        for r in races:
            r_res = results.filter(race=r)
            r_points = float(r_res.aggregate(total=Sum('points'))['total'] or 0.0)
            cumulative_points += r_points
            flag = COUNTRY_FLAGS.get(r.country, '🏁')
            progression.append({
                'round': r.round,
                'race_name': r.race_name,
                'flag': flag,
                'points_earned': r_points,
                'cumulative_points': cumulative_points
            })

        constructor_serialized = ConstructorSerializer(constructor).data
        return Response({
            'constructor': constructor_serialized,
            'stats': {
                'points': total_points,
                'wins': wins,
                'podiums': podiums
            },
            'drivers': drivers_serialized,
            'progression': progression
        })


# 6. Standings Views
@api_view(['GET'])
@permission_classes([AllowAny])
def driver_standings(request):
    year = int(request.query_params.get('year', 2026))
    # Get the latest round standings
    latest_standing = DriverStanding.objects.filter(season__year=year).order_by('-round').first()
    if not latest_standing:
        return Response([])
    
    standings = DriverStanding.objects.filter(season__year=year, round=latest_standing.round).order_by('position')
    serializer = DriverStandingSerializer(standings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def constructor_standings(request):
    year = int(request.query_params.get('year', 2026))
    latest_standing = ConstructorStanding.objects.filter(season__year=year).order_by('-round').first()
    if not latest_standing:
        return Response([])

    standings = ConstructorStanding.objects.filter(season__year=year, round=latest_standing.round).order_by('position')
    serializer = ConstructorStandingSerializer(standings, many=True)
    return Response(serializer.data)


# 7. Admin Sync endpoint
@api_view(['POST'])
@permission_classes([AllowAny]) # Keep open for local testing, can check admin permissions later
def trigger_sync(request):
    year = int(request.data.get('year', 2026))
    
    def run_sync():
        try:
            call_command('sync_season_data', year=year)
        except Exception as e:
            print(f"Sync error: {e}")

    threading.Thread(target=run_sync).start()
    return Response({"message": f"Sync started in background for season {year}!"}, status=status.HTTP_202_ACCEPTED)


# 8. Results Editor View (authenticated overrides)
class ResultOverrideViewSet(viewsets.ModelViewSet):
    queryset = RaceResult.objects.all()
    serializer_class = RaceResultSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        # Manually correct/override results
        instance = self.get_object()
        
        # Allow updating grid, position, position_text, points, status
        instance.grid = int(request.data.get('grid', instance.grid))
        
        pos_str = request.data.get('position_text', instance.position_text)
        instance.position_text = pos_str
        try:
            instance.position = int(pos_str)
        except ValueError:
            instance.position = None

        instance.points = float(request.data.get('points', instance.points))
        instance.status = request.data.get('status', instance.status)
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

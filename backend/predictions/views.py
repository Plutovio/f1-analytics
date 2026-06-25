import datetime
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from seasons.models import Driver, Race, RaceResult, Season, DriverStanding

def get_completed_races_count(year):
    # A race is completed if it has results in the database
    return Race.objects.filter(season__year=year, results__isnull=False).distinct().count()

def get_drivers_points(year):
    results = RaceResult.objects.filter(race__season__year=year)
    drivers = Driver.objects.all()
    points_map = {}
    for d in drivers:
        d_res = results.filter(driver=d)
        if d_res.exists():
            points_map[d.driver_id] = float(d_res.aggregate(total=Sum('points'))['total'] or 0.0)
    return points_map

@api_view(['GET'])
@permission_classes([AllowAny])
def championship_scenarios(request):
    driver_id = request.query_params.get('driver_id')
    year = int(request.query_params.get('year', datetime.datetime.now().year if 'datetime' in globals() else 2026))

    if not driver_id:
        return Response({"error": "driver_id parameter is required"}, status=400)

    driver = get_object_or_404(Driver, driver_id=driver_id)
    races_list = Race.objects.filter(season__year=year).order_by('round')
    total_races = races_list.count()
    completed_races = get_completed_races_count(year)
    remaining_races = max(0, total_races - completed_races)

    # Current points for all drivers
    points_map = get_drivers_points(year)
    current_points = points_map.get(driver_id, 0.0)

    # Max competitor points
    max_competitor_points = 0.0
    for oid, opt in points_map.items():
        if oid != driver_id:
            max_possible = opt + (remaining_races * 25.0)
            if max_possible > max_competitor_points:
                max_competitor_points = max_possible

    scenarios = {}
    for pos, pts_val in [(1, 25.0), (2, 18.0), (3, 15.0)]:
        total_from_remaining = pts_val * remaining_races
        final_points = current_points + total_from_remaining
        scenarios[pos] = {
            "pointsPerRace": pts_val,
            "totalPoints": final_points,
            "beatsMax": final_points >= max_competitor_points,
            "position": pos
        }

    return Response({
        "driver": driver.full_name,
        "remaining_races": remaining_races,
        "current_points": current_points,
        "max_competitor_points": max_competitor_points,
        "scenarios": scenarios
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def points_projection(request):
    year = int(request.query_params.get('year', 2026))
    races_list = Race.objects.filter(season__year=year).order_by('round')
    total_races = races_list.count()
    completed_races = get_completed_races_count(year)
    remaining_races = max(0, total_races - completed_races)

    points_map = get_drivers_points(year)
    projections = []

    for d_id, pts in points_map.items():
        driver = Driver.objects.get(driver_id=d_id)
        avg_per_race = pts / max(completed_races, 1)
        
        proj_pace = int(round(pts + (avg_per_race * remaining_races)))
        proj_up = int(round(pts + (avg_per_race * remaining_races * 1.05)))
        proj_down = int(round(pts + (avg_per_race * remaining_races * 0.95)))

        projections.append({
            "driver": driver.full_name,
            "code": driver.code or driver.family_name[:3].upper(),
            "current": pts,
            "projections": {
                "Current Pace": proj_pace,
                "+5% Improvement": proj_up,
                "-5% Decline": proj_down
            }
        })

    # Sort by Current Pace descending
    projections.sort(key=lambda x: x['projections']['Current Pace'], reverse=True)
    return Response(projections)


@api_view(['GET'])
@permission_classes([AllowAny])
def title_decider(request):
    year = int(request.query_params.get('year', 2026))
    races_list = Race.objects.filter(season__year=year).order_by('round')
    total_races = races_list.count()
    completed_races = get_completed_races_count(year)
    remaining_races = max(0, total_races - completed_races)

    points_map = get_drivers_points(year)
    if len(points_map) < 2:
        return Response({"message": "Not enough data"}, status=200)

    standings = sorted(points_map.items(), key=lambda x: x[1], reverse=True)
    leader_id, leader_pts = standings[0]
    challenger_id, challenger_pts = standings[1]

    leader = Driver.objects.get(driver_id=leader_id)
    challenger = Driver.objects.get(driver_id=challenger_id)
    gap = leader_pts - challenger_pts

    # Calculate decider round
    decider_race = None
    decider_number = None
    races_until_decided = None
    is_decided = gap > (remaining_races * 25.0)

    if not is_decided:
        accumulated_gap = 0
        for i in range(completed_races, total_races):
            accumulated_gap += 25
            if accumulated_gap > gap:
                decider_race = races_list[i].race_name
                decider_number = i + 1
                races_until_decided = i - completed_races + 1
                break

    return Response({
        "leader": leader.full_name,
        "leaderPoints": leader_pts,
        "challenger": challenger.full_name,
        "challengerPoints": challenger_pts,
        "gap": gap,
        "deciderRace": decider_race,
        "deciderNumber": decider_number,
        "racesUntilDecided": races_until_decided,
        "isDecided": is_decided
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def win_probability(request):
    driver_id = request.query_params.get('driver_id')
    year = int(request.query_params.get('year', 2026))

    if not driver_id:
        return Response({"error": "driver_id parameter is required"}, status=400)

    driver = get_object_or_404(Driver, driver_id=driver_id)
    races_list = Race.objects.filter(season__year=year).order_by('round')
    total_races = races_list.count()
    completed_races = get_completed_races_count(year)
    remaining_races = max(0, total_races - completed_races)

    # Count wins for this driver
    results = RaceResult.objects.filter(race__season__year=year, driver=driver)
    wins = results.filter(position=1).count()
    driver_completed = results.count()

    win_rate = wins / max(driver_completed, 1)
    conservative = min(100.0, win_rate * 100.0)
    optimistic = min(100.0, win_rate * 1.2 * 100.0)
    pessimistic = max(0.0, win_rate * 0.8 * 100.0)
    expected_wins = remaining_races * win_rate

    return Response({
        "wins": wins,
        "completedRaces": driver_completed,
        "winRate": round(win_rate * 100.0, 1),
        "remaining": remaining_races,
        "conservative": round(conservative, 1),
        "optimistic": round(optimistic, 1),
        "pessimistic": round(pessimistic, 1),
        "expectedWins": round(expected_wins, 1)
    })

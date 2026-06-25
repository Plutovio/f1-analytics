import datetime
import requests
import fastf1
import pandas as pd
from django.core.management.base import BaseCommand
from seasons.models import (
    Season, Constructor, Driver, Race, RaceResult,
    QualifyingResult, DriverStanding, ConstructorStanding
)
from f1data.constants import CONSTRUCTOR_COLORS, CONSTRUCTOR_LOGOS, COUNTRY_FLAGS

class Command(BaseCommand):
    help = "Syncs F1 season calendar, drivers, constructors, standings and results from Jolpica and FastF1."

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            default=datetime.datetime.now().year,
            help='Year of the season to sync'
        )

    def handle(self, *args, **options):
        year = options['year']
        self.stdout.write(self.style.WARNING(f"Starting sync for season {year}..."))

        # Enable FastF1 Cache
        import os
        cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'fastf1_cache')
        os.makedirs(cache_dir, exist_ok=True)
        try:
            fastf1.Cache.enable_cache(cache_dir)
            self.stdout.write(self.style.SUCCESS(f"FastF1 cache enabled at: {cache_dir}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Could not enable FastF1 cache: {e}"))

        # Initialize Season
        season, _ = Season.objects.get_or_create(year=year)

        # 1. Sync Constructors
        self.stdout.write("Syncing constructors...")
        constructors_url = f"https://api.jolpi.ca/ergast/f1/{year}/constructors.json?limit=100"
        try:
            resp = requests.get(constructors_url).json()
            constructor_list = resp['MRData']['ConstructorTable']['Constructors']
            for c in constructor_list:
                c_id = c['constructorId']
                color = CONSTRUCTOR_COLORS.get(c_id, '#7f8c8d')
                logo = CONSTRUCTOR_LOGOS.get(c_id, '')
                Constructor.objects.update_or_create(
                    constructor_id=c_id,
                    defaults={
                        'name': c['name'],
                        'nationality': c.get('nationality', ''),
                        'color_hex': color,
                        'logo_url': logo
                    }
                )
            self.stdout.write(self.style.SUCCESS(f"Synced {len(constructor_list)} constructors."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error syncing constructors: {e}"))

        # 2. Sync Drivers
        self.stdout.write("Syncing drivers...")
        drivers_url = f"https://api.jolpi.ca/ergast/f1/{year}/drivers.json?limit=100"
        try:
            resp = requests.get(drivers_url).json()
            driver_list = resp['MRData']['DriverTable']['Drivers']
            for d in driver_list:
                d_id = d['driverId']
                
                # Approximate Wikipedia headshot URL logic or leave empty for frontend initials badge fallback
                wiki_url = d.get('url', '')
                headshot = ''
                if wiki_url:
                    # Construct a plausible headshot URL from name
                    # (In production we'd parse wikipedia page or use static mappings,
                    # here we keep it clean. Frontend fallback will activate if empty)
                    pass

                Driver.objects.update_or_create(
                    driver_id=d_id,
                    defaults={
                        'code': d.get('code', d_id[:3].upper()),
                        'given_name': d['givenName'],
                        'family_name': d['familyName'],
                        'nationality': d.get('nationality', ''),
                        'headshot_url': headshot
                    }
                )
            self.stdout.write(self.style.SUCCESS(f"Synced {len(driver_list)} drivers."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error syncing drivers: {e}"))

        # 3. Sync Calendar (Races)
        self.stdout.write("Syncing race calendar...")
        calendar_url = f"https://api.jolpi.ca/ergast/f1/{year}.json"
        try:
            resp = requests.get(calendar_url).json()
            race_list = resp['MRData']['RaceTable']['Races']
            for r in race_list:
                r_round = int(r['round'])
                r_date = datetime.datetime.strptime(r['date'], "%Y-%m-%d").date()
                r_time_str = r.get('time')
                r_time = None
                if r_time_str:
                    # strip Z or offset if any
                    r_time_str = r_time_str.replace('Z', '')
                    try:
                        r_time = datetime.datetime.strptime(r_time_str, "%H:%M:%S").time()
                    except ValueError:
                        try:
                            r_time = datetime.datetime.strptime(r_time_str[:5], "%H:%M").time()
                        except ValueError:
                            pass

                Race.objects.update_or_create(
                    season=season,
                    round=r_round,
                    defaults={
                        'race_name': r['raceName'],
                        'circuit_name': r['Circuit']['circuitName'],
                        'circuit_id': r['Circuit']['circuitId'],
                        'country': r['Circuit']['Location']['country'],
                        'locality': r['Circuit']['Location']['locality'],
                        'date': r_date,
                        'time': r_time
                    }
                )
            self.stdout.write(self.style.SUCCESS(f"Synced {len(race_list)} races."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error syncing calendar: {e}"))

        # 4. Sync Results, Qualifying, and FastF1 Enrichment
        self.stdout.write("Syncing results and qualifying for completed races...")
        races = Race.objects.filter(season=season).order_by('round')
        for race in races:
            # Check if race is completed (either date in past or results already published)
            # We hit results URL to check if results are available
            results_url = f"https://api.jolpi.ca/ergast/f1/{year}/{race.round}/results.json"
            try:
                resp = requests.get(results_url).json()
                races_data = resp['MRData']['RaceTable']['Races']
                if not races_data:
                    self.stdout.write(self.style.WARNING(f"Round {race.round} ({race.race_name}) has no results yet. Skipping results sync."))
                    continue

                results_list = races_data[0]['Results']
                self.stdout.write(f"Syncing results for Round {race.round} ({race.race_name})...")

                # Store Results
                for res in results_list:
                    d_id = res['Driver']['driverId']
                    c_id = res['Constructor']['constructorId']

                    driver = Driver.objects.get(driver_id=d_id)
                    constructor = Constructor.objects.get(constructor_id=c_id)

                    # Update driver's current constructor
                    driver.current_constructor = constructor
                    driver.save()

                    # Fastest Lap details
                    fl_time = None
                    fl_rank = None
                    if 'FastestLap' in res:
                        fl_time = res['FastestLap']['Time']['time']
                        fl_rank = int(res['FastestLap'].get('rank', 0))

                    pos_text = res['positionText']
                    try:
                        pos = int(res['position'])
                    except ValueError:
                        pos = None

                    RaceResult.objects.update_or_create(
                        race=race,
                        driver=driver,
                        defaults={
                            'constructor': constructor,
                            'grid': int(res['grid']),
                            'position': pos,
                            'position_text': pos_text,
                            'status': res['status'],
                            'points': float(res['points']),
                            'fastest_lap_time': fl_time,
                            'fastest_lap_rank': fl_rank
                        }
                    )

                # Sync Qualifying
                self.stdout.write(f"Syncing qualifying for Round {race.round}...")
                quali_url = f"https://api.jolpi.ca/ergast/f1/{year}/{race.round}/qualifying.json"
                try:
                    q_resp = requests.get(quali_url).json()
                    q_races = q_resp['MRData']['RaceTable']['Races']
                    if q_races:
                        q_list = q_races[0]['QualifyingResults']
                        for q_res in q_list:
                            qd_id = q_res['Driver']['driverId']
                            qc_id = q_res['Constructor']['constructorId']

                            q_driver = Driver.objects.get(driver_id=qd_id)
                            q_constructor = Constructor.objects.get(constructor_id=qc_id)

                            QualifyingResult.objects.update_or_create(
                                race=race,
                                driver=q_driver,
                                defaults={
                                    'constructor': q_constructor,
                                    'position': int(q_res['position']),
                                    'q1': q_res.get('Q1', ''),
                                    'q2': q_res.get('Q2', ''),
                                    'q3': q_res.get('Q3', '')
                                }
                            )
                except Exception as eq:
                    self.stdout.write(self.style.ERROR(f"Error syncing qualifying for Round {race.round}: {eq}"))

                # 5. Enrich with FastF1 details (Tyre Strategy and Pit Stops)
                self.stdout.write(f"Loading FastF1 session details for Round {race.round}...")
                try:
                    # FastF1 accepts race name or round number
                    session = fastf1.get_session(year, race.round, 'R')
                    session.load(laps=True, telemetry=False, weather=False)
                    
                    laps = session.laps
                    if laps is not None and len(laps) > 0:
                        # Map drivers by code
                        for result in RaceResult.objects.filter(race=race):
                            d_code = result.driver.code
                            if not d_code:
                                continue
                            
                            driver_laps = laps[laps['Driver'] == d_code]
                            if len(driver_laps) > 0:
                                # Count pit stops (where PitInTime is not NaT/null)
                                pit_stops = driver_laps['PitInTime'].notna().sum()
                                
                                # Compounds sequence
                                compounds = []
                                last_comp = None
                                for c in driver_laps['Compound']:
                                    if pd.notna(c) and c != last_comp:
                                        char = str(c)[0].upper() if len(str(c)) > 0 else '?'
                                        compounds.append(char)
                                        last_comp = c
                                tyres_seq = "-".join(compounds)
                                
                                result.pit_stops_count = int(pit_stops)
                                result.tyres_used = tyres_seq
                                result.save()
                                self.stdout.write(f"Enriched {d_code}: Pit Stops={pit_stops}, Tyres={tyres_seq}")
                except Exception as ef:
                    self.stdout.write(self.style.WARNING(f"Could not enrich FastF1 for Round {race.round}: {ef}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing results for round {race.round}: {e}"))

        # 6. Sync Driver Standings
        self.stdout.write("Syncing driver standings...")
        driver_standings_url = f"https://api.jolpi.ca/ergast/f1/{year}/driverStandings.json"
        try:
            resp = requests.get(driver_standings_url).json()
            lists = resp['MRData']['StandingsTable']['StandingsLists']
            if lists:
                round_snapshot = int(lists[0]['round'])
                standings = lists[0]['DriverStandings']
                for st in standings:
                    d_id = st['Driver']['driverId']
                    driver = Driver.objects.get(driver_id=d_id)
                    DriverStanding.objects.update_or_create(
                        season=season,
                        round=round_snapshot,
                        driver=driver,
                        defaults={
                            'points': float(st['points']),
                            'position': int(st['position']),
                            'wins': int(st['wins'])
                        }
                    )
                self.stdout.write(self.style.SUCCESS(f"Synced driver standings snapshot at round {round_snapshot}."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error syncing driver standings: {e}"))

        # 7. Sync Constructor Standings
        self.stdout.write("Syncing constructor standings...")
        constructor_standings_url = f"https://api.jolpi.ca/ergast/f1/{year}/constructorStandings.json"
        try:
            resp = requests.get(constructor_standings_url).json()
            lists = resp['MRData']['StandingsTable']['StandingsLists']
            if lists:
                round_snapshot = int(lists[0]['round'])
                standings = lists[0]['ConstructorStandings']
                for st in standings:
                    c_id = st['Constructor']['constructorId']
                    constructor = Constructor.objects.get(constructor_id=c_id)
                    ConstructorStanding.objects.update_or_create(
                        season=season,
                        round=round_snapshot,
                        constructor=constructor,
                        defaults={
                            'points': float(st['points']),
                            'position': int(st['position']),
                            'wins': int(st['wins'])
                        }
                    )
                self.stdout.write(self.style.SUCCESS(f"Synced constructor standings snapshot at round {round_snapshot}."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error syncing constructor standings: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Sync complete for season {year}!"))

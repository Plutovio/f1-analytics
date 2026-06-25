from rest_framework import serializers
from seasons.models import (
    Season, Constructor, Driver, Race, RaceResult,
    QualifyingResult, DriverStanding, ConstructorStanding
)

class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ['year']


class ConstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Constructor
        fields = ['constructor_id', 'name', 'nationality', 'color_hex', 'logo_url']


class DriverSerializer(serializers.ModelSerializer):
    current_constructor = ConstructorSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Driver
        fields = [
            'driver_id', 'code', 'given_name', 'family_name', 'full_name',
            'nationality', 'headshot_url', 'current_constructor'
        ]


class RaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Race
        fields = [
            'id', 'season', 'round', 'race_name', 'circuit_name',
            'circuit_id', 'country', 'locality', 'date', 'time'
        ]


class RaceResultSerializer(serializers.ModelSerializer):
    driver = DriverSerializer(read_only=True)
    constructor = ConstructorSerializer(read_only=True)

    class Meta:
        model = RaceResult
        fields = [
            'id', 'race', 'driver', 'constructor', 'grid', 'position',
            'position_text', 'status', 'points', 'fastest_lap_time',
            'fastest_lap_rank', 'pit_stops_count', 'tyres_used'
        ]


class QualifyingResultSerializer(serializers.ModelSerializer):
    driver = DriverSerializer(read_only=True)
    constructor = ConstructorSerializer(read_only=True)

    class Meta:
        model = QualifyingResult
        fields = [
            'id', 'race', 'driver', 'constructor', 'position',
            'q1', 'q2', 'q3'
        ]


class DriverStandingSerializer(serializers.ModelSerializer):
    driver = DriverSerializer(read_only=True)

    class Meta:
        model = DriverStanding
        fields = ['id', 'season', 'round', 'driver', 'points', 'position', 'wins']


class ConstructorStandingSerializer(serializers.ModelSerializer):
    constructor = ConstructorSerializer(read_only=True)

    class Meta:
        model = ConstructorStanding
        fields = ['id', 'season', 'round', 'constructor', 'points', 'position', 'wins']

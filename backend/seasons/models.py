from django.db import models

class Season(models.Model):
    year = models.IntegerField(primary_key=True)

    def __str__(self):
        return str(self.year)


class Constructor(models.Model):
    constructor_id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    color_hex = models.CharField(max_length=7, default="#7f8c8d")
    logo_url = models.URLField(max_length=1000, blank=True, null=True)

    def __str__(self):
        return self.name


class Driver(models.Model):
    driver_id = models.CharField(max_length=100, primary_key=True)
    code = models.CharField(max_length=10, blank=True, null=True)
    given_name = models.CharField(max_length=255)
    family_name = models.CharField(max_length=255)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    headshot_url = models.URLField(max_length=1000, blank=True, null=True)
    current_constructor = models.ForeignKey(Constructor, on_delete=models.SET_NULL, blank=True, null=True)

    @property
    def full_name(self):
        return f"{self.given_name} {self.family_name}"

    def __str__(self):
        return self.full_name


class Race(models.Model):
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="races")
    round = models.IntegerField()
    race_name = models.CharField(max_length=255)
    circuit_name = models.CharField(max_length=255)
    circuit_id = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    locality = models.CharField(max_length=100)
    date = models.DateField()
    time = models.TimeField(blank=True, null=True)

    class Meta:
        unique_together = ('season', 'round')
        ordering = ['season', 'round']

    def __str__(self):
        return f"{self.season.year} R{self.round} - {self.race_name}"


class RaceResult(models.Model):
    race = models.ForeignKey(Race, on_delete=models.CASCADE, related_name="results")
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="race_results")
    constructor = models.ForeignKey(Constructor, on_delete=models.CASCADE, related_name="race_results")
    grid = models.IntegerField()
    position = models.IntegerField(blank=True, null=True)
    position_text = models.CharField(max_length=10)
    status = models.CharField(max_length=100)
    points = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    fastest_lap_time = models.CharField(max_length=50, blank=True, null=True)
    fastest_lap_rank = models.IntegerField(blank=True, null=True)
    pit_stops_count = models.IntegerField(blank=True, null=True)
    tyres_used = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('race', 'driver')
        ordering = ['position', 'grid']

    def __str__(self):
        return f"{self.race} - {self.driver.code} - P{self.position_text}"


class QualifyingResult(models.Model):
    race = models.ForeignKey(Race, on_delete=models.CASCADE, related_name="qualifying_results")
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="qualifying_results")
    constructor = models.ForeignKey(Constructor, on_delete=models.CASCADE, related_name="qualifying_results")
    position = models.IntegerField()
    q1 = models.CharField(max_length=50, blank=True, null=True)
    q2 = models.CharField(max_length=50, blank=True, null=True)
    q3 = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('race', 'driver')
        ordering = ['position']

    def __str__(self):
        return f"{self.race} Quali - {self.driver.code} - P{self.position}"


class DriverStanding(models.Model):
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="driver_standings")
    round = models.IntegerField()
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="standings")
    points = models.DecimalField(max_digits=6, decimal_places=2)
    position = models.IntegerField()
    wins = models.IntegerField(default=0)

    class Meta:
        unique_together = ('season', 'round', 'driver')
        ordering = ['position']

    def __str__(self):
        return f"{self.season.year} R{self.round} DriverStanding - {self.driver.code} - P{self.position} ({self.points} pts)"


class ConstructorStanding(models.Model):
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="constructor_standings")
    round = models.IntegerField()
    constructor = models.ForeignKey(Constructor, on_delete=models.CASCADE, related_name="standings")
    points = models.DecimalField(max_digits=6, decimal_places=2)
    position = models.IntegerField()
    wins = models.IntegerField(default=0)

    class Meta:
        unique_together = ('season', 'round', 'constructor')
        ordering = ['position']

    def __str__(self):
        return f"{self.season.year} R{self.round} ConstructorStanding - {self.constructor.name} - P{self.position} ({self.points} pts)"

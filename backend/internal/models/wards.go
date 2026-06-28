package models

type Ward struct {
	WardNumber int    `json:"ward_number"`
	WardName   string `json:"ward_name"`
	Division   string `json:"division"`
	RoadCount  int    `json:"road_count"`
}

type WardRoad struct {
	ID          int      `json:"id"`
	Slug        string   `json:"slug"`
	Name        string   `json:"name"`
	Description *string  `json:"description"`
	LengthKm    *float64 `json:"length_km"`
}

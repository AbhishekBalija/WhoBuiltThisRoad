package models

type Road struct {
	ID          int      `json:"id"`
	Slug        string   `json:"slug"`
	Name        string   `json:"name"`
	Description *string  `json:"description"`
	WardNumber  *int     `json:"ward_number"`
	WardName    *string  `json:"ward_name"`
	Division    *string  `json:"division"`
	LengthKm    *float64 `json:"length_km"`
}

package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/db"
	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/models"
)

func ListWards(c *gin.Context) {
	query := `
		SELECT ward_number, ward_name, division, COUNT(*)::int as road_count
		FROM roads
		WHERE ward_number IS NOT NULL
		GROUP BY ward_number, ward_name, division
		ORDER BY ward_name
	`

	rows, err := db.Pool.Query(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query wards"})
		return
	}
	defer rows.Close()

	wards, err := pgx.CollectRows(rows, pgx.RowToStructByPos[models.Ward])
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read wards"})
		return
	}

	if wards == nil {
		wards = []models.Ward{}
	}

	c.JSON(http.StatusOK, gin.H{"wards": wards})
}

func GetWard(c *gin.Context) {
	wardNumber, err := strconv.Atoi(c.Param("wardNumber"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ward number"})
		return
	}

	wardQuery := `
		SELECT ward_number, ward_name, division, COUNT(*)::int as road_count
		FROM roads
		WHERE ward_number = $1
		GROUP BY ward_number, ward_name, division
	`

	wardRows, err := db.Pool.Query(c.Request.Context(), wardQuery, wardNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query ward"})
		return
	}
	defer wardRows.Close()

	ward, err := pgx.CollectOneRow(wardRows, pgx.RowToStructByPos[models.Ward])
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ward not found"})
		return
	}

	roadQuery := `
		SELECT id, slug, name, description, length_km
		FROM roads
		WHERE ward_number = $1
		ORDER BY name
	`

	roadRows, err := db.Pool.Query(c.Request.Context(), roadQuery, wardNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query roads"})
		return
	}
	defer roadRows.Close()

	roads, err := pgx.CollectRows(roadRows, pgx.RowToStructByPos[models.WardRoad])
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read roads"})
		return
	}

	if roads == nil {
		roads = []models.WardRoad{}
	}

	c.JSON(http.StatusOK, gin.H{
		"ward":  ward,
		"roads": roads,
	})
}

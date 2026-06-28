package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/db"
	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/models"
)

func GetRoad(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	roadQuery := `
		SELECT
			r.id, r.slug, r.name, r.description,
			r.ward_number, r.ward_name, r.division, r.length_km
		FROM roads r
		WHERE r.slug = $1
		LIMIT 1
	`

	rows, err := db.Pool.Query(c.Request.Context(), roadQuery, slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query road"})
		return
	}
	defer rows.Close()

	road, err := pgx.CollectOneRow(rows, pgx.RowToStructByPos[models.Road])
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "road not found"})
		return
	}

	workQuery := `
		SELECT
			wo.id, wo.contractor_name, wo.contractor_phone,
			wo.ae_name, wo.ae_phone, wo.aee_name, wo.aee_phone,
			wo.ee_name, wo.ee_phone,
			wo.completion_date, wo.dlp_expiry_date,
			wo.dlp_status, wo.days_remaining,
			wo.source_document, wo.source_label
		FROM work_orders_with_status wo
		JOIN roads r ON r.id = wo.road_id
		WHERE r.slug = $1
		ORDER BY wo.completion_date DESC NULLS LAST
	`

	woRows, err := db.Pool.Query(c.Request.Context(), workQuery, slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query work orders"})
		return
	}
	defer woRows.Close()

	workOrders, err := pgx.CollectRows(woRows, pgx.RowToStructByPos[models.WorkOrder])
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read work orders"})
		return
	}

	if workOrders == nil {
		workOrders = []models.WorkOrder{}
	}

	c.JSON(http.StatusOK, gin.H{
		"road":        road,
		"work_orders": workOrders,
	})
}

func SearchRoads(c *gin.Context) {
	q := c.Query("q")
	if len(q) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query must be at least 3 characters"})
		return
	}

	query := `
		SELECT
			r.id, r.slug, r.name, r.description,
			r.ward_number, r.ward_name, r.division, r.length_km
		FROM roads r
		WHERE r.name % $1
		   OR r.name ILIKE '%' || $1 || '%'
		   OR r.description ILIKE '%' || $1 || '%'
		ORDER BY similarity(r.name, $1) DESC, r.name
		LIMIT 20
	`

	rows, err := db.Pool.Query(c.Request.Context(), query, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}
	defer rows.Close()

	results, err := pgx.CollectRows(rows, pgx.RowToStructByPos[models.Road])
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read results"})
		return
	}

	if results == nil {
		results = []models.Road{}
	}

	c.JSON(http.StatusOK, gin.H{
		"count":   len(results),
		"results": results,
	})
}

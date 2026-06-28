package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/db"
	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/handlers"
)

func TestMain(m *testing.M) {
	if os.Getenv("DATABASE_URL") == "" {
		path := filepath.Join("..", "..", "..", ".env")
		godotenv.Load(path)
	}
	if os.Getenv("DATABASE_URL") != "" {
		db.Init()
		defer db.Close()
	}
	os.Exit(m.Run())
}

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/roads/search", handlers.SearchRoads)
	r.GET("/roads/:slug", handlers.GetRoad)
	r.GET("/wards", handlers.ListWards)
	r.GET("/wards/:wardNumber/roads", handlers.GetWard)
	return r
}

func TestSearchShortQuery(t *testing.T) {
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/search?q=ab", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}

	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["error"] != "query must be at least 3 characters" {
		t.Fatalf("unexpected error message: %s", body["error"])
	}
}

func TestSearchNoResults(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/search?q=zxqwerty", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body struct {
		Count   int            `json:"count"`
		Results []any          `json:"results"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body.Count != 0 {
		t.Fatalf("expected count 0, got %d", body.Count)
	}
	if body.Results == nil {
		t.Fatal("results should be empty array, not null")
	}
}

func TestSearchReturnsResults(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/search?q=indiranagar", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body struct {
		Count   int              `json:"count"`
		Results []map[string]any `json:"results"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body.Count == 0 {
		t.Fatal("expected at least 1 result for 'indiranagar'")
	}
	if body.Count != len(body.Results) {
		t.Fatalf("count %d doesn't match results length %d", body.Count, len(body.Results))
	}
	first := body.Results[0]
	if _, ok := first["slug"]; !ok {
		t.Fatal("result missing 'slug' field")
	}
	if _, ok := first["name"]; !ok {
		t.Fatal("result missing 'name' field")
	}
}

func TestSearchMissingQuery(t *testing.T) {
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/search", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestSearchTrimsWhitespace(t *testing.T) {
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/search?q=+", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for whitespace-only query, got %d", w.Code)
	}
}

func TestSearchSlug(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/search?q=100ft", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body struct {
		Count   int              `json:"count"`
		Results []map[string]any `json:"results"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body.Count == 0 {
		t.Fatal("expected at least 1 result for '100ft'")
	}
	first := body.Results[0]
	slug, _ := first["slug"].(string)
	if !strings.Contains(slug, "100ft") && !strings.Contains(slug, "100-feet") {
		t.Logf("first result slug: %s", slug)
	}
}

func TestGetRoadNotFound(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/this-road-does-not-exist", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}

	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["error"] != "road not found" {
		t.Fatalf("unexpected error: %s", body["error"])
	}
}

func TestGetRoadSuccess(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/indiranagar-100ft-road-from-old-airport-road-to-old-madras-road", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body struct {
		Road       map[string]any   `json:"road"`
		WorkOrders []map[string]any `json:"work_orders"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)

	if body.Road == nil {
		t.Fatal("response missing 'road' field")
	}
	if body.Road["slug"] != "indiranagar-100ft-road-from-old-airport-road-to-old-madras-road" {
		t.Fatalf("unexpected slug: %v", body.Road["slug"])
	}
	if body.Road["name"] == "" {
		t.Fatal("road name is empty")
	}
	if body.WorkOrders == nil {
		t.Fatal("work_orders should be array, not null")
	}
}

func TestGetRoadWorkOrderFields(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/indiranagar-100ft-road-from-old-airport-road-to-old-madras-road", nil)
	r.ServeHTTP(w, req)

	var body struct {
		Road       map[string]any   `json:"road"`
		WorkOrders []map[string]any `json:"work_orders"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)

	if len(body.WorkOrders) == 0 {
		t.Fatal("expected at least 1 work order")
	}

	first := body.WorkOrders[0]
	requiredFields := []string{"id", "contractor_name", "dlp_status", "source_document", "source_label"}
	for _, f := range requiredFields {
		if _, ok := first[f]; !ok {
			t.Fatalf("work order missing field: %s", f)
		}
	}
}

func TestGetRoadWithSearchResultSlug(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}

	searchW := httptest.NewRecorder()
	searchReq := httptest.NewRequest("GET", "/roads/search?q=indiranagar", nil)
	setupRouter().ServeHTTP(searchW, searchReq)

	var searchBody struct {
		Results []map[string]any `json:"results"`
	}
	json.Unmarshal(searchW.Body.Bytes(), &searchBody)
	if len(searchBody.Results) == 0 {
		t.Fatal("no search results to test with")
	}

	slug := searchBody.Results[0]["slug"].(string)
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/roads/"+slug, nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 for slug %s, got %d", slug, w.Code)
	}
}

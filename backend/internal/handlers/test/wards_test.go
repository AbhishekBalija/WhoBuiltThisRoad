package handlers_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/db"
)

func TestListWardsReturnsArray(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/wards", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var body struct {
		Wards []any `json:"wards"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body.Wards == nil {
		t.Fatal("wards should be array, not null")
	}
}

func TestListWardsShapeExistingEntry(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/wards", nil)
	r.ServeHTTP(w, req)

	var body struct {
		Wards []map[string]any `json:"wards"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)

	if len(body.Wards) == 0 {
		t.Skip("Skipping: no wards with data in DB")
	}

	first := body.Wards[0]
	requiredFields := []string{"ward_number", "ward_name", "division", "road_count"}
	for _, f := range requiredFields {
		if _, ok := first[f]; !ok {
			t.Fatalf("ward missing field: %s", f)
		}
	}
}

func TestGetWardBadNumber(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/wards/abc/roads", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}

	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["error"] != "invalid ward number" {
		t.Fatalf("unexpected error: %s", body["error"])
	}
}

func TestGetWardNotFound(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/wards/99999/roads", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}

	var body map[string]string
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["error"] != "ward not found" {
		t.Fatalf("unexpected error: %s", body["error"])
	}
}

func TestGetWardReturnsResponseShape(t *testing.T) {
	if db.Pool == nil {
		t.Skip("Skipping: DATABASE_URL not set")
	}

	listW := httptest.NewRecorder()
	listReq := httptest.NewRequest("GET", "/wards", nil)
	setupRouter().ServeHTTP(listW, listReq)

	var listBody struct {
		Wards []map[string]any `json:"wards"`
	}
	json.Unmarshal(listW.Body.Bytes(), &listBody)

	if len(listBody.Wards) == 0 {
		t.Skip("Skipping: no wards with data in DB")
	}

	wardNum := int(listBody.Wards[0]["ward_number"].(float64))

	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", fmt.Sprintf("/wards/%d/roads", wardNum), nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 for ward %d, got %d", wardNum, w.Code)
	}

	var body struct {
		Ward  map[string]any   `json:"ward"`
		Roads []map[string]any `json:"roads"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)

	if body.Ward == nil {
		t.Fatal("response missing 'ward' field")
	}
	if body.Roads == nil {
		t.Fatal("roads should be array, not null")
	}
}

package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/middleware"
)

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.CORS())
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	return r
}

func TestCORSSetsHeaderForAllowedOrigin(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/health", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Fatalf("expected CORS header, got %s", w.Header().Get("Access-Control-Allow-Origin"))
	}
	if w.Header().Get("Access-Control-Allow-Methods") != "GET, POST, OPTIONS" {
		t.Fatalf("expected Allow-Methods header, got %s", w.Header().Get("Access-Control-Allow-Methods"))
	}
}

func TestCORSSkipsHeaderForDisallowedOrigin(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/health", nil)
	req.Header.Set("Origin", "http://evil.com")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("should not set CORS header for disallowed origin, got %s", w.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCORSOptionsReturns204(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("OPTIONS", "/health", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for OPTIONS, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Fatalf("expected CORS header on OPTIONS, got %s", w.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCORSEmptyAllowedOrigins(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/health", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("should not set CORS header when ALLOWED_ORIGINS is empty, got %s", w.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestCORSMultipleOrigins(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173,https://who-built-this-road.vercel.app")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := setupRouter()

	tests := []struct {
		name   string
		origin string
		expect string
	}{
		{"first allowed", "http://localhost:5173", "http://localhost:5173"},
		{"second allowed", "https://who-built-this-road.vercel.app", "https://who-built-this-road.vercel.app"},
		{"disallowed", "http://evil.com", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", "/health", nil)
			req.Header.Set("Origin", tt.origin)
			r.ServeHTTP(w, req)

			if w.Header().Get("Access-Control-Allow-Origin") != tt.expect {
				t.Fatalf("origin %q: expected %q, got %q", tt.origin, tt.expect, w.Header().Get("Access-Control-Allow-Origin"))
			}
		})
	}
}

func TestCORSRequestWithoutOrigin(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:5173")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	r := setupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

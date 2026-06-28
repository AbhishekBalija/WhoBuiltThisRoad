package db_test

import (
	"log"
	"os"
	"path/filepath"
	"testing"

	"github.com/joho/godotenv"
)

func TestMain(m *testing.M) {
	if os.Getenv("DATABASE_URL") == "" {
		// Test runs from package dir: backend/internal/db/test/
		// .env is at: backend/.env
		path := filepath.Join("..", "..", "..", ".env")
		if err := godotenv.Load(path); err != nil {
			log.Printf("Warning: no .env found: %v", err)
		}
	}
	os.Exit(m.Run())
}

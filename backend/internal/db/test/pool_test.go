package db_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/db"
)

func TestCloseNilSafety(t *testing.T) {
	db.Pool = nil
	db.Close()
}

func TestPingNilPool(t *testing.T) {
	db.Pool = nil
	ctx := context.Background()
	if err := db.Ping(ctx); err != nil {
		t.Fatalf("Ping should return nil when Pool is nil: %v", err)
	}
}

func TestParseConfigInvalidDSN(t *testing.T) {
	_, err := pgxpool.ParseConfig("not-a-valid-dsn")
	if err == nil {
		t.Fatal("Expected error for invalid DSN")
	}
}

func TestInitSuccessful(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	db.Init()
	defer db.Close()
	if db.Pool == nil {
		t.Fatal("Pool should be non-nil after successful Init")
	}
}

func TestInitTwiceNoLeak(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("Skipping: DATABASE_URL not set")
	}
	db.Init()
	db.Init()
	defer db.Close()
	if db.Pool == nil {
		t.Fatal("Pool should be non-nil after second Init")
	}
}

func TestCloseMultipleTimes(t *testing.T) {
	pool := openTestPool(t)
	if pool == nil {
		t.Skip("Skipping: DATABASE_URL not set or DB unreachable")
	}
	db.Pool = pool
	db.Close()
	db.Close()
}

func TestPingAfterInit(t *testing.T) {
	pool := openTestPool(t)
	if pool == nil {
		t.Skip("Skipping: DATABASE_URL not set or DB unreachable")
	}
	db.Pool = pool
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := db.Ping(ctx); err != nil {
		t.Fatalf("Ping failed: %v", err)
	}
}

func openTestPool(tb testing.TB) *pgxpool.Pool {
	tb.Helper()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil
	}
	return pool
}

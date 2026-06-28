package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/db"
	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/handlers"
	"github.com/AbhishekBalija/WhoBuiltThisRoad/internal/middleware"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, using system env")
	}

	db.Init()
	defer db.Close()
	log.Println("Database pool initialized successfully")

	r := gin.Default()
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.GET("/roads/search", handlers.SearchRoads)
	r.GET("/roads/:slug", handlers.GetRoad)
	r.GET("/wards", handlers.ListWards)
	r.GET("/wards/:wardNumber/roads", handlers.GetWard)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

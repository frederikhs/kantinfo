package main

import (
	"kantinfo/internal/persistence"
	"kantinfo/internal/rest/controller"
	"kantinfo/internal/rest/middleware"
	"kantinfo/internal/service"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	db := persistence.NewDB()
	db.CreateTables()

	go func() {
		for {
			service.SyncData(db)
			time.Sleep(time.Hour)
		}
	}()

	r := gin.Default()
	r.Use(middleware.SetupCors("*"))

	r.GET("/api/menu/next", controller.GetMenuItemsNext(db))
	r.GET("/api/menu/:date", controller.GetMenuItemsForDateByRouteParam(db))
	r.GET("/api/dates", controller.GetDatesWithMenuItems(db))

	log.Fatal(r.Run(":8080"))
}

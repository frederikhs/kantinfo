package main

import (
	"kantinfo/internal/persistence"
	"kantinfo/internal/rest/controller"
	"kantinfo/internal/rest/middleware"
	"kantinfo/internal/service"
	"log"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
)

const syncInterval = time.Hour

func main() {
	db := persistence.NewDB()
	db.CreateTables()

	var nextSyncAt atomic.Int64
	getNextSyncAt := func() time.Time {
		n := nextSyncAt.Load()
		if n == 0 {
			return time.Time{}
		}

		return time.Unix(0, n)
	}

	go func() {
		for {
			service.SyncData(db)
			nextSync := time.Now().Add(syncInterval)
			nextSyncAt.Store(nextSync.UnixNano())
			time.Sleep(time.Until(nextSync))
		}
	}()

	r := gin.Default()
	r.Use(middleware.SetupCors("*"))

	api := r.Group("/api", middleware.CacheUntil(getNextSyncAt))
	api.GET("/menu/next", controller.GetMenuItemsNext(db))
	api.GET("/menu/:date", controller.GetMenuItemsForDateByRouteParam(db))
	api.GET("/dates", controller.GetDatesWithMenuItems(db))

	log.Fatal(r.Run(":8080"))
}
